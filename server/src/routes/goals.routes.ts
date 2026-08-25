import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { interpretGoalSchema, structuredGoalSchema } from '../middleware/validation.js';
import { getAllTargetRoles, resolveOrSynthesizeRole } from '../utils/dynamic-roles.js';

const router = Router();

// POST /api/goals/interpret — Interpret natural language goal
router.post('/interpret', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = interpretGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { text } = parsed.data;

    let interpreted;
    try {
      const { interpretGoalWithAI } = await import('../ai/goal-interpreter.js');
      interpreted = await interpretGoalWithAI(text);
    } catch {
      interpreted = interpretGoalDeterministic(text);
    }

    // Auto-synthesize the target role if it's new
    if (interpreted.targetRole) {
      await resolveOrSynthesizeRole(interpreted.targetRole as string);
    }

    res.json({ interpreted });
  } catch (error) {
    console.error('Goal interpret error:', error);
    res.status(500).json({ error: 'Failed to interpret goal' });
  }
});

// POST /api/goals/set — Set the goal on the learner profile
router.post('/set', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = structuredGoalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    // Ensure the target role is resolved/synthesized
    await resolveOrSynthesizeRole(parsed.data.targetRole);

    const goal = {
      ...parsed.data,
      createdAt: new Date(),
    };

    const { selfReportedSkills } = req.body;

    const update: any = {
      $push: { goals: goal },
      $set: {
        weeklyHours: goal.weeklyHours,
        experienceLevel: goal.currentLevel,
        preferredLearningModes: goal.learningPreference,
      },
    };

    if (selfReportedSkills && Array.isArray(selfReportedSkills)) {
      const skillStates = selfReportedSkills.map((s: any) => ({
        skillId: s.skillId,
        proficiency: Math.min(100, Math.max(0, s.proficiency)),
        confidence: 0.3,
        evidence: [{
          type: 'SELF_REPORT',
          score: s.proficiency,
          timestamp: new Date(),
        }],
        lastUpdated: new Date(),
      }));

      update.$set.skillStates = skillStates;
    }

    const learner = await LearnerModel.findByIdAndUpdate(
      req.userId,
      update,
      { new: true, select: '-passwordHash' },
    );

    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    res.json({
      message: 'Goal set successfully',
      goal,
      learner: {
        id: learner._id,
        name: learner.name,
        email: learner.email,
        experienceLevel: learner.experienceLevel,
        weeklyHours: learner.weeklyHours,
        goalsCount: learner.goals.length,
        skillsCount: learner.skillStates.length,
      },
    });
  } catch (error) {
    console.error('Set goal error:', error);
    res.status(500).json({ error: 'Failed to set goal' });
  }
});

// GET /api/goals/roles — List all available and dynamically synthesized target roles
router.get('/roles', async (_req: AuthRequest, res: Response) => {
  try {
    const roles = getAllTargetRoles();
    res.json({
      roles: roles.map((r: any) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        estimatedTotalHours: r.estimatedTotalHours,
        skillCount: r.requiredSkills.length,
      })),
    });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
});

// POST /api/goals/custom-role — Create a custom career role pathway on demand
router.post('/custom-role', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { roleName } = req.body;
    if (!roleName || typeof roleName !== 'string') {
      res.status(400).json({ error: 'roleName string is required' });
      return;
    }

    const role = await resolveOrSynthesizeRole(roleName);
    res.json({ role });
  } catch (error) {
    console.error('Custom role creation error:', error);
    res.status(500).json({ error: 'Failed to create custom role' });
  }
});

function interpretGoalDeterministic(text: string) {
  const lower = text.toLowerCase();

  let targetRole = 'data-scientist';
  if (lower.includes('full stack') || lower.includes('fullstack') || lower.includes('web dev')) {
    targetRole = 'full-stack-developer';
  } else if (lower.includes('ml engineer') || lower.includes('machine learning engineer')) {
    targetRole = 'ml-engineer';
  } else if (lower.includes('data analyst') || lower.includes('analytics')) {
    targetRole = 'data-analyst';
  } else if (lower.includes('ai engineer') || lower.includes('artificial intelligence')) {
    targetRole = 'ai-engineer';
  } else if (lower.includes('3d') || lower.includes('animat')) {
    targetRole = '3d-animator';
  }

  let timeframeWeeks = 24;
  const monthMatch = lower.match(/(\d+)\s*month/);
  if (monthMatch) timeframeWeeks = parseInt(monthMatch[1]) * 4;
  const weekMatch = lower.match(/(\d+)\s*week/);
  if (weekMatch) timeframeWeeks = parseInt(weekMatch[1]);

  let weeklyHours = 8;
  const hourMatch = lower.match(/(\d+)\s*hour/);
  if (hourMatch) weeklyHours = parseInt(hourMatch[1]);

  let currentLevel = 'beginner_intermediate';
  if (lower.includes('advanced') || lower.includes('senior')) currentLevel = 'advanced';
  else if (lower.includes('intermediate') || lower.includes('some experience')) currentLevel = 'intermediate';

  const learningPreference: string[] = [];
  if (lower.includes('project')) learningPreference.push('project_based');
  if (lower.includes('video')) learningPreference.push('video');
  if (lower.includes('reading') || lower.includes('book')) learningPreference.push('reading');
  if (lower.includes('interactive') || lower.includes('hands-on')) learningPreference.push('interactive');
  if (learningPreference.length === 0) learningPreference.push('project_based');

  return {
    targetRole,
    objective: 'career_transition',
    timeframeWeeks,
    weeklyHours,
    currentLevel,
    learningPreference,
    constraints: [],
    targetSkills: [],
  };
}

export default router;
