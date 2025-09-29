# 📚 Real-Time Emotion-Aware E-Learning Platform

An advanced e-learning management system designed to enhance online education through emotion detection, real-time student feedback, video conferencing, and intelligent student engagement monitoring.

---

## 🚀 Project Overview

This project aims to improve the online learning experience by detecting students’ facial expressions during live video classes. Using AI-powered emotion detection, the system gives lecturers insights into students’ engagement and understanding, enabling adaptive teaching in real-time.

---

## 🎯 Key Features

### 👩‍🏫 Lecturer Module
- Start and manage video conferencing sessions
- Share lecture materials (PDF, video, image, audio)
- View real-time student emotion feedback
- Create and grade assessments
- Monitor class attendance and engagement
- Semester-based course/module management

### 🎓 Student Module
- Join live classes with emotion tracking
- Access lecture materials and session recordings
- Submit assessments and view grades
- Emotion-based engagement tracking
- View registered course modules

### 🧠 Emotion Detection
- Uses **Face API.js** for real-time emotion recognition
- Detects facial expressions like happy, sad, confused, neutral, etc.
- Displays live emotion stats to lecturers during sessions
- Helps adapt teaching to improve comprehension

### ⚙️ Admin Panel
- Manage users (students, lecturers, admins)
- Approve/reject new user registrations
- Assign users to courses/semesters
- View overall platform analytics and reports
- View student exam schedules and results

---

## 🛠️ Tech Stack

| Layer         | Technology         |
| ------------- | ------------------ |
| Frontend      | Angular            |
| Backend       | Node.js + Express  |
| Database      | MongoDB            |
| Emotion AI    | Face API.js (TensorFlow) |
| Video Calls   | Jitsi Meet / WebRTC |
| Auth          | JWT (JSON Web Token) |
| Storage       | Local file system |
