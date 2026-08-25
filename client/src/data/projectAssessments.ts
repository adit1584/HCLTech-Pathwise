export interface ProjectMilestoneSpec {
  id: string;
  skillId: string;
  title: string;
  difficulty: 'Easy / Beginner' | 'Intermediate';
  estimatedHours: number;
  overview: string;
  requirements: string[];
  starterCode: {
    filename: string;
    language: string;
    content: string;
  }[];
  rubric: {
    criterion: string;
    points: number;
    description: string;
  }[];
  sampleSolutionGuide: string;
}

export const PROJECT_ASSESSMENTS: Record<string, ProjectMilestoneSpec> = {
  // ── SQL / Data Engineering Project ───────────────────────────────────────
  sql: {
    id: 'proj-sql-ecommerce',
    skillId: 'sql',
    title: 'E-Commerce Database Schema & Sales Analytics Engine',
    difficulty: 'Easy / Beginner',
    estimatedHours: 3,
    overview: 'Design and build a normalized relational database schema for an online store, populate it with mock transaction data, and write 3 analytical SQL queries to compute store metrics.',
    requirements: [
      'Create 3 normalized tables: customers, products, and orders with appropriate PRIMARY and FOREIGN keys.',
      'Insert at least 5 sample records per table to simulate realistic customer orders.',
      'Write Query 1: Calculate total revenue generated per product category.',
      'Write Query 2: Identify the top 3 highest-spending customers using SUM() and GROUP BY.',
      'Write Query 3: Find products that have never been ordered using a LEFT JOIN with IS NULL filter.',
    ],
    starterCode: [
      {
        filename: 'schema.sql',
        language: 'sql',
        content: `-- Step 1: Create normalized tables
CREATE TABLE customers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    customer_id INT REFERENCES customers(id),
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL DEFAULT 1,
    order_date DATE NOT NULL
);`,
      },
      {
        filename: 'analytics_queries.sql',
        language: 'sql',
        content: `-- Query 1: Revenue by Category
SELECT p.category, SUM(p.price * o.quantity) as total_revenue
FROM orders o
JOIN products p ON o.product_id = p.id
GROUP BY p.category
ORDER BY total_revenue DESC;

-- Query 2: Top Spending Customers
-- (Write your query here)

-- Query 3: Unsold Products
-- (Write your query here)`,
      },
    ],
    rubric: [
      { criterion: 'Schema Design & Relational Constraints', points: 30, description: 'Primary and foreign keys correctly defined without data anomalies.' },
      { criterion: 'Data Insertion & Integrity', points: 20, description: 'Sample dataset populated with consistent referential integrity.' },
      { criterion: 'Analytical Aggregations (GROUP BY & Joins)', points: 30, description: 'Correct SQL aggregation logic computing revenue and top customers.' },
      { criterion: 'Edge Case & Unsold Products Query', points: 20, description: 'Correct LEFT JOIN / NOT EXISTS filter identifying zero-order products.' },
    ],
    sampleSolutionGuide: 'Use standard PostgreSQL or SQLite syntax. Ensure foreign keys cascade appropriately and test all queries against sample rows.',
  },

  // ── Python Project ───────────────────────────────────────────────────────
  python: {
    id: 'proj-python-parser',
    skillId: 'python',
    title: 'CLI Sales Data Analyzer & Report Generator',
    difficulty: 'Easy / Beginner',
    estimatedHours: 3,
    overview: 'Build a standalone Python script that reads CSV transaction logs, cleans corrupt/missing numerical values, computes key business KPIs (Mean, Median, Top Segment), and outputs a summary report.',
    requirements: [
      'Accept a CSV file input via standard Python file handling or the csv module.',
      'Handle missing or malformed numbers gracefully using try/except blocks.',
      'Compute total revenue, average order value (AOV), and median purchase price.',
      'Generate a clean formatted text report summary and export it to report.txt.',
      'Write modular functions with docstrings and type hints.',
    ],
    starterCode: [
      {
        filename: 'analyzer.py',
        language: 'python',
        content: `import csv
from typing import List, Dict, Any

def parse_transactions(filepath: str) -> List[Dict[str, Any]]:
    """Reads and cleans raw CSV transaction records."""
    valid_records = []
    with open(filepath, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                # Convert numbers safely
                amount = float(row.get('amount', 0))
                valid_records.append({
                    'id': row.get('id'),
                    'customer': row.get('customer'),
                    'amount': amount,
                    'category': row.get('category', 'General')
                })
            except (ValueError, TypeError):
                continue # Skip corrupt rows
    return valid_records

def generate_kpis(records: List[Dict[str, Any]]) -> Dict[str, float]:
    """Computes total, average, and max transaction metrics."""
    if not records:
        return {'total': 0.0, 'avg': 0.0, 'count': 0}
    amounts = [r['amount'] for r in records]
    return {
        'total': sum(amounts),
        'avg': sum(amounts) / len(amounts),
        'count': len(amounts)
    }

if __name__ == '__main__':
    # Test your implementation here
    pass`,
      },
    ],
    rubric: [
      { criterion: 'File I/O & Exception Handling', points: 30, description: 'Safely parses files and ignores corrupted rows without crashing.' },
      { criterion: 'Mathematical Aggregations', points: 30, description: 'Accurately computes total, mean, and count metrics.' },
      { criterion: 'Code Structure & Type Hints', points: 20, description: 'Clean modular functions with clear naming and typing.' },
      { criterion: 'Report Output Formatting', points: 20, description: 'Generates structured report summary text.' },
    ],
    sampleSolutionGuide: 'Test your script with a sample CSV of 10 rows including one invalid row with letters in the price field.',
  },

  // ── JavaScript / Node.js Project ─────────────────────────────────────────
  javascript: {
    id: 'proj-node-api',
    skillId: 'javascript',
    title: 'RESTful Task Management API with Express & JSON Storage',
    difficulty: 'Easy / Beginner',
    estimatedHours: 4,
    overview: 'Build a lightweight REST API server using Express.js providing full CRUD operations (Create, Read, Update, Delete) for tasks with input validation and in-memory persistence.',
    requirements: [
      'Create Express server listening on port 3000 with express.json() middleware.',
      'Implement GET /api/tasks — Return list of all tasks with optional status filter.',
      'Implement POST /api/tasks — Create a task with title, description, and auto-generated UUID/ID.',
      'Implement PUT /api/tasks/:id — Update completion status or title.',
      'Implement DELETE /api/tasks/:id — Remove task and return HTTP 204/200.',
      'Add error handling middleware for invalid payloads and 404 Not Found.',
    ],
    starterCode: [
      {
        filename: 'server.js',
        language: 'javascript',
        content: `const express = require('express');
const app = express();
app.use(express.json());

// In-memory tasks database
let tasks = [
  { id: '1', title: 'Setup Development Environment', completed: true },
  { id: '2', title: 'Build Express API Routes', completed: false }
];

// GET /api/tasks
app.get('/api/tasks', (req, res) => {
  const { completed } = req.query;
  if (completed !== undefined) {
    const isComp = completed === 'true';
    return res.json(tasks.filter(t => t.completed === isComp));
  }
  res.json(tasks);
});

// POST /api/tasks
app.post('/api/tasks', (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newTask = {
    id: Date.now().toString(),
    title: title.trim(),
    completed: false
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// TODO: Implement PUT /api/tasks/:id and DELETE /api/tasks/:id

const PORT = 3000;
app.listen(PORT, () => console.log(\`Server listening on http://localhost:\${PORT}\`));`,
      },
    ],
    rubric: [
      { criterion: 'CRUD Route Implementations', points: 40, description: 'All 4 REST verbs (GET, POST, PUT, DELETE) functional.' },
      { criterion: 'Input Validation & HTTP Status Codes', points: 30, description: 'Returns proper 200, 201, 400, 404 response codes.' },
      { criterion: 'Query Parameter Filtering', points: 15, description: 'Supports filtering tasks by completed status.' },
      { criterion: 'Clean Architecture & Middleware', points: 15, description: 'Proper Express middleware organization and error handling.' },
    ],
    sampleSolutionGuide: 'Use curl, Postman, or ThunderClient to verify all 4 HTTP endpoints before submitting.',
  },

  // ── React Project ────────────────────────────────────────────────────────
  react: {
    id: 'proj-react-kanban',
    skillId: 'react',
    title: 'Interactive Kanban Task Board with LocalStorage Persistence',
    difficulty: 'Easy / Beginner',
    estimatedHours: 4,
    overview: 'Build a responsive React component for a Kanban-style task board with columns (To Do, In Progress, Done), task creation modal, drag or click status transitions, and automatic localStorage persistence.',
    requirements: [
      'Manage tasks state using useState or useReducer hooks.',
      'Persist all tasks to browser localStorage with useEffect synchronization.',
      'Allow users to add new tasks with a title and difficulty tag.',
      'Allow moving tasks across columns (To Do -> In Progress -> Done).',
      'Provide task deletion and quick search filter by keyword.',
    ],
    starterCode: [
      {
        filename: 'KanbanBoard.jsx',
        language: 'jsx',
        content: `import React, { useState, useEffect } from 'react';

const INITIAL_COLUMNS = ['To Do', 'In Progress', 'Done'];

export function KanbanBoard() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('kanban_tasks');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Learn React Hooks', column: 'Done' },
      { id: '2', title: 'Build Project Assessment', column: 'In Progress' }
    ];
  });

  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    localStorage.setItem('kanban_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const addTask = (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTasks(prev => [
      ...prev,
      { id: Date.now().toString(), title: newTaskTitle.trim(), column: 'To Do' }
    ]);
    setNewTaskTitle('');
  };

  const moveTask = (id, newColumn) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, column: newColumn } : t));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Project Kanban Board</h1>
      {/* Implement board columns and task cards here */}
    </div>
  );
}`,
      },
    ],
    rubric: [
      { criterion: 'State Management & React Hooks', points: 35, description: 'Correct usage of useState, useEffect, and immutable state updates.' },
      { criterion: 'LocalStorage Persistence', points: 25, description: 'Seamlessly persists and reloads task records across page refreshes.' },
      { criterion: 'Column Progression Logic', points: 25, description: 'Allows intuitive transitions between To Do, In Progress, and Done.' },
      { criterion: 'UI Design & Responsive Layout', points: 15, description: 'Clean styling and intuitive user interaction.' },
    ],
    sampleSolutionGuide: 'Test adding, moving, and deleting tasks, and verify they remain intact after refreshing the browser.',
  },

  // ── Machine Learning Project ─────────────────────────────────────────────
  'machine-learning': {
    id: 'proj-ml-churn',
    skillId: 'machine-learning',
    title: 'Customer Churn Classification & Evaluation Pipeline',
    difficulty: 'Easy / Beginner',
    estimatedHours: 4,
    overview: 'Build an end-to-end Python ML pipeline using Scikit-Learn to preprocess tabular customer data, train a classification model (Logistic Regression & Random Forest), evaluate performance with ROC-AUC & F1-Score, and report top predictive features.',
    requirements: [
      'Load tabular dataset and perform train/test split (80/20) with random_state.',
      'Handle categorical features using OneHotEncoder or OrdinalEncoder.',
      'Scale numerical features using StandardScaler inside a Scikit-Learn Pipeline.',
      'Train both LogisticRegression and RandomForestClassifier models.',
      'Evaluate with Confusion Matrix, Precision, Recall, and ROC-AUC score.',
      'Print top 3 most influential predictive features.',
    ],
    starterCode: [
      {
        filename: 'churn_pipeline.py',
        language: 'python',
        content: `import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score
from sklearn.pipeline import Pipeline

def run_ml_pipeline(df: pd.DataFrame):
    # 1. Feature & Target separation
    X = df.drop(columns=['churn'])
    y = df['churn']

    # 2. Split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 3. Create Pipeline
    pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
    ])

    # 4. Train
    pipe.fit(X_train, y_train)

    # 5. Evaluate
    y_pred = pipe.predict(X_test)
    y_prob = pipe.predict_proba(X_test)[:, 1]

    print("=== Classification Report ===")
    print(classification_report(y_test, y_pred))
    print(f"ROC-AUC Score: {roc_auc_score(y_test, y_prob):.4f}")

    return pipe`,
      },
    ],
    rubric: [
      { criterion: 'Data Preprocessing & Train/Test Split', points: 30, description: 'Proper stratification and preprocessing without data leakage.' },
      { criterion: 'Scikit-Learn Pipeline Construction', points: 30, description: 'Clean encapsulated Pipeline combining scaler and estimator.' },
      { criterion: 'Comprehensive Metric Evaluation', points: 25, description: 'Evaluates with ROC-AUC, F1, and Precision/Recall rather than accuracy alone.' },
      { criterion: 'Code Cleanliness & Documentation', points: 15, description: 'Clean modular script with reproducible seeds.' },
    ],
    sampleSolutionGuide: 'Execute your script against sample customer data and verify ROC-AUC score exceeds 0.80.',
  },
};

export function getProjectSpecForSkill(skillId: string, title?: string): ProjectMilestoneSpec {
  const norm = (skillId || '').toLowerCase().trim();
  const titleNorm = (title || '').toLowerCase().trim();

  // 1. Direct match in project catalog
  if (PROJECT_ASSESSMENTS[norm]) {
    return PROJECT_ASSESSMENTS[norm];
  }

  // 2. Key substring match
  for (const [key, spec] of Object.entries(PROJECT_ASSESSMENTS)) {
    if (norm.includes(key) || key.includes(norm) || titleNorm.includes(key)) {
      return spec;
    }
  }

  // 3. Topic and keyword associations
  if (titleNorm.includes('sql') || titleNorm.includes('database') || titleNorm.includes('analytics') || titleNorm.includes('milestone 1') || norm.includes('milestone-1')) {
    return PROJECT_ASSESSMENTS.sql;
  }
  if (titleNorm.includes('python') || titleNorm.includes('etl') || titleNorm.includes('pipeline') || titleNorm.includes('milestone 2') || norm.includes('milestone-2')) {
    return PROJECT_ASSESSMENTS.python;
  }
  if (titleNorm.includes('api') || titleNorm.includes('node') || titleNorm.includes('javascript') || titleNorm.includes('express') || titleNorm.includes('milestone 3') || norm.includes('milestone-3')) {
    return PROJECT_ASSESSMENTS.javascript;
  }
  if (titleNorm.includes('ml') || titleNorm.includes('learn') || titleNorm.includes('model') || titleNorm.includes('churn') || titleNorm.includes('milestone 4') || norm.includes('milestone-4')) {
    return PROJECT_ASSESSMENTS['machine-learning'];
  }
  if (titleNorm.includes('react') || titleNorm.includes('kanban') || titleNorm.includes('frontend')) {
    return PROJECT_ASSESSMENTS.react;
  }

  // Default to real SQL project
  return PROJECT_ASSESSMENTS.sql;
}
