# Production Deployment Guide

Complete guide to deploying the Karate Championships Management System to production using Railway.

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Prepare Your Code for Production](#prepare-your-code-for-production)
3. [Set Up GitHub Repository](#set-up-github-repository)
4. [Deploy to Railway](#deploy-to-railway)
5. [Configure Environment Variables](#configure-environment-variables)
6. [Database Setup](#database-setup)
7. [Build and Deploy](#build-and-deploy)
8. [Post-Deployment Configuration](#post-deployment-configuration)
9. [Testing Your Deployment](#testing-your-deployment)
10. [Monitoring and Maintenance](#monitoring-and-maintenance)

---

## Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] GitHub account with a repository for your project
- [ ] Railway account (sign up at https://railway.app)
- [ ] Railway CLI installed (optional but recommended): `npm i -g @railway/cli`
- [ ] All code committed to your repository
- [ ] Production-ready configuration files
- [ ] Strong passwords generated for production secrets

---

## Prepare Your Code for Production

### Step 1: Create Production Configuration Files

#### 1.1 Backend: Create `railway.json` (if needed)

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 1.2 Backend: Update `package.json` Scripts

Add a production start script to `backend/package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:seed": "tsx prisma/seed.ts",
    "prisma:migrate": "prisma migrate deploy",
    "prisma:studio": "prisma studio",
    "superuser-recovery": "tsx scripts/superuser-recovery.ts"
  }
}
```

**Note:** If you're using `tsx` in production (not recommended but works), change start to:
```json
"start": "tsx src/server.ts"
```

#### 1.3 Backend: Create `.env.example`

Create `backend/.env.example` with template variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Node Environment
NODE_ENV=production

# Server Port
PORT=4000

# Frontend URL (for CORS)
FRONTEND_URL=https://your-app.railway.app
```

#### 1.4 Frontend: Create `.env.production`

Create `frontend/.env.production`:

```env
VITE_API_URL=https://your-backend.railway.app/api
```

#### 1.5 Update CORS Configuration

Update `backend/src/server.ts` to use environment variable for CORS:

```typescript
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
```

#### 1.6 Create `.gitignore` (if not exists)

Ensure both backend and frontend have proper `.gitignore`:

**Backend `.gitignore`:**
```
node_modules/
dist/
.env
*.log
.DS_Store
```

**Frontend `.gitignore`:**
```
node_modules/
dist/
.env.local
.env.production.local
*.log
.DS_Store
```

---

## Set Up GitHub Repository

### Step 1: Initialize Git (if not done)

```bash
git init
git add .
git commit -m "Initial commit: Karate Championships Management System"
```

### Step 2: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `gojukainam`)
3. Choose **Private** or **Public**
4. Do NOT initialize with README (you already have code)

### Step 3: Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/gojukainam.git
git branch -M main
git push -u origin main
```

### Step 4: Verify Push

Check your GitHub repository to ensure all files are uploaded correctly.

---

## Deploy to Railway

### Overview

You'll deploy **two services** on Railway:
1. **Backend API** (Node.js + Express + Prisma)
2. **Frontend** (React + Vite)
3. **PostgreSQL Database** (automatically provisioned)

### Step 1: Sign Up / Log In to Railway

1. Go to https://railway.app
2. Click "Login" and authenticate with GitHub
3. Authorize Railway to access your repositories

### Step 2: Create a New Project

1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `gojukainam` repository
4. Railway will detect your services

### Step 3: Set Up PostgreSQL Database

#### 3.1 Add Database Service

1. In your Railway project, click "+ New"
2. Select "Database"
3. Choose "PostgreSQL"
4. Railway will provision a PostgreSQL instance

#### 3.2 Note Database Connection Details

Railway automatically creates these environment variables for your database service:
- `DATABASE_URL` - Full connection string
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`

---

## Configure Backend Service

### Step 1: Deploy Backend

1. In Railway project, click "+ New"
2. Select "GitHub Repo"
3. Choose your repository
4. Railway will detect it as a Node.js project

### Step 2: Configure Build Settings

1. Go to your backend service settings
2. **Root Directory**: Set to `backend`
3. **Build Command**: `npm install && npx prisma generate && npm run build` (if using TypeScript)
   - OR `npm install && npx prisma generate` (if using tsx)
4. **Start Command**: `npm start`
5. **Watch Paths**: `backend/**`

### Step 3: Set Environment Variables

Go to your backend service → Variables tab and add:

#### Required Variables:

```bash
# Database (link to your PostgreSQL service)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secret - GENERATE A STRONG RANDOM STRING
JWT_SECRET=<generate-a-strong-random-key-here>

# Node Environment
NODE_ENV=production

# Port (Railway auto-assigns, but you can set default)
PORT=4000

# Frontend URL (you'll update this after frontend deploys)
FRONTEND_URL=https://your-frontend-domain.railway.app
```

#### Generate Strong JWT Secret:

```bash
# On Linux/Mac:
openssl rand -base64 32

# OR use Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# OR online: https://randomkeygen.com/
```

### Step 4: Link Database to Backend

1. In backend service settings
2. Go to "Service Variables"
3. Click "Reference" and select your PostgreSQL service
4. Add reference: `${{Postgres.DATABASE_URL}}`

### Step 5: Run Database Migrations

#### Option A: Using Railway CLI (Recommended)

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run migrations
railway run --service backend npm run prisma:migrate
```

#### Option B: Using Railway Dashboard

1. Go to backend service settings
2. Click "Deploy"
3. After deployment, go to "Logs"
4. Ensure migrations run automatically (if configured in build command)

#### Option C: Add Migration to Build Script

Update `backend/package.json`:

```json
{
  "scripts": {
    "build": "npx prisma migrate deploy && tsc",
    "start": "node dist/server.js"
  }
}
```

---

## Configure Frontend Service

### Step 1: Deploy Frontend

1. In Railway project, click "+ New"
2. Select "GitHub Repo"
3. Choose your repository again (for frontend)

### Step 2: Configure Build Settings

1. Go to frontend service settings
2. **Root Directory**: Set to `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npx serve -s dist -l $PORT`
5. **Watch Paths**: `frontend/**`

### Step 3: Install `serve` Package

Add to `frontend/package.json`:

```json
{
  "dependencies": {
    "serve": "^14.2.1"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "start": "serve -s dist -l $PORT"
  }
}
```

Commit and push:

```bash
cd frontend
npm install serve --save
cd ..
git add .
git commit -m "Add serve for production frontend"
git push
```

### Step 4: Set Environment Variables

Go to frontend service → Variables tab:

```bash
# Backend API URL (use your backend Railway URL)
VITE_API_URL=https://your-backend-service.railway.app/api
```

### Step 5: Update Backend CORS

Now that you know your frontend URL:

1. Go to backend service → Variables
2. Update `FRONTEND_URL` to your actual frontend Railway URL
3. Example: `https://gojukainam-frontend.railway.app`

---

## Generate Domain Names

### Step 1: Generate Public URLs

Railway automatically assigns domains to your services:

1. Go to each service settings
2. Click "Networking"
3. Click "Generate Domain"
4. Railway will create a URL like: `https://servicename-production-xxxx.up.railway.app`

### Step 2: Update Cross-References

Now update the environment variables with actual URLs:

**Backend Service:**
```bash
FRONTEND_URL=https://your-actual-frontend-domain.railway.app
```

**Frontend Service:**
```bash
VITE_API_URL=https://your-actual-backend-domain.railway.app/api
```

### Step 3: Trigger Redeployment

After updating environment variables:
1. Go to each service
2. Click "Deploy" → "Redeploy"
3. OR push a new commit to trigger automatic deployment

---

## Custom Domain (Optional)

### Step 1: Add Custom Domain

1. Go to service settings → Networking
2. Click "Custom Domain"
3. Add your domain (e.g., `karate.example.com`)

### Step 2: Configure DNS

Add a CNAME record to your domain:

```
Type: CNAME
Name: karate (or @ for root domain)
Value: your-service.railway.app
```

### Step 3: SSL Certificate

Railway automatically provisions SSL certificates via Let's Encrypt.

---

## Seed Initial Data

### Step 1: Create Superuser Account

Using Railway CLI:

```bash
railway run --service backend npm run prisma:seed
```

OR manually create a superuser using Prisma Studio:

```bash
railway run --service backend npx prisma studio
```

### Step 2: Set Superuser Password

After deployment, use the superuser recovery script:

```bash
railway run --service backend npm run superuser-recovery your-email@example.com
```

Copy the recovery link from the logs and use it to set your password.

---

## Security Hardening

### Step 1: Environment Variables Checklist

Ensure all sensitive variables are set:

- [ ] `JWT_SECRET` - Strong random string (not default)
- [ ] `DATABASE_URL` - Secured PostgreSQL connection
- [ ] `NODE_ENV` - Set to `production`
- [ ] `FRONTEND_URL` - Correct frontend domain

### Step 2: Enable HTTPS-Only Cookies

Verify `backend/src/routes/auth.ts`:

```typescript
const IS_PROD = process.env.NODE_ENV === "production";

res.cookie(COOKIE_NAME, token, {
  httpOnly: true,
  secure: IS_PROD,  // ✓ Ensures HTTPS in production
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

### Step 3: Update CORS to Specific Domain

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL, // Not "*"
  credentials: true,
}));
```

### Step 4: Rate Limiting (Recommended)

Install `express-rate-limit`:

```bash
cd backend
npm install express-rate-limit
```

Add to `backend/src/server.ts`:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later.'
});

// Apply to auth routes
app.use('/api/auth', limiter);
```

---

## Testing Your Deployment

### Step 1: Access Your Application

1. Open your frontend Railway URL
2. You should see the sign-in page

### Step 2: Test Authentication

1. Click "Forgot password?"
2. Enter your superuser email
3. Check Railway logs for the reset link
4. Set your password
5. Sign in with email/password

### Step 3: Test Core Features

- [ ] Sign in works
- [ ] Dashboard loads
- [ ] Create/edit users
- [ ] Create/edit clubs
- [ ] Create/edit athletes
- [ ] Admin password management works

### Step 4: Check Logs

Monitor Railway logs for errors:

1. Go to service → Logs
2. Watch for any error messages
3. Fix issues and redeploy

---

## Monitoring and Maintenance

### Step 1: Set Up Monitoring

Railway provides built-in monitoring:
- CPU usage
- Memory usage
- Network traffic
- Build logs
- Runtime logs

### Step 2: Set Up Alerts (Optional)

Configure alerts for:
- Service crashes
- High error rates
- High resource usage

### Step 3: Database Backups

Railway automatically backs up PostgreSQL databases.

To create manual backup:
1. Go to PostgreSQL service
2. Click "Data"
3. Export database

### Step 4: Update Application

To deploy updates:

```bash
git add .
git commit -m "Your update message"
git push
```

Railway automatically redeploys on push to main branch.

---

## Troubleshooting

### Issue: Build Fails

**Solution:**
1. Check Railway logs for error details
2. Verify `package.json` scripts are correct
3. Ensure all dependencies are in `dependencies`, not `devDependencies`

### Issue: Database Connection Error

**Solution:**
1. Verify `DATABASE_URL` is correctly set
2. Check PostgreSQL service is running
3. Ensure backend service is linked to database

### Issue: CORS Errors

**Solution:**
1. Verify `FRONTEND_URL` matches actual frontend domain
2. Ensure `credentials: true` in CORS config
3. Check frontend is using correct API URL

### Issue: Password Reset Not Working

**Solution:**
1. Check backend logs for reset token
2. In production, implement email sending (e.g., SendGrid, AWS SES)
3. For now, use admin "Reset Link" button to generate tokens

### Issue: Cookie Not Setting

**Solution:**
1. Ensure `secure: true` in production
2. Verify both frontend and backend use HTTPS
3. Check `sameSite` cookie attribute

---

## Email Integration (Future Enhancement)

For production password resets, integrate email service:

### Option 1: SendGrid

```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// In requestPasswordReset:
await sgMail.send({
  to: email,
  from: 'noreply@yourdomain.com',
  subject: 'Password Reset',
  html: `Click here to reset: <a href="${resetLink}">${resetLink}</a>`
});
```

### Option 2: AWS SES
### Option 3: Resend
### Option 4: Mailgun

---

## Cost Optimization

### Railway Pricing Tiers

- **Free Trial**: $5 credit per month
- **Hobby Plan**: $5/month per user
- **Pro Plan**: Pay-as-you-go

### Tips to Reduce Costs

1. Use Railway's free trial for testing
2. Optimize database queries
3. Enable service sleeping for development environments
4. Use smaller resource allocations initially
5. Monitor usage dashboard

---

## Checklist: Pre-Production Launch

- [ ] All environment variables configured
- [ ] JWT_SECRET is strong and unique
- [ ] Database migrations applied
- [ ] Superuser account created and password set
- [ ] CORS configured with actual frontend domain
- [ ] HTTPS enforced for cookies
- [ ] Test all authentication flows
- [ ] Test password reset flow
- [ ] Test admin password management
- [ ] Monitor logs for errors
- [ ] Database backups enabled
- [ ] Custom domain configured (optional)
- [ ] Email service integrated (recommended)
- [ ] Rate limiting enabled
- [ ] Security review completed

---

## Support and Documentation

- **Railway Docs**: https://docs.railway.app
- **Railway Discord**: https://discord.gg/railway
- **Prisma Docs**: https://www.prisma.io/docs
- **Express Docs**: https://expressjs.com

---

## Conclusion

Your Karate Championships Management System is now deployed to production! 🎉

Remember to:
- Regularly monitor logs
- Keep dependencies updated
- Backup database regularly
- Test new features in development first
- Use the superuser recovery script if you lose access

For any issues, check the troubleshooting section or Railway logs.
