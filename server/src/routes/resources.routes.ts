import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { ResourceModel } from '../models/Resource.js';
import { LearnerModel } from '../models/Learner.js';
import { getAICourseRecommendations } from '../ai/course-recommender.js';
import { loadSkillsData } from '../utils/load-data.js';

const router = Router();

// GET /api/resources — List all resources from DB
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { type, skill, difficulty } = req.query;

    const filter: any = {};
    if (type) filter.type = type;
    if (skill) filter.skills = skill;
    if (difficulty) filter.difficulty = parseInt(difficulty as string);

    const resources = await ResourceModel.find(filter).lean();
    res.json({ resources });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to get resources' });
  }
});

// GET /api/resources/recommendations — AI-powered real course recommendations
// Query params: skillId, skillName, count (optional, default 8)
router.get('/recommendations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { skillId, skillName, role, level } = req.query;

    if (!skillId) {
      res.status(400).json({ error: 'skillId is required' });
      return;
    }

    // Get learner context for better recommendations
    let targetRole = (role as string) || 'software-developer';
    let learnerLevel = (level as string) || 'intermediate';
    let learningPreferences = ['course'];

    if (req.userId) {
      try {
        const learner = await LearnerModel.findById(req.userId).lean();
        if (learner) {
          const activeGoal = learner.goals?.[learner.goals.length - 1];
          if (activeGoal?.targetRole) targetRole = activeGoal.targetRole;
          if (learner.experienceLevel) learnerLevel = learner.experienceLevel;
          if (learner.preferredLearningModes?.length) learningPreferences = learner.preferredLearningModes;
        }
      } catch {
        // ignore, use defaults
      }
    }

    // Resolve display name for the skill
    const skills = loadSkillsData();
    const skillObj = skills.find(s => s.id === skillId);
    const resolvedSkillName = (skillName as string) || skillObj?.name || (skillId as string).replace(/-/g, ' ');

    const recommendations = await getAICourseRecommendations(
      resolvedSkillName,
      skillId as string,
      targetRole,
      learnerLevel,
      learningPreferences,
    );

    res.json({ recommendations, skill: resolvedSkillName, targetRole });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({ error: 'Failed to get AI recommendations' });
  }
});

// POST /api/resources/recommendations/bulk — Get recommendations for multiple skills at once
router.post('/recommendations/bulk', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { skillIds } = req.body;
    if (!Array.isArray(skillIds) || skillIds.length === 0) {
      res.status(400).json({ error: 'skillIds array is required' });
      return;
    }

    // Get learner context
    let targetRole = 'software-developer';
    let learnerLevel = 'intermediate';
    let learningPreferences = ['course'];

    if (req.userId) {
      try {
        const learner = await LearnerModel.findById(req.userId).lean();
        if (learner) {
          const activeGoal = learner.goals?.[learner.goals.length - 1];
          if (activeGoal?.targetRole) targetRole = activeGoal.targetRole;
          if (learner.experienceLevel) learnerLevel = learner.experienceLevel;
          if (learner.preferredLearningModes?.length) learningPreferences = learner.preferredLearningModes;
        }
      } catch {
        // ignore
      }
    }

    const skills = loadSkillsData();

    // Get recommendations for up to 5 skills (to avoid rate limiting)
    const targetSkillIds = (skillIds as string[]).slice(0, 5);

    const results = await Promise.all(
      targetSkillIds.map(async (skillId: string) => {
        const skillObj = skills.find(s => s.id === skillId);
        const skillName = skillObj?.name || skillId.replace(/-/g, ' ');
        const recs = await getAICourseRecommendations(skillName, skillId, targetRole, learnerLevel, learningPreferences);
        return { skillId, skillName, recommendations: recs };
      })
    );

    res.json({ results, targetRole });
  } catch (error) {
    console.error('Bulk recommendations error:', error);
    res.status(500).json({ error: 'Failed to get bulk recommendations' });
  }
});

// GET /api/resources/:id — Get resource detail
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resource = await ResourceModel.findOne({ resourceId: req.params.id }).lean();
    if (!resource) {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    res.json({ resource });
  } catch (error) {
    console.error('Get resource error:', error);
    res.status(500).json({ error: 'Failed to get resource' });
  }
});

export default router;
