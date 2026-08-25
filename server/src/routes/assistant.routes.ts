import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { RoadmapModel } from '../models/Roadmap.js';
import { LearningEventModel } from '../models/LearningEvent.js';
import { SkillModel } from '../models/Skill.js';
import { askAssistant } from '../ai/assistant.js';
import { assistantChatSchema } from '../middleware/validation.js';

const router = Router();

// POST /api/assistant/chat — Context-aware AI assistant
router.post('/chat', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = assistantChatSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const learner = await LearnerModel.findById(req.userId).lean();
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    const roadmap = await RoadmapModel.findOne({ learnerId: req.userId }).lean();
    const recentEvents = await LearningEventModel.find({ learnerId: req.userId })
      .sort({ timestamp: -1 })
      .limit(5)
      .lean();

    const allSkills = await SkillModel.find({}).lean();
    const skillMap = new Map(allSkills.map(s => [s.skillId, s.name]));

    const activeGoal = learner.goals?.[learner.goals.length - 1];
    const targetRole = (activeGoal as any)?.targetRole || 'Data Scientist';

    const skillProficiencies = (learner.skillStates || []).map((s: any) => ({
      skillId: s.skillId,
      skillName: skillMap.get(s.skillId) || s.skillId,
      proficiency: s.proficiency,
      confidence: s.confidence,
    }));

    const currentRoadmap = (roadmap?.items || []).map((item: any) => ({
      title: item.title,
      type: item.type,
      milestone: item.milestone,
      status: item.status,
      priorityScore: item.priorityScore,
      reason: item.reason,
    }));

    const assistantResponse = await askAssistant(
      parsed.data.message,
      {
        learnerName: learner.name,
        targetRole,
        weeklyHours: learner.weeklyHours || 8,
        currentRoadmap,
        recentEvents: recentEvents.map(e => ({
          type: e.type,
          skillIds: e.skillIds || [],
          score: e.score,
          timestamp: e.timestamp,
        })),
        skillProficiencies,
      },
      parsed.data.history || [],
    );

    res.json(assistantResponse);
  } catch (error) {
    console.error('Assistant chat error:', error);
    res.status(500).json({ error: 'Assistant failed to respond' });
  }
});

export default router;
