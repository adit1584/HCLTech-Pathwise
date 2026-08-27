import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { TargetRole, Skill, Resource } from '../models/types.js';

function findDataFile(filename: string): string | null {
  const currentDir = typeof __dirname !== 'undefined' ? __dirname : fileURLToPath(new URL('.', import.meta.url));
  const candidatePaths = [
    resolve(process.cwd(), '../data', filename),
    resolve(process.cwd(), 'data', filename),
    resolve(process.cwd(), 'server/data', filename),
    resolve(currentDir, '../../data', filename),
    resolve(currentDir, '../../../data', filename),
    resolve(currentDir, '../data', filename),
  ];

  for (const p of candidatePaths) {
    if (existsSync(p)) {
      return p;
    }
  }
  return null;
}

export function loadRolesData(): TargetRole[] {
  try {
    const filePath = findDataFile('roles.json');
    if (!filePath) {
      console.warn('roles.json not found in any candidate path');
      return [];
    }
    const data = readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.warn('Failed to load roles.json data:', err);
    return [];
  }
}

export function loadSkillsData(): Skill[] {
  try {
    const filePath = findDataFile('skills.json');
    if (!filePath) {
      console.warn('skills.json not found in any candidate path');
      return [];
    }
    const raw: any[] = JSON.parse(readFileSync(filePath, 'utf-8'));

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
  } catch (err) {
    console.warn('Failed to load skills.json data:', err);
    return [];
  }
}

export function loadResourcesData(): Resource[] {
  try {
    const filePath = findDataFile('resources.json');
    if (!filePath) {
      console.warn('resources.json not found in any candidate path');
      return [];
    }
    const raw: any[] = JSON.parse(readFileSync(filePath, 'utf-8'));

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
  } catch (err) {
    console.warn('Failed to load resources.json data:', err);
    return [];
  }
}
