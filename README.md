# MADECC Group - Full-Stack Engineering Portal (100% Netlify + GitHub Optimized)

A high-performance, full-stack corporate engineering and scheduling portal built using **React 19 + Vite (Frontend)** and **Express + Drizzle ORM + PostgreSQL (Backend)**. Integrated with **Gemini AI** for virtual assistance, custom interactive document workflows, and SMTP notifications.

This codebase is optimized to run **completely on Netlify** using **Netlify Serverless Functions** for the Express backend and **Netlify CDN** for the React frontend. You do **not** need any other hosting provider (like Render, Railway, etc.)!

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to `.env` and fill in your credentials:
```bash
cp .env.example .env
```
*Make sure to configure your `DATABASE_URL` (PostgreSQL), `GEMINI_API_KEY` (AI Assistant), and SMTP credentials.*

### 3. Synchronize Database Schema
Synchronize the Drizzle ORM schemas with your PostgreSQL database:
```bash
npm run db:push
```

### 4. Seed Initial Data
Seed standard blog posts, banners, services, and categories:
```bash
npm run db:seed
```

### 5. Run Development Server
Start the Express server and Vite frontend compiler concurrently:
```bash
npm run dev
```
Open your browser at [http://localhost:3000](http://localhost:3000).

---

## 📦 Deploying to GitHub

To prepare this repository and push it to your GitHub account:

1. **Initialize Git Repository:**
   ```bash
   git init
   ```
2. **Add Files to Staging:**
   ```bash
   git add .
   ```
3. **Commit Changes:**
   ```bash
   git commit -m "Initial commit: prepared 100% full-stack app for Netlify"
   ```
4. **Create a Repository on GitHub** and link it to your local git:
   ```bash
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   ```
5. **Push Code to GitHub:**
   ```bash
   git push -u origin main
   ```

---

## ⚡ 100% Netlify Serverless Deployment (No Render Needed!)

This project is pre-configured to build the frontend and bundle the backend Express server as a Netlify Serverless Function automatically.

### How it works:
1. **Frontend Compilation:** Netlify runs `npm run build` to compile the Vite React app to static files in `dist/`.
2. **Backend Serverless Wrapping:** Netlify discovers `/netlify/functions/api.ts`, which uses `serverless-http` to wrap our Express app.
3. **Seamless Routing (`netlify.toml`):**
   - All `/api/*` traffic is routed internally directly to the Serverless Function.
   - All other routes fallback to `index.html` to support React Router SPA paths seamlessly, avoiding any `404 Not Found` errors on page refresh.

### Step-by-Step Deployment:
1. Go to your [Netlify Dashboard](https://netlify.com) and click **Add new site** -> **Import from GitHub**.
2. Select your repository.
3. Netlify will auto-detect the configuration settings from our pre-defined `netlify.toml`:
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
   - **Functions Directory:** `netlify/functions`
4. Under **Site Configuration** -> **Environment Variables**, click **Add Variable** and input:
   - `DATABASE_URL`: Your PostgreSQL (Neon/Supabase/ElephantSQL) database connection string.
   - `GEMINI_API_KEY`: Your Google Gemini API key.
   - `SMTP_USER` / `SMTP_PASS` / `SMTP_HOST` / `SMTP_PORT`: (Optional, for automatic email dispatch).
5. Click **Deploy**. Your 100% Netlify-hosted full-stack app is live!

---

## 🛠️ Project Scripts Reference

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts development server on port `3000` (Direct execution of `server.ts` via `tsx`) |
| `npm run build` | Compiles static frontend files and bundles the Express server to `dist/server.cjs` |
| `npm run start` | Runs the bundled production Express server from `dist/server.cjs` |
| `npm run db:push` | Pushes local database schemas to the remote database |
| `npm run db:seed` | Seeds the remote/local database with starter content |
| `npm run lint` | Runs TypeScript type verification checking for any build-time errors |
