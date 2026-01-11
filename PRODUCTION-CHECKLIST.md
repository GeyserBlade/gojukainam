# Production Readiness Checklist

Use this checklist to verify your application is ready for production deployment.

## ✅ Configuration Files Created

- [x] **backend/.env.example** - Template for production environment variables
- [x] **frontend/.env.production** - Production API URL configuration
- [x] **railway.json** - Railway deployment configuration
- [x] **backend/package.json** - Production scripts added (build, start, prisma:migrate)
- [x] **frontend/package.json** - Production scripts and `serve` package added
- [x] **backend/src/server.ts** - CORS configured with environment variable
- [x] **.gitignore** - Migrations no longer ignored (needed for production)

## 📋 Pre-Deployment Checklist

### Backend Configuration
- [ ] TypeScript compiles successfully (`cd backend && npm run build`)
- [ ] JWT_SECRET is set in production (NOT the dev default)
- [ ] DATABASE_URL points to production PostgreSQL
- [ ] NODE_ENV is set to "production"
- [ ] FRONTEND_URL matches your actual frontend Railway domain
- [ ] All Prisma migrations are committed to git

### Frontend Configuration
- [ ] Frontend builds successfully (`cd frontend && npm run build`)
- [ ] VITE_API_URL points to your backend Railway domain
- [ ] `serve` package is installed (`npm install serve`)

### Security
- [ ] JWT_SECRET is a strong random string (NOT "dev-secret-change-in-production")
- [ ] CORS origin is set to your actual frontend domain (NOT "*")
- [ ] Cookies are secure in production (httpOnly, secure, sameSite)
- [ ] No sensitive data in committed files
- [ ] .env files are in .gitignore

### Git Repository
- [ ] All code is committed
- [ ] Migrations are committed (NOT ignored)
- [ ] .env files are NOT committed
- [ ] Pushed to GitHub
- [ ] Repository connected to Railway

## 🔐 Generate Production Secrets

### Generate Strong JWT Secret

Use one of these methods:

**Option 1: OpenSSL (Linux/Mac/WSL)**
```bash
openssl rand -base64 32
```

**Option 2: Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option 3: PowerShell (Windows)**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

**Option 4: Online Tool**
Visit: https://randomkeygen.com/ (use "Fort Knox Passwords" section)

## 🚀 Railway Environment Variables

When deploying to Railway, set these in the **backend service**:

```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Link to your PostgreSQL service
JWT_SECRET=<your-generated-secret-here>
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-frontend-domain.railway.app
```

When deploying to Railway, set these in the **frontend service**:

```bash
VITE_API_URL=https://your-backend-domain.railway.app/api
```

## 🧪 Testing Before Deployment

### Test Backend Locally
```bash
cd backend
npm run build          # Should compile without errors
npm run start          # Should start the server
```

### Test Frontend Locally
```bash
cd frontend
npm run build          # Should create dist/ folder
npm run start          # Should serve the built app
```

### Test Database Migrations
```bash
cd backend
npm run prisma:migrate  # Should apply migrations
```

## 📦 Railway Deployment Steps

Follow the detailed guide in [DEPLOYMENT.md](DEPLOYMENT.md) for complete Railway setup.

### Quick Railway Setup Summary:

1. **Create Railway Project**
   - Sign in to railway.app with GitHub
   - Create new project from GitHub repo

2. **Add PostgreSQL Database**
   - Click "+ New" → Database → PostgreSQL
   - Note the connection details (postgresql://postgres:soXfNcBEswftwIYlhrrZfnBGvlWbLMuk@postgres.railway.internal:5432/railway)
   - docker container id: ca271e886764
   - CMD: docker exec -t ca271e886764 pg_dump -U postgres --clean --no-owner --no-privileges > clean_backup.sql
   - docker exec -it ca271e886764 psql -U postgres -l

3. **Deploy Backend Service**
   - Click "+ New" → GitHub Repo
   - Set root directory: `backend`
   - Set build command: `npm install && npx prisma generate && npm run build`
   - Set start command: `npm start`
   - Add environment variables (see above)
   - Link to PostgreSQL service

4. **Deploy Frontend Service**
   - Click "+ New" → GitHub Repo
   - Set root directory: `frontend`
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Add environment variables (see above)

5. **Generate Public Domains**
   - Go to each service → Networking → Generate Domain
   - Update FRONTEND_URL in backend service
   - Update VITE_API_URL in frontend service
   - Redeploy both services

6. **Run Database Migrations**
   ```bash
   railway run --service backend npm run prisma:migrate
   ```

7. **Create Superuser**
   ```bash
   railway run --service backend npm run prisma:seed
   railway run --service backend npm run superuser-recovery your-email@example.com
   ```

## 🔍 Post-Deployment Testing

- [ ] Frontend loads at Railway URL
- [ ] Backend health check responds: `https://your-backend.railway.app/api/health`
- [ ] Login page displays
- [ ] Can sign in with superuser account
- [ ] Dashboard loads after login
- [ ] Can create/edit users
- [ ] Can create/edit clubs
- [ ] Can create/edit athletes
- [ ] Password reset flow works
- [ ] No CORS errors in browser console
- [ ] No authentication errors

## 📊 Monitoring

Check Railway dashboards for:
- [ ] Build logs show successful compilation
- [ ] Runtime logs show no errors
- [ ] Database connection is successful
- [ ] CPU/Memory usage is normal
- [ ] No repeated crash/restart cycles

## 🐛 Common Issues

### Build Fails
- Check that all dependencies are in `dependencies`, not `devDependencies`
- Verify TypeScript compiles locally
- Check build logs for specific errors

### CORS Errors
- Verify FRONTEND_URL matches actual frontend domain
- Ensure `credentials: true` in CORS config
- Check frontend uses correct API URL

### Database Connection Fails
- Verify DATABASE_URL is correctly set
- Check PostgreSQL service is running
- Ensure backend service is linked to database

### Migrations Fail
- Ensure migrations are committed to git
- Check database permissions
- Try running migrations manually via Railway CLI

## 📝 Notes

- Railway automatically redeploys when you push to GitHub
- Use Railway CLI for advanced operations: `npm i -g @railway/cli`
- Monitor logs regularly for errors
- Set up database backups
- Keep dependencies updated

---

**Last Updated:** 2026-01-08
**Deployment Platform:** Railway.com
