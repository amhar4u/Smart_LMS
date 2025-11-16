# ⚡ Vercel Deployment - Quick Reference

## 🎯 Copy-Paste Values for Vercel Dashboard

### Build & Development Settings

```
Framework Preset: Angular
Root Directory: frontend
```

### Build Command
```
ng build --configuration production
```

### Output Directory
```
dist/frontend/browser
```

### Install Command
```
npm install
```

---

## 🔑 Environment Variables

Click "Add More" and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |

**Note:** API URL is configured in the code, not as environment variable.

---

## ⚠️ BEFORE DEPLOYING - CHECKLIST

### 1. Deploy Backend First ✓
- [ ] Backend deployed (Render/Railway/etc.)
- [ ] Backend URL obtained (e.g., `https://your-api.com`)

### 2. Update Frontend Files ✓
- [ ] Edit `frontend/src/environments/environment.prod.ts`
- [ ] Replace `apiUrl: 'https://your-backend-url.com/api'` with actual URL
- [ ] Commit and push changes to GitHub

### 3. Update Backend CORS ✓
- [ ] Add your Vercel URL to backend `.env`:
  ```
  FRONTEND_URL=https://your-app.vercel.app
  ```
- [ ] Update CORS configuration in backend

### 4. Test Build Locally ✓
```bash
cd frontend
ng build --configuration production
```
- [ ] Build succeeds without errors
- [ ] Check `dist/frontend/browser` folder exists

---

## 📝 Files Created/Modified

✅ `frontend/src/environments/environment.prod.ts` - Production config
✅ `frontend/angular.json` - File replacement added
✅ `frontend/vercel.json` - Vercel configuration
✅ `VERCEL_DEPLOYMENT_GUIDE.md` - Complete guide

---

## 🚀 Deployment Steps in Vercel

1. **Import Project**
   - Go to Vercel Dashboard
   - Click "Add New" → "Project"
   - Import from GitHub: `amhar4u/Smart_LMS`

2. **Configure Project**
   - Framework: `Angular`
   - Root Directory: `frontend`
   - Build Command: `ng build --configuration production`
   - Output Directory: `dist/frontend/browser`

3. **Add Environment Variables**
   - `NODE_ENV` = `production`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

5. **Post-Deployment**
   - Copy your Vercel URL
   - Update backend CORS with this URL
   - Test the application

---

## 🎉 Your Project is Ready!

All files are configured. Just:
1. Deploy backend
2. Update `environment.prod.ts` with backend URL
3. Push to GitHub
4. Deploy on Vercel with above settings

---

**Quick Help:**
- Build fails? Check `VERCEL_DEPLOYMENT_GUIDE.md`
- CORS errors? Update backend `.env` with Vercel URL
- 404 on refresh? The `vercel.json` handles this

Good luck! 🚀
