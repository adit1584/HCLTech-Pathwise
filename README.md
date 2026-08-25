# Pathwise — Personalized Learning Intelligence

[![HCLTech Hackathon](https://img.shields.io/badge/HCLTech-AI%20Hackathon%202026-blue?style=for-the-badge)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3%2070B-F55036?style=for-the-badge)](https://groq.com/)

> **HCLTech AI Challenge Prototype**  
> **Core Proposition:** Pathwise does not merely recommend courses. It understands a learner's goal, measures their current capability, identifies high-value skill gaps, constructs a prerequisite-aware learning path via DAG optimization, and continuously recompiles that path as new evidence arrives.

---

## 📁 Repository Structure

```text
HCLTech-Hackathon/
├── client/                     # Frontend Application (React + Vite + TypeScript)
│   ├── public/                 # Static assets
│   ├── src/                    # Components, pages, hooks, DAG canvas, services
│   └── package.json
├── server/                     # Backend API & Engine (Express + TypeScript + MongoDB)
│   ├── src/
│   │   ├── engine/             # Graph analysis, DAG recompiler, priority formula
│   │   ├── models/             # Mongoose schemas (Learners, Skills, Roadmap, Events)
│   │   ├── routes/             # REST endpoints (auth, learner, graph, simulation, AI)
│   │   └── services/           # Groq LLM service & deterministic compiler
│   └── package.json
├── data/                       # Pre-seeded JSON catalogs (skills, roles, resources)
├── docs/                       # Technical Specifications & Architecture Documentation
│   ├── PATHWISE_ARCHITECTURE.md
│   └── PATHWISE_MASTER_PROMPT.md
├── .env.example                # Sanitized template for environment variables
├── .gitignore                  # Production-grade git exclusion rules
├── package.json                # Root orchestration scripts
└── README.md                   # Project documentation
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js**: v18+
- **MongoDB Atlas** (or local MongoDB)
- **Groq API Key** (`llama-3.3-70b-versatile`)

### 2. Environment Configuration
Create your local `.env` from the provided template:
```bash
cp .env.example .env
```
*(Populate `.env` with your MongoDB URI, JWT secret, and Groq API key as indicated in `.env.example`)*

### 3. Installation & Database Seeding
Run from the root directory:
```bash
# Install root dependencies
npm install

# Install server dependencies & seed demo database
cd server && npm install && npm run seed && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

### 4. Running the Application
You can run both client and server simultaneously from the root:
```bash
npm run dev
```
- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:3001](http://localhost:3001)

---

## 🌟 The Golden Demo Walkthrough

1. **1-Click Demo Login:** Click **"Demo as Alex"** on the landing screen.
   - Profile: Mid-level Python dev aiming to become a **Data Scientist** in 6 months at 8 hrs/week.
2. **Deterministic Priority Engine:**
   - Notice **"Your Next Best Action"** (e.g., SQL Data Challenge).
   - Click **"Inspect Trace"** to view live mathematical parameter breakdowns.
3. **Interactive 2D Prerequisite Graph:**
   - Navigate to `/skill-graph` to explore skill mastery DAG states.
4. **Adaptive Recompilation in Action:**
   - Complete an assessment in `/practice` or `/roadmap`.
   - Observe the **"Learning Path Recompiled"** event updating milestone queues and downstream unlock values.
5. **Context-Aware AI Assistant:**
   - Ask the AI assistant: *"Why did my roadmap change?"*
   - Explains the exact DAG recomputation without hallucinations.
6. **What-If Scenario Simulator:**
   - Adjust weekly commitment in `/simulator` to observe timeline compression.

---

## 🏗️ Architecture & Compiler Pipeline

```text
Natural-Language Goal (Lexer)
         ↓
Learner Model & State (Symbol Table)
         ↓
Semantic Skill Diff (Semantic Diff)
         ↓
Prerequisite-Aware Optimizer (Optimizer)
         ↓
Roadmap & Resource Catalog (Code Generation)
         ↓
Auditable Trace (Debugger)
         ↓
Learner Events & Evidence → Incremental Recompilation (Recompiler)
```

### Non-Negotiable Architecture Rule
- **Groq LLM**: Strictly for semantic natural-language intent parsing and contextual conversational feedback.
- **Deterministic Learning Engine**: Computes exact skill gaps, topological graph sorting, unlock values, and mathematical priority traces.

---

## 📊 Auditable Priority Formula

$$\text{Priority Score} = \frac{\text{Gap} \times \text{Role Importance} \times \text{Skill Centrality} \times \text{Unlock Value} \times \text{Goal Relevance}}{\text{Learning Cost}}$$

Every recommendation provides a full mathematical trace showing why it was prioritized and why alternatives were deferred.

---

## 📚 Documentation
- [System Architecture](docs/PATHWISE_ARCHITECTURE.md)

