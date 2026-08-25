// ============================================================
// AI-Powered Real Course & Resource Recommender
// ============================================================
// Uses Groq to generate real, curated course recommendations
// from platforms like Coursera, edX, YouTube, Kaggle, fast.ai, etc.
// ============================================================

import Groq from 'groq-sdk';
import { config } from '../config.js';

export interface CourseRecommendation {
  title: string;
  provider: string;
  platform: string;
  url: string;
  description: string;
  estimatedHours: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isFree: boolean;
  type: 'course' | 'practice' | 'project' | 'paper' | 'assignment';
  skills: string[];
  rating?: number;
}

const PLATFORM_URLS: Record<string, string> = {
  'Coursera': 'https://www.coursera.org/search?query=',
  'edX': 'https://www.edx.org/search?q=',
  'YouTube': 'https://www.youtube.com/results?search_query=',
  'Kaggle': 'https://www.kaggle.com/learn',
  'fast.ai': 'https://www.fast.ai/',
  'freeCodeCamp': 'https://www.freecodecamp.org/learn',
  'Udemy': 'https://www.udemy.com/courses/search/?q=',
  'MIT OpenCourseWare': 'https://ocw.mit.edu/search/?q=',
  'Google Developers': 'https://developers.google.com/learn',
  'Microsoft Learn': 'https://learn.microsoft.com/en-us/training/browse/?terms=',
  'AWS Training': 'https://aws.amazon.com/training/',
  'DataCamp': 'https://www.datacamp.com/courses-all',
  'Codecademy': 'https://www.codecademy.com/catalog',
  'LeetCode': 'https://leetcode.com/problemset/',
  'HackerRank': 'https://www.hackerrank.com/domains/',
};

function buildPlatformUrl(platform: string, query: string): string {
  const base = PLATFORM_URLS[platform];
  if (!base) return `https://www.google.com/search?q=${encodeURIComponent(query + ' ' + platform + ' course')}`;
  if (base.endsWith('=') || base.endsWith('?q=') || base.endsWith('?query=') || base.endsWith('terms=') || base.endsWith('search_query=')) {
    return base + encodeURIComponent(query);
  }
  return base;
}

export async function getAICourseRecommendations(
  skillName: string,
  skillId: string,
  targetRole: string,
  level: string = 'intermediate',
  learningPreferences: string[] = ['course'],
): Promise<CourseRecommendation[]> {
  try {
    const apiKey = config.groqApiKey || process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error('No Groq API key');

    const client = new Groq({ apiKey });

    const systemPrompt = `You are a world-class learning curator with deep knowledge of online education platforms.
Your task: Return REAL, HIGH-QUALITY course and resource recommendations for a specific skill.

CRITICAL DISAMBIGUATION & ACCURACY RULES:
1. STRICT LANGUAGE SEPARATION:
   - "Java" is the JVM language (Duke University, University of Helsinki MOOC.fi, Oracle, Spring Boot, Tim Buchalka). NEVER recommend JavaScript, React, Node.js, or web frontend tools for "Java"!
   - "JavaScript" is ECMAScript/web language (Jonas Schmedtmann, MDN, freeCodeCamp JS).
   - "C" != "C++" != "C#".
2. Only recommend REAL courses/resources that actually exist on their platforms
3. Use accurate titles, providers, and realistic URLs
4. Mix free and paid options
5. Include a variety of types: courses, YouTube playlists, practice sets, projects, papers
6. Prioritize quality over quantity

Return EXACTLY 8 items as valid JSON array.`;

    const userPrompt = `Skill: "${skillName}" (id: ${skillId})
Target Career Role: ${targetRole}
Learner Level: ${level}
Preferred Learning Modes: ${learningPreferences.join(', ')}

Return 8 real course/resource recommendations as JSON array:
[
  {
    "title": "exact real course title",
    "provider": "instructor or organization name",
    "platform": "Coursera | edX | YouTube | Kaggle | fast.ai | freeCodeCamp | Udemy | MIT OpenCourseWare | Google Developers | Microsoft Learn | AWS Training | DataCamp | Codecademy | LeetCode | HackerRank",
    "url": "direct url to the course/resource (exact real URL if known, else platform search URL)",
    "description": "2-3 sentence description of what learner gains",
    "estimatedHours": number,
    "difficulty": "beginner | intermediate | advanced",
    "isFree": boolean,
    "type": "course | practice | project | paper | assignment",
    "skills": ["relevant", "skill", "tags"],
    "rating": 4.7
  }
]

Include both free (YouTube, freeCodeCamp, Kaggle, fast.ai) and paid (Coursera, Udemy, DataCamp) options.
Focus on the most highly-rated, widely-recommended resources for ${skillName}.`;

    const model = config.groqModel || process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });

    const content = response.choices[0]?.message?.content || '';

    // Parse JSON
    let items: any[] = [];
    try {
      const cleaned = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        items = JSON.parse(match[0]);
      } else {
        items = JSON.parse(cleaned);
      }
    } catch {
      console.warn('Groq response was not clean JSON, trying line extraction');
    }

    if (!Array.isArray(items) || items.length === 0) {
      return getFallbackRecommendations(skillName, skillId, targetRole);
    }

    return items.slice(0, 8).map((item: any): CourseRecommendation => ({
      title: item.title || `${skillName} Learning Resource`,
      provider: item.provider || item.instructor || 'Community',
      platform: item.platform || 'Online',
      url: item.url && item.url.startsWith('http')
        ? item.url
        : buildPlatformUrl(item.platform || 'Coursera', item.title || skillName),
      description: item.description || `Master ${skillName} with this curated resource.`,
      estimatedHours: Number(item.estimatedHours) || 10,
      difficulty: (['beginner', 'intermediate', 'advanced'].includes(item.difficulty) ? item.difficulty : 'intermediate') as CourseRecommendation['difficulty'],
      isFree: Boolean(item.isFree),
      type: (['course', 'practice', 'project', 'paper', 'assignment'].includes(item.type) ? item.type : 'course') as CourseRecommendation['type'],
      skills: Array.isArray(item.skills) ? item.skills : [skillId],
      rating: item.rating ? parseFloat(item.rating) : undefined,
    }));
  } catch (err) {
    console.warn(`AI recommendations failed for ${skillId}, using fallback:`, err);
    return getFallbackRecommendations(skillName, skillId, targetRole);
  }
}

function getFallbackRecommendations(skillName: string, skillId: string, _targetRole: string): CourseRecommendation[] {
  const id = skillId.toLowerCase().trim();

  const categoryMap: Record<string, CourseRecommendation[]> = {
    java: [
      { title: 'Java Programming and Software Engineering Fundamentals', provider: 'Duke University', platform: 'Coursera', url: 'https://www.coursera.org/specializations/java-programming', description: 'Designed for beginners to learn core Java, OOP, data structures, and algorithms.', estimatedHours: 60, difficulty: 'beginner', isFree: false, type: 'course', skills: ['java'], rating: 4.7 },
      { title: 'Java Tutorial for Beginners (Full Course)', provider: 'freeCodeCamp', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=A74TOX803D0', description: 'Comprehensive 9-hour Java course covering classes, OOP, interfaces, collections, and exception handling.', estimatedHours: 9, difficulty: 'beginner', isFree: true, type: 'course', skills: ['java'], rating: 4.8 },
      { title: 'Java Practice Problem Set', provider: 'HackerRank', platform: 'HackerRank', url: 'https://www.hackerrank.com/domains/java', description: 'Practice core Java questions from basic syntax to multi-threading and regex.', estimatedHours: 15, difficulty: 'intermediate', isFree: true, type: 'practice', skills: ['java'], rating: 4.6 },
    ],
    python: [
      { title: 'Python for Everybody Specialization', provider: 'Dr. Chuck (University of Michigan)', platform: 'Coursera', url: 'https://www.coursera.org/specializations/python', description: 'Learn Python from basics to data structures and web scraping. One of the most popular Python courses worldwide.', estimatedHours: 40, difficulty: 'beginner', isFree: false, type: 'course', skills: ['python'], rating: 4.8 },
      { title: 'freeCodeCamp Python Tutorial (Full Course)', provider: 'freeCodeCamp', platform: 'YouTube', url: 'https://www.youtube.com/watch?v=rfscVS0vtbw', description: '4.5 hour comprehensive Python course covering all the basics. Completely free and highly rated.', estimatedHours: 5, difficulty: 'beginner', isFree: true, type: 'course', skills: ['python'], rating: 4.7 },
      { title: 'Python Practice Problems', provider: 'HackerRank', platform: 'HackerRank', url: 'https://www.hackerrank.com/domains/python', description: 'Hands-on Python exercises from beginner to advanced. Great for building problem-solving skills.', estimatedHours: 15, difficulty: 'intermediate', isFree: true, type: 'practice', skills: ['python'], rating: 4.6 },
    ],
    'machine-learning': [
      { title: 'Machine Learning Specialization', provider: 'Andrew Ng (Stanford/DeepLearning.AI)', platform: 'Coursera', url: 'https://www.coursera.org/specializations/machine-learning-introduction', description: "Andrew Ng's updated ML course. The gold standard for learning machine learning fundamentals.", estimatedHours: 70, difficulty: 'intermediate', isFree: false, type: 'course', skills: ['machine-learning', 'python'], rating: 4.9 },
      { title: 'fast.ai Practical Deep Learning for Coders', provider: 'Jeremy Howard', platform: 'fast.ai', url: 'https://course.fast.ai/', description: 'Top-down practical approach to deep learning. Free and used by professionals worldwide.', estimatedHours: 60, difficulty: 'intermediate', isFree: true, type: 'course', skills: ['machine-learning', 'deep-learning'], rating: 4.8 },
      { title: 'Kaggle ML Courses', provider: 'Kaggle', platform: 'Kaggle', url: 'https://www.kaggle.com/learn', description: 'Bite-sized interactive courses in ML, pandas, SQL, and more. Completely free with hands-on notebooks.', estimatedHours: 20, difficulty: 'beginner', isFree: true, type: 'course', skills: ['machine-learning', 'pandas'], rating: 4.7 },
    ],
    javascript: [
      { title: 'The Complete JavaScript Course 2024', provider: 'Jonas Schmedtmann', platform: 'Udemy', url: 'https://www.udemy.com/course/the-complete-javascript-course/', description: 'The most comprehensive JavaScript course from basics to advanced. Project-based learning.', estimatedHours: 69, difficulty: 'beginner', isFree: false, type: 'course', skills: ['javascript'], rating: 4.7 },
      { title: 'JavaScript Algorithms & Data Structures', provider: 'freeCodeCamp', platform: 'freeCodeCamp', url: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/', description: '300 hours of free interactive JavaScript challenges covering ES6, regex, debugging, and more.', estimatedHours: 30, difficulty: 'beginner', isFree: true, type: 'course', skills: ['javascript'], rating: 4.6 },
    ],
    sql: [
      { title: 'SQL for Data Science', provider: 'UC Davis', platform: 'Coursera', url: 'https://www.coursera.org/learn/sql-for-data-science', description: 'Learn SQL basics and data analysis techniques. Great starting point for data roles.', estimatedHours: 20, difficulty: 'beginner', isFree: false, type: 'course', skills: ['sql'], rating: 4.6 },
      { title: 'SQL Practice & Challenges', provider: 'LeetCode', platform: 'LeetCode', url: 'https://leetcode.com/problemset/database/', description: 'Practice SQL queries with real interview-style problems. Great for building query skills.', estimatedHours: 10, difficulty: 'intermediate', isFree: true, type: 'practice', skills: ['sql'], rating: 4.5 },
    ],
  };

  // Exact or strict prefix/word boundary match (prevent 'java' from matching 'javascript')
  if (categoryMap[id]) {
    return categoryMap[id];
  }

  for (const [key, recs] of Object.entries(categoryMap)) {
    if (id === key || (id.length > 4 && id.includes(key))) {
      return recs;
    }
  }

  // Generic fallback
  return [
    {
      title: `${skillName} — Complete Course`,
      provider: 'Various Instructors',
      platform: 'Coursera',
      url: `https://www.coursera.org/search?query=${encodeURIComponent(skillName)}`,
      description: `Comprehensive structured course to build ${skillName} skills from fundamentals to practical application.`,
      estimatedHours: 20,
      difficulty: 'intermediate',
      isFree: false,
      type: 'course',
      skills: [skillId],
      rating: 4.5,
    },
    {
      title: `${skillName} Free Tutorials & Projects`,
      provider: 'freeCodeCamp',
      platform: 'YouTube',
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skillName + ' tutorial freeCodeCamp')}`,
      description: `Free video tutorials, guided projects, and exercises to practice ${skillName} hands-on.`,
      estimatedHours: 8,
      difficulty: 'beginner',
      isFree: true,
      type: 'practice',
      skills: [skillId],
      rating: 4.4,
    },
    {
      title: `${skillName} — Kaggle Learn`,
      provider: 'Kaggle',
      platform: 'Kaggle',
      url: 'https://www.kaggle.com/learn',
      description: `Interactive Kaggle micro-courses and notebooks to apply ${skillName} on real datasets.`,
      estimatedHours: 6,
      difficulty: 'beginner',
      isFree: true,
      type: 'practice',
      skills: [skillId],
      rating: 4.5,
    },
  ];
}
