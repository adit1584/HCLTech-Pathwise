// ============================================================
// Pathwise Client Types
// ============================================================

export type ExperienceLevel = 'beginner' | 'beginner_intermediate' | 'intermediate' | 'advanced' | 'expert';

export type LearningMode = 'video' | 'reading' | 'project_based' | 'interactive' | 'course' | 'mentored';

export type EvidenceType =
  | 'SELF_REPORT'
  | 'DIAGNOSTIC'
  | 'COURSE_COMPLETION'
  | 'ASSESSMENT'
  | 'PROJECT'
  | 'PRACTICE'
  | 'RECENCY';

export interface Evidence {
  type: EvidenceType;
  score?: number;
  source?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface SkillState {
  skillId: string;
  proficiency: number;
  confidence: number;
  evidence: Evidence[];
  lastUpdated: string;
}

export interface LearnerGoal {
  targetRole: string;
  objective: string;
  timeframeWeeks: number;
  weeklyHours: number;
  currentLevel: ExperienceLevel;
  learningPreference: LearningMode[];
  constraints: string[];
  targetSkills?: string[];
  createdAt: string;
}

export interface LearnerProfile {
  id: string;
  name: string;
  email: string;
  experienceLevel: ExperienceLevel;
  goals: LearnerGoal[];
  interests: string[];
  weeklyHours: number;
  preferredLearningModes: LearningMode[];
  completedResources: string[];
  skillStates: SkillState[];
  assessmentHistory: string[];
  projectHistory: string[];
}

export interface TargetRole {
  id: string;
  name: string;
  description: string;
  estimatedTotalHours: number;
  skillCount: number;
  requiredSkills?: Array<{ skillId: string; targetProficiency?: number; importance?: number }>;
}

export interface SkillNode {
  id: string;
  name: string;
  category: string;
  difficulty: number;
  estimatedHours: number;
  prerequisites: string[];
  relatedSkills: string[];
}

export interface SkillEdge {
  from: string;
  to: string;
  type: 'PREREQUISITE' | 'RELATED_TO' | 'ENABLES' | 'SPECIALIZES';
}

export interface SkillGraphData {
  nodes: SkillNode[];
  edges: SkillEdge[];
}

export interface RoadmapItem {
  id: string;
  type: 'SKILL' | 'COURSE' | 'PROJECT' | 'ASSESSMENT' | 'PRACTICE';
  title: string;
  skillIds: string[];
  prerequisiteIds: string[];
  estimatedHours: number;
  priorityScore: number;
  status: 'locked' | 'available' | 'in_progress' | 'completed' | 'skipped';
  reason: string;
  unlocks: string[];
  resourceIds: string[];
  milestone: number;
}

export interface SkillGap {
  skillId: string;
  skillName: string;
  currentProficiency: number;
  targetProficiency: number;
  gap: number;
  roleImportance: number;
  centrality: number;
  unlockValue: number;
  goalRelevance: number;
  learningCost: number;
  priorityScore: number;
}

export interface RecommendationTrace {
  recommendationId: string;
  skillId: string;
  skillName: string;
  triggeredBySkills: string[];
  gap: number;
  roleImportance: number;
  centrality: number;
  unlockValue: number;
  goalRelevance: number;
  estimatedCost: number;
  priorityScore: number;
  prerequisiteReason: string[];
  excludedAlternatives: Array<{
    skillId: string;
    skillName: string;
    reason: string;
  }>;
}

export interface RecompilationResult {
  dependenciesChecked: number;
  skillsRecomputed: number;
  resourcesRemoved: number;
  resourcesAdded: number;
  milestonesUpdated: number;
  reason: string;
  affectedSkills: string[];
  changes: Array<{
    type: 'skill_updated' | 'resource_removed' | 'resource_added' | 'milestone_changed' | 'order_changed';
    description: string;
  }>;
}

export interface DiagnosticQuestion {
  id: string;
  skillId: string;
  skillName: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: number;
  explanation: string;
}

export interface LearningResource {
  resourceId: string;
  title: string;
  type: 'COURSE' | 'PROJECT' | 'ASSESSMENT' | 'PRACTICE' | 'READING' | 'VIDEO';
  skills: string[];
  prerequisites: string[];
  difficulty: number;
  estimatedHours: number;
  qualityScore: number;
  description: string;
  source: string;
  url: string;
}
