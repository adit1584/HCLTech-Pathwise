import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { SkillModel } from '../models/Skill.js';
import { ResourceModel } from '../models/Resource.js';
import { RoadmapModel } from '../models/Roadmap.js';
import { computePriorityScores } from '../engine/priority-scorer.js';
import { optimizePath, estimatePathDuration } from '../engine/path-optimizer.js';
import { generateRoadmap } from '../engine/roadmap-generator.js';
import { recompile } from '../engine/recompiler.js';
import { loadRolesData } from '../utils/load-data.js';
import type { Skill, SkillState } from '../models/types.js';

const router = Router();

// POST /api/path/compile — Compile initial learning path
router.post('/compile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const learner = await LearnerModel.findById(req.userId);
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    if (learner.goals.length === 0) {
      res.status(400).json({ error: 'No goals set. Complete onboarding first.' });
      return;
    }

    const activeGoal = learner.goals[learner.goals.length - 1];
    const { resolveOrSynthesizeRole } = await import('../utils/dynamic-roles.js');
    const targetRole = await resolveOrSynthesizeRole((activeGoal as any).targetRole);

    // Get all skills
    const allSkillDocs = await SkillModel.find({}).lean();
    const allSkills: Skill[] = allSkillDocs.map(s => ({
      id: s.skillId,
      name: s.name,
      category: s.category,
      description: s.description,
      prerequisites: s.prerequisites,
      relatedSkills: s.relatedSkills,
      roleImportance: s.roleImportance,
      difficulty: s.difficulty,
      estimatedHours: s.estimatedHours,
    }));

    // Ensure all target requirements exist in allSkills
    for (const req of targetRole.requiredSkills) {
      if (!allSkills.some(s => s.id === req.skillId)) {
        allSkills.push({
          id: req.skillId,
          name: req.skillId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          category: 'Specialization',
          description: `Core competency for ${targetRole.name}`,
          prerequisites: [],
          relatedSkills: [],
          roleImportance: [{ roleId: targetRole.id, importance: req.importance || 0.8 }],
          difficulty: 3,
          estimatedHours: 25,
        });
      }
    }

    // Convert learner skill states
    const skillStates: SkillState[] = (learner.skillStates as any[]).map(s => ({
      skillId: s.skillId,
      proficiency: s.proficiency,
      confidence: s.confidence,
      evidence: s.evidence || [],
      lastUpdated: s.lastUpdated || new Date(),
    }));

    // Step 1: Compute priority scores
    const gaps = computePriorityScores({
      skillStates,
      targetRequirements: targetRole.requiredSkills,
      allSkills,
      targetRoleId: targetRole.id,
    });

    // Step 2: Optimize path
    const pathItems = optimizePath({
      gaps,
      allSkills,
      weeklyHours: learner.weeklyHours,
      learningPreferences: learner.preferredLearningModes,
    });

    // Step 3: Get resources
    const allResources = await ResourceModel.find({}).lean();
    const resources = allResources.map(r => ({
      id: r.resourceId,
      resourceId: r.resourceId,
      title: r.title,
      type: r.type as any,
      skills: r.skills,
      prerequisites: r.prerequisites,
      difficulty: r.difficulty,
      estimatedHours: r.estimatedHours,
      qualityScore: r.qualityScore,
      description: r.description,
      source: r.source,
      url: r.url || `https://www.google.com/search?q=${encodeURIComponent(r.title + ' tutorial course practice')}`,
    }));

    // Ensure fallback resources for all gap skills
    for (const gap of gaps) {
      if (!resources.some(r => r.skills.includes(gap.skillId))) {
        resources.push({
          id: `res-${gap.skillId}-course`,
          resourceId: `res-${gap.skillId}-course`,
          title: `${gap.skillName} Mastery Course`,
          type: 'COURSE',
          skills: [gap.skillId],
          prerequisites: [],
          difficulty: 2,
          estimatedHours: 15,
          qualityScore: 0.9,
          description: `Interactive learning path and practice exercises for ${gap.skillName}.`,
          source: 'Google Learning',
          url: `https://www.google.com/search?q=${encodeURIComponent(gap.skillName + ' complete course tutorial documentation')}`,
        });
      }
    }

    // Step 4: Generate roadmap
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
      learningPreferences: learner.preferredLearningModes,
      completedSkills,
      weeklyHours: learner.weeklyHours,
    });

    // Save roadmap
    const newVersion = (learner.currentRoadmapVersion || 0) + 1;

    await RoadmapModel.findOneAndUpdate(
      { learnerId: req.userId },
      {
        learnerId: req.userId,
        items: roadmap.items,
        totalEstimatedWeeks: roadmap.totalEstimatedWeeks,
        version: newVersion,
        compiledAt: new Date(),
      },
      { upsert: true, new: true },
    );

    await LearnerModel.findByIdAndUpdate(req.userId, {
      currentRoadmapVersion: newVersion,
    });

    res.json({
      roadmap: roadmap.items,
      totalEstimatedWeeks: roadmap.totalEstimatedWeeks,
      version: newVersion,
      skillGaps: gaps,
    });
  } catch (error) {
    console.error('Path compile error:', error);
    res.status(500).json({ error: 'Failed to compile learning path' });
  }
});

// GET /api/path/current — Get current roadmap
router.get('/current', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const roadmap = await RoadmapModel.findOne({ learnerId: req.userId }).lean();
    if (!roadmap) {
      res.status(404).json({ error: 'No roadmap found. Compile a path first.' });
      return;
    }

    res.json({
      roadmap: roadmap.items,
      totalEstimatedWeeks: roadmap.totalEstimatedWeeks,
      version: roadmap.version,
      compiledAt: roadmap.compiledAt,
    });
  } catch (error) {
    console.error('Get current path error:', error);
    res.status(500).json({ error: 'Failed to get current path' });
  }
});

// POST /api/path/recompile — Incremental recompilation
router.post('/recompile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { changedSkillIds, reason } = req.body;

    if (!changedSkillIds || changedSkillIds.length === 0) {
      res.status(400).json({ error: 'changedSkillIds is required' });
      return;
    }

    const learner = await LearnerModel.findById(req.userId);
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    const currentRoadmap = await RoadmapModel.findOne({ learnerId: req.userId });
    if (!currentRoadmap) {
      res.status(400).json({ error: 'No existing roadmap. Compile first.' });
      return;
    }

    const activeGoal = learner.goals[learner.goals.length - 1];
    const { resolveOrSynthesizeRole: resolveRole } = await import('../utils/dynamic-roles.js');
    const targetRole = await resolveRole((activeGoal as any).targetRole);

    const allSkillDocs = await SkillModel.find({}).lean();
    const allSkills: Skill[] = allSkillDocs.map(s => ({
      id: s.skillId, name: s.name, category: s.category, description: s.description,
      prerequisites: s.prerequisites, relatedSkills: s.relatedSkills,
      roleImportance: s.roleImportance, difficulty: s.difficulty, estimatedHours: s.estimatedHours,
    }));

    for (const req of targetRole.requiredSkills) {
      if (!allSkills.some(s => s.id === req.skillId)) {
        allSkills.push({
          id: req.skillId,
          name: req.skillId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          category: 'Specialization',
          description: `Core competency for ${targetRole.name}`,
          prerequisites: [],
          relatedSkills: [],
          roleImportance: [{ roleId: targetRole.id, importance: req.importance || 0.8 }],
          difficulty: 3,
          estimatedHours: 25,
        });
      }
    }

    const allResources = await ResourceModel.find({}).lean();
    const resources = allResources.map(r => ({
      id: r.resourceId, resourceId: r.resourceId, title: r.title, type: r.type as any,
      skills: r.skills, prerequisites: r.prerequisites, difficulty: r.difficulty,
      estimatedHours: r.estimatedHours, qualityScore: r.qualityScore,
      description: r.description, source: r.source, url: r.url,
    }));

    const skillStates: SkillState[] = (learner.skillStates as any[]).map(s => ({
      skillId: s.skillId, proficiency: s.proficiency, confidence: s.confidence,
      evidence: s.evidence || [], lastUpdated: s.lastUpdated || new Date(),
    }));

    const completedSkills = new Set(
      skillStates.filter(s => {
        const req = targetRole.requiredSkills.find((r: any) => r.skillId === s.skillId);
        return req && s.proficiency >= req.targetProficiency;
      }).map(s => s.skillId)
    );

    const { newRoadmapItems, totalEstimatedWeeks, result } = recompile({
      changedSkillIds,
      reason: reason || 'Manual recompilation',
      updatedSkillStates: skillStates,
      allSkills,
      targetRequirements: targetRole.requiredSkills,
      targetRoleId: targetRole.id,
      currentRoadmapItems: currentRoadmap.items as any[],
      resources,
      weeklyHours: learner.weeklyHours,
      learningPreferences: learner.preferredLearningModes,
      completedSkills,
    });

    // Save updated roadmap
    const newVersion = (learner.currentRoadmapVersion || 0) + 1;

    await RoadmapModel.findOneAndUpdate(
      { learnerId: req.userId },
      {
        items: newRoadmapItems,
        totalEstimatedWeeks,
        version: newVersion,
        compiledAt: new Date(),
      },
    );

    await LearnerModel.findByIdAndUpdate(req.userId, {
      currentRoadmapVersion: newVersion,
    });

    res.json({
      roadmap: newRoadmapItems,
      totalEstimatedWeeks,
      version: newVersion,
      recompilation: result,
    });
  } catch (error) {
    console.error('Recompile error:', error);
    res.status(500).json({ error: 'Failed to recompile path' });
  }
});

export default router;
