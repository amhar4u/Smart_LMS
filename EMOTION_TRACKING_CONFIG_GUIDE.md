# 🎛️ Emotion Tracking Configuration Guide

## Environment Variable Setup

### Backend (.env file)

Add this line to your `backend/.env` file:

```env
# Emotion Tracking Configuration
# Interval in milliseconds (300000 = 5 minutes)
EMOTION_TRACKING_INTERVAL=300000
```

### Interval Values Reference:

| Time | Milliseconds | Use Case |
|------|-------------|----------|
| 15 seconds | 15000 | High-frequency monitoring (quizzes, tests) |
| 30 seconds | 30000 | Detailed tracking (important lectures) |
| 1 minute | 60000 | Normal tracking |
| 2 minutes | 120000 | Standard lectures |
| **5 minutes** | **300000** | **Default - General classroom use** ✅ |
| 10 minutes | 600000 | Long sessions, minimal tracking |

---

## How It Works

### 1. **Backend serves the configuration**
```javascript
// server.js endpoint
GET /api/config/emotion-tracking
Response: {
  "interval": 300000,  // 5 minutes
  "enabled": true
}
```

### 2. **Frontend loads configuration on startup**
```typescript
// config.service.ts
constructor() {
  this.loadEmotionConfig(); // Automatically loads from backend
}
```

### 3. **Components use the interval**
```typescript
// In your student-meeting-room.component.ts
export class StudentMeetingRoomComponent implements OnInit {
  constructor(
    private emotionService: EmotionTrackingService,
    private configService: ConfigService,
    private socketService: SocketService
  ) {}

  async ngOnInit() {
    // Get interval from backend config
    const interval = this.configService.getEmotionTrackingInterval();
    
    console.log(`Using emotion tracking interval: ${interval}ms`);
    
    // Start tracking with configured interval
    await this.emotionService.loadModels();
    await this.emotionService.startWebcam();
    
    this.emotionService.startTracking((result) => {
      // Send emotion data
      this.socketService.sendEmotionUpdate(
        meetingId,
        studentId,
        result.emotions,
        result.dominantEmotion,
        result.faceDetected,
        result.confidence,
        sessionId
      );
    }, interval); // Use configured interval
  }
}
```

---

## Changing the Interval

### Method 1: Update .env file (Recommended)

1. Open `backend/.env`
2. Change the value:
```env
# For 2 minutes
EMOTION_TRACKING_INTERVAL=120000

# For 10 minutes  
EMOTION_TRACKING_INTERVAL=600000

# For 30 seconds (testing)
EMOTION_TRACKING_INTERVAL=30000
```

3. Restart the backend server:
```bash
cd backend
node server.js
```

4. Refresh the frontend - it will automatically load the new value!

### Method 2: Override per component

```typescript
// Use custom interval for specific meeting type
const customInterval = 60000; // 1 minute for important meetings

this.emotionService.startTracking((result) => {
  // Handle emotion data
}, customInterval);
```

---

## Real-World Examples

### Scenario 1: Regular Lecture (Default)
```env
EMOTION_TRACKING_INTERVAL=300000  # 5 minutes
```
**Why**: Balanced approach, captures general mood without overwhelming

**60-minute lecture**: 12 emotion checks per student
**Database**: ~360 records for 30 students

---

### Scenario 2: High-Stakes Exam
```env
EMOTION_TRACKING_INTERVAL=30000  # 30 seconds
```
**Why**: Detect stress and confusion quickly

**60-minute exam**: 120 emotion checks per student
**Database**: ~3,600 records for 30 students

---

### Scenario 3: Long Workshop (3 hours)
```env
EMOTION_TRACKING_INTERVAL=600000  # 10 minutes
```
**Why**: Minimize performance impact, general engagement only

**180-minute workshop**: 18 emotion checks per student
**Database**: ~540 records for 30 students

---

## Advanced: Dynamic Configuration

### Make it configurable per meeting (Future Enhancement)

**1. Add field to Meeting model:**
```javascript
emotionTrackingInterval: {
  type: Number,
  default: () => parseInt(process.env.EMOTION_TRACKING_INTERVAL) || 300000
}
```

**2. Let lecturers choose when creating meeting:**
```html
<mat-form-field>
  <mat-label>Tracking Frequency</mat-label>
  <mat-select [(ngModel)]="meeting.emotionTrackingInterval">
    <mat-option [value]="30000">Every 30 seconds (Detailed)</mat-option>
    <mat-option [value]="60000">Every 1 minute</mat-option>
    <mat-option [value]="120000">Every 2 minutes</mat-option>
    <mat-option [value]="300000">Every 5 minutes (Default)</mat-option>
    <mat-option [value]="600000">Every 10 minutes (Light)</mat-option>
  </mat-select>
</mat-form-field>
```

**3. Use meeting-specific interval:**
```typescript
// Get interval from meeting data
const interval = meeting.emotionTrackingInterval || this.configService.getEmotionTrackingInterval();
```

---

## Monitoring & Debugging

### Check current configuration:

**Frontend Console:**
```typescript
// In component
console.log('Current interval:', this.configService.getEmotionTrackingInterval());

// Output: Current interval: 300000
```

**Backend Logs:**
```bash
# When server starts
✅ Emotion tracking config loaded: { interval: 300000, enabled: true }
📊 Tracking interval: 300000ms (5 minutes)
```

### Verify it's working:

1. Open browser console
2. Look for: `✅ Emotion tracking started (interval: 300000ms = 5 minutes)`
3. Emotion updates should appear every 5 minutes (or your configured interval)

---

## Performance Impact

### Database Growth (60-minute meeting, 30 students):

| Interval | Records/Hour | Storage* | CPU Usage |
|----------|-------------|----------|-----------|
| 30 sec   | 3,600       | ~700 KB  | 2-4%     |
| 1 min    | 1,800       | ~350 KB  | 1-2%     |
| 5 min ✅  | 360         | ~70 KB   | <0.5%    |
| 10 min   | 180         | ~35 KB   | <0.3%    |

*Approximate MongoDB storage

---

## Best Practices

### ✅ Recommended Settings:

**General Use (Default):**
```env
EMOTION_TRACKING_INTERVAL=300000  # 5 minutes
```

**High-Engagement Sessions:**
```env
EMOTION_TRACKING_INTERVAL=120000  # 2 minutes
```

**Performance-Critical (Large Classes):**
```env
EMOTION_TRACKING_INTERVAL=600000  # 10 minutes
```

### ⚠️ Not Recommended:

❌ **Less than 15 seconds** - Too frequent, high CPU/network usage
❌ **More than 15 minutes** - Too infrequent, miss important emotional changes

---

## Troubleshooting

### Issue: Interval not updating

**Solution:**
1. Check `.env` file has correct value
2. Restart backend server
3. Clear browser cache
4. Refresh frontend

### Issue: Using wrong interval

**Check logs:**
```bash
# Backend
GET /api/config/emotion-tracking → { interval: 300000 }

# Frontend
✅ Emotion tracking config loaded: { interval: 300000, enabled: true }
```

### Issue: Want different intervals for different meetings

**Implement per-meeting configuration:**
- Add field to Meeting model
- Update meeting creation form
- Pass meeting interval to tracking service

---

## Quick Reference Card

```bash
# Default (5 minutes)
EMOTION_TRACKING_INTERVAL=300000

# Common Values
15 sec  = 15000
30 sec  = 30000
1 min   = 60000
2 min   = 120000
5 min   = 300000  ← Default
10 min  = 600000

# Calculation Formula
Minutes × 60 × 1000 = Milliseconds
Example: 5 × 60 × 1000 = 300000
```

---

**Summary**: 
- ✅ Default: **5 minutes (300000ms)** 
- ✅ Configurable via `.env` file
- ✅ Changes take effect after server restart
- ✅ Frontend automatically loads configuration
- ✅ Can be overridden per component if needed

Perfect for general classroom use with minimal performance impact! 🎓📊
