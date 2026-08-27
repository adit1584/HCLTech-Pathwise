import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { SkillModel } from '../models/Skill.js';
import { computePriorityScores } from '../engine/priority-scorer.js';
import { getDirectDependents } from '../engine/centrality.js';
import { resolveOrSynthesizeRole } from '../utils/dynamic-roles.js';
import type { Skill, SkillState, RecommendationTrace } from '../models/types.js';

const router = Router();

// GET /api/recommendations — Get prioritized skill recommendations
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const learner = await LearnerModel.findById(req.userId);
    if (!learner || learner.goals.length === 0) {
      res.status(400).json({ error: 'No goals set' });
      return;
    }

    const activeGoal = learner.goals[learner.goals.length - 1];
    const targetRole = await resolveOrSynthesizeRole((activeGoal as any).targetRole);

    const allSkillDocs = await SkillModel.find({}).lean();
    const allSkills: Skill[] = allSkillDocs.map(s => ({
      id: s.skillId, name: s.name, category: s.category, description: s.description,
      prerequisites: s.prerequisites, relatedSkills: s.relatedSkills,
      roleImportance: s.roleImportance, difficulty: s.difficulty, estimatedHours: s.estimatedHours,
    }));

    const skillStates: SkillState[] = (learner.skillStates as any[]).map(s => ({
      skillId: s.skillId, proficiency: s.proficiency, confidence: s.confidence,
      evidence: s.evidence || [], lastUpdated: s.lastUpdated || new Date(),
    }));

    const gaps = computePriorityScores({
      skillStates,
      targetRequirements: targetRole.requiredSkills,
      allSkills,
      targetRoleId: targetRole.id,
    });

    res.json({ recommendations: gaps });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// GET /api/recommendations/:skillId/trace — Get recommendation trace
router.get('/:skillId/trace', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const skillId = Array.isArray(req.params.skillId) ? req.params.skillId[0] : req.params.skillId;

    const learner = await LearnerModel.findById(req.userId);
    if (!learner || learner.goals.length === 0) {
      res.status(400).json({ error: 'No goals set' });
      return;
    }

    const activeGoal = learner.goals[learner.goals.length - 1];
    const targetRole = await resolveOrSynthesizeRole((activeGoal as any).targetRole);

    const allSkillDocs = await SkillModel.find({}).lean();
    const allSkills: Skill[] = allSkillDocs.map(s => ({
      id: s.skillId, name: s.name, category: s.category, description: s.description,
      prerequisites: s.prerequisites, relatedSkills: s.relatedSkills,
      roleImportance: s.roleImportance, difficulty: s.difficulty, estimatedHours: s.estimatedHours,
    }));

    const skillStates: SkillState[] = (learner.skillStates as any[]).map(s => ({
      skillId: s.skillId, proficiency: s.proficiency, confidence: s.confidence,
      evidence: s.evidence || [], lastUpdated: s.lastUpdated || new Date(),
    }));

    const gaps = computePriorityScores({
      skillStates,
      targetRequirements: targetRole.requiredSkills,
      allSkills,
      targetRoleId: targetRole.id,
    });

    const targetGap = gaps.find(g => g.skillId === skillId);
    if (!targetGap) {
      res.status(404).json({ error: 'Skill not found in recommendations' });
      return;
    }

    const skill = allSkills.find(s => s.id === skillId);
    const directDeps = getDirectDependents(skillId, allSkills);

    // Build "why not" explanations for top alternative skills
    const alternatives = gaps
      .filter(g => g.skillId !== skillId)
      .slice(0, 3)
      .map(g => {
        const altSkill = allSkills.find(s => s.id === g.skillId);
        let reason = '';
        if (g.priorityScore < targetGap.priorityScore) {
          if (g.unlockValue < targetGap.unlockValue) reason = 'Lower downstream unlock value';
          else if (g.roleImportance < targetGap.roleImportance) reason = 'Lower role importance';
          else if (g.learningCost > targetGap.learningCost) reason = 'Higher learning cost';
          else reason = `Lower priority score (${g.priorityScore.toFixed(2)} vs ${targetGap.priorityScore.toFixed(2)})`;
        } else {
          // Check if prerequisites are unmet
          const prereqUnmet = (altSkill?.prerequisites ?? []).some(p => {
            const state = skillStates.find(s => s.skillId === p);
            return !state || state.proficiency < 60;
          });
          if (prereqUnmet) reason = 'Prerequisite skills not yet mastered';
          else reason = 'Lower overall priority in current context';
        }

        return {
          skillId: g.skillId,
          skillName: g.skillName,
          reason,
        };
      });

    const trace: RecommendationTrace = {
      recommendationId: `trace-${skillId}`,
      skillId,
      skillName: targetGap.skillName,
      triggeredBySkills: skill?.prerequisites ?? [],
      gap: targetGap.gap,
      roleImportance: targetGap.roleImportance,
      centrality: targetGap.centrality,
      unlockValue: targetGap.unlockValue,
      goalRelevance: targetGap.goalRelevance,
      estimatedCost: targetGap.learningCost,
      priorityScore: targetGap.priorityScore,
      prerequisiteReason: (skill?.prerequisites ?? []).map(p => {
        const state = skillStates.find(s => s.skillId === p);
        const pName = allSkills.find(s => s.id === p)?.name ?? p;
        if (!state || state.proficiency < 60) {
          return `${pName}: Not yet mastered (${state?.proficiency ?? 0}%)`;
        }
        return `${pName}: Mastered (${state.proficiency}%)`;
      }),
      excludedAlternatives: alternatives,
    };

    // Unlocks info
    const unlocks = directDeps.map(depId => {
      const depSkill = allSkills.find(s => s.id === depId);
      return { id: depId, name: depSkill?.name ?? depId };
    });

    res.json({ trace, unlocks });
  } catch (error) {
    console.error('Get trace error:', error);
    res.status(500).json({ error: 'Failed to get recommendation trace' });
  }
});

export default router;
