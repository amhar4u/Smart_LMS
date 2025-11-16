# 🔧 Environment Configuration Guide

## 📋 Available Environments

Your Smart LMS frontend now supports **3 environments**:

### 1. **Development** (Default - Mixed)
- **File:** `src/environments/environment.ts`
- **API URL:** `http://localhost:3000/api`
- **Usage:** Default development with local backend
- **Command:** `npm start`

### 2. **Local** (Localhost Backend)
- **File:** `src/environments/environment.local.ts`
- **API URL:** `http://localhost:3000/api`
- **Usage:** Explicit local development
- **Command:** `npm run start:local`

### 3. **Production** (Live/Deployed)
- **File:** `src/environments/environment.prod.ts`
- **API URL:** `https://smart-lms-pqp2.onrender.com/api`
- **Usage:** Production build for Vercel
- **Command:** `npm run start:prod` (serve) or `npm run build:prod` (build)

---

## 🚀 How to Use

### Run with Local Backend (localhost:3000)
```bash
# Method 1: Default development
npm start

# Method 2: Explicit local
npm run start:local
```

### Run with Production Backend (Render)
```bash
npm run start:prod
```

### Build Commands
```bash
# Build for local
npm run build:local

# Build for production (Vercel deployment)
npm run build:prod
```

---

## 🎯 Current Setup

### Frontend URLs:
- **Local:** http://localhost:4200
- **Production:** https://smart-lms-e3fh.vercel.app

### Backend URLs:
- **Local:** http://localhost:3000/api
- **Production:** https://smart-lms-pqp2.onrender.com/api

---

## 📝 Environment Files Summary

| File | Environment | Backend URL | Production Flag |
|------|-------------|-------------|-----------------|
| `environment.ts` | Development | `http://localhost:3000/api` | `false` |
| `environment.local.ts` | Local | `http://localhost:3000/api` | `false` |
| `environment.prod.ts` | Production | `https://smart-lms-pqp2.onrender.com/api` | `true` |

---

## 🔄 Switching Between Environments

### During Development:

**Use Local Backend:**
```bash
npm run start:local
# or just
npm start
```

**Use Production Backend (for testing):**
```bash
npm run start:prod
```

### For Deployment:

Vercel automatically uses `environment.prod.ts` when building with:
```bash
ng build --configuration production
```

---

## ⚙️ Backend Setup Required

### For Local Development:
1. Start your local backend:
```bash
cd backend
npm start
```
2. Backend runs on `http://localhost:3000`
3. Frontend will connect automatically

### For Production:
- Backend already deployed on Render
- No local backend needed
- Just use `npm run start:prod`

---

## 🐛 Troubleshooting

### "Connection refused" error
- **Local:** Make sure backend is running (`npm start` in backend folder)
- **Production:** Check if Render backend is live

### CORS errors
- **Local:** Backend CORS already configured for `http://localhost:4200`
- **Production:** Backend needs `FRONTEND_URL=https://smart-lms-e3fh.vercel.app`

### Wrong API being called
- Check which command you're using
- Verify environment file is correct
- Clear browser cache and reload

---

## 📚 Quick Reference

```bash
# Local development (default)
npm start                    # Uses localhost:3000

# Explicit local
npm run start:local          # Uses localhost:3000

# Production testing
npm run start:prod           # Uses Render backend

# Production build
npm run build:prod           # For Vercel deployment
```

---

**Last Updated:** November 16, 2025
