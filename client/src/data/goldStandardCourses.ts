export interface GoldStandardCourse {
  skillId: string;
  topicName: string;
  category: 'Programming' | 'Web Development' | 'Data & SQL' | 'Machine Learning & AI' | 'DevOps & Systems';
  freeCourse: {
    title: string;
    provider: string;
    platform: string;
    url: string;
    durationHours: number;
    rating: number;
    description: string;
    highlight: string;
  };
  paidCourse: {
    title: string;
    provider: string;
    platform: string;
    url: string;
    durationHours: number;
    rating: number;
    price: string;
    certificate: boolean;
    description: string;
    highlight: string;
  };
}

export const GOLD_STANDARD_COURSES: GoldStandardCourse[] = [
  {
    skillId: 'python',
    topicName: 'Python Programming',
    category: 'Programming',
    freeCourse: {
      title: "CS50's Introduction to Programming with Python",
      provider: 'Harvard University',
      platform: 'Harvard / edX',
      url: 'https://cs50.harvard.edu/python/',
      durationHours: 40,
      rating: 4.95,
      description: 'An introduction to programming using Python, taught by David J. Malan. Covers functions, variables, conditionals, loops, exceptions, libraries, unit tests, and OOP.',
      highlight: 'Harvard University Official Python Curriculum',
    },
    paidCourse: {
      title: 'Python for Everybody Specialization',
      provider: 'University of Michigan (Dr. Chuck)',
      platform: 'Coursera',
      url: 'https://www.coursera.org/specializations/python',
      durationHours: 60,
      rating: 4.8,
      price: '$49/mo (Coursera Plus)',
      certificate: true,
      description: 'Learn to program and analyze data with Python. Develop programs to gather, clean, analyze, and visualize data with official University of Michigan certificate.',
      highlight: 'University of Michigan Professional Credential',
    },
  },
  {
    skillId: 'javascript',
    topicName: 'JavaScript & Modern ECMAScript',
    category: 'Web Development',
    freeCourse: {
      title: 'The Modern JavaScript Tutorial & Course',
      provider: 'JavaScript.info & freeCodeCamp',
      platform: 'JavaScript.info',
      url: 'https://javascript.info/',
      durationHours: 50,
      rating: 4.98,
      description: 'From the basics to advanced topics with simple, but detailed explanations. Event loop, promises, async/await, closures, prototypes, and modern browser APIs.',
      highlight: 'Comprehensive Deep-Dive JavaScript Reference',
    },
    paidCourse: {
      title: 'The Complete JavaScript Course: From Zero to Expert!',
      provider: 'Jonas Schmedtmann',
      platform: 'Udemy',
      url: 'https://www.udemy.com/course/the-complete-javascript-course/',
      durationHours: 68,
      rating: 4.8,
      price: '$14.99 / ₹549',
      certificate: true,
      description: 'The modern JavaScript course for everyone! Master JavaScript with projects, challenges, theory, OOP, asynchronous JS, and modern tooling.',
      highlight: 'Comprehensive Full-Stack JavaScript Bootcamp',
    },
  },
  {
    skillId: 'react',
    topicName: 'React.js & Frontend Architecture',
    category: 'Web Development',
    freeCourse: {
      title: 'Official React Documentation & Interactive Tutorial',
      provider: 'Meta / React Core Team',
      platform: 'React.dev',
      url: 'https://react.dev/learn',
      durationHours: 35,
      rating: 4.95,
      description: 'The official tutorial completely rewritten with modern hooks, server components, state management, and functional architecture by React creators.',
      highlight: 'Official Interactive Learning Path from Meta',
    },
    paidCourse: {
      title: 'The Ultimate React Course (React, Next.js, Redux)',
      provider: 'Jonas Schmedtmann',
      platform: 'Udemy',
      url: 'https://www.udemy.com/course/the-ultimate-react-course/',
      durationHours: 67,
      rating: 4.9,
      price: '$14.99 / ₹549',
      certificate: true,
      description: 'Master React, Redux Toolkit, React Query, React Router, Next.js, Tailwind CSS, and Supabase by building real-world production full-stack apps.',
      highlight: 'Production Architecture & Next.js Full Stack Projects',
    },
  },
  {
    skillId: 'sql',
    topicName: 'SQL, Relational Databases & Analytics',
    category: 'Data & SQL',
    freeCourse: {
      title: 'Mode Analytics Interactive SQL Tutorial',
      provider: 'Mode Analytics',
      platform: 'Mode',
      url: 'https://mode.com/sql-tutorial/',
      durationHours: 25,
      rating: 4.92,
      description: 'Hands-on interactive SQL training inside real query environments. Covers Basic, Intermediate, and Advanced SQL including Window Functions, CTEs, and Pivots.',
      highlight: 'Hands-On Interactive SQL Analytics Environment',
    },
    paidCourse: {
      title: 'Excel to MySQL: Analytic Techniques for Business Specialization',
      provider: 'Duke University',
      platform: 'Coursera',
      url: 'https://www.coursera.org/specializations/excel-mysql',
      durationHours: 60,
      rating: 4.7,
      price: '$49/mo (Coursera Plus)',
      certificate: true,
      description: 'Formulate business questions and use relational database SQL, data aggregation, and business modeling with Duke University faculty.',
      highlight: 'Duke University Credential for SQL & Relational Analysis',
    },
  },
  {
    skillId: 'machine-learning',
    topicName: 'Machine Learning & Predictive Modeling',
    category: 'Machine Learning & AI',
    freeCourse: {
      title: 'CS229: Machine Learning by Andrew Ng',
      provider: 'Stanford University',
      platform: 'Stanford Online / YouTube',
      url: 'https://www.youtube.com/playlist?list=PLoROMvodv4rMiGQp3WXShtMGgzqpfVfbU',
      durationHours: 55,
      rating: 4.99,
      description: 'The foundational Stanford university course taught by Andrew Ng covering supervised learning, unsupervised learning, generalization, and learning theory.',
      highlight: 'Stanford University Foundational ML Lectures',
    },
    paidCourse: {
      title: 'Machine Learning Specialization',
      provider: 'DeepLearning.AI & Stanford Online (Andrew Ng)',
      platform: 'Coursera',
      url: 'https://www.coursera.org/specializations/machine-learning-introduction',
      durationHours: 75,
      rating: 4.9,
      price: '$49/mo (Coursera Plus)',
      certificate: true,
      description: 'Updated 3-course curriculum covering Supervised ML (Regression, Classification), Advanced Algorithms (Neural Networks, Trees), and Unsupervised Learning & Recommenders.',
      highlight: 'DeepLearning.AI & Stanford Online Certificate',
    },
  },
  {
    skillId: 'deep-learning',
    topicName: 'Deep Learning & Neural Networks',
    category: 'Machine Learning & AI',
    freeCourse: {
      title: 'Practical Deep Learning for Coders',
      provider: 'Jeremy Howard / fast.ai',
      platform: 'fast.ai',
      url: 'https://course.fast.ai/',
      durationHours: 60,
      rating: 4.96,
      description: 'Top-down deep learning using PyTorch and fastai. Computer vision, NLP, tabular models, collaborative filtering, generative models, and deployment.',
      highlight: 'PyTorch & Modern Computer Vision / NLP Applications',
    },
    paidCourse: {
      title: 'Deep Learning Specialization',
      provider: 'DeepLearning.AI (Andrew Ng)',
      platform: 'Coursera',
      url: 'https://www.coursera.org/specializations/deep-learning',
      durationHours: 85,
      rating: 4.9,
      price: '$49/mo (Coursera Plus)',
      certificate: true,
      description: 'Master Neural Networks, Deep Learning architectures, CNNs, Sequence Models (RNNs, LSTMs, Transformers), and structuring ML projects with industry certification.',
      highlight: 'DeepLearning.AI Industry Certification',
    },
  },
  {
    skillId: 'nodejs',
    topicName: 'Node.js, Express & Backend APIs',
    category: 'Web Development',
    freeCourse: {
      title: 'Node.js & Express.js Full Masterclass',
      provider: 'freeCodeCamp / John Smilga',
      platform: 'freeCodeCamp',
      url: 'https://www.youtube.com/watch?v=Oe421EPjeBE',
      durationHours: 10,
      rating: 4.88,
      description: 'Full 10-hour comprehensive guide to building REST APIs, MongoDB integration, middleware, JWT authentication, and file upload systems with Express.',
      highlight: 'Full REST API & Express Architecture Video Guide',
    },
    paidCourse: {
      title: 'NodeJS - The Complete Guide (MVC, REST APIs, GraphQL, Deno)',
      provider: 'Maximilian Schwarzmüller (Academind)',
      platform: 'Udemy',
      url: 'https://www.udemy.com/course/nodejs-the-complete-guide/',
      durationHours: 40,
      rating: 4.7,
      price: '$14.99 / ₹549',
      certificate: true,
      description: 'Master Node JS & Express from scratch. Includes SQL & NoSQL databases, MVC patterns, REST & GraphQL APIs, authentication, payments with Stripe, and testing.',
      highlight: 'Production Backend Architecture, Auth & Payments',
    },
  },
  {
    skillId: 'docker',
    topicName: 'Docker, Containers & Cloud Infrastructure',
    category: 'DevOps & Systems',
    freeCourse: {
      title: 'Docker Tutorial for Beginners Full Course',
      provider: 'TechWorld with Nana',
      platform: 'YouTube',
      url: 'https://www.youtube.com/watch?v=fqMOX6JJhGo',
      durationHours: 4,
      rating: 4.95,
      description: 'Clear, concise visual breakdown of Docker architecture, images, containers, Dockerfile, Docker Compose, networking, volumes, and repository publishing.',
      highlight: 'Practical DevOps & Containerization Video Guide',
    },
    paidCourse: {
      title: 'Docker and Kubernetes: The Complete Guide',
      provider: 'Stephen Grider',
      platform: 'Udemy',
      url: 'https://www.udemy.com/course/docker-and-kubernetes-the-complete-guide/',
      durationHours: 23,
      rating: 4.8,
      price: '$14.99 / ₹549',
      certificate: true,
      description: 'Build, test, and deploy Docker applications with Kubernetes while learning production CI/CD workflows and multi-container deployment.',
      highlight: 'Production Multi-Container CI/CD & Kubernetes',
    },
  },
  {
    skillId: 'git',
    topicName: 'Git & Version Control Mastery',
    category: 'Programming',
    freeCourse: {
      title: 'Pro Git Official Book & Interactive Course',
      provider: 'Scott Chacon & Ben Straub',
      platform: 'Git-SCM',
      url: 'https://git-scm.com/book/en/v2',
      durationHours: 15,
      rating: 4.97,
      description: 'The authoritative reference book on Git, fully open-source. Branching, rebasing, remotes, internals, hooks, submodules, and team collaboration workflows.',
      highlight: 'Official Open-Source Git Documentation & Book',
    },
    paidCourse: {
      title: 'Git & GitHub Bootcamp',
      provider: 'Colt Steele',
      platform: 'Udemy',
      url: 'https://www.udemy.com/course/git-and-github-bootcamp/',
      durationHours: 17,
      rating: 4.8,
      price: '$14.99 / ₹549',
      certificate: true,
      description: 'Visual, deeply practical course covering commits, merge conflicts, interactive rebasing, reflogs, squashing, GitHub workflows, and team pull requests.',
      highlight: 'Interactive Branching & Team Collaboration Workflows',
    },
  },
  {
    skillId: 'nlp',
    topicName: 'Natural Language Processing & LLMs',
    category: 'Machine Learning & AI',
    freeCourse: {
      title: 'Hugging Face Official NLP & Transformer Course',
      provider: 'Hugging Face Core Team',
      platform: 'Hugging Face',
      url: 'https://huggingface.co/learn/nlp-course',
      durationHours: 30,
      rating: 4.96,
      description: 'Learn how to apply Transformers to NLP tasks using the Hugging Face ecosystem (Transformers, Datasets, Tokenizers, Accelerate). Covers fine-tuning and modern LLMs.',
      highlight: 'Official Transformer & LLM Hands-On Curriculum',
    },
    paidCourse: {
      title: 'Natural Language Processing Specialization',
      provider: 'DeepLearning.AI (Andrew Ng & Łukasz Kaiser)',
      platform: 'Coursera',
      url: 'https://www.coursera.org/specializations/natural-language-processing',
      durationHours: 65,
      rating: 4.7,
      price: '$49/mo (Coursera Plus)',
      certificate: true,
      description: 'Build sentiment analysis, word embeddings (Word2Vec), auto-complete models, machine translation, and Transformer architectures using Trax and PyTorch.',
      highlight: 'DeepLearning.AI Natural Language Processing Credential',
    },
  },
];
