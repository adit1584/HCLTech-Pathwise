import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import type { TargetRole, Skill, Resource } from '../models/types.js';

function getDataDir(): string {
  return resolve(process.cwd(), '../data');
}

export function loadRolesData(): TargetRole[] {
  try {
    const filePath = join(getDataDir(), 'roles.json');
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    try {
      const localPath = resolve(process.cwd(), 'data/roles.json');
      return JSON.parse(readFileSync(localPath, 'utf-8'));
    } catch {
      console.warn('Failed to load roles.json data:', err);
      return [];
    }
  }
}

export function loadSkillsData(): Skill[] {
  try {
    let raw: any[] = [];
    try {
      const filePath = join(getDataDir(), 'skills.json');
      raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      const localPath = resolve(process.cwd(), 'data/skills.json');
      raw = JSON.parse(readFileSync(localPath, 'utf-8'));
    }

    return raw.map((s: any) => ({
      id: s.skillId || s.id,
      name: s.name,
      category: s.category,
      description: s.description,
      prerequisites: s.prerequisites || [],
      relatedSkills: s.relatedSkills || [],
      roleImportance: s.roleImportance || [],
      difficulty: s.difficulty || 2,
      estimatedHours: s.estimatedHours || 20,
    }));
  } catch {
    return [];
  }
}

export function loadResourcesData(): Resource[] {
  try {
    let raw: any[] = [];
    try {
      const filePath = join(getDataDir(), 'resources.json');
      raw = JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch {
      const localPath = resolve(process.cwd(), 'data/resources.json');
      raw = JSON.parse(readFileSync(localPath, 'utf-8'));
    }

    return raw.map((r: any) => ({
      id: r.resourceId || r.id,
      resourceId: r.resourceId || r.id,
      title: r.title,
      type: r.type,
      skills: r.skills || [],
      prerequisites: r.prerequisites || [],
      difficulty: r.difficulty || 1,
      estimatedHours: r.estimatedHours || 10,
      qualityScore: r.qualityScore || 0.85,
      description: r.description || '',
      source: r.source || 'pathwise',
      url: r.url || `https://www.google.com/search?q=${encodeURIComponent(r.title + ' tutorial course practice')}`,
    }));
  } catch {
    return [];
  }
}
