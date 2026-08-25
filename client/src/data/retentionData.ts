export interface MicroSparkChallenge {
  id: string;
  skillId: string;
  skillName: string;
  question: string;
  codeSnippet?: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  halfLifeRestorePercent: number; // e.g. resets to 100%
  timeLimitSeconds: number; // 90s
}

export const MICRO_SPARK_CHALLENGES: MicroSparkChallenge[] = [
  {
    id: 'spark-sql-window',
    skillId: 'sql',
    skillName: 'SQL & Database Engine',
    question: 'What is the output of DENSE_RANK() vs RANK() when two items tie for 1st place?',
    codeSnippet: 'SELECT score, RANK() OVER(ORDER BY score DESC), DENSE_RANK() OVER(ORDER BY score DESC) FROM games;',
    options: [
      'RANK gives (1, 1, 3); DENSE_RANK gives (1, 1, 2)',
      'RANK gives (1, 1, 2); DENSE_RANK gives (1, 1, 3)',
      'Both give identical sequences (1, 1, 2)',
      'DENSE_RANK throws an error without PARTITION BY',
    ],
    correctAnswer: 0,
    explanation: 'RANK leaves gaps for ties (1, 1, 3), whereas DENSE_RANK maintains contiguous sequential ranks (1, 1, 2).',
    halfLifeRestorePercent: 100,
    timeLimitSeconds: 90,
  },
  {
    id: 'spark-js-event-loop',
    skillId: 'javascript',
    skillName: 'JavaScript Asynchronous Runtime',
    question: 'In the JS event loop, which microtask queue runs before macrotasks (like setTimeout)?',
    codeSnippet: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');`,
    options: [
      'Output is: A, D, C, B (Promise microtask runs before timer macrotask)',
      'Output is: A, B, C, D (setTimeout runs first)',
      'Output is: A, D, B, C (timer runs before promise)',
      'Output is undefined',
    ],
    correctAnswer: 0,
    explanation: 'Synchronous code executes first (A, D), then the microtask queue drains (Promise -> C), and lastly macrotasks execute (setTimeout -> B).',
    halfLifeRestorePercent: 100,
    timeLimitSeconds: 90,
  },
  {
    id: 'spark-python-mutable',
    skillId: 'python',
    skillName: 'Python Memory & Scopes',
    question: 'Why is defining `def append_to(val, target=[])` considered a dangerous anti-pattern in Python?',
    options: [
      'The default list is bound at function definition time in memory, causing all calls to share and mutate the same list instance',
      'Python throws a SyntaxError on mutable default parameters',
      'It creates an infinite loop in the garbage collector',
      'It disables type hints',
    ],
    correctAnswer: 0,
    explanation: 'Default arguments are evaluated once when the function is defined, so mutable objects are shared across all calls unless reset with `None`.',
    halfLifeRestorePercent: 100,
    timeLimitSeconds: 90,
  },
  {
    id: 'spark-ml-overfitting',
    skillId: 'machine-learning',
    skillName: 'Machine Learning & Regularization',
    question: 'How does L1 Regularization (Lasso) differ mathematically from L2 Regularization (Ridge) in feature selection?',
    options: [
      'L1 uses absolute weight penalty (|w|) which forces non-critical weights strictly to zero, yielding sparse models',
      'L2 zeros out weights while L1 shrinks them',
      'L1 can only be applied to deep learning neural networks',
      'There is no mathematical difference',
    ],
    correctAnswer: 0,
    explanation: 'The diamond-shaped L1 constraint boundary naturally intersects coordinate axes at exact zeros, effectively performing automated feature selection.',
    halfLifeRestorePercent: 100,
    timeLimitSeconds: 90,
  },
  {
    id: 'spark-docker-layers',
    skillId: 'docker',
    skillName: 'Docker & Container Caching',
    question: 'Why should `COPY package*.json ./` and `RUN npm install` precede `COPY . .` in a production Dockerfile?',
    codeSnippet: `COPY package*.json ./
RUN npm install
COPY . .`,
    options: [
      'Leverages Docker layer caching so npm install only re-runs when dependency manifests change rather than on every source code edit',
      'Required by Linux filesystem specifications',
      'Reduces image size by 90%',
      'Prevents port conflicts',
    ],
    correctAnswer: 0,
    explanation: 'Docker checks build cache per instruction. Copying package.json first ensures npm dependencies are cached unless dependencies actually change.',
    halfLifeRestorePercent: 100,
    timeLimitSeconds: 90,
  },
];
