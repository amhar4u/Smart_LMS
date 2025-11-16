# 🚀 Vercel Frontend Deployment Guide - Smart LMS

## 📋 Complete Deployment Checklist

### ✅ Step 1: Build Command Configuration

**In Vercel Dashboard - Build and Output Settings:**

| Setting | Value |
|---------|-------|
| **Build Command** | `ng build --configuration production` |
| **Output Directory** | `dist/frontend/browser` |
| **Install Command** | `npm install` (default) |

> **Note**: Angular 18+ uses `dist/frontend/browser` as the output directory for production builds.

---

### ✅ Step 2: Environment Variables

**In Vercel Dashboard - Environment Variables Section:**

**Remove:**
- ❌ Delete the `EXAMPLE_NAME` variable

**Add the following:**

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Sets environment to production |
| `API_URL` | `https://your-backend-url.com/api` | **IMPORTANT: Replace with your actual backend URL** |

> **⚠️ CRITICAL**: You MUST deploy your backend first and get its URL, then add it here.

---

### ✅ Step 3: Angular Configuration (Already Done ✓)

Your `angular.json` is properly configured with:
- ✅ Production configuration with output hashing
- ✅ Budget limits for bundle sizes
- ✅ Optimization enabled for production

**Current Output Path:** `dist/frontend/browser` (Angular 18+ default)

---

### ✅ Step 4: Environment Files Configuration

**Files in your project:**

#### `src/environments/environment.ts` (Development) ✓
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://192.168.8.168:3000/api',
  firebase: { ... }
};
```

#### `src/environments/environment.prod.ts` (Production) ✓ **CREATED**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.com/api', // UPDATE THIS!
  firebase: { ... }
};
```

**🔴 ACTION REQUIRED:** 
Update `environment.prod.ts` with your actual backend URL after deploying the backend.

---

### ✅ Step 5: Build Configuration

Update your `angular.json` to use the production environment file:

**Add this to `architect.build.configurations.production`:**
```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

---

### ✅ Step 6: Vercel Configuration File (Optional but Recommended)

Create `vercel.json` in the **frontend** folder:

```json
{
  "buildCommand": "ng build --configuration production",
  "outputDirectory": "dist/frontend/browser",
  "framework": "angular",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures proper routing for Angular's client-side navigation.

---

## 🔧 Pre-Deployment Steps

### 1. Update Production Environment
```bash
# Edit this file with your backend URL
frontend/src/environments/environment.prod.ts
```

Replace `'https://your-backend-url.com/api'` with your actual backend URL.

### 2. Test Production Build Locally
```bash
cd frontend
ng build --configuration production
```

Check if the build succeeds without errors.

### 3. Verify Output Directory
```bash
# After building, check if this directory exists:
ls dist/frontend/browser
```

You should see: `index.html`, `main-[hash].js`, `styles-[hash].css`, etc.

---

## 📝 Exact Vercel Settings

### Framework Preset
- **Framework:** Angular

### Root Directory
- **Root Directory:** `frontend`

### Build & Output Settings
```
Build Command: ng build --configuration production
Output Directory: dist/frontend/browser
Install Command: npm install
```

### Environment Variables
```
NODE_ENV = production
```

> **Note**: Backend API URL is configured in `environment.prod.ts`, not as env variable.

---

## 🎯 Deployment Flow

### Order of Deployment:

1. **Deploy Backend First** (Render/Railway/Heroku/Vercel)
   - Get the backend URL (e.g., `https://smart-lms-api.onrender.com`)

2. **Update Frontend Environment**
   - Edit `frontend/src/environments/environment.prod.ts`
   - Replace `apiUrl` with your backend URL

3. **Deploy Frontend to Vercel**
   - Push changes to GitHub
   - Connect repository to Vercel
   - Configure settings as above
   - Deploy!

---

## 🔒 Backend CORS Configuration

**IMPORTANT:** Update your backend `.env` to allow the Vercel frontend URL:

```env
# In backend/.env
FRONTEND_URL=https://your-app.vercel.app
```

And in your backend CORS configuration:
```javascript
app.use(cors({
  origin: [
    'http://localhost:4200',
    process.env.FRONTEND_URL // Your Vercel URL
  ],
  credentials: true
}));
```

---

## ✅ Post-Deployment Checklist

After deploying:

- [ ] Frontend loads at Vercel URL
- [ ] Login page appears correctly
- [ ] Can login with credentials
- [ ] API calls work (check browser console)
- [ ] File uploads work (Cloudinary)
- [ ] All routes work (no 404s)
- [ ] Emotion tracking loads
- [ ] Firebase connection works

---

## 🐛 Troubleshooting

### Build Fails
- Check if `ng build --configuration production` works locally
- Verify all dependencies are in `package.json` (not devDependencies)
- Check Vercel build logs for specific errors

### API Calls Fail (CORS Errors)
- Verify backend CORS allows your Vercel URL
- Check `environment.prod.ts` has correct API URL
- Ensure API URL ends with `/api` (no trailing slash)

### Routing Issues (404 on refresh)
- Add `vercel.json` with rewrites configuration
- Vercel should use `index.html` for all routes

### Environment Variables Not Working
- Remember: Angular uses file replacement, not runtime env vars
- Double-check `environment.prod.ts` is correct
- Rebuild after changing environment files

---

## 📚 Additional Resources

- [Angular Production Deployment](https://angular.io/guide/deployment)
- [Vercel Angular Deployment](https://vercel.com/docs/frameworks/angular)
- [Angular Environment Configuration](https://angular.io/guide/build#configuring-application-environments)

---

## 🎉 Current Status

### ✅ Completed:
- [x] `angular.json` is properly configured
- [x] `environment.prod.ts` created
- [x] Build command identified: `ng build --configuration production`
- [x] Output directory identified: `dist/frontend/browser`

### ⚠️ Required Actions:
- [ ] Deploy backend and get URL
- [ ] Update `environment.prod.ts` with backend URL
- [ ] Add file replacement configuration to `angular.json`
- [ ] Create `vercel.json` (optional)
- [ ] Update backend CORS with Vercel URL
- [ ] Deploy to Vercel

---

**Last Updated:** November 16, 2025  
**Maintainer:** Smart LMS Development Team
