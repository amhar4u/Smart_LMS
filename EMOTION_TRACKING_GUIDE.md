# 🎭 Emotion Tracking - Complete Guide

## 📋 Overview

Real-time facial emotion detection and analysis system for monitoring student engagement during online meetings using Face-API.js and Socket.IO.

---

## ✅ Features

- **7 Emotion Types**: Happy, Sad, Angry, Surprised, Fearful, Disgusted, Neutral
- **Real-time Detection**: Face detection via webcam every 60 seconds (configurable)
- **Database Storage**: All emotion data saved to MongoDB StudentEmotion collection
- **Live Updates**: Lecturer receives real-time emotion broadcasts via Socket.IO
- **Alert System**: Automatic alerts for negative emotions (>60%) and low attentiveness (<50%)
- **Debug Logging**: Comprehensive console output for troubleshooting

---

## 🚀 Quick Start

### 1. Start Servers

```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
cd frontend
ng serve --host 0.0.0.0 --port 4200
```

### 2. Test Emotion Tracking

1. Login as student: `http://192.168.8.168:4200`
2. Join active meeting
3. **Grant camera permission** ⚠️
4. Wait 60 seconds
5. Check backend console for emotion data

---

## ⚙️ Configuration

**File:** `backend/.env`

```env
# Emotion tracking interval (milliseconds)
EMOTION_TRACKING_INTERVAL=60000  # 1 minute for testing
# EMOTION_TRACKING_INTERVAL=300000  # 5 minutes for production
```

---

## 📊 How It Works

```
Student joins meeting
  ↓
Socket.IO connects
  ↓
Face-API models load
  ↓
Webcam starts
  ↓
Every 60 seconds:
  - Face detected
  - 7 emotions analyzed
  - Data sent via Socket.IO
  - Saved to database
  - Lecturer notified
  - Alerts checked
```

---

## 🗄️ Database Schema

```javascript
{
  meetingId: ObjectId("..."),
  studentId: ObjectId("..."),
  timestamp: ISODate("..."),
  emotions: {
    happy: 0.75,
    sad: 0.05,
    angry: 0.02,
    surprised: 0.03,
    fearful: 0.01,
    disgusted: 0.01,
    neutral: 0.13
  },
  dominantEmotion: "happy",
  faceDetected: true,
  attentiveness: 0.92,
  detectionConfidence: 0.92,
  sessionId: "...",
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

---

## 📡 Socket.IO Events

### From Student:
- `emotion-update` - Sends emotion data every 60s

### To Lecturer:
- `student-emotion-live` - Real-time emotion broadcast
- `emotion-alert` - Alerts for concerning patterns

---

## 🖥️ Console Output

### Backend (Every 60 seconds):

```
🎭 EMOTION TRACKING DATA RECEIVED
⏰ Timestamp: 10:30:45 PM
📍 Meeting ID: 673d4f2e...
👤 Student ID: 68c13317...

👁️ FACE DETECTION:
   Status: ✅ DETECTED
   Confidence: 92.45%

😊 EMOTION VALUES:
   😊 Happy:     75.23%
   😢 Sad:       5.12%
   😠 Angry:     2.34%
   😮 Surprised: 3.45%
   😨 Fearful:   1.23%
   🤢 Disgusted: 0.56%
   😐 Neutral:   12.07%

🎯 DOMINANT EMOTION: 😊 HAPPY

💾 DATABASE: ✅ Emotion record saved successfully
```

### Frontend (Browser Console):

```javascript
✅ Socket.IO connected
✅ Face-API models loaded
✅ Webcam started
✅ Emotion tracking started (interval: 60000ms)
🎭 Emotion detected: { dominantEmotion: 'happy', faceDetected: true }
📡 Emotion update sent to server
```

---

## 🚨 Alert System

### Triggers:
- **Negative Emotions**: Sad/Angry/Fearful > 60%
- **Low Attentiveness**: Face not detected OR confidence < 50%

### Severity Levels:
- **HIGH**: Emotion > 70%
- **MEDIUM**: Emotion 50-70%
- **LOW**: Attentiveness < 50%

---

## 🐛 Troubleshooting

### Camera Not Working
**Solutions:**
- Grant browser permissions
- Close other apps using camera
- Use Chrome/Edge browser
- Try `http://localhost:4200` (better camera support)

### Face-API Models Missing
**Check:**
```bash
ls frontend/public/assets/models/
```
**Required files:**
- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_expression_model-weights_manifest.json`
- `face_expression_model-shard1`

### No Emotion Updates
**Checklist:**
- [ ] Backend running (port 3000)?
- [ ] Socket.IO connected (browser console)?
- [ ] Webcam started (browser console)?
- [ ] Face-API loaded (browser console)?
- [ ] MongoDB connected (backend console)?

### Face Not Detected
**Improve:**
- Better lighting
- Look at camera
- Adjust distance
- Use quality webcam

---

## 🧪 Testing

### Manual Test:
1. Start servers
2. Login as student
3. Join meeting (grant camera)
4. Stay 5 minutes
5. Verify 5 emotion records in database:
   ```javascript
   db.studentemotions.find({ meetingId: ObjectId("...") }).count()
   // Should return 5
   ```

### Automated Test:
```bash
cd backend
node test-emotion-tracking.js
```

---

## 📊 Database Queries

```javascript
// Total emotions for meeting
db.studentemotions.find({ meetingId: ObjectId("...") }).count()

// Emotion distribution
db.studentemotions.aggregate([
  { $match: { meetingId: ObjectId("...") } },
  { $group: { _id: "$dominantEmotion", count: { $sum: 1 } }}
])

// Average attentiveness per student
db.studentemotions.aggregate([
  { $match: { meetingId: ObjectId("...") } },
  { $group: {
      _id: "$studentId",
      avgAttentiveness: { $avg: "$attentiveness" }
  }}
])
```

---

## ✅ Success Checklist

- [ ] Backend running on port 3000
- [ ] Frontend running on port 4200
- [ ] MongoDB connected
- [ ] Face-API models in `frontend/public/assets/models/`
- [ ] Camera permission granted
- [ ] Socket.IO connected (browser console shows ✅)
- [ ] Emotion data logged every 60s (backend console)
- [ ] Database records created (check MongoDB)

---

## 📱 Network Access

### Localhost (Best for Camera):
```
http://localhost:4200 ✅ Camera always works
```

### IP Address:
```
http://192.168.8.168:4200
✅ Works on your computer
⚠️ Camera may not work on other devices (HTTP restriction)
```

### HTTPS (For Network Camera):
```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
ng serve --host 0.0.0.0 --ssl --ssl-cert cert.pem --ssl-key key.pem
# Access: https://192.168.8.168:4200
```

---

**Status:** ✅ Fully Implemented | **Updated:** November 16, 2025
