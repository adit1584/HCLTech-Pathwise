// ============================================================
// Pathwise API Client
// ============================================================

import type {
  LearnerProfile,
  TargetRole,
  SkillGraphData,
  RoadmapItem,
  SkillGap,
  RecommendationTrace,
  DiagnosticQuestion,
  LearningResource,
  RecompilationResult,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('pathwise_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Auth
  sendOtp: (data: { name: string; email: string; password: string }) =>
    request<{ success: boolean; message: string; email: string; devOtp?: string }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyOtp: (data: { email: string; otp: string }) =>
    request<{ token: string; user: any }>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: { name: string; email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  demoLogin: () =>
    request<{ token: string; user: any }>('/auth/demo', {
      method: 'POST',
    }),

  getMe: () => request<any>('/auth/me'),

  // Profile
  getProfile: () => request<LearnerProfile>('/learner/profile'),
  updateProfile: (data: Partial<LearnerProfile>) =>
    request<any>('/learner/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Goals
  interpretGoal: (text: string) =>
    request<{ interpreted: any }>('/goals/interpret', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  setGoal: (goalData: any, selfReportedSkills?: Array<{ skillId: string; proficiency: number }>) =>
    request<any>('/goals/set', {
      method: 'POST',
      body: JSON.stringify({ ...goalData, selfReportedSkills }),
    }),

  getRoles: () => request<{ roles: TargetRole[] }>('/goals/roles'),

  // Dynamic role search — any career path
  createCustomRole: (roleName: string) =>
    request<{ role: TargetRole }>('/goals/custom-role', {
      method: 'POST',
      body: JSON.stringify({ roleName }),
    }),

  // Skills
  getSkills: () => request<{ skills: any[] }>('/skills'),
  getSkillGraph: (role?: string) =>
    request<SkillGraphData>(role ? `/skills/graph?role=${encodeURIComponent(role)}` : '/skills/graph'),
  getSkillDetail: (skillId: string) => request<any>(`/skills/${skillId}`),

  // Diagnostic
  startDiagnostic: () =>
    request<{ questions: DiagnosticQuestion[]; totalQuestions: number; targetRole: string }>(
      '/diagnostic/start',
      { method: 'POST' }
    ),

  submitDiagnostic: (answers: Array<{ questionId: string; selectedAnswer: number }>) =>
    request<{ results: any[]; message: string }>('/diagnostic/answer', {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // Learning Path / Roadmap
  compilePath: () =>
    request<{
      roadmap: RoadmapItem[];
      totalEstimatedWeeks: number;
      version: number;
      skillGaps: SkillGap[];
    }>('/path/compile', { method: 'POST' }),

  getCurrentPath: () =>
    request<{
      roadmap: RoadmapItem[];
      totalEstimatedWeeks: number;
      version: number;
      compiledAt: string;
    }>('/path/current'),

  recompilePath: (changedSkillIds: string[], reason?: string) =>
    request<{
      roadmap: RoadmapItem[];
      totalEstimatedWeeks: number;
      version: number;
      recompilation: RecompilationResult;
    }>('/path/recompile', {
      method: 'POST',
      body: JSON.stringify({ changedSkillIds, reason }),
    }),

  // Recommendations & Traces
  getRecommendations: () => request<{ recommendations: SkillGap[] }>('/recommendations'),
  getRecommendationTrace: (skillId: string) =>
    request<{ trace: RecommendationTrace; unlocks: Array<{ id: string; name: string }> }>(
      `/recommendations/${skillId}/trace`
    ),

  // Progress
  recordProgressEvent: (event: {
    type: 'ASSESSMENT_COMPLETED' | 'PROJECT_COMPLETED' | 'RESOURCE_COMPLETED' | 'PRACTICE_COMPLETED';
    skillIds: string[];
    resourceId?: string;
    score: number;
    metadata?: Record<string, unknown>;
  }) =>
    request<{
      event: any;
      skillUpdates: Array<{ skillId: string; before: number; after: number }>;
      message: string;
    }>('/progress/event', {
      method: 'POST',
      body: JSON.stringify(event),
    }),

  getProgressHistory: () => request<{ events: any[] }>('/progress/history'),

  // Resources
  getResources: (params?: { type?: string; skill?: string; difficulty?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.skill) query.append('skill', params.skill);
    if (params?.difficulty) query.append('difficulty', params.difficulty.toString());
    return request<{ resources: LearningResource[] }>(`/resources?${query.toString()}`);
  },

  // AI-Powered Course Recommendations
  getAIRecommendations: (skillId: string, skillName?: string) => {
    const query = new URLSearchParams({ skillId });
    if (skillName) query.append('skillName', skillName);
    return request<{ recommendations: any[]; skill: string; targetRole: string }>(
      `/resources/recommendations?${query.toString()}`
    );
  },

  getBulkRecommendations: (skillIds: string[]) =>
    request<{ results: Array<{ skillId: string; skillName: string; recommendations: any[] }>; targetRole: string }>(
      '/resources/recommendations/bulk',
      { method: 'POST', body: JSON.stringify({ skillIds }) }
    ),

  // Feedback
  submitFeedback: (text: string) =>
    request<{
      received: boolean;
      structured: any;
      systemAction: string;
      message: string;
    }>('/feedback', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

  // AI Assistant
  askAssistant: (message: string, history?: Array<{ role: 'user' | 'assistant'; content: string }>) =>
    request<{ answer: string; suggestedActions: string[] }>('/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history }),
    }),

  // What-If Simulator
  simulateWhatIf: (data: { weeklyHours?: number; targetRole?: string; secondaryRole?: string | null; skipSkills?: string[] }) =>
    request<{
      simulatedRole: string;
      simulatedRoleId: string;
      isDualRole?: boolean;
      primaryRoleName?: string;
      secondaryRoleName?: string;
      sharedSkills?: string[];
      synergyWeeksSaved?: number;
      simulatedWeeklyHours: number;
      simulatedTotalWeeks: number;
      baseWeeks: number;
      timeSavedWeeks: number;
      totalMilestones: number;
      simulatedItemsCount: number;
      simulatedRoadmap: RoadmapItem[];
    }>('/simulator/what-if', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  applySimulation: (data: { weeklyHours?: number; targetRole?: string; secondaryRole?: string | null; skipSkills?: string[] }) =>
    request<{
      success: boolean;
      recompiled: boolean;
      weeklyHours: number;
      targetRole: string;
      roadmap: RoadmapItem[];
      totalEstimatedWeeks: number;
      message: string;
    }>('/simulator/apply-simulation', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Practice Challenges & Dynamic Questions
  getRoadmapPracticeQuestions: () =>
    request<{
      targetRole: string;
      targetRoleName: string;
      roadmapSkills: Array<{ skillId: string; skillName: string; milestone: number }>;
      questions: Array<{
        id: string;
        title: string;
        skillId: string;
        skillName: string;
        milestone: number;
        category: string;
        platform: string;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        estimatedMinutes: number;
        url: string;
        problemStatement: string;
        tags: string[];
        skills: string[];
        quiz?: {
          question: string;
          options: string[];
          correctAnswer: number;
          explanation: string;
          codeSnippet?: string;
        };
      }>;
    }>('/practice/roadmap-questions'),

  generatePracticeQuestions: (data: { skillId: string; skillName?: string; role?: string; count?: number }) =>
    request<{ questions: any[]; skillName: string }>('/practice/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitPracticeAnswer: (data: { questionId: string; skillId: string; selectedOption?: number; correctAnswer?: number; title?: string }) =>
    request<{
      success: boolean;
      isCorrect: boolean;
      score: number;
      xpEarned: number;
      message: string;
    }>('/practice/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
