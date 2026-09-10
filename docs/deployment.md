# Deployment Guide

## Overview

TaskFlow is designed as a single-service deployment. The Express server serves both the REST API and the built React client in production. This guide covers deploying to [Render](https://render.com), but the same principles apply to any Node.js hosting platform.

## Prerequisites

- A GitHub repository with the TaskFlow codebase
- A [MongoDB Atlas](https://www.mongodb.com/atlas) cluster (free tier works)
- A [Render](https://render.com) account

## Step 1: Set Up MongoDB Atlas

1. Create a free cluster on MongoDB Atlas
2. In **Database Access**, create a database user with read/write permissions
3. In **Network Access**, add `0.0.0.0/0` to the IP allowlist (or your Render service IP)
4. In **Database**, click **Connect** → **Connect your application** and copy the connection string
5. Replace `<password>` with your database user's password

The connection string format is:
```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
```

## Step 2: Configure Environment Variables

Create a `.env` file locally for reference (never commit this):

```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow?retryWrites=true&w=majority
JWT_SECRET=your-strong-random-secret-here-use-openssl-rand-base64-32
NODE_ENV=production
PORT=5000
CORS_ORIGIN=https://your-app.onrender.com
```

### Generating a JWT Secret

```bash
openssl rand -base64 32
```

## Step 3: Deploy to Render

### Option A: Blueprint (Recommended)

1. Ensure your repo has a `render.yaml` at the root (see below)
2. On Render, click **New** → **Blueprint**
3. Connect your GitHub repo
4. Render will detect the blueprint and create the service

**render.yaml:**
```yaml
services:
  - type: web
    name: taskflow
    runtime: node
    plan: free
    buildCommand: npm install && cd server && npm install && cd ../client && npm install && npm run build
    startCommand: cd server && npm start
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: NODE_ENV
        value: production
      - key: CORS_ORIGIN
        value: https://taskflow.onrender.com
```

### Option B: Manual Setup

1. On Render, click **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `taskflow`
   - **Runtime:** Node
   - **Build Command:**
     ```
     npm install && cd server && npm install && cd ../client && npm install && npm run build
     ```
   - **Start Command:**
     ```
     cd server && npm start
     ```
   - **Plan:** Free (or Starter for production)
4. Add environment variables in the **Environment** tab:
   - `MONGODB_URI` — Your MongoDB Atlas connection string
   - `JWT_SECRET` — Generated secret
   - `NODE_ENV` — `production`
   - `CORS_ORIGIN` — Your Render service URL (e.g., `https://taskflow.onrender.com`)
5. Click **Create Web Service**

## Step 4: Verify Deployment

1. Once the build completes, visit your Render URL
2. Test the health endpoint: `https://your-app.onrender.com/api/health`
3. Register a new account and verify all features work

## Production Build Process

When `NODE_ENV=production`:

1. The React client is built via `vite build` → outputs to `client/dist/`
2. Express serves `client/dist/` as static files
3. A catch-all route serves `index.html` for client-side routing (React Router)
4. All `/api/*` requests are handled by the Express API

```
Browser Request
    │
    ├── GET /api/health  → Express API handler
    ├── GET /api/todos   → Express API handler (auth middleware)
    └── GET /my-day      → Serves client/dist/index.html (React Router)
```

## Platform Alternatives

### Railway

Railway supports Node.js natively:

```bash
railway init
railway add MONGODB_URI="..."
railway add JWT_SECRET="..."
railway up
```

### Fly.io

```bash
fly launch
fly secrets set MONGODB_URI="..." JWT_SECRET="..."
fly deploy
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/
RUN npm install && cd server && npm install && cd ../client && npm install
COPY . .
RUN cd client && npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 5000
CMD ["node", "server/src/index.js"]
```

## Troubleshooting

### Build fails on Render

- Ensure `package.json` scripts are correct
- Check that all dependencies are in `dependencies` (not just `devDependencies`) for the server
- The client's `devDependencies` (like Vite) are only needed at build time

### CORS errors in production

- Set `CORS_ORIGIN` to your exact Render URL (including `https://`)
- Do not use `*` in production with credentials

### MongoDB connection refused

- Verify the Atlas IP allowlist includes `0.0.0.0/0`
- Check that the database user password is correct in the connection string
- Ensure the database name is specified in the URI

### Blank page after deploy

- Verify the build command includes `npm run build` for the client
- Check Render logs for any build errors
- Ensure `client/dist/` exists after build

## Performance Notes

- **Free tier services** spin down after inactivity; the first request may take 30-60 seconds
- **Starter plan** ($7/mo) keeps the service always on
- **MongoDB Atlas M10+** recommended for production with real data
- Consider adding a CDN (Cloudflare) for static asset caching
