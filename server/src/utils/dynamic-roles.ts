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
  // Covers 15+ role categories so custom roles get relevant skills
  const lower = roleNameOrId.toLowerCase();
  const selectedSkills: Array<{ skillId: string; targetProficiency: number; importance: number }> = [];

  const addSkill = (id: string, prof = 75, imp = 0.85) => {
    if (availableSkillIds.includes(id) && !selectedSkills.some(s => s.skillId === id)) {
      selectedSkills.push({ skillId: id, targetProficiency: prof, importance: imp });
    }
  };

  if (lower.includes('full-stack') || lower.includes('fullstack') || lower.includes('full stack')) {
    // Full Stack Developer — In-depth 4-milestone stack
    addSkill('html-css', 80, 0.9);
    addSkill('javascript', 85, 0.95);
    addSkill('typescript', 80, 0.9);
    addSkill('react', 85, 0.95);
    addSkill('nodejs', 85, 0.95);
    addSkill('graphql', 75, 0.82);
    addSkill('sql', 80, 0.88);
    addSkill('nosql', 70, 0.75);
    addSkill('api-design', 85, 0.92);
    addSkill('system-design', 75, 0.85);
    addSkill('git', 80, 0.85);
    addSkill('docker', 75, 0.8);
    addSkill('deployment', 75, 0.82);
    addSkill('testing', 75, 0.8);
  } else if (lower.includes('frontend') || lower.includes('front-end') || lower.includes('front end') || lower.includes('react') || lower.includes('ui develop') || lower.includes('web develop')) {
    // Frontend / Web Developer
    addSkill('html-css', 90, 0.98);
    addSkill('javascript', 90, 0.98);
    addSkill('typescript', 85, 0.92);
    addSkill('react', 90, 0.98);
    addSkill('ui-ux-design', 80, 0.88);
    addSkill('react-native', 70, 0.75);
    addSkill('api-design', 75, 0.8);
    addSkill('git', 80, 0.85);
    addSkill('testing', 75, 0.82);
    addSkill('deployment', 70, 0.75);
  } else if (lower.includes('backend') || lower.includes('back-end') || lower.includes('back end') || lower.includes('server') || lower.includes('node')) {
    // Backend Developer
    addSkill('python', 85, 0.9);
    addSkill('nodejs', 85, 0.95);
    addSkill('typescript', 80, 0.88);
    addSkill('sql', 85, 0.95);
    addSkill('nosql', 75, 0.82);
    addSkill('graphql', 75, 0.82);
    addSkill('api-design', 90, 0.98);
    addSkill('system-design', 85, 0.95);
    addSkill('linux', 80, 0.88);
    addSkill('docker', 80, 0.88);
    addSkill('aws-cloud', 75, 0.85);
    addSkill('git', 80, 0.85);
    addSkill('deployment', 80, 0.88);
    addSkill('testing', 80, 0.88);
  } else if (lower.includes('cyber') || lower.includes('security') || lower.includes('pentest') || lower.includes('infosec') || lower.includes('ethical hack')) {
    // Cybersecurity / InfoSec
    addSkill('linux', 85, 0.95);
    addSkill('networking', 90, 0.98);
    addSkill('cybersecurity-fundamentals', 90, 0.98);
    addSkill('ethical-hacking', 85, 0.95);
    addSkill('python', 80, 0.88);
    addSkill('sql', 75, 0.8);
    addSkill('docker', 75, 0.8);
    addSkill('git', 75, 0.78);
    addSkill('deployment', 75, 0.8);
    addSkill('testing', 80, 0.85);
  } else if (lower.includes('blockchain') || lower.includes('web3') || lower.includes('crypto') || lower.includes('smart contract') || lower.includes('solidity')) {
    // Blockchain / Web3 Developer
    addSkill('javascript', 85, 0.92);
    addSkill('typescript', 85, 0.92);
    addSkill('solidity', 90, 0.98);
    addSkill('smart-contracts', 90, 0.98);
    addSkill('web3', 85, 0.95);
    addSkill('react', 80, 0.88);
    addSkill('api-design', 80, 0.85);
    addSkill('git', 80, 0.85);
    addSkill('docker', 70, 0.75);
    addSkill('testing', 85, 0.92);
    addSkill('deployment', 75, 0.82);
  } else if (lower.includes('product manager') || lower.includes('product owner') || lower.includes('pm ') || lower.includes('project manager')) {
    // Product / Project Manager
    addSkill('product-management', 90, 0.98);
    addSkill('excel', 85, 0.92);
    addSkill('sql', 80, 0.88);
    addSkill('statistics', 75, 0.82);
    addSkill('eda', 75, 0.82);
    addSkill('data-visualization', 85, 0.92);
    addSkill('ui-ux-design', 75, 0.82);
    addSkill('api-design', 70, 0.75);
    addSkill('git', 65, 0.65);
  } else if (lower.includes('ui/ux') || lower.includes('ui ux') || lower.includes('ux design') || lower.includes('ui design') || lower.includes('design') || lower.includes('figma')) {
    // UI/UX Designer
    addSkill('ui-ux-design', 95, 0.98);
    addSkill('html-css', 90, 0.95);
    addSkill('javascript', 80, 0.85);
    addSkill('react', 75, 0.8);
    addSkill('data-visualization', 80, 0.85);
    addSkill('git', 65, 0.65);
    addSkill('typescript', 65, 0.65);
  } else if (lower.includes('data engineer') || lower.includes('etl') || lower.includes('data pipeline') || lower.includes('data infra')) {
    // Data Engineer
    addSkill('python', 90, 0.98);
    addSkill('sql', 90, 0.98);
    addSkill('pandas', 80, 0.88);
    addSkill('data-cleaning', 85, 0.92);
    addSkill('nosql', 80, 0.85);
    addSkill('linux', 80, 0.88);
    addSkill('docker', 85, 0.92);
    addSkill('system-design', 80, 0.88);
    addSkill('aws-cloud', 80, 0.88);
    addSkill('git', 80, 0.85);
    addSkill('deployment', 80, 0.88);
    addSkill('testing', 75, 0.8);
  } else if (lower.includes('nlp') || lower.includes('natural language') || lower.includes('language model') || lower.includes('llm') || lower.includes('computer vision') || lower.includes('cv engineer')) {
    // NLP / Computer Vision / Specialized AI
    addSkill('python', 90, 0.98);
    addSkill('numpy', 85, 0.92);
    addSkill('statistics', 80, 0.88);
    addSkill('probability', 80, 0.88);
    addSkill('machine-learning', 90, 0.98);
    addSkill('deep-learning', 90, 0.98);
    addSkill('nlp', 90, 0.98);
    addSkill('model-evaluation', 80, 0.88);
    addSkill('docker', 75, 0.8);
    addSkill('git', 80, 0.85);
    addSkill('deployment', 80, 0.88);
  } else if (lower.includes('mobile') || lower.includes('android') || lower.includes('ios') || lower.includes('flutter') || lower.includes('react native') || lower.includes('app develop')) {
    // Mobile Developer
    addSkill('javascript', 85, 0.92);
    addSkill('typescript', 85, 0.92);
    addSkill('react', 85, 0.92);
    addSkill('react-native', 90, 0.98);
    addSkill('flutter', 85, 0.92);
    addSkill('api-design', 85, 0.9);
    addSkill('git', 85, 0.9);
    addSkill('testing', 80, 0.85);
    addSkill('deployment', 75, 0.8);
  } else if (lower.includes('animat') || lower.includes('3d') || lower.includes('game') || lower.includes('vfx') || lower.includes('unity') || lower.includes('unreal')) {
    // 3D / Animation / Game Dev
    addSkill('blender-3d', 90, 0.98);
    addSkill('game-development', 85, 0.95);
    addSkill('3d-modeling-fundamentals', 85, 0.95);
    addSkill('principles-of-animation', 85, 0.95);
    addSkill('character-rigging', 80, 0.88);
    addSkill('environment-design-lighting', 80, 0.88);
    addSkill('character-animation-basics', 80, 0.9);
    addSkill('advanced-character-acting', 75, 0.85);
    addSkill('3d-demoreel-portfolio', 85, 0.95);
    addSkill('python', 65, 0.65);
    addSkill('git', 70, 0.7);
  } else if (lower.includes('devops') || lower.includes('cloud') || lower.includes('infra') || lower.includes('sre') || lower.includes('platform engineer') || lower.includes('reliability')) {
    // DevOps / Cloud / SRE
    addSkill('linux', 90, 0.98);
    addSkill('networking', 85, 0.92);
    addSkill('git', 85, 0.92);
    addSkill('docker', 90, 0.98);
    addSkill('kubernetes', 90, 0.98);
    addSkill('aws-cloud', 90, 0.98);
    addSkill('system-design', 85, 0.92);
    addSkill('python', 80, 0.85);
    addSkill('deployment', 90, 0.98);
    addSkill('api-design', 80, 0.85);
    addSkill('testing', 80, 0.88);
  } else if (lower.includes('robot') || lower.includes('embedded') || lower.includes('hardware') || lower.includes('iot') || lower.includes('firmware')) {
    // Robotics / Embedded / IoT
    addSkill('linux', 85, 0.92);
    addSkill('python', 85, 0.92);
    addSkill('numpy', 80, 0.88);
    addSkill('statistics', 75, 0.82);
    addSkill('machine-learning', 80, 0.88);
    addSkill('deep-learning', 80, 0.88);
    addSkill('docker', 75, 0.8);
    addSkill('git', 80, 0.85);
    addSkill('deployment', 75, 0.8);
  } else if (lower.includes('data scientist') || lower.includes('data science') || lower.includes('ml engineer') || lower.includes('machine learning')) {
    // Data Scientist / ML Engineer (explicit match)
    addSkill('python', 85, 0.95);
    addSkill('numpy', 75, 0.8);
    addSkill('pandas', 80, 0.9);
    addSkill('sql', 75, 0.85);
    addSkill('statistics', 80, 0.92);
    addSkill('probability', 70, 0.8);
    addSkill('data-cleaning', 75, 0.82);
    addSkill('eda', 80, 0.88);
    addSkill('data-visualization', 75, 0.78);
    addSkill('feature-engineering', 75, 0.85);
    addSkill('machine-learning', 85, 0.95);
    addSkill('deep-learning', 75, 0.82);
    addSkill('model-evaluation', 75, 0.82);
    addSkill('git', 70, 0.7);
    addSkill('deployment', 65, 0.65);
  } else if (lower.includes('data analyst') || lower.includes('business analyst') || lower.includes('analytics') || lower.includes('business intelligence') || lower.includes('bi ')) {
    // Data Analyst / BI
    addSkill('sql', 85, 0.95);
    addSkill('excel', 80, 0.88);
    addSkill('python', 70, 0.78);
    addSkill('pandas', 75, 0.85);
    addSkill('statistics', 75, 0.85);
    addSkill('data-cleaning', 80, 0.88);
    addSkill('eda', 85, 0.92);
    addSkill('data-visualization', 85, 0.95);
    addSkill('git', 55, 0.5);
  } else if (lower.includes('qa') || lower.includes('test') || lower.includes('sdet') || lower.includes('quality')) {
    // QA / Test Engineer
    addSkill('python', 75, 0.85);
    addSkill('javascript', 75, 0.82);
    addSkill('testing', 85, 0.95);
    addSkill('sql', 70, 0.78);
    addSkill('git', 80, 0.88);
    addSkill('api-design', 70, 0.78);
    addSkill('docker', 65, 0.68);
    addSkill('deployment', 65, 0.68);
  } else {
    // Generic tech fallback — broad foundational skills
    addSkill('python', 75, 0.85);
    addSkill('javascript', 70, 0.78);
    addSkill('sql', 70, 0.78);
    addSkill('git', 70, 0.78);
    addSkill('html-css', 65, 0.68);
    addSkill('api-design', 65, 0.68);
    addSkill('testing', 60, 0.62);
    addSkill('deployment', 60, 0.62);
    addSkill('docker', 55, 0.55);
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
