// ============================================================
// Roadmap Generator — Converts optimized path to actionable roadmap
// ============================================================
// Takes PathItems from the optimizer and enriches them with
// matching resources from the catalog.
//
// This is a DETERMINISTIC module. No LLM calls.
// ============================================================

import type { Skill, Resource, SkillGap, RoadmapItem } from '../models/types.js';
import type { PathItem } from './path-optimizer.js';
import { randomUUID } from 'crypto';

/**
 * Generate a unique ID for roadmap items.
 */
function generateId(): string {
  try {
    return randomUUID();
  } catch {
    return Math.random().toString(36).substring(2, 15);
  }
}

/**
 * Find the best matching resources for a skill.
 * Prioritizes by quality score and learner preference.
 */
function findResources(
  skillId: string,
  resources: Resource[],
  learningPreferences: string[],
  maxResources: number = 3,
): Resource[] {
  const matching = resources.filter(r =>
    r.skills.includes(skillId)
  );

  // Sort by preference match + quality
  matching.sort((a, b) => {
    // Preference bonus
    const aPreferenceMatch = learningPreferences.includes(a.type.toLowerCase()) ? 0.2 : 0;
    const bPreferenceMatch = learningPreferences.includes(b.type.toLowerCase()) ? 0.2 : 0;

    const aScore = a.qualityScore + aPreferenceMatch;
    const bScore = b.qualityScore + bPreferenceMatch;

    return bScore - aScore;
  });

  return matching.slice(0, maxResources);
}

/**
 * Convert a PathItem into a RoadmapItem with matched resources.
 */
function pathItemToRoadmapItem(
  item: PathItem,
  resources: Resource[],
  learningPreferences: string[],
  allSkills: Skill[],
  index: number = 0,
): RoadmapItem {
  const matchedResources = item.type === 'SKILL'
    ? findResources(item.skillId, resources, learningPreferences)
    : [];

  return {
    id: `${item.type.toLowerCase()}-${item.skillId}-${item.milestone}-${index}`,
    type: item.type === 'SKILL' ? 'COURSE' : item.type,
    title: item.skillName,
    skillIds: [item.skillId],
    prerequisiteIds: item.prerequisites,
    estimatedHours: item.estimatedHours,
    priorityScore: item.priorityScore,
    status: 'locked',
    reason: item.reason,
    unlocks: item.unlocks,
    resourceIds: matchedResources.map(r => r.id),
    milestone: item.milestone,
  };
}

/**
 * Determine item statuses based on prerequisites.
 * Items with no prerequisites (or all completed prerequisites) are "available".
 */
function assignStatuses(
  items: RoadmapItem[],
  completedSkills: Set<string>,
): RoadmapItem[] {
  const completed = new Set(completedSkills);

  return items.map(item => {
    // Check if all prerequisite skills are completed
    const allPrereqsMet = item.prerequisiteIds.every(prereqId =>
      completed.has(prereqId)
    );

    // Only mark assessment as completed if skill is verified
    if (completed.has(item.skillIds[0]) && item.type === 'ASSESSMENT') {
      return { ...item, status: 'completed' as const };
    }

    if (item.prerequisiteIds.length === 0 || allPrereqsMet) {
      return { ...item, status: 'available' as const };
    }

    return { ...item, status: 'locked' as const };
  });
}

export interface RoadmapGeneratorInput {
  pathItems: PathItem[];
  resources: Resource[];
  allSkills: Skill[];
  learningPreferences: string[];
  completedSkills: Set<string>;
  weeklyHours: number;
}

/**
 * Generate a complete roadmap from the optimized path.
 */
export function generateRoadmap(input: RoadmapGeneratorInput): {
  items: RoadmapItem[];
  totalEstimatedWeeks: number;
} {
  const {
    pathItems,
    resources,
    allSkills,
    learningPreferences,
    completedSkills,
    weeklyHours,
  } = input;

  // Convert path items to roadmap items with matched resources
  let roadmapItems = pathItems.map((item, index) =>
    pathItemToRoadmapItem(item, resources, learningPreferences, allSkills, index)
  );

  // Assign statuses based on prerequisites and completion
  roadmapItems = assignStatuses(roadmapItems, completedSkills);

  // Calculate total estimated weeks
  const totalHours = roadmapItems.reduce((sum, item) => sum + item.estimatedHours, 0);
  const totalEstimatedWeeks = Math.ceil(totalHours / Math.max(weeklyHours, 1));

  return {
    items: roadmapItems,
    totalEstimatedWeeks,
  };
}
