import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { SkillModel } from '../models/Skill.js';
import { LearningEventModel } from '../models/LearningEvent.js';
import { updateFromDiagnostic } from '../engine/mastery-updater.js';
import { resolveOrSynthesizeRole } from '../utils/dynamic-roles.js';
import Groq from 'groq-sdk';
import { config } from '../config.js';
import type { SkillState, DiagnosticQuestion } from '../models/types.js';

// Hard-coded diagnostic questions per skill (for hackathon reliability)
const DIAGNOSTIC_BANK: Record<string, DiagnosticQuestion[]> = {
  'python': [
    {
      id: 'py-1', skillId: 'python', skillName: 'Python', difficulty: 2,
      question: 'What is the output of: list(range(2, 10, 3))?',
      options: ['[2, 5, 8]', '[2, 3, 4, 5, 6, 7, 8, 9]', '[3, 6, 9]', '[2, 4, 6, 8]'],
      correctAnswer: 0, explanation: 'range(2, 10, 3) starts at 2, steps by 3: 2, 5, 8.',
    },
    {
      id: 'py-2', skillId: 'python', skillName: 'Python', difficulty: 3,
      question: 'Which of these creates a shallow copy of a list?',
      options: ['new_list = old_list', 'new_list = old_list[:]', 'new_list = old_list.copy() and old_list[:]', 'None of these'],
      correctAnswer: 2, explanation: 'Both .copy() and [:] create shallow copies. Simple assignment creates a reference.',
    },
  ],
  'sql': [
    {
      id: 'sql-1', skillId: 'sql', skillName: 'SQL', difficulty: 2,
      question: 'Which SQL clause is used to filter grouped results?',
      options: ['WHERE', 'HAVING', 'FILTER', 'GROUP FILTER'],
      correctAnswer: 1, explanation: 'HAVING filters groups after GROUP BY. WHERE filters individual rows before grouping.',
    },
    {
      id: 'sql-2', skillId: 'sql', skillName: 'SQL', difficulty: 3,
      question: 'What does a LEFT JOIN return?',
      options: ['Only matching rows', 'All rows from right table', 'All rows from left table + matching right rows', 'Cartesian product'],
      correctAnswer: 2, explanation: 'LEFT JOIN returns all left table rows, with NULL for non-matching right side.',
    },
  ],
  'statistics': [
    {
      id: 'stats-1', skillId: 'statistics', skillName: 'Statistics', difficulty: 2,
      question: 'What does a p-value less than 0.05 typically suggest?',
      options: ['The effect is large', 'The null hypothesis is rejected', 'The sample is too small', 'The result is practically significant'],
      correctAnswer: 1, explanation: 'A p-value < 0.05 means there is sufficient evidence to reject the null hypothesis at the 5% significance level.',
    },
    {
      id: 'stats-2', skillId: 'statistics', skillName: 'Statistics', difficulty: 3,
      question: 'Which measure is most robust to outliers?',
      options: ['Mean', 'Median', 'Standard deviation', 'Range'],
      correctAnswer: 1, explanation: 'The median is resistant to outliers because it depends only on the middle value(s).',
    },
  ],
  'machine-learning': [
    {
      id: 'ml-1', skillId: 'machine-learning', skillName: 'Machine Learning', difficulty: 3,
      question: 'What is overfitting?',
      options: ['Model is too simple', 'Model learns noise in training data', 'Model uses too few features', 'Model trains too slowly'],
      correctAnswer: 1, explanation: 'Overfitting occurs when a model captures noise rather than the underlying pattern, performing well on training data but poorly on unseen data.',
    },
    {
      id: 'ml-2', skillId: 'machine-learning', skillName: 'Machine Learning', difficulty: 2,
      question: 'Which is a supervised learning algorithm?',
      options: ['K-means clustering', 'PCA', 'Random Forest', 'DBSCAN'],
      correctAnswer: 2, explanation: 'Random Forest is supervised (uses labeled data). K-means, PCA, and DBSCAN are unsupervised.',
    },
  ],
  'numpy': [
    {
      id: 'np-1', skillId: 'numpy', skillName: 'NumPy', difficulty: 2,
      question: 'What does np.array([1,2,3]) * 2 produce?',
      options: ['[1,2,3,1,2,3]', '[2,4,6]', 'Error', '[[1,2,3],[1,2,3]]'],
      correctAnswer: 1, explanation: 'NumPy performs element-wise multiplication (vectorized operation).',
    },
  ],
  'pandas': [
    {
      id: 'pd-1', skillId: 'pandas', skillName: 'Pandas', difficulty: 2,
      question: 'How do you select rows where column "age" is greater than 30?',
      options: ['df.filter(age > 30)', 'df[df["age"] > 30]', 'df.select(age > 30)', 'df.where("age > 30")'],
      correctAnswer: 1, explanation: 'Boolean indexing df[df["age"] > 30] is the standard pandas way to filter rows.',
    },
  ],
  'javascript': [
    {
      id: 'js-1', skillId: 'javascript', skillName: 'JavaScript', difficulty: 2,
      question: 'What is the difference between let and const in JavaScript?',
      options: ['let is block-scoped and reassignable; const is block-scoped and immutable binding', 'const is global only', 'let cannot be updated', 'No difference'],
      correctAnswer: 0, explanation: 'let allows variable reassignment within its block scope, whereas const creates a read-only variable binding.',
    },
    {
      id: 'js-2', skillId: 'javascript', skillName: 'JavaScript', difficulty: 3,
      question: 'What does Promise.all() do when one of the promises rejects?',
      options: ['Continues executing others', 'Immediately rejects with the reason of the first rejected promise', 'Returns null', 'Retries automatically'],
      correctAnswer: 1, explanation: 'Promise.all fails-fast: if any promise in the iterable rejects, the whole returned promise immediately rejects.',
    },
  ],
  'react': [
    {
      id: 'react-1', skillId: 'react', skillName: 'React', difficulty: 2,
      question: 'What is the purpose of useEffect dependency array in React?',
      options: ['Defines when the effect re-runs based on changed values', 'Increases render speed', 'Sets component styles', 'Caches state values permanently'],
      correctAnswer: 0, explanation: 'The dependency array tells React to only re-run the effect if one of the listed values has changed between renders.',
    },
  ],
  'data-cleaning': [
    {
      id: 'dc-1', skillId: 'data-cleaning', skillName: 'Data Cleaning', difficulty: 2,
      question: 'Which method in pandas replaces missing NaN values with a specific constant?',
      options: ['df.dropna()', 'df.fillna()', 'df.replace_null()', 'df.clean()'],
      correctAnswer: 1, explanation: 'df.fillna(value) fills NA/NaN values using the specified value or imputation method.',
    },
  ],
  'docker': [
    {
      id: 'doc-1', skillId: 'docker', skillName: 'Docker & Containers', difficulty: 2,
      question: 'What is the primary difference between a Docker Image and a Docker Container?',
      options: ['An image is a static immutable blueprint; a container is a live running instance of an image', 'They are identical', 'A container cannot be stopped', 'An image requires a hypervisor'],
      correctAnswer: 0, explanation: 'An image is the read-only template with instructions; a container is the runnable instance of an image.',
    },
  ],
};

// In-memory cache for AI-generated questions (avoid re-generating per session)
const aiQuestionCache = new Map<string, DiagnosticQuestion[]>();

/**
 * Generate diagnostic questions for a skill using Groq AI.
 * Returns 2 MCQ questions for the given skill.
 */
async function generateDiagnosticQuestionsAI(skillId: string, skillName: string): Promise<DiagnosticQuestion[]> {
  // Check cache first
  if (aiQuestionCache.has(skillId)) return aiQuestionCache.get(skillId)!;

  try {
    const apiKey = config.groqApiKey || process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('No API key');

    const client = new Groq({ apiKey });
    const model = config.groqModel || 'openai/gpt-oss-120b';

    const res = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are a technical assessment designer. Generate exactly 2 multiple-choice diagnostic questions for the skill "${skillName}". Each question must test practical understanding. Return ONLY valid JSON array.`,
        },
        {
          role: 'user',
          content: `Generate 2 MCQ questions for "${skillName}" (id: ${skillId}).
Return JSON array:
[
  {
    "question": "Question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this is correct",
    "difficulty": 2
  }
]`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const content = res.choices[0]?.message?.content || '';
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const parsed = match ? JSON.parse(match[0]) : JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      const questions: DiagnosticQuestion[] = parsed.slice(0, 2).map((q: any, idx: number) => ({
        id: `ai-${skillId}-${idx + 1}`,
        skillId,
        skillName,
        difficulty: q.difficulty || 2,
        question: q.question,
        options: q.options,
        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
        explanation: q.explanation || `Correct answer for ${skillName}.`,
      }));
      aiQuestionCache.set(skillId, questions);
      return questions;
    }
  } catch (err) {
    console.warn(`AI diagnostic generation failed for ${skillId}:`, err);
  }

  // Deterministic fallback for common skills not in the bank
  const fallback = buildFallbackQuestions(skillId, skillName);
  aiQuestionCache.set(skillId, fallback);
  return fallback;
}

/**
 * Build deterministic fallback questions for skills without hardcoded or AI questions.
 */
function buildFallbackQuestions(skillId: string, skillName: string): DiagnosticQuestion[] {
  const lower = skillId.toLowerCase();

  // Pre-built fallbacks for common skills that aren't in DIAGNOSTIC_BANK
  const builtIn: Record<string, DiagnosticQuestion[]> = {
    'html-css': [
      { id: 'html-1', skillId: 'html-css', skillName: 'HTML & CSS', difficulty: 2, question: 'Which CSS property is used to make a flex container?', options: ['display: grid', 'display: flex', 'position: flex', 'float: flex'], correctAnswer: 1, explanation: 'display: flex creates a flex container for its children.' },
      { id: 'html-2', skillId: 'html-css', skillName: 'HTML & CSS', difficulty: 2, question: 'What does the <semantic> tag represent in HTML5?', options: ['It does not exist', 'A styled div', 'Meaningful markup like <article>, <nav>, <section>', 'A script container'], correctAnswer: 2, explanation: 'HTML5 semantic elements provide meaningful structure like <article>, <nav>, <section>.' },
    ],
    'typescript': [
      { id: 'ts-1', skillId: 'typescript', skillName: 'TypeScript', difficulty: 2, question: 'What is the primary benefit of TypeScript over JavaScript?', options: ['Faster runtime performance', 'Static type checking at compile time', 'Smaller bundle size', 'Built-in database support'], correctAnswer: 1, explanation: 'TypeScript adds static type checking which catches type errors during development.' },
      { id: 'ts-2', skillId: 'typescript', skillName: 'TypeScript', difficulty: 3, question: 'What does "interface" do in TypeScript?', options: ['Creates a new class', 'Defines a type contract for object shapes', 'Imports external modules', 'Declares a variable'], correctAnswer: 1, explanation: 'Interfaces define the shape/contract that an object must conform to.' },
    ],
    'nodejs': [
      { id: 'node-1', skillId: 'nodejs', skillName: 'Node.js', difficulty: 2, question: 'What is the event loop in Node.js?', options: ['A for-loop that iterates events', 'A mechanism that handles async callbacks and I/O non-blockingly', 'A DOM rendering engine', 'A package manager'], correctAnswer: 1, explanation: 'The event loop is what allows Node.js to perform non-blocking I/O operations.' },
      { id: 'node-2', skillId: 'nodejs', skillName: 'Node.js', difficulty: 2, question: 'Which module is used to create an HTTP server in Node.js?', options: ['fs', 'http', 'path', 'url'], correctAnswer: 1, explanation: 'The http module provides utilities for creating HTTP servers and clients.' },
    ],
    'nosql': [
      { id: 'nosql-1', skillId: 'nosql', skillName: 'NoSQL Databases', difficulty: 2, question: 'Which is a key advantage of NoSQL over relational databases?', options: ['Enforces strict schemas', 'Horizontal scalability and flexible schemas', 'ACID compliance by default', 'SQL query support'], correctAnswer: 1, explanation: 'NoSQL databases excel at horizontal scaling and handling unstructured/semi-structured data.' },
    ],
    'api-design': [
      { id: 'api-1', skillId: 'api-design', skillName: 'API Design', difficulty: 2, question: 'What HTTP method is typically used to update an existing resource?', options: ['GET', 'POST', 'PUT', 'DELETE'], correctAnswer: 2, explanation: 'PUT is used to update/replace an existing resource at the given URI.' },
      { id: 'api-2', skillId: 'api-design', skillName: 'API Design', difficulty: 2, question: 'What does REST stand for?', options: ['Rapid Endpoint Service Technology', 'Representational State Transfer', 'Remote Execution Server Tool', 'Resource Encoding Standard Type'], correctAnswer: 1, explanation: 'REST = Representational State Transfer, an architectural style for distributed systems.' },
    ],
    'deployment': [
      { id: 'dep-1', skillId: 'deployment', skillName: 'Deployment', difficulty: 2, question: 'What does CI/CD stand for?', options: ['Continuous Integration / Continuous Deployment', 'Code Implementation / Code Delivery', 'Central Integration / Central Distribution', 'Container Isolation / Container Distribution'], correctAnswer: 0, explanation: 'CI/CD automates building, testing (CI) and deploying (CD) code changes.' },
    ],
    'testing': [
      { id: 'test-1', skillId: 'testing', skillName: 'Testing', difficulty: 2, question: 'What is a unit test?', options: ['Testing the entire application end-to-end', 'Testing a single function or component in isolation', 'Manual browser testing', 'Load testing under high traffic'], correctAnswer: 1, explanation: 'Unit tests verify individual functions/components in isolation from the rest of the system.' },
      { id: 'test-2', skillId: 'testing', skillName: 'Testing', difficulty: 2, question: 'What does TDD stand for?', options: ['Test-Driven Development', 'Type-Driven Design', 'Total Data Debugging', 'Team Development Docs'], correctAnswer: 0, explanation: 'TDD means writing tests before writing the implementation code.' },
    ],
    'git': [
      { id: 'git-1', skillId: 'git', skillName: 'Git & Version Control', difficulty: 2, question: 'What does "git merge" do?', options: ['Deletes a branch', 'Combines changes from one branch into another', 'Creates a new repository', 'Reverts all changes'], correctAnswer: 1, explanation: 'git merge integrates changes from one branch into the current branch.' },
    ],
    'excel': [
      { id: 'excel-1', skillId: 'excel', skillName: 'Excel & Spreadsheets', difficulty: 2, question: 'What is a Pivot Table used for?', options: ['Creating charts only', 'Summarizing and analyzing large datasets by grouping and aggregating', 'Writing macros', 'Formatting cells'], correctAnswer: 1, explanation: 'Pivot Tables let you summarize, sort, reorganize, group, count, total, or average data.' },
    ],
    'deep-learning': [
      { id: 'dl-1', skillId: 'deep-learning', skillName: 'Deep Learning', difficulty: 3, question: 'What is backpropagation?', options: ['A data preprocessing step', 'An algorithm that computes gradients to update neural network weights', 'A method to split datasets', 'A type of activation function'], correctAnswer: 1, explanation: 'Backpropagation computes the gradient of the loss function with respect to each weight by the chain rule.' },
    ],
    'nlp': [
      { id: 'nlp-1', skillId: 'nlp', skillName: 'NLP', difficulty: 3, question: 'What is tokenization in NLP?', options: ['Encrypting text data', 'Breaking text into smaller units like words or subwords', 'Removing stop words', 'Translating between languages'], correctAnswer: 1, explanation: 'Tokenization splits text into tokens (words, subwords, or characters) for processing.' },
    ],
    'probability': [
      { id: 'prob-1', skillId: 'probability', skillName: 'Probability', difficulty: 2, question: "What does Bayes' theorem relate?", options: ['Mean and median', 'Prior probability, likelihood, and posterior probability', 'Standard deviation and variance', 'Population and sample'], correctAnswer: 1, explanation: "Bayes' theorem describes how to update the probability of a hypothesis given new evidence." },
    ],
    'feature-engineering': [
      { id: 'fe-1', skillId: 'feature-engineering', skillName: 'Feature Engineering', difficulty: 2, question: 'What is one-hot encoding used for?', options: ['Normalizing numerical features', 'Converting categorical variables into binary vectors', 'Reducing dimensionality', 'Filling missing values'], correctAnswer: 1, explanation: 'One-hot encoding creates binary columns for each category of a categorical variable.' },
    ],
    'eda': [
      { id: 'eda-1', skillId: 'eda', skillName: 'Exploratory Data Analysis', difficulty: 2, question: 'What is the primary goal of EDA?', options: ['Building production models', 'Understanding data distributions, patterns, and anomalies', 'Deploying applications', 'Writing unit tests'], correctAnswer: 1, explanation: 'EDA involves examining data to understand its main characteristics, often using visualization.' },
    ],
    'data-visualization': [
      { id: 'dv-1', skillId: 'data-visualization', skillName: 'Data Visualization', difficulty: 2, question: 'Which chart type is best for showing trends over time?', options: ['Pie chart', 'Line chart', 'Tree map', 'Scatter plot'], correctAnswer: 1, explanation: 'Line charts are ideal for displaying trends and changes over a continuous time period.' },
    ],
    'model-evaluation': [
      { id: 'me-1', skillId: 'model-evaluation', skillName: 'Model Evaluation', difficulty: 2, question: 'What does the F1 score balance?', options: ['Accuracy and speed', 'Precision and recall', 'Bias and variance', 'Training and test loss'], correctAnswer: 1, explanation: 'F1 score is the harmonic mean of precision and recall, balancing both metrics.' },
    ],
    'regression': [
      { id: 'reg-1', skillId: 'regression', skillName: 'Regression', difficulty: 2, question: 'What does R² (R-squared) measure?', options: ['The slope of the regression line', 'The proportion of variance in the dependent variable explained by the model', 'The number of features', 'The learning rate'], correctAnswer: 1, explanation: 'R² indicates how well the model explains the variability of the target variable.' },
    ],
    'classification': [
      { id: 'cls-1', skillId: 'classification', skillName: 'Classification', difficulty: 2, question: 'What is a confusion matrix?', options: ['A matrix of feature correlations', 'A table showing true/false positives and negatives for classification results', 'A weight initialization method', 'A data augmentation technique'], correctAnswer: 1, explanation: 'A confusion matrix shows TP, TN, FP, FN counts to evaluate classification performance.' },
    ],
  };

  if (builtIn[skillId]) return builtIn[skillId];

  // Generic self-assessment fallback
  return [
    {
      id: `gen-${skillId}-1`,
      skillId,
      skillName,
      difficulty: 2,
      question: `Which statement best describes a core concept of ${skillName}?`,
      options: [
        `${skillName} is primarily about understanding fundamental principles and applying them practically`,
        `${skillName} requires no prior knowledge of any related field`,
        `${skillName} is only relevant for academic research`,
        `${skillName} cannot be learned through hands-on practice`,
      ],
      correctAnswer: 0,
      explanation: `Understanding fundamentals and practical application is key to mastering ${skillName}.`,
    },
  ];
}

const router = Router();

// POST /api/diagnostic/start — Generate personalized diagnostic
router.post('/start', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const learner = await LearnerModel.findById(req.userId);
    if (!learner || learner.goals.length === 0) {
      res.status(400).json({ error: 'Complete onboarding first' });
      return;
    }

    const activeGoal = learner.goals[learner.goals.length - 1];
    const targetRole = await resolveOrSynthesizeRole((activeGoal as any).targetRole);

    // Find skills with HIGH uncertainty + HIGH importance
    const skillStates = new Map(
      ((learner.skillStates as any[]) || []).map(s => [s.skillId, s])
    );

    const questionsToAsk: DiagnosticQuestion[] = [];

    // Sort required skills by (importance * uncertainty), pick top skills
    const rankedSkills = ((targetRole as any).requiredSkills || [])
      .map((req: any) => {
        const state = skillStates.get(req.skillId);
        const confidence = state?.confidence ?? 0;
        const uncertainty = 1 - confidence;
        return {
          skillId: req.skillId,
          importance: req.importance || 0.8,
          score: (req.importance || 0.8) * uncertainty,
        };
      })
      .sort((a: any, b: any) => b.score - a.score);

    // Pick 2 questions from top skills — try hardcoded bank first, then AI/fallback
    for (const ranked of rankedSkills) {
      const bank = DIAGNOSTIC_BANK[ranked.skillId];
      if (bank && bank.length > 0) {
        questionsToAsk.push(...bank.slice(0, 2));
      } else {
        // No hardcoded questions — generate dynamically
        const skillName = ranked.skillId.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
        try {
          const dynamicQs = await generateDiagnosticQuestionsAI(ranked.skillId, skillName);
          questionsToAsk.push(...dynamicQs.slice(0, 2));
        } catch {
          // Skip this skill if generation fails
        }
      }
      if (questionsToAsk.length >= 8) break;
    }

    // Fallback: If still empty, supply foundational questions from available banks
    if (questionsToAsk.length === 0) {
      for (const bank of Object.values(DIAGNOSTIC_BANK)) {
        if (bank && bank.length > 0) {
          questionsToAsk.push(bank[0]);
        }
        if (questionsToAsk.length >= 6) break;
      }
    }

    res.json({
      questions: questionsToAsk,
      totalQuestions: questionsToAsk.length,
      targetRole: (targetRole as any).name || 'Target Role',
    });
  } catch (error) {
    console.error('Diagnostic start error:', error);
    res.status(500).json({ error: 'Failed to start diagnostic' });
  }
});

// POST /api/diagnostic/answer — Submit all diagnostic answers
router.post('/answer', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body;

    if (!answers || !Array.isArray(answers)) {
      res.status(400).json({ error: 'answers array is required' });
      return;
    }

    const learner = await LearnerModel.findById(req.userId);
    if (!learner) {
      res.status(404).json({ error: 'Learner not found' });
      return;
    }

    // Score each answer and compute per-skill diagnostic score
    const skillScores = new Map<string, { correct: number; total: number }>();

    for (const answer of answers) {
      const { questionId, selectedAnswer } = answer;

      // Find the question across hardcoded banks + AI-generated cache
      let question: DiagnosticQuestion | undefined;
      for (const bank of Object.values(DIAGNOSTIC_BANK)) {
        question = bank.find(q => q.id === questionId);
        if (question) break;
      }
      // Also search AI-generated question cache
      if (!question) {
        for (const cachedQs of aiQuestionCache.values()) {
          question = cachedQs.find(q => q.id === questionId);
          if (question) break;
        }
      }

      if (!question) continue;

      const isCorrect = selectedAnswer === question.correctAnswer;

      const existing = skillScores.get(question.skillId) ?? { correct: 0, total: 0 };
      existing.total += 1;
      if (isCorrect) existing.correct += 1;
      skillScores.set(question.skillId, existing);
    }

    // Convert to diagnostic scores (0-100)
    const diagnosticResults: Array<{ skillId: string; score: number }> = [];
    for (const [skillId, counts] of skillScores) {
      const score = Math.round((counts.correct / counts.total) * 100);
      diagnosticResults.push({ skillId, score });
    }

    // Update learner mastery
    const currentStates: SkillState[] = (learner.skillStates as any[]).map(s => ({
      skillId: s.skillId, proficiency: s.proficiency, confidence: s.confidence,
      evidence: s.evidence || [], lastUpdated: s.lastUpdated || new Date(),
    }));

    const { updatedStates, changes } = updateFromDiagnostic(currentStates, diagnosticResults);

    // Save updated states
    await LearnerModel.findByIdAndUpdate(req.userId, {
      skillStates: updatedStates.map(s => ({
        skillId: s.skillId, proficiency: s.proficiency, confidence: s.confidence,
        evidence: s.evidence, lastUpdated: s.lastUpdated,
      })),
      $push: { assessmentHistory: `diagnostic-${Date.now()}` },
    });

    // Record event
    await LearningEventModel.create({
      learnerId: req.userId,
      type: 'DIAGNOSTIC_COMPLETED',
      skillIds: diagnosticResults.map(r => r.skillId),
      score: Math.round(diagnosticResults.reduce((s, r) => s + r.score, 0) / diagnosticResults.length),
      metadata: { diagnosticResults, changes },
      timestamp: new Date(),
    });

    res.json({
      results: changes.map(c => ({
        skillId: c.skillId,
        skillName: DIAGNOSTIC_BANK[c.skillId]?.[0]?.skillName ?? aiQuestionCache.get(c.skillId)?.[0]?.skillName ?? c.skillId.replace(/-/g, ' ').replace(/\b\w/g, (ch: string) => ch.toUpperCase()),
        before: c.before,
        after: c.after,
        confidenceBefore: c.confidenceBefore,
        confidenceAfter: c.confidenceAfter,
      })),
      message: 'Diagnostic complete. Your skill profile has been updated.',
    });
  } catch (error) {
    console.error('Diagnostic answer error:', error);
    res.status(500).json({ error: 'Failed to process diagnostic' });
  }
});

export default router;
