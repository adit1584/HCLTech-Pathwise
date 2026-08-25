import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { SkillModel } from '../models/Skill.js';
import { LearningEventModel } from '../models/LearningEvent.js';
import { updateFromDiagnostic } from '../engine/mastery-updater.js';
import { loadRolesData } from '../utils/load-data.js';
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
    const roles = loadRolesData();
    const targetRole = roles.find((r: any) => r.id === (activeGoal as any).targetRole) || {
      id: 'data-scientist',
      name: 'Data Scientist',
      requiredSkills: [
        { skillId: 'python', importance: 0.9 },
        { skillId: 'sql', importance: 0.9 },
        { skillId: 'statistics', importance: 0.8 },
        { skillId: 'machine-learning', importance: 0.85 },
      ],
    };

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

    // Pick 2 questions from top skills
    for (const ranked of rankedSkills) {
      const bank = DIAGNOSTIC_BANK[ranked.skillId];
      if (bank && bank.length > 0) {
        questionsToAsk.push(...bank.slice(0, 2));
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

      // Find the question across all banks
      let question: DiagnosticQuestion | undefined;
      for (const bank of Object.values(DIAGNOSTIC_BANK)) {
        question = bank.find(q => q.id === questionId);
        if (question) break;
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
        skillName: DIAGNOSTIC_BANK[c.skillId]?.[0]?.skillName ?? c.skillId,
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
