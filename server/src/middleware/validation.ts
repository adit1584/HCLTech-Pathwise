import { z } from 'zod';

// ── Auth Schemas ────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Goal Schemas ────────────────────────────────────────────

export const interpretGoalSchema = z.object({
  text: z.string().min(10).max(2000),
});

export const structuredGoalSchema = z.object({
  targetRole: z.string(),
  objective: z.string(),
  timeframeWeeks: z.number().min(1).max(520),
  weeklyHours: z.number().min(1).max(80),
  currentLevel: z.enum(['beginner', 'beginner_intermediate', 'intermediate', 'advanced', 'expert']),
  learningPreference: z.array(z.enum(['video', 'reading', 'project_based', 'interactive', 'course', 'mentored'])),
  constraints: z.array(z.string()),
  targetSkills: z.array(z.string()).optional(),
});

// ── Learner Profile Schemas ─────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  experienceLevel: z.enum(['beginner', 'beginner_intermediate', 'intermediate', 'advanced', 'expert']).optional(),
  interests: z.array(z.string()).optional(),
  weeklyHours: z.number().min(1).max(80).optional(),
  preferredLearningModes: z.array(z.enum(['video', 'reading', 'project_based', 'interactive', 'course', 'mentored'])).optional(),
});

// ── Diagnostic Schemas ──────────────────────────────────────

export const diagnosticAnswerSchema = z.object({
  questionId: z.string(),
  selectedAnswer: z.number().min(0),
});

// ── Progress Event Schemas ──────────────────────────────────

export const progressEventSchema = z.object({
  type: z.enum([
    'ASSESSMENT_COMPLETED',
    'PROJECT_COMPLETED',
    'RESOURCE_COMPLETED',
    'PRACTICE_COMPLETED',
  ]),
  skillIds: z.array(z.string()).min(1),
  resourceId: z.string().optional(),
  score: z.number().min(0).max(100),
  metadata: z.record(z.unknown()).optional(),
});

// ── Feedback Schemas ────────────────────────────────────────

export const feedbackSchema = z.object({
  text: z.string().min(5).max(2000),
});

// ── Assistant Schemas ───────────────────────────────────────

export const assistantChatSchema = z.object({
  message: z.string().min(1).max(3000),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
});

// ── What-If Simulator ───────────────────────────────────────

export const whatIfSchema = z.object({
  weeklyHours: z.number().min(1).max(80).optional(),
  targetRole: z.string().optional(),
  skipSkills: z.array(z.string()).optional(),
});
