import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { SkillModel } from '../models/Skill.js';
import { ResourceModel } from '../models/Resource.js';
import { RoadmapModel } from '../models/Roadmap.js';
import { computePriorityScores } from '../engine/priority-scorer.js';
import { optimizePath, estimatePathDuration } from '../engine/path-optimizer.js';
import { generateRoadmap } from '../engine/roadmap-generator.js';
import { whatIfSchema } from '../middleware/validation.js';
import { loadRolesData } from '../utils/load-data.js';
import type { Skill, SkillState } from '../models/types.js';

const router = Router();

// POST /api/simulator/what-if — Calculate hypothetical path without mutating DB
router.post('/what-if', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = whatIfSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const learner = await LearnerModel.findById(req.userId).lean();
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    const activeGoal = learner.goals?.[learner.goals.length - 1];
    const targetRoleId = parsed.data.targetRole || (activeGoal as any)?.targetRole || 'data-scientist';
    const { resolveOrSynthesizeRole } = await import('../utils/dynamic-roles.js');
    const targetRole = await resolveOrSynthesizeRole(targetRoleId);

    const weeklyHours = parsed.data.weeklyHours || learner.weeklyHours || 8;
    const skipSkills = new Set(parsed.data.skipSkills || []);

    const allSkillDocs = await SkillModel.find({}).lean();
    const allSkills: Skill[] = allSkillDocs.map(s => ({
      id: s.skillId, name: s.name, category: s.category, description: s.description,
      prerequisites: s.prerequisites, relatedSkills: s.relatedSkills,
      roleImportance: s.roleImportance, difficulty: s.difficulty, estimatedHours: s.estimatedHours,
    }));

    const allResources = await ResourceModel.find({}).lean();
    const resources = allResources.map(r => ({
      id: r.resourceId, resourceId: r.resourceId, title: r.title, type: r.type as any,
      skills: r.skills, prerequisites: r.prerequisites, difficulty: r.difficulty,
      estimatedHours: r.estimatedHours, qualityScore: r.qualityScore,
      description: r.description, source: r.source, url: r.url,
    }));

    // Construct simulated skill states (skipSkills simulated as mastered at 85%)
    const skillStates: SkillState[] = (learner.skillStates || []).map((s: any) => {
      if (skipSkills.has(s.skillId)) {
        return {
          skillId: s.skillId,
          proficiency: 85,
          confidence: 0.9,
          evidence: s.evidence || [],
          lastUpdated: new Date(),
        };
      }
      return {
        skillId: s.skillId,
        proficiency: s.proficiency,
        confidence: s.confidence,
        evidence: s.evidence || [],
        lastUpdated: s.lastUpdated || new Date(),
      };
    });

    // Add any skipSkills that weren't in current state
    for (const skillId of skipSkills) {
      if (!skillStates.some(s => s.skillId === skillId)) {
        skillStates.push({
          skillId,
          proficiency: 85,
          confidence: 0.9,
          evidence: [],
          lastUpdated: new Date(),
        });
      }
    }

    // Run deterministic optimizer on simulated state
    const gaps = computePriorityScores({
      skillStates,
      targetRequirements: targetRole.requiredSkills,
      allSkills,
      targetRoleId: targetRole.id,
    });

    const pathItems = optimizePath({
      gaps,
      allSkills,
      weeklyHours,
      learningPreferences: learner.preferredLearningModes || ['course'],
    });

    const completedSkills = new Set(
      skillStates.filter(s => {
        const req = targetRole.requiredSkills.find((r: any) => r.skillId === s.skillId);
        return req && s.proficiency >= req.targetProficiency;
      }).map(s => s.skillId)
    );

    const roadmap = generateRoadmap({
      pathItems,
      resources,
      allSkills,
      learningPreferences: learner.preferredLearningModes || ['course'],
      completedSkills,
      weeklyHours,
    });

    // Compare with current base estimate
    const baseWeeks = Math.ceil(480 / (learner.weeklyHours || 8)); // approximate baseline
    const timeSavedWeeks = Math.max(0, baseWeeks - roadmap.totalEstimatedWeeks);

    res.json({
      simulatedRole: targetRole.name,
      simulatedRoleId: targetRole.id,
      simulatedWeeklyHours: weeklyHours,
      simulatedTotalWeeks: roadmap.totalEstimatedWeeks,
      baseWeeks,
      timeSavedWeeks,
      totalMilestones: Math.max(...roadmap.items.map(i => i.milestone), 1),
      simulatedItemsCount: roadmap.items.length,
      simulatedRoadmap: roadmap.items,
    });
  } catch (error) {
    console.error('Simulator error:', error);
    res.status(500).json({ error: 'Failed to run what-if simulation' });
  }
});

// POST /api/simulator/apply-simulation — Persist simulated configuration to active learner plan
router.post('/apply-simulation', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { targetRole: targetRoleIdInput, weeklyHours, skipSkills } = req.body;

    const learner = await LearnerModel.findById(req.userId);
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    if (weeklyHours && typeof weeklyHours === 'number') {
      learner.weeklyHours = weeklyHours;
    }

    const activeGoal = learner.goals?.[learner.goals.length - 1];
    const targetRoleId = targetRoleIdInput || (activeGoal as any)?.targetRole || 'data-scientist';

    if (targetRoleIdInput && typeof targetRoleIdInput === 'string') {
      if (!learner.goals || learner.goals.length === 0) {
        learner.goals = [{
          id: `goal-${Date.now()}`,
          targetRole: targetRoleIdInput,
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        }] as any;
      } else {
        (learner.goals[learner.goals.length - 1] as any).targetRole = targetRoleIdInput;
      }
    }

    // Apply skipSkills if any
    if (Array.isArray(skipSkills) && skipSkills.length > 0) {
      for (const skillId of skipSkills) {
        const existing = learner.skillStates?.find((s: any) => s.skillId === skillId);
        if (existing) {
          existing.proficiency = 85;
          existing.confidence = 0.9;
        } else {
          learner.skillStates?.push({
            skillId,
            proficiency: 85,
            confidence: 0.9,
            evidence: [],
            lastUpdated: new Date(),
          } as any);
        }
      }
    }

    const { resolveOrSynthesizeRole } = await import('../utils/dynamic-roles.js');
    const targetRole = await resolveOrSynthesizeRole(targetRoleId);

    const allSkillDocs = await SkillModel.find({}).lean();
    const allSkills: Skill[] = allSkillDocs.map(s => ({
      id: s.skillId, name: s.name, category: s.category, description: s.description,
      prerequisites: s.prerequisites, relatedSkills: s.relatedSkills,
      roleImportance: s.roleImportance, difficulty: s.difficulty, estimatedHours: s.estimatedHours,
    }));

    const allResources = await ResourceModel.find({}).lean();
    const resources = allResources.map(r => ({
      id: r.resourceId, resourceId: r.resourceId, title: r.title, type: r.type as any,
      skills: r.skills, prerequisites: r.prerequisites, difficulty: r.difficulty,
      estimatedHours: r.estimatedHours, qualityScore: r.qualityScore,
      description: r.description, source: r.source, url: r.url,
    }));

    const skillStates: SkillState[] = (learner.skillStates || []).map((s: any) => ({
      skillId: s.skillId,
      proficiency: s.proficiency,
      confidence: s.confidence,
      evidence: s.evidence || [],
      lastUpdated: s.lastUpdated || new Date(),
    }));

    const gaps = computePriorityScores({
      skillStates,
      targetRequirements: targetRole.requiredSkills,
      allSkills,
      targetRoleId: targetRole.id,
    });

    const pathItems = optimizePath({
      gaps,
      allSkills,
      weeklyHours: learner.weeklyHours || 10,
      learningPreferences: learner.preferredLearningModes || ['course'],
    });

    const completedSkills = new Set(
      skillStates.filter(s => {
        const req = targetRole.requiredSkills.find((r: any) => r.skillId === s.skillId);
        return req && s.proficiency >= req.targetProficiency;
      }).map(s => s.skillId)
    );

    const roadmap = generateRoadmap({
      pathItems,
      resources,
      allSkills,
      learningPreferences: learner.preferredLearningModes || ['course'],
      completedSkills,
      weeklyHours: learner.weeklyHours || 10,
    });

    const newVersion = (learner.currentRoadmapVersion || 0) + 1;
    learner.currentRoadmapVersion = newVersion;
    await learner.save();

    await RoadmapModel.findOneAndUpdate(
      { learnerId: req.userId },
      {
        learnerId: req.userId,
        items: roadmap.items,
        totalEstimatedWeeks: roadmap.totalEstimatedWeeks,
        version: newVersion,
        compiledAt: new Date(),
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      recompiled: true,
      weeklyHours: learner.weeklyHours,
      targetRole: targetRole.name,
      roadmap: roadmap.items,
      totalEstimatedWeeks: roadmap.totalEstimatedWeeks,
      message: `Successfully applied ${learner.weeklyHours}h/week velocity to your active roadmap.`,
    });
  } catch (error) {
    console.error('Apply simulation error:', error);
    res.status(500).json({ error: 'Failed to apply simulated plan' });
  }
});

export default router;
