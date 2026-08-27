import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { LearnerModel } from '../models/Learner.js';
import { OtpVerificationModel } from '../models/OtpVerification.js';
import { registerSchema, loginSchema } from '../middleware/validation.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { validateRealEmail } from '../utils/emailValidator.js';
import { sendOtpEmail } from '../services/emailService.js';

const router = Router();

// Helper to generate 6-digit OTP
function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/auth/send-otp — Request email verification code for new account
router.post('/send-otp', async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }

    // 1. Validate real, non-disposable email
    const emailValidation = validateRealEmail(email);
    if (!emailValidation.isValid || !emailValidation.normalizedEmail) {
      res.status(400).json({ error: emailValidation.reason || 'Invalid email address.' });
      return;
    }
    const cleanEmail = emailValidation.normalizedEmail;

    // 2. Ensure only ONE account exists per email address
    const existing = await LearnerModel.findOne({ email: cleanEmail });
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
      return;
    }

    // 3. Generate 6-digit OTP
    const otp = generateOtp();
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Save or update pending registration OTP record
    await OtpVerificationModel.findOneAndUpdate(
      { email: cleanEmail },
      {
        email: cleanEmail,
        name: name.trim(),
        passwordHash,
        otp,
        attempts: 0,
        createdAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // 5. Send real email directly to user's inbox
    await sendOtpEmail(cleanEmail, otp, name.trim());

    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched directly to ${cleanEmail}. Please check your inbox or spam folder.`,
      email: cleanEmail,
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to dispatch email verification code. Please try again.' });
  }
});

// POST /api/auth/verify-otp — Verify 6-digit OTP and create user account
router.post('/verify-otp', async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ error: 'Email and 6-digit verification code are required.' });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otp.toString().trim();

    // 1. Find OTP record
    const record = await OtpVerificationModel.findOne({ email: cleanEmail });
    if (!record) {
      res.status(400).json({ error: 'Verification code has expired or is invalid. Please request a new code.' });
      return;
    }

    // 2. Check maximum attempts
    if (record.attempts >= 5) {
      await OtpVerificationModel.deleteOne({ _id: record._id });
      res.status(429).json({ error: 'Too many incorrect attempts. Please request a new verification code.' });
      return;
    }

    // 3. Verify OTP Match
    if (record.otp !== cleanOtp) {
      await OtpVerificationModel.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });
      res.status(400).json({ error: 'Incorrect verification code. Please check your email and try again.' });
      return;
    }

    // 4. Double check unique account condition
    const existing = await LearnerModel.findOne({ email: cleanEmail });
    if (existing) {
      await OtpVerificationModel.deleteOne({ _id: record._id });
      res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
      return;
    }

    // 5. Create permanent Learner Account
    const learner = await LearnerModel.create({
      name: record.name,
      email: cleanEmail,
      passwordHash: record.passwordHash,
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

    // Clean up OTP record
    await OtpVerificationModel.deleteOne({ _id: record._id });

    // Generate JWT token
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
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify code and create account.' });
  }
});

// POST /api/auth/register — Direct Registration with Email Legitimacy Validation
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Validation failed', details: parsed.error.format() });
      return;
    }

    const { name, email, password } = parsed.data;

    // Validate real, non-disposable email
    const emailValidation = validateRealEmail(email);
    if (!emailValidation.isValid || !emailValidation.normalizedEmail) {
      res.status(400).json({ error: emailValidation.reason || 'Invalid email address.' });
      return;
    }
    const cleanEmail = emailValidation.normalizedEmail;

    // Check if user exists (1 account per email rule)
    const existing = await LearnerModel.findOne({ email: cleanEmail });
    if (existing) {
      res.status(409).json({ error: 'An account with this email address already exists. Please sign in instead.' });
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create learner
    const learner = await LearnerModel.create({
      name: name.trim(),
      email: cleanEmail,
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
    const cleanEmail = email.trim().toLowerCase();

    const learner = await LearnerModel.findOne({ email: cleanEmail });
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
        hasCompletedDiagnostic: true,
      },
    });
  } catch (error) {
    console.error('Demo auth error:', error);
    res.status(500).json({ error: 'Demo login failed' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const learner = await LearnerModel.findById(req.userId);
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    res.json({
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
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
