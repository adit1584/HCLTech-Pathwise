import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { LearnerModel } from '../models/Learner.js';
import { LearningEventModel } from '../models/LearningEvent.js';
import { resolveOrSynthesizeRole } from '../utils/dynamic-roles.js';
import { loadSkillsData } from '../utils/load-data.js';
import Groq from 'groq-sdk';
import { config } from '../config.js';

const router = Router();

export interface PracticeChallenge {
  id: string;
  title: string;
  skillId: string;
  skillName: string;
  milestone: number;
  category: 'Programming' | 'Web Development' | 'Data & SQL' | 'Machine Learning & AI' | 'DevOps & Systems' | 'Architecture';
  platform: 'LeetCode' | 'Kaggle' | 'HackerRank' | 'CodeWars' | 'Interactive Lab' | 'GitHub';
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedMinutes: number;
  url: string;
  problemStatement: string;
  tags: string[];
  skills: string[];
  quiz?: {
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    codeSnippet?: string;
  };
}

// Rich fallback bank of practice challenges mapped by skill (EASY ➔ MEDIUM ➔ HARD)
const SKILL_PRACTICE_BANK: Record<string, PracticeChallenge[]> = {
  'html': [
    {
      id: 'html-easy',
      title: 'Semantic HTML Landmarks & Form Validation',
      skillId: 'html',
      skillName: 'HTML & Semantic Structure',
      milestone: 1,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'EASY',
      estimatedMinutes: 15,
      url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
      problemStatement: 'Build a compliant, accessible form with semantic HTML5 elements (<header>, <main>, <form>, <fieldset>, aria-labels) and built-in regex pattern validation.',
      tags: ['Semantic HTML', 'Accessibility', 'Forms', 'ARIA'],
      skills: ['html', 'html-css'],
    },
    {
      id: 'html-med',
      title: 'Responsive Flexbox & CSS Grid Dashboard Card',
      skillId: 'html',
      skillName: 'HTML & CSS Layouts',
      milestone: 1,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'MEDIUM',
      estimatedMinutes: 25,
      url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids',
      problemStatement: 'Construct a responsive multi-column dashboard grid using CSS Grid template areas that smoothly adapts down to single-column flexbox on mobile.',
      tags: ['CSS Grid', 'Flexbox', 'Media Queries', 'Responsive'],
      skills: ['html', 'css', 'html-css'],
    },
    {
      id: 'html-hard',
      title: 'GPU-Accelerated Keyframe Animation & Custom Properties',
      skillId: 'html',
      skillName: 'HTML & Modern CSS',
      milestone: 1,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'HARD',
      estimatedMinutes: 35,
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations',
      problemStatement: 'Implement 60fps micro-animations using CSS transform3d, custom CSS design tokens (--color, --spacing), and dark/light theme switching with prefers-color-scheme.',
      tags: ['CSS Variables', 'Keyframes', 'Hardware Acceleration', 'Theming'],
      skills: ['html', 'css', 'html-css'],
    },
  ],
  'css': [
    {
      id: 'css-easy',
      title: 'CSS Box Model, Flexbox Alignments & Specificity',
      skillId: 'css',
      skillName: 'CSS Styling',
      milestone: 1,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'EASY',
      estimatedMinutes: 15,
      url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model',
      problemStatement: 'Style interactive UI components using standard CSS box-sizing: border-box, flexbox justify/align properties, and correct selector specificity.',
      tags: ['Box Model', 'Flexbox', 'Specificity', 'Padding/Margin'],
      skills: ['css', 'html-css'],
    },
    {
      id: 'css-med',
      title: 'Complex Multi-Breakpoint CSS Grid Layouts',
      skillId: 'css',
      skillName: 'CSS Layouts',
      milestone: 1,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'MEDIUM',
      estimatedMinutes: 25,
      url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids',
      problemStatement: 'Implement a 12-column dynamic CSS Grid layout with minmax() auto-fit track columns and responsive sticky headers.',
      tags: ['CSS Grid', 'minmax()', 'auto-fit', 'Sticky Positioning'],
      skills: ['css', 'html-css'],
    },
    {
      id: 'css-hard',
      title: 'Glassmorphism Design System & Performance Optimization',
      skillId: 'css',
      skillName: 'Advanced CSS',
      milestone: 2,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'HARD',
      estimatedMinutes: 35,
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter',
      problemStatement: 'Architect a modern glassmorphic UI system utilizing backdrop-filter, will-change optimization, and zero layout shift transitions.',
      tags: ['Glassmorphism', 'backdrop-filter', 'will-change', 'CLS Optimization'],
      skills: ['css', 'html-css'],
    },
  ],
  'html-css': [
    {
      id: 'htmlcss-easy',
      title: 'Semantic HTML5 Form & Base Responsive Typography',
      skillId: 'html-css',
      skillName: 'HTML & CSS Essentials',
      milestone: 1,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'EASY',
      estimatedMinutes: 15,
      url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/',
      problemStatement: 'Create a semantic accessible landing hero and contact form with fluid clamp() typography and modern CSS reset.',
      tags: ['Semantic HTML', 'Fluid Typography', 'Forms', 'CSS Reset'],
      skills: ['html-css'],
    },
    {
      id: 'htmlcss-med',
      title: 'Responsive Dashboard Card with CSS Grid & Flexbox',
      skillId: 'html-css',
      skillName: 'HTML & CSS Layouts',
      milestone: 1,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'MEDIUM',
      estimatedMinutes: 25,
      url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Grids',
      problemStatement: 'Build a responsive SaaS dashboard component using CSS Grid with dynamic subgrid columns and responsive media queries.',
      tags: ['CSS Grid', 'Subgrid', 'Responsive', 'Flexbox'],
      skills: ['html-css'],
    },
    {
      id: 'htmlcss-hard',
      title: 'Production Theme Engine & GPU Animations',
      skillId: 'html-css',
      skillName: 'Advanced HTML & CSS',
      milestone: 2,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'HARD',
      estimatedMinutes: 35,
      url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations',
      problemStatement: 'Build a multi-theme token engine (Light/Dark/OLED) using CSS custom properties, backdrop blur filters, and 60fps transform animations.',
      tags: ['Theming Tokens', 'Hardware Acceleration', 'Custom Properties', 'Animation'],
      skills: ['html-css'],
    },
  ],
  'javascript': [
    {
      id: 'js-easy',
      title: 'Array Transformations & Functional Filter / Map',
      skillId: 'javascript',
      skillName: 'JavaScript Core',
      milestone: 1,
      category: 'Web Development',
      platform: 'LeetCode',
      difficulty: 'EASY',
      estimatedMinutes: 15,
      url: 'https://leetcode.com/problems/filter-elements-from-array/',
      problemStatement: 'Implement array transformation and filtering functions without using built-in Array.prototype.map/filter to understand inner pointer operations.',
      tags: ['Arrays', 'Functional', 'Iterators', 'Pointers'],
      skills: ['javascript'],
    },
    {
      id: 'js-med',
      title: 'Debounce & Throttle Higher-Order Implementation',
      skillId: 'javascript',
      skillName: 'JavaScript Core',
      milestone: 1,
      category: 'Web Development',
      platform: 'LeetCode',
      difficulty: 'MEDIUM',
      estimatedMinutes: 25,
      url: 'https://leetcode.com/problems/debounce/',
      problemStatement: 'Implement production-grade debounce and throttle closures that handle leading/trailing edge execution and cancellation.',
      tags: ['Closures', 'setTimeout', 'Event Loop', 'Higher-Order Functions'],
      skills: ['javascript'],
    },
    {
      id: 'js-hard',
      title: 'Custom Promise.all & Asynchronous Concurrency Limiter',
      skillId: 'javascript',
      skillName: 'JavaScript Core',
      milestone: 2,
      category: 'Web Development',
      platform: 'LeetCode',
      difficulty: 'HARD',
      estimatedMinutes: 35,
      url: 'https://leetcode.com/problems/execute-asynchronous-functions-in-parallel/',
      problemStatement: 'Build an async concurrency pool that executes at most N tasks in parallel with fail-safe error isolation and Promise.allSettled semantics.',
      tags: ['Promises', 'Concurrency Pool', 'Async/Await', 'Event Loop'],
      skills: ['javascript'],
    },
  ],
  'typescript': [
    {
      id: 'ts-easy',
      title: 'Generics & Strongly Typed API Response Models',
      skillId: 'typescript',
      skillName: 'TypeScript',
      milestone: 1,
      category: 'Programming',
      platform: 'Interactive Lab',
      difficulty: 'EASY',
      estimatedMinutes: 15,
      url: 'https://www.typescriptlang.org/play',
      problemStatement: 'Define reusable generic types ApiResponse<T> and PaginatedResult<T> with type constraints and default generic parameters.',
      tags: ['Generics', 'Type Aliases', 'Interfaces', 'Type Safety'],
      skills: ['typescript'],
    },
    {
      id: 'ts-med',
      title: 'Discriminated Unions & Custom Type Guards',
      skillId: 'typescript',
      skillName: 'TypeScript',
      milestone: 2,
      category: 'Programming',
      platform: 'CodeWars',
      difficulty: 'MEDIUM',
      estimatedMinutes: 25,
      url: 'https://www.typescriptlang.org/docs/handbook/2/narrowing.html',
      problemStatement: 'Implement exhaustiveness checking with never type and custom user-defined type guard functions (isSuccessResponse) for state machines.',
      tags: ['Discriminated Unions', 'Type Narrowing', 'Never Type', 'Type Guards'],
      skills: ['typescript'],
    },
    {
      id: 'ts-hard',
      title: 'Conditional Types, infer & Template Literal Mapped Types',
      skillId: 'typescript',
      skillName: 'Advanced TypeScript',
      milestone: 3,
      category: 'Programming',
      platform: 'GitHub',
      difficulty: 'HARD',
      estimatedMinutes: 35,
      url: 'https://github.com/type-challenges/type-challenges',
      problemStatement: 'Implement deep recursive DeepReadonly<T>, Flatten<T>, and event-name template literal types (e.g. `on${Capitalize<Event>}`) from scratch.',
      tags: ['infer Keyword', 'Conditional Types', 'Mapped Types', 'Type Challenges'],
      skills: ['typescript'],
    },
  ],
  'react': [
    {
      id: 'react-easy',
      title: 'State Management & Controlled Form Components',
      skillId: 'react',
      skillName: 'React.js',
      milestone: 1,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'EASY',
      estimatedMinutes: 15,
      url: 'https://react.dev/learn',
      problemStatement: 'Build controlled form inputs with validation state, lifting state up, and custom props destructuring with clean separation of concerns.',
      tags: ['useState', 'Controlled Inputs', 'Props', 'React Basics'],
      skills: ['react'],
    },
    {
      id: 'react-med',
      title: 'Custom Hook for Debounced API Fetch with AbortController',
      skillId: 'react',
      skillName: 'React.js',
      milestone: 2,
      category: 'Web Development',
      platform: 'Interactive Lab',
      difficulty: 'MEDIUM',
      estimatedMinutes: 25,
      url: 'https://github.com/facebook/react',
      problemStatement: 'Implement useDebounceFetch custom hook with loading states, error boundaries, memory leak prevention, and AbortController cancellation.',
      tags: ['Custom Hooks', 'useEffect', 'AbortController', 'Performance'],
      skills: ['react'],
    },
    {
      id: 'react-hard',
      title: 'Virtualized Infinite List with Zero Layout Shift',
      skillId: 'react',
      skillName: 'Advanced React Architecture',
      milestone: 3,
      category: 'Web Development',
      platform: 'GitHub',
      difficulty: 'HARD',
      estimatedMinutes: 35,
      url: 'https://github.com/tanstack/virtual',
      problemStatement: 'Build a custom windowing list renderer for 50,000 items that computes dynamic element heights and visible ranges with useMemo and useRef.',
      tags: ['Windowing', 'Virtualization', 'useRef', 'Performance Optimization'],
      skills: ['react'],
    },
  ],
  'sql': [
    {
      id: 'sql-easy',
      title: 'Recyclable & Low Fat Products (Filtering)',
      skillId: 'sql',
      skillName: 'SQL & Relational DBs',
      milestone: 1,
      category: 'Data & SQL',
      platform: 'LeetCode',
      difficulty: 'EASY',
      estimatedMinutes: 10,
      url: 'https://leetcode.com/problems/recyclable-and-low-fat-products/',
      problemStatement: 'Write a query to find the IDs of products that are both low fat and recyclable using boolean predicates in WHERE clause.',
      tags: ['SELECT', 'WHERE', 'Predicates', 'Indexing'],
      skills: ['sql'],
    },
    {
      id: 'sql-med',
      title: 'Department Highest Salary (Multi-Table Joins & Grouping)',
      skillId: 'sql',
      skillName: 'SQL & Relational DBs',
      milestone: 2,
      category: 'Data & SQL',
      platform: 'LeetCode',
      difficulty: 'MEDIUM',
      estimatedMinutes: 25,
      url: 'https://leetcode.com/problems/department-highest-salary/',
      problemStatement: 'Find employees who have the highest salary in each department using INNER JOIN, GROUP BY, and IN (subquery).',
      tags: ['INNER JOIN', 'GROUP BY', 'Subqueries', 'Aggregations'],
      skills: ['sql'],
    },
    {
      id: 'sql-hard',
      title: 'Department Top 3 Salaries (Window Functions & Partitioning)',
      skillId: 'sql',
      skillName: 'SQL & Relational DBs',
      milestone: 3,
      category: 'Data & SQL',
      platform: 'LeetCode',
      difficulty: 'HARD',
      estimatedMinutes: 35,
      url: 'https://leetcode.com/problems/department-top-three-salaries/',
      problemStatement: 'Find employees earning the top 3 unique salaries in each department using DENSE_RANK() OVER (PARTITION BY departmentId ORDER BY salary DESC).',
      tags: ['Window Functions', 'DENSE_RANK', 'PARTITION BY', 'Analytics'],
      skills: ['sql'],
    },
  ],
  'python': [
    {
      id: 'py-easy',
      title: 'Two Sum & O(n) Hash Map Lookup',
      skillId: 'python',
      skillName: 'Python Programming',
      milestone: 1,
      category: 'Programming',
      platform: 'LeetCode',
      difficulty: 'EASY',
      estimatedMinutes: 15,
      url: 'https://leetcode.com/problems/two-sum/',
      problemStatement: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target in single-pass O(n) time.',
      tags: ['Hash Map', 'Dictionary', 'Two Pointers', 'Time Complexity'],
      skills: ['python'],
    },
    {
      id: 'py-med',
      title: 'Group Anagrams with DefaultDict & Tuple Keys',
      skillId: 'python',
      skillName: 'Python Programming',
      milestone: 1,
      category: 'Programming',
      platform: 'LeetCode',
      difficulty: 'MEDIUM',
      estimatedMinutes: 25,
      url: 'https://leetcode.com/problems/group-anagrams/',
      problemStatement: 'Given an array of strings strs, group the anagrams together using collections.defaultdict with sorted tuple keys in O(N * K log K).',
      tags: ['Hash Table', 'defaultdict', 'Tuple Hashing', 'String Manipulation'],
      skills: ['python'],
    },
    {
      id: 'py-hard',
      title: 'LRU Cache Design (Doubly-Linked List + Hash Map)',
      skillId: 'python',
      skillName: 'Python Programming',
      milestone: 2,
      category: 'Programming',
      platform: 'LeetCode',
      difficulty: 'HARD',
      estimatedMinutes: 40,
      url: 'https://leetcode.com/problems/lru-cache/',
      problemStatement: 'Design a data structure that follows the constraints of a Least Recently Used (LRU) cache with O(1) get() and put() time complexity.',
      tags: ['Doubly-Linked List', 'Hash Map', 'LRU Cache', 'System Design'],
      skills: ['python'],
    },
  ],
  'docker': [
    {
      id: 'docker-easy',
      title: 'Containerize a Node.js / Python Web Service',
      skillId: 'docker',
      skillName: 'Docker & Containers',
      milestone: 1,
      category: 'DevOps & Systems',
      platform: 'Interactive Lab',
      difficulty: 'EASY',
      estimatedMinutes: 15,
      url: 'https://docs.docker.com/get-started/',
      problemStatement: 'Write a basic Dockerfile for a backend API service, expose port 3000, set workdir, and run with environment variables.',
      tags: ['Dockerfile', 'EXPOSE', 'WORKDIR', 'ENV'],
      skills: ['docker'],
    },
    {
      id: 'docker-med',
      title: 'Multi-Stage Dockerfile Optimization & Security Hardening',
      skillId: 'docker',
      skillName: 'Docker & Containers',
      milestone: 2,
      category: 'DevOps & Systems',
      platform: 'Interactive Lab',
      difficulty: 'MEDIUM',
      estimatedMinutes: 25,
      url: 'https://docs.docker.com/build/building/multi-stage/',
      problemStatement: 'Write a multi-stage Dockerfile separating build dependencies from the production runner, reducing image size below 80MB with non-root user.',
      tags: ['Multi-Stage', 'Alpine Linux', 'Security', 'Layer Caching'],
      skills: ['docker'],
    },
    {
      id: 'docker-hard',
      title: 'Docker Compose Multi-Container Mesh & Healthchecks',
      skillId: 'docker',
      skillName: 'Docker & Microservices',
      milestone: 3,
      category: 'DevOps & Systems',
      platform: 'Interactive Lab',
      difficulty: 'HARD',
      estimatedMinutes: 35,
      url: 'https://docs.docker.com/compose/',
      problemStatement: 'Configure docker-compose.yml orchestrating API, Redis cache, and Postgres DB with service dependencies (condition: service_healthy) and isolated bridge networks.',
      tags: ['Docker Compose', 'Healthchecks', 'Bridge Networks', 'Volumes'],
      skills: ['docker'],
    },
  ],
  'machine-learning': [
    {
      id: 'ml-easy',
      title: 'Supervised Linear Regression & Feature Normalization',
      skillId: 'machine-learning',
      skillName: 'Machine Learning',
      milestone: 1,
      category: 'Machine Learning & AI',
      platform: 'Kaggle',
      difficulty: 'EASY',
      estimatedMinutes: 20,
      url: 'https://www.kaggle.com/learn/intro-to-machine-learning',
      problemStatement: 'Train and evaluate a linear regression model with StandardScaler pipeline on tabular house pricing data using Scikit-Learn.',
      tags: ['Linear Regression', 'Scikit-Learn', 'StandardScaler', 'RMSE'],
      skills: ['machine-learning'],
    },
    {
      id: 'ml-med',
      title: 'Handling Class Imbalance with SMOTE & PR-AUC Evaluation',
      skillId: 'machine-learning',
      skillName: 'Machine Learning',
      milestone: 2,
      category: 'Machine Learning & AI',
      platform: 'Kaggle',
      difficulty: 'MEDIUM',
      estimatedMinutes: 30,
      url: 'https://www.kaggle.com/competitions',
      problemStatement: 'Build a fraud detection pipeline on a 99:1 imbalanced dataset using SMOTE for oversampling and evaluate with Precision-Recall AUC and F1-score.',
      tags: ['Classification', 'SMOTE', 'Precision-Recall', 'Scikit-Learn'],
      skills: ['machine-learning'],
    },
    {
      id: 'ml-hard',
      title: 'Custom PyTorch Multi-Head Self-Attention Transformer',
      skillId: 'machine-learning',
      skillName: 'Deep Learning & LLMs',
      milestone: 3,
      category: 'Machine Learning & AI',
      platform: 'Kaggle',
      difficulty: 'HARD',
      estimatedMinutes: 45,
      url: 'https://huggingface.co/docs/transformers/training',
      problemStatement: 'Implement the scaled dot-product attention mechanism (Q, K, V matrices with causal masking) from scratch in PyTorch with gradient clipping.',
      tags: ['Transformers', 'Attention Mechanism', 'PyTorch', 'Causal Masking'],
      skills: ['machine-learning'],
    },
  ],
  'system-design': [
    {
      id: 'sys-easy',
      title: 'Load Balancing Strategies & Cache Invalidation Patterns',
      skillId: 'system-design',
      skillName: 'System Design',
      milestone: 1,
      category: 'Architecture',
      platform: 'GitHub',
      difficulty: 'EASY',
      estimatedMinutes: 15,
      url: 'https://github.com/donnemartin/system-design-primer',
      problemStatement: 'Compare Round-Robin vs Least Connections load balancing, and design Cache-Aside vs Write-Through strategies for low latency reads.',
      tags: ['Load Balancing', 'Cache-Aside', 'Redis', 'Latency'],
      skills: ['system-design'],
    },
    {
      id: 'sys-med',
      title: 'Design a Scalable Distributed URL Shortener (TinyURL)',
      skillId: 'system-design',
      skillName: 'System Design',
      milestone: 2,
      category: 'Architecture',
      platform: 'GitHub',
      difficulty: 'MEDIUM',
      estimatedMinutes: 30,
      url: 'https://github.com/donnemartin/system-design-primer',
      problemStatement: 'Architect a URL shortening service handling 100M daily writes using Base62 encoding, unique ID generation (Snowflake), and Redis caching.',
      tags: ['Base62', 'Snowflake ID', 'Sharding', 'CAP Theorem'],
      skills: ['system-design'],
    },
    {
      id: 'sys-hard',
      title: 'Distributed Rate Limiter (Token Bucket & Sliding Window)',
      skillId: 'system-design',
      skillName: 'System Design & Distributed Systems',
      milestone: 3,
      category: 'Architecture',
      platform: 'GitHub',
      difficulty: 'HARD',
      estimatedMinutes: 40,
      url: 'https://github.com/donnemartin/system-design-primer',
      problemStatement: 'Architect a low-latency distributed rate limiter capable of handling 500k RPS across multi-region clusters using Redis Sorted Sets.',
      tags: ['Rate Limiter', 'Redis Sorted Sets', 'Sliding Window', 'Concurrency'],
      skills: ['system-design'],
    },
  ],
};

// Generate dynamic challenges with Groq AI for custom skills (EASY ➔ MEDIUM ➔ HARD)
async function generateGroqPracticeChallenges(
  skillId: string,
  skillName: string,
  targetRole: string,
  count: number = 3
): Promise<PracticeChallenge[]> {
  try {
    const apiKey = config.groqApiKey || process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('No Groq API key');

    const client = new Groq({ apiKey });
    const model = config.groqModel || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

    const systemPrompt = `You are a Principal Tech Lead and Interview Question Architect.
Your task: Create a graduated playlist of 3 real-world coding practice challenges for a technical skill, ordered strictly from EASY to MEDIUM to HARD.
Requirements:
1. Challenge 1 must be difficulty "EASY", testing fundamentals & syntax.
2. Challenge 2 must be difficulty "MEDIUM", testing practical implementation & optimization.
3. Challenge 3 must be difficulty "HARD", testing advanced architecture, scale, or edge cases.
4. Provide authentic canonical URLs (LeetCode, HackerRank, freeCodeCamp, Kaggle, GitHub, MDN).
5. Output MUST be a valid JSON array only.`;

    const userPrompt = `Generate a 3-challenge playlist (EASY, MEDIUM, HARD) for skill: "${skillName}" (id: ${skillId})
Target Career Role: "${targetRole}"

Return JSON array formatted as:
[
  {
    "id": "${skillId}-easy",
    "title": "Clear Beginner/Foundational challenge title",
    "skillId": "${skillId}",
    "skillName": "${skillName}",
    "milestone": 1,
    "category": "Programming | Web Development | Data & SQL | Machine Learning & AI | DevOps & Systems | Architecture",
    "platform": "LeetCode | HackerRank | Kaggle | CodeWars | Interactive Lab | GitHub",
    "difficulty": "EASY",
    "estimatedMinutes": 15,
    "url": "https://leetcode.com/... or https://www.hackerrank.com/... or https://github.com/...",
    "problemStatement": "Precise 2-sentence description of the problem and technical objective.",
    "tags": ["Tag1", "Tag2"]
  },
  {
    "id": "${skillId}-med",
    "title": "Clear Intermediate challenge title",
    "skillId": "${skillId}",
    "skillName": "${skillName}",
    "milestone": 2,
    "category": "Programming | Web Development | Data & SQL | Machine Learning & AI | DevOps & Systems | Architecture",
    "platform": "LeetCode | HackerRank | Kaggle | CodeWars | Interactive Lab | GitHub",
    "difficulty": "MEDIUM",
    "estimatedMinutes": 25,
    "url": "https://leetcode.com/... or https://www.hackerrank.com/... or https://github.com/...",
    "problemStatement": "Precise 2-sentence description of the problem and technical objective.",
    "tags": ["Tag1", "Tag2"]
  },
  {
    "id": "${skillId}-hard",
    "title": "Clear Advanced challenge title",
    "skillId": "${skillId}",
    "skillName": "${skillName}",
    "milestone": 3,
    "category": "Programming | Web Development | Data & SQL | Machine Learning & AI | DevOps & Systems | Architecture",
    "platform": "LeetCode | HackerRank | Kaggle | CodeWars | Interactive Lab | GitHub",
    "difficulty": "HARD",
    "estimatedMinutes": 35,
    "url": "https://leetcode.com/... or https://www.hackerrank.com/... or https://github.com/...",
    "problemStatement": "Precise 2-sentence description of the problem and technical objective.",
    "tags": ["Tag1", "Tag2"]
  }
]`;

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 1200,
    });

    const content = response.choices[0]?.message?.content || '';
    const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
    const match = cleaned.match(/\[[\s\S]*\]/);
    const parsed = match ? JSON.parse(match[0]) : JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      const diffLevels = ['EASY', 'MEDIUM', 'HARD'];
      return parsed.map((item: any, idx: number) => ({
        id: item.id || `${skillId}-${diffLevels[idx] ? diffLevels[idx].toLowerCase() : `p${idx + 1}`}`,
        title: item.title || `${skillName} Challenge ${idx + 1}`,
        skillId: skillId,
        skillName: item.skillName || skillName,
        milestone: item.milestone || (idx + 1),
        category: item.category || 'Programming',
        platform: item.platform || (idx === 0 ? 'HackerRank' : idx === 1 ? 'LeetCode' : 'GitHub'),
        difficulty: (['EASY', 'MEDIUM', 'HARD'].includes(item.difficulty) ? item.difficulty : (diffLevels[idx] || 'MEDIUM')) as any,
        estimatedMinutes: Number(item.estimatedMinutes) || (idx === 0 ? 15 : idx === 1 ? 25 : 35),
        url: item.url && item.url.startsWith('http') ? item.url : `https://www.google.com/search?q=${encodeURIComponent(skillName + ' practice coding problems')}`,
        problemStatement: item.problemStatement || `Solve hands-on practice problems to master ${skillName}.`,
        tags: Array.isArray(item.tags) ? item.tags : [skillId],
        skills: [skillId],
      }));
    }
  } catch (err) {
    console.warn(`Groq generation failed for practice skill ${skillId}, using template fallback:`, err);
  }

  // Generic Easy ➔ Medium ➔ Hard fallback if Groq fails
  return [
    {
      id: `${skillId}-easy`,
      title: `${skillName} Core Syntax & Fundamentals`,
      skillId,
      skillName,
      milestone: 1,
      category: 'Programming',
      platform: 'HackerRank',
      difficulty: 'EASY',
      estimatedMinutes: 15,
      url: `https://www.hackerrank.com/domains/${encodeURIComponent(skillId)}`,
      problemStatement: `Practice foundational syntax, conditional branching, and basic operations in ${skillName}.`,
      tags: ['Fundamentals', 'Syntax', 'Basics'],
      skills: [skillId],
    },
    {
      id: `${skillId}-med`,
      title: `${skillName} Practical Optimization & Patterns`,
      skillId,
      skillName,
      milestone: 2,
      category: 'Architecture',
      platform: 'LeetCode',
      difficulty: 'MEDIUM',
      estimatedMinutes: 25,
      url: `https://leetcode.com/problemset/?search=${encodeURIComponent(skillName)}`,
      problemStatement: `Implement idiomatic design patterns and algorithmic problem solving with ${skillName}.`,
      tags: ['Optimization', 'Patterns', 'Data Structures'],
      skills: [skillId],
    },
    {
      id: `${skillId}-hard`,
      title: `${skillName} High-Scale Architecture & Resiliency`,
      skillId,
      skillName,
      milestone: 3,
      category: 'Architecture',
      platform: 'GitHub',
      difficulty: 'HARD',
      estimatedMinutes: 35,
      url: `https://github.com/topics/${encodeURIComponent(skillId)}`,
      problemStatement: `Design and implement production-hardened concurrency, edge cases, and performance profiles in ${skillName}.`,
      tags: ['Production', 'Resiliency', 'Scale'],
      skills: [skillId],
    },
  ];
}

// GET /api/practice/roadmap-questions — Fetch practice challenges aligned with active user roadmap
router.get('/roadmap-questions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let targetRole = 'full-stack-developer';
    let roadmapSkillIds: Array<{ skillId: string; milestone: number }> = [];

    if (req.userId) {
      try {
        const learner = await LearnerModel.findById(req.userId).lean();
        if (learner) {
          const activeGoal = learner.goals?.[learner.goals.length - 1];
          if (activeGoal?.targetRole) targetRole = activeGoal.targetRole;
        }
      } catch {
        // ignore
      }
    }

    // Resolve target role skills and milestones
    const roleDef = await resolveOrSynthesizeRole(targetRole);
    if (roleDef?.requiredSkills?.length) {
      roadmapSkillIds = roleDef.requiredSkills.map((reqSkill: any, idx: number) => ({
        skillId: reqSkill.skillId,
        milestone: Math.min(4, Math.floor(idx / 2) + 1),
      }));
    } else {
      roadmapSkillIds = [
        { skillId: 'python', milestone: 1 },
        { skillId: 'sql', milestone: 1 },
        { skillId: 'javascript', milestone: 2 },
        { skillId: 'react', milestone: 2 },
        { skillId: 'docker', milestone: 3 },
        { skillId: 'system-design', milestone: 4 },
      ];
    }

    // Load available skills metadata
    const allSkills = loadSkillsData();
    const questions: PracticeChallenge[] = [];

    for (const item of roadmapSkillIds) {
      const skillObj = allSkills.find(s => s.id === item.skillId);
      const skillName = skillObj?.name || item.skillId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

      const known = SKILL_PRACTICE_BANK[item.skillId];
      if (known && known.length > 0) {
        known.forEach(q => {
          questions.push({
            ...q,
            milestone: item.milestone,
            skillName,
          });
        });
      } else {
        // Generate on-demand fallback challenge
        const generated = await generateGroqPracticeChallenges(item.skillId, skillName, targetRole, 2);
        generated.forEach(q => {
          questions.push({
            ...q,
            milestone: item.milestone,
          });
        });
      }
    }

    res.json({
      targetRole,
      targetRoleName: roleDef.name || targetRole.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      roadmapSkills: roadmapSkillIds.map(r => {
        const sk = allSkills.find(s => s.id === r.skillId);
        return {
          skillId: r.skillId,
          skillName: sk?.name || r.skillId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          milestone: r.milestone,
        };
      }),
      questions,
    });
  } catch (error) {
    console.error('Roadmap practice questions error:', error);
    res.status(500).json({ error: 'Failed to load roadmap practice questions' });
  }
});

// POST /api/practice/generate — Generate dynamic questions for any custom topic
router.post('/generate', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { skillId, skillName, role, count = 3 } = req.body;
    if (!skillId) {
      res.status(400).json({ error: 'skillId is required' });
      return;
    }

    const resolvedName = skillName || (skillId as string).replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    const targetRole = role || 'Software Developer';

    const questions = await generateGroqPracticeChallenges(skillId, resolvedName, targetRole, count);
    res.json({ questions, skillName: resolvedName });
  } catch (error) {
    console.error('Generate practice questions error:', error);
    res.status(500).json({ error: 'Failed to generate practice challenges' });
  }
});

// POST /api/practice/submit — Submit answer to practice quiz and earn XP
router.post('/submit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { questionId, skillId, selectedOption, correctAnswer, title } = req.body;

    const isCorrect = selectedOption !== undefined && correctAnswer !== undefined
      ? selectedOption === correctAnswer
      : true;

    const score = isCorrect ? 100 : 50;
    const xpEarned = isCorrect ? 50 : 20;

    if (req.userId) {
      try {
        // Record progress event
        await LearningEventModel.create({
          learnerId: req.userId,
          eventType: 'PRACTICE_COMPLETED',
          skillIds: [skillId || 'general'],
          score,
          evidence: {
            questionId,
            selectedOption,
            correctAnswer,
            title,
          },
        });

        // Update learner skill proficiency
        const learner = await LearnerModel.findById(req.userId);
        if (learner) {
          const sIdx = learner.skillStates.findIndex(s => s.skillId === skillId);
          if (sIdx >= 0) {
            learner.skillStates[sIdx].proficiency = Math.min(100, learner.skillStates[sIdx].proficiency + (isCorrect ? 10 : 4));
            learner.skillStates[sIdx].lastUpdated = new Date();
          } else {
            learner.skillStates.push({
              skillId: skillId || 'general',
              proficiency: isCorrect ? 60 : 35,
              confidence: 0.8,
              evidence: [],
              lastUpdated: new Date(),
            });
          }
          await learner.save();
        }
      } catch (e) {
        console.warn('Failed to save learning event:', e);
      }
    }

    res.json({
      success: true,
      isCorrect,
      score,
      xpEarned,
      message: isCorrect ? '🎉 Correct answer! +50 XP Earned!' : 'Keep practicing! Review the explanation below.',
    });
  } catch (error) {
    console.error('Practice submit error:', error);
    res.status(500).json({ error: 'Failed to submit practice challenge' });
  }
});

export default router;
