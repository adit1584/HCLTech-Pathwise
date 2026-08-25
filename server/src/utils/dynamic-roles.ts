// ============================================================
// Dynamic Role Registry & AI Role Synthesizer
// ============================================================
// Allows ANY custom career role to be compiled into a prerequisite DAG.
// Integrates with Groq to synthesize role requirements for custom inputs.
// ============================================================

import { loadRolesData, loadSkillsData } from './load-data.js';
import type { TargetRole } from '../models/types.js';
import Groq from 'groq-sdk';
import { config } from '../config.js';

// In-memory cache for synthesized and preset roles
const dynamicRolesMap = new Map<string, TargetRole>();

function initRoles() {
  const preset = loadRolesData();
  preset.forEach(r => dynamicRolesMap.set(r.id.toLowerCase(), r));
}
initRoles();

function normalizeRoleId(nameOrId: string): string {
  return nameOrId
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function resolveOrSynthesizeRole(roleNameOrId: string): Promise<TargetRole> {
  const normalizedId = normalizeRoleId(roleNameOrId);

  // 1. Check if already registered
  if (dynamicRolesMap.has(normalizedId)) {
    return dynamicRolesMap.get(normalizedId)!;
  }

  // Check case-insensitive match on name
  for (const role of dynamicRolesMap.values()) {
    if (role.name.toLowerCase() === roleNameOrId.toLowerCase()) {
      return role;
    }
  }

  // 2. Synthesize new role using Groq AI
  const allSkills = loadSkillsData();
  const availableSkillIds = allSkills.map(s => s.id).filter(Boolean);

  try {
    const apiKey = config.groqApiKey || process.env.GROQ_API_KEY;
    if (apiKey) {
      const client = new Groq({ apiKey });
      const prompt = `You are a curriculum architect. Given the career target "${roleNameOrId}", pick 6 to 12 required skills from this list:
${JSON.stringify(availableSkillIds)}

Format strictly as JSON:
{
  "name": "${roleNameOrId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}",
  "description": "Brief 1-2 sentence description of this technical role.",
  "estimatedTotalHours": 360,
  "requiredSkills": [
    { "skillId": "valid_skill_id_from_list", "targetProficiency": 80, "importance": 0.9 }
  ]
}`;

      const res = await client.chat.completions.create({
        model: config.groqModel || 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const parsed = JSON.parse(res.choices[0]?.message?.content || '{}');
      if (parsed.requiredSkills && Array.isArray(parsed.requiredSkills) && parsed.requiredSkills.length > 0) {
        const validReqs = parsed.requiredSkills.filter((r: any) =>
          availableSkillIds.includes(r.skillId)
        );

        if (validReqs.length >= 3) {
          const synthesizedRole: TargetRole = {
            id: normalizedId,
            name: parsed.name || roleNameOrId,
            description: parsed.description || `Specialized career pathway for ${roleNameOrId}.`,
            estimatedTotalHours: parsed.estimatedTotalHours || validReqs.length * 35,
            requiredSkills: validReqs,
          };
          dynamicRolesMap.set(normalizedId, synthesizedRole);
          return synthesizedRole;
        }
      }
    }
  } catch (err) {
    console.warn('AI role synthesis fallback triggered:', err);
  }

  // 3. Guaranteed Deterministic Synthesis Fallback
  const lower = roleNameOrId.toLowerCase();
  const selectedSkills: Array<{ skillId: string; targetProficiency: number; importance: number }> = [];

  const addSkill = (id: string, prof = 75, imp = 0.85) => {
    if (availableSkillIds.includes(id) && !selectedSkills.some(s => s.skillId === id)) {
      selectedSkills.push({ skillId: id, targetProficiency: prof, importance: imp });
    }
  };

  if (lower.includes('web') || lower.includes('front') || lower.includes('react') || lower.includes('full') || lower.includes('node')) {
    addSkill('html-css', 80, 0.9);
    addSkill('javascript', 85, 0.95);
    addSkill('typescript', 75, 0.85);
    addSkill('react', 80, 0.9);
    addSkill('nodejs', 80, 0.85);
    addSkill('sql', 70, 0.75);
    addSkill('git', 75, 0.8);
    addSkill('api-design', 80, 0.85);
  } else if (lower.includes('animat') || lower.includes('3d') || lower.includes('model') || lower.includes('art') || lower.includes('game')) {
    addSkill('3d-modeling-fundamentals', 80, 0.95);
    addSkill('principles-of-animation', 85, 0.95);
    addSkill('character-rigging', 75, 0.85);
    addSkill('environment-design-lighting', 75, 0.85);
    addSkill('character-animation-basics', 80, 0.9);
    addSkill('advanced-character-acting', 75, 0.85);
    addSkill('3d-demoreel-portfolio', 85, 0.95);
  } else if (lower.includes('devops') || lower.includes('cloud') || lower.includes('infra') || lower.includes('sre')) {
    addSkill('python', 75, 0.8);
    addSkill('docker', 85, 0.95);
    addSkill('deployment', 85, 0.95);
    addSkill('git', 80, 0.85);
    addSkill('api-design', 75, 0.8);
    addSkill('testing', 75, 0.8);
    addSkill('sql', 65, 0.65);
  } else if (lower.includes('robot') || lower.includes('embedded') || lower.includes('hardware')) {
    addSkill('python', 80, 0.9);
    addSkill('numpy', 75, 0.85);
    addSkill('statistics', 70, 0.8);
    addSkill('machine-learning', 80, 0.9);
    addSkill('deep-learning', 80, 0.9);
    addSkill('git', 75, 0.8);
    addSkill('docker', 70, 0.75);
  } else {
    addSkill('python', 80, 0.9);
    addSkill('sql', 75, 0.85);
    addSkill('statistics', 70, 0.8);
    addSkill('pandas', 75, 0.85);
    addSkill('data-cleaning', 75, 0.8);
    addSkill('eda', 80, 0.85);
    addSkill('data-visualization', 75, 0.8);
    addSkill('machine-learning', 75, 0.85);
    addSkill('git', 70, 0.75);
  }

  const synthesized: TargetRole = {
    id: normalizedId,
    name: roleNameOrId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: `Adaptive prerequisite-aware learning curriculum for ${roleNameOrId}.`,
    estimatedTotalHours: selectedSkills.length * 35,
    requiredSkills: selectedSkills,
  };

  dynamicRolesMap.set(normalizedId, synthesized);
  return synthesized;
}

export function getAllTargetRoles(): TargetRole[] {
  return Array.from(dynamicRolesMap.values());
}
