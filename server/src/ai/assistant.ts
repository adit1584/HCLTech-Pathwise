// ============================================================
// Pathwise AI — Site-Specific & Education-Focused Learning Assistant
// ============================================================
// Context-Aware Learning Intelligence Assistant powered by Groq LLM
// Exclusively specialized in Pathwise DAG learning paths, skill mastery,
// technical education, and career development.
// ============================================================

import Groq from 'groq-sdk';
import { config } from '../config.js';

function getGroqClient(): Groq | null {
  const apiKey = config.groqApiKey || process.env.GROQ_API_KEY || '';
  if (!apiKey) {
    return null;
  }
  try {
    return new Groq({ apiKey });
  } catch (err) {
    console.warn('Failed to initialize Groq client:', err);
    return null;
  }
}

export interface AssistantContext {
  learnerName: string;
  targetRole: string;
  weeklyHours: number;
  currentRoadmap: Array<{
    title: string;
    type: string;
    milestone: number;
    status: string;
    priorityScore: number;
    reason: string;
  }>;
  recentEvents: Array<{
    type: string;
    skillIds: string[];
    score?: number;
    timestamp: Date;
  }>;
  skillProficiencies: Array<{
    skillId: string;
    skillName: string;
    proficiency: number;
    confidence: number;
  }>;
}

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CANDIDATE_MODELS = [
  config.groqModel || 'openai/gpt-oss-120b',
  'openai/gpt-oss-120b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
];

function cleanThinkTags(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function generateLocalAssistantResponse(
  userQuestion: string,
  context: AssistantContext
): { answer: string; suggestedActions: string[] } {
  const q = (userQuestion || '').toLowerCase();

  if (q.includes('priorit') || q.includes('why') || q.includes('formula') || q.includes('score')) {
    return {
      answer: `### 🎯 Pathwise Priority Scoring Formula\n\nYour roadmap prioritizes skills using a deterministic mathematical ranking model:\n\n$$\\text{Priority} = \\frac{\\text{Goal Relevance} \\times \\text{Graph Centrality} \\times \\text{Unlock Multiplier}}{\\text{Learning Cost (Hours)}}$$\n\n1. **Goal Relevance**: How critical the skill is for **${context.targetRole}**.\n2. **Graph Centrality**: How many downstream prerequisite pathways depend on this node.\n3. **Unlock Multiplier**: The number of high-value milestone nodes unblocked once mastered.\n4. **Cost Efficiency**: Normalized against your **${context.weeklyHours}h/week** study capacity.`,
      suggestedActions: ['View Active Roadmap', 'Inspect Topology Graph', 'Run What-If Simulation'],
    };
  }

  if (q.includes('milestone') || q.includes('next') || q.includes('roadmap') || q.includes('step')) {
    const nextItem = context.currentRoadmap.find(r => r.status === 'available') || context.currentRoadmap[0];
    return {
      answer: `### 🗺️ Roadmap & Next Actions\n\nFor your target role as a **${context.targetRole}**, your next recommended focus is **${nextItem?.title || 'Milestone 1 Foundation'}**.\n\n- **Type**: ${nextItem?.type || 'Course'}\n- **Priority Score**: ${nextItem?.priorityScore ? nextItem.priorityScore.toFixed(2) : 'Highest'}\n- **Strategy**: Complete the practice exercises and review the documentation before taking the milestone assessment.`,
      suggestedActions: ['Go to Roadmap', 'Take Practice Challenges', 'Check Diagnostic'],
    };
  }

  if (q.includes('what-if') || q.includes('simulator') || q.includes('hours') || q.includes('time') || q.includes('weeks')) {
    return {
      answer: `### ⚡ What-If Scenario Planning\n\nYou are currently committed to **${context.weeklyHours} hours/week**.\n\n- Increasing your pace to **20h/week** accelerates your timeline by ~45%.\n- Pre-mastering foundational skills allows you to bypass prerequisite steps via the Simulator without losing curriculum coherence.`,
      suggestedActions: ['Open Simulator', 'Adjust Weekly Velocity', 'Simulate Skill Bypass'],
    };
  }

  return {
    answer: `### 💡 Pathwise Mentor Insights for ${context.targetRole}\n\nI have evaluated your skill profile for **${context.targetRole}** with your **${context.weeklyHours}h/week** commitment.\n\n- **Curriculum Architecture**: Directed Acyclic Graph with topological sort optimization.\n- **Recommended Focus**: Master foundational prerequisites sequentially before advancing to milestone projects.\n\nFeel free to ask about any specific concept (SQL, Python, ML, System Design) or roadmap milestone!`,
    suggestedActions: ['Explain next milestone', 'How does priority scoring work?', 'Start Practice Challenges'],
  };
}

export async function askAssistant(
  userQuestion: string,
  context: AssistantContext,
  history: ChatHistoryMessage[] = [],
): Promise<{ answer: string; suggestedActions: string[] }> {
  const client = getGroqClient();

  // If no Groq client is configured, return the instant knowledge engine response
  if (!client) {
    return generateLocalAssistantResponse(userQuestion, context);
  }

  const systemPrompt = `You are Pathwise AI, the dedicated adaptive learning assistant and technical mentor built directly into the Pathwise educational platform.

YOUR IDENTITY & SPECIALIZATION:
You specialize EXCLUSIVELY in education, technical skill development, computer science, software engineering, career transitions, and the Pathwise adaptive learning platform.

ALLOWED DOMAIN AREAS:
1. TECHNICAL EDUCATION & CONCEPTS: Programming languages, algorithms, data structures, mathematics, system design, machine learning, web development, cloud computing, 3D graphics, security, databases, software best practices, and code examples.
2. PATHWISE PLATFORM GUIDANCE:
   - Dashboard: Next Best Action, calibrated skill proficiencies, and learning velocity.
   - Roadmap (/roadmap): Milestone DAG ordering, topological prerequisites, priority scoring formulas, and Dynamic Recompilation.
   - Skill Graph (/skills): Prerequisite and enables dependency graph.
   - Diagnostic (/diagnostic): Calibrated baseline assessments that adjust confidence without punishing the learner.
   - Practice Arena (/practice): Curated courses, practice problems, and projects.
   - What-If Simulator (/simulator): Counterfactual simulation of hours/week and skipped skills on completion timelines.
3. CAREER & STUDY MENTORSHIP: Study plans, technical interview preparation, project architectures, resume portfolio advice, and pacing based on the learner's committed weekly study hours.

RESPONSE GUIDELINES:
- When explaining technical concepts, provide rich, crystal-clear, structured Markdown (use headings, bold text, bullet points, and syntax-highlighted code blocks).
- Connect explanations to the learner's actual profile (target role: ${context.targetRole}, study commitment: ${context.weeklyHours}h/week) whenever helpful.
- Output your entire response strictly as valid JSON matching this schema:
{
  "answer": "Your complete Markdown response here",
  "suggestedActions": ["Relevant follow-up action 1", "Relevant follow-up action 2", "Relevant follow-up action 3"]
}`;

  const userContextSummary = `[Learner Profile Context]
Learner Name: ${context.learnerName || 'Learner'}
Target Career Role: ${context.targetRole}
Weekly Study Commitment: ${context.weeklyHours} hours/week
Calibrated Skills & Proficiencies:
${context.skillProficiencies.slice(0, 10).map(s => `• ${s.skillName} (${s.skillId}): ${s.proficiency}% [confidence: ${Math.round(s.confidence * 100)}%]`).join('\n') || 'None recorded yet'}

Current Roadmap Milestones:
${context.currentRoadmap.slice(0, 8).map(r => `• [Milestone ${r.milestone}] ${r.title} (${r.type}, Status: ${r.status}, Priority: ${r.priorityScore.toFixed(2)}) - ${r.reason}`).join('\n') || 'Roadmap not yet generated'}

Recent Progress Events:
${context.recentEvents.slice(0, 4).map(e => `• ${e.type} on [${e.skillIds.join(', ')}] (Score: ${e.score ?? 'N/A'}) on ${new Date(e.timestamp).toLocaleDateString()}`).join('\n') || 'No recent events recorded'}
`;

  const messages: Groq.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: userContextSummary },
  ];

  for (const h of history.slice(-6)) {
    messages.push({ role: h.role, content: h.content });
  }

  messages.push({ role: 'user', content: userQuestion });

  const triedModels = new Set<string>();

  for (const model of CANDIDATE_MODELS) {
    if (triedModels.has(model)) continue;
    triedModels.add(model);

    try {
      const response = await client.chat.completions.create({
        model,
        messages,
        temperature: 0.25,
        max_tokens: 650,
        response_format: { type: 'json_object' },
      });

      let rawContent = response.choices[0]?.message?.content?.trim() || '';
      rawContent = cleanThinkTags(rawContent);

      if (!rawContent) continue;

      try {
        const parsed = JSON.parse(rawContent);
        if (parsed.answer) {
          return {
            answer: parsed.answer,
            suggestedActions: Array.isArray(parsed.suggestedActions) && parsed.suggestedActions.length > 0
              ? parsed.suggestedActions.slice(0, 3)
              : ['View my roadmap', 'Practice next skill', 'Run What-If simulation'],
          };
        }
      } catch {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const extracted = JSON.parse(jsonMatch[0]);
            if (extracted.answer) {
              return {
                answer: extracted.answer,
                suggestedActions: extracted.suggestedActions || ['View my roadmap', 'Practice next skill'],
              };
            }
          } catch {
            // ignore
          }
        }
      }

      return {
        answer: rawContent,
        suggestedActions: ['Go to Next Best Action', 'Check Skill Graph', 'Explore Practice Arena'],
      };
    } catch (err: any) {
      console.warn(`Groq model ${model} failed, trying next:`, err.message || err);
    }
  }

  return generateLocalAssistantResponse(userQuestion, context);
}
