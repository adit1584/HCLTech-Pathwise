# 🚀 Pathwise Deployment Guide

This guide details how to deploy Pathwise (Frontend & Backend) to free, production-grade cloud hosts (**Vercel** + **Render** / **Railway**).

---

## 🏗️ Architecture Overview

| Component | Framework / Tech | Recommended Platform |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Tailwind CSS | **Vercel** (or Netlify) |
| **Backend** | Express + TypeScript + Mongoose + Groq AI | **Render** (or Railway) |
| **Database** | MongoDB Atlas Cloud Database | **MongoDB Atlas** |

---

## 1️⃣ Step 1: Deploy Backend to Render (Free Web Service)

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** $\to$ **Web Service**.
2. Connect your GitHub repository: `https://github.com/adit1584/HCLTech-Hackathon`.
3. Configure the service:
   - **Name:** `pathwise-server`
   - **Root Directory:** `server`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add **Environment Variables** under the **Environment** tab:
   ```env
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=your_jwt_secret_key_minimum_8_chars
   JWT_EXPIRES_IN=7d
   GROQ_API_KEY=your_groq_api_key_here
   GROQ_MODEL=llama-3.3-70b-versatile
   CLIENT_URL=*
   ```
5. Click **Create Web Service**.
6. Copy your live backend URL (e.g. `https://pathwise-server.onrender.com`).

---

## 2️⃣ Step 2: Deploy Frontend to Vercel (Free)

1. Go to [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
2. Select your repository: `HCLTech-Hackathon`.
3. Configure the project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add **Environment Variables**:
   ```env
   VITE_API_URL=https://pathwise-server.onrender.com
   ```
   *(Replace with your actual Render URL from Step 1)*
5. Click **Deploy**.
6. Vercel will build and assign you a live production URL (e.g. `https://pathwise.vercel.app`).

---

## 3️⃣ Step 3: Connect Frontend URL to Backend CORS (Optional Polish)

In your Render backend settings, update `CLIENT_URL` with your exact Vercel frontend URL:
```env
CLIENT_URL=https://pathwise.vercel.app
```

---

## ✅ Deployment Verification Checklist

- [x] **Client Build Verified**: `npm run build` in `client` passes with 0 errors.
- [x] **Server Build Verified**: `npm run build` in `server` passes with 0 errors.
- [x] **SPA Routing**: `client/vercel.json` rewrites all direct URLs (`/dashboard`, `/roadmap`, `/practice`, `/profile`) to `/index.html`.
- [x] **Dynamic API Endpoint**: `VITE_API_URL` dynamically configures the base URL for production.
- [x] **Permissive CORS**: Handles Vercel production and preview deployments automatically.
