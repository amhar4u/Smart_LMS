# 🚀 Smart LMS Deployment Guide - Complete Order

## ⚠️ IMPORTANT: Deploy in This Order!

### **Step 1: Deploy Backend First** (Render)
### **Step 2: Deploy Frontend** (Vercel)

---

## 📋 **STEP 1: Backend Deployment (Render)**

### A. Render Configuration

**Settings to Use:**

| Setting | Value |
|---------|-------|
| **Language** | Node |
| **Branch** | main |
| **Region** | Oregon (US West) or nearest to you |
| **Root Directory** | `backend` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |

### B. Environment Variables (ADD ALL OF THESE!)

After creating the service, go to **Environment** tab and add:

```env
# MongoDB Configuration
MONGODB_URI=your-mongodb-connection-string

# Server Configuration
PORT=3000
NODE_ENV=production
SESSION_SECRET=smart-lms-secret-key-2024
JWT_SECRET=smart-lms-jwt-secret-key-2024-secure-token
JWT_EXPIRE=7d

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_URL=cloudinary://your-api-key:your-api-secret@your-cloud-name

# Firebase Admin SDK Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key-here
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_STORAGE_BUCKET=your-storage-bucket

# Gemini AI Configuration
GEMINI_API_KEY=your-gemini-api-key-here

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# AI Provider Selection
AI_PROVIDER=openai

# Emotion Tracking Configuration
EMOTION_TRACKING_INTERVAL=60000

# CORS Configuration - WILL UPDATE AFTER FRONTEND DEPLOYMENT
FRONTEND_URL=http://localhost:4200
```

**⚠️ Note:** Don't add quotes around the FIREBASE_PRIVATE_KEY in Render - paste it as-is with the \n characters.

### C. Deploy Backend

1. Click **"Deploy Web Service"**
2. Wait for deployment to complete
3. **Copy your backend URL** (e.g., `https://smart-lms-backend.onrender.com`)

---

## 📋 **STEP 2: Update Backend Code for Production**

### A. Update CORS Configuration

You need to update `backend/server.js` to include your production URLs:

**File:** `backend/server.js`

Find the CORS configuration (around line 46) and update:

```javascript
// CORS middleware
app.use(cors({
  origin: [
    'http://localhost:4200', 
    'http://localhost:4201', 
    'http://localhost:4202',
    'http://192.168.8.168:4200',
    'http://192.168.8.168:4201',
    'http://192.168.8.168:4202',
    process.env.FRONTEND_URL, // Production frontend URL
    'https://your-app.vercel.app' // Replace with actual Vercel URL
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

Also update Socket.IO CORS (around line 17):

```javascript
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:4200', 
      'http://localhost:4201', 
      'http://localhost:4202',
      'http://192.168.8.168:4200',
      'http://192.168.8.168:4201',
      'http://192.168.8.168:4202',
      process.env.FRONTEND_URL,
      'https://your-app.vercel.app' // Replace with actual Vercel URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST']
  }
});
```

**Commit and push these changes AFTER you get your Vercel URL.**

---

## 📋 **STEP 3: Frontend Deployment (Vercel)**

### A. Update Frontend Environment

**File:** `frontend/src/environments/environment.prod.ts`

Update the apiUrl with your Render backend URL:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-backend-url.onrender.com/api', // Replace!
  firebase: {
    apiKey: "AIzaSyD_B3ZDSsycZyJKeAesmcqAKzC_BK8zNLI",
    authDomain: "smart-lms-d5ce5.firebaseapp.com",
    projectId: "smart-lms-d5ce5",
    storageBucket: "smart-lms-d5ce5.firebasestorage.app",
    messagingSenderId: "1048951192303",
    appId: "1:1048951192303:web:9d3528e4e97e1e1207b91a",
    measurementId: "G-G5PGXF5WJV"
  }
};
```

**Commit and push this change!**

### B. Vercel Configuration

| Setting | Value |
|---------|-------|
| **Framework** | Angular |
| **Root Directory** | `frontend` |
| **Build Command** | `ng build --configuration production` |
| **Output Directory** | `dist/frontend/browser` |
| **Install Command** | `npm install --legacy-peer-deps` |

**Environment Variables:**
```
NODE_ENV = production
```

### C. Deploy Frontend

1. Click **"Deploy"** on Vercel
2. Wait for deployment
3. **Copy your Vercel URL** (e.g., `https://smart-lms.vercel.app`)

---

## 📋 **STEP 4: Final Configuration Updates**

### A. Update Backend Environment Variables on Render

Go back to Render → Your Service → Environment

Update:
```
FRONTEND_URL=https://your-app.vercel.app
```

### B. Update Backend Code with Vercel URL

In `backend/server.js`, replace `'https://your-app.vercel.app'` with your actual Vercel URL.

Commit and push - Render will auto-redeploy.

---

## ✅ **Deployment Checklist**

- [ ] **Backend deployed on Render**
  - [ ] All environment variables added
  - [ ] Build successful
  - [ ] Backend URL obtained

- [ ] **Frontend environment updated**
  - [ ] `environment.prod.ts` has backend URL
  - [ ] Changes committed and pushed

- [ ] **Frontend deployed on Vercel**
  - [ ] All settings correct
  - [ ] Build successful
  - [ ] Vercel URL obtained

- [ ] **Backend CORS updated**
  - [ ] `server.js` has Vercel URL
  - [ ] `FRONTEND_URL` env variable updated on Render
  - [ ] Changes committed and pushed

- [ ] **Testing**
  - [ ] Can access frontend at Vercel URL
  - [ ] Can login
  - [ ] API calls work
  - [ ] File uploads work
  - [ ] No CORS errors

---

## 🔧 **Troubleshooting**

### CORS Errors
- Make sure `FRONTEND_URL` is set in Render
- Verify Vercel URL is in `server.js` CORS config
- Check browser console for exact error

### Backend Not Starting
- Check Render logs
- Verify all environment variables are set
- Check `PORT` is set to 3000

### Frontend Build Fails
- Ensure `npm install --legacy-peer-deps` is set
- Check Vercel build logs
- Verify all Angular packages are version 20.1.3

### API Calls Fail
- Check if backend URL in `environment.prod.ts` is correct
- Must end with `/api`
- Use HTTPS, not HTTP

---

## 📝 **Important URLs**

After deployment, you'll have:

- **Backend API:** `https://your-service.onrender.com`
- **Frontend App:** `https://your-app.vercel.app`

Save these URLs!

---

**Ready to deploy? Start with Step 1! 🚀**
