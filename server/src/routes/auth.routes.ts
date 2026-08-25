import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { LearnerModel } from '../models/Learner.js';
import { registerSchema, loginSchema } from '../middleware/validation.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { name, email, password } = parsed.data;

    // Check if user exists
    const existing = await LearnerModel.findOne({ email });
    if (existing) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create learner
    const learner = await LearnerModel.create({
      name,
      email,
      passwordHash,
      experienceLevel: 'beginner',
      goals: [],
      interests: [],
      weeklyHours: 8,
      preferredLearningModes: [],
      completedResources: [],
      skillStates: [],
      assessmentHistory: [],
      projectHistory: [],
      feedbackEvents: [],
    });

    // Generate token
    const token = jwt.sign(
      { userId: learner._id.toString(), email: learner.email },
      config.jwtSecret,
      { expiresIn: '7d' },
    );

    res.status(201).json({
      token,
      user: {
        id: learner._id,
        name: learner.name,
        email: learner.email,
        experienceLevel: learner.experienceLevel,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { email, password } = parsed.data;

    const learner = await LearnerModel.findOne({ email });
    if (!learner) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, learner.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const token = jwt.sign(
      { userId: learner._id.toString(), email: learner.email },
      config.jwtSecret,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      user: {
        id: learner._id,
        name: learner.name,
        email: learner.email,
        experienceLevel: learner.experienceLevel,
        hasGoals: learner.goals.length > 0,
        hasCompletedDiagnostic: learner.assessmentHistory.length > 0,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/demo — 1-click Demo Login
router.post('/demo', async (_req: Request, res: Response) => {
  try {
    let learner = await LearnerModel.findOne({ email: 'alex@demo.pathwise.dev' });
    if (!learner) {
      const passwordHash = await bcrypt.hash('pathwise123', 12);
      learner = await LearnerModel.create({
        name: 'Alex',
        email: 'alex@demo.pathwise.dev',
        passwordHash,
        experienceLevel: 'beginner_intermediate',
        goals: [{
          targetRole: 'data-scientist',
          objective: 'career_transition',
          timeframeWeeks: 24,
          weeklyHours: 8,
          currentLevel: 'beginner_intermediate',
          learningPreference: ['project_based'],
          constraints: [],
          targetSkills: [],
          createdAt: new Date(),
        }],
        interests: ['data science', 'machine learning', 'analytics'],
        weeklyHours: 8,
        preferredLearningModes: ['project_based'],
        completedResources: [],
        skillStates: [
          { skillId: 'python', proficiency: 72, confidence: 0.65, evidence: [{ type: 'SELF_REPORT', score: 70, timestamp: new Date() }], lastUpdated: new Date() },
          { skillId: 'excel', proficiency: 78, confidence: 0.55, evidence: [{ type: 'SELF_REPORT', score: 78, timestamp: new Date() }], lastUpdated: new Date() },
          { skillId: 'sql', proficiency: 54, confidence: 0.40, evidence: [{ type: 'SELF_REPORT', score: 54, timestamp: new Date() }], lastUpdated: new Date() },
          { skillId: 'statistics', proficiency: 45, confidence: 0.35, evidence: [{ type: 'SELF_REPORT', score: 45, timestamp: new Date() }], lastUpdated: new Date() },
          { skillId: 'data-cleaning', proficiency: 60, confidence: 0.50, evidence: [{ type: 'SELF_REPORT', score: 60, timestamp: new Date() }], lastUpdated: new Date() },
          { skillId: 'exploratory-data-analysis', proficiency: 55, confidence: 0.45, evidence: [{ type: 'SELF_REPORT', score: 55, timestamp: new Date() }], lastUpdated: new Date() },
          { skillId: 'machine-learning', proficiency: 25, confidence: 0.20, evidence: [{ type: 'SELF_REPORT', score: 25, timestamp: new Date() }], lastUpdated: new Date() },
          { skillId: 'data-visualization', proficiency: 62, confidence: 0.55, evidence: [{ type: 'SELF_REPORT', score: 62, timestamp: new Date() }], lastUpdated: new Date() },
        ],
        assessmentHistory: [],
        projectHistory: [],
        feedbackEvents: [],
      });
    }

    const token = jwt.sign(
      { userId: learner._id.toString(), email: learner.email },
      config.jwtSecret,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      user: {
        id: learner._id,
        name: learner.name,
        email: learner.email,
        experienceLevel: learner.experienceLevel,
        hasGoals: learner.goals.length > 0,
        hasCompletedDiagnostic: learner.assessmentHistory.length > 0,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (_req: AuthRequest, res: Response) => {
  // JWT is stateless — client should discard the token
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const learner = await LearnerModel.findById(req.userId).select('-passwordHash');
    if (!learner) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: learner._id,
      name: learner.name,
      email: learner.email,
      experienceLevel: learner.experienceLevel,
      hasGoals: learner.goals.length > 0,
      hasCompletedDiagnostic: learner.assessmentHistory.length > 0,
      skillStatesCount: learner.skillStates.length,
    });
  } catch (error) {
    console.error('Auth me error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
