// ============================================================
// AI Goal Interpreter — Uses Groq LLM for NL → structured JSON
// ============================================================
// This module is the ONLY place where an LLM interprets the
// learner's goal. The LLM does NOT decide what to recommend.
// ============================================================

import Groq from 'groq-sdk';
import { config } from '../config.js';

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!groqClient) {
    if (!config.groqApiKey) {
      throw new Error('GROQ_API_KEY not configured');
    }
    groqClient = new Groq({ apiKey: config.groqApiKey });
  }
  return groqClient;
}

const SYSTEM_PROMPT = `You are a goal interpreter for Pathwise, a personalized learning platform.

Given a learner's natural language description of their learning goal, extract a structured JSON object.

IMPORTANT: The "targetRole" field should be the specific career role the learner wants, expressed as a kebab-case slug.
Examples:
- "data scientist" → "data-scientist"
- "full stack developer" → "full-stack-developer"
- "blockchain developer" → "blockchain-developer"
- "3d animator" → "3d-animator"
- "game developer" → "game-developer"
- "cybersecurity analyst" → "cybersecurity-analyst"
- "devops engineer" → "devops-engineer"
- "robotics engineer" → "robotics-engineer"
- "product manager" → "product-manager"
- "ui/ux designer" → "ui-ux-designer"

DO NOT limit yourself to a fixed list. Extract whatever career role the learner mentions.

Available learning preferences:
- video
- reading
- project_based
- interactive
- course
- mentored

Experience levels:
- beginner
- beginner_intermediate
- intermediate
- advanced
- expert

Respond ONLY with a valid JSON object matching this schema:
{
  "targetRole": "string (kebab-case career role slug — can be ANYTHING)",
  "targetRoleDisplayName": "string (human-readable display name, e.g. 'Full Stack Developer')",
  "objective": "string (career_transition | skill_development | upskilling | hobby)",
  "timeframeWeeks": number,
  "weeklyHours": number,
  "currentLevel": "string (one of the experience levels)",
  "learningPreference": ["string[]"],
  "constraints": ["string[]"],
  "targetSkills": ["string[]"]
}

If the learner doesn't specify a field, use reasonable defaults:
- timeframeWeeks: 24
- weeklyHours: 8
- currentLevel: "beginner"
- learningPreference: ["course"]
- constraints: []
- targetSkills: []`;

export async function interpretGoalWithAI(text: string): Promise<Record<string, unknown>> {
  const client = getGroqClient();

  const candidateModels = [config.groqModel || 'openai/gpt-oss-120b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];
  let content: string = '';

  for (const m of candidateModels) {
    try {
      const response = await client.chat.completions.create({
        model: m,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.1,
        max_tokens: 600,
        response_format: { type: 'json_object' },
      });
      content = response.choices[0]?.message?.content || '';
      if (content) break;
    } catch (err: any) {
      console.warn(`Goal interpreter model ${m} failed:`, err.message || err);
    }
  }

  if (!content) {
    throw new Error('Empty response from LLM');
  }

  return JSON.parse(content);
}
