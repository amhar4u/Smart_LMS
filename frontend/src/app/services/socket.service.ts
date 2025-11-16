import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmotionUpdateEvent {
  studentId: string;
  emotions: any;
  dominantEmotion: string;
  faceDetected: boolean;
  attentiveness: number;
  timestamp: Date;
}

export interface EmotionAlertEvent {
  type: string;
  studentId: string;
  emotion?: string;
  value?: number;
  attentiveness?: number;
  severity: string;
  timestamp: Date;
}

export interface EngagementData {
  meetingId: string;
  totalStudents: number;
  engaged: number;
  disengaged: number;
  avgEngagement: number;
  students: any[];
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private connected = false;

  // Observables for real-time events
  private emotionUpdateSubject = new Subject<EmotionUpdateEvent>();
  private emotionAlertSubject = new Subject<EmotionAlertEvent>();
  private studentJoinedSubject = new Subject<any>();
  private studentLeftSubject = new Subject<any>();
  private engagementDataSubject = new Subject<EngagementData>();
  private alertsDataSubject = new Subject<any>();

  public emotionUpdate$ = this.emotionUpdateSubject.asObservable();
  public emotionAlert$ = this.emotionAlertSubject.asObservable();
  public studentJoined$ = this.studentJoinedSubject.asObservable();
  public studentLeft$ = this.studentLeftSubject.asObservable();
  public engagementData$ = this.engagementDataSubject.asObservable();
  public alertsData$ = this.alertsDataSubject.asObservable();

  constructor() {}

  /**
   * Connect to Socket.IO server
   */
  connect(): void {
    if (this.connected) {
      return;
    }

    const apiUrl = environment.apiUrl.replace('/api', ''); // Remove /api suffix
    
    this.socket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket.IO error:', error);
    });

    // Listen for emotion updates
    this.socket.on('student-emotion-live', (data: EmotionUpdateEvent) => {
      this.emotionUpdateSubject.next(data);
    });

    // Listen for emotion alerts
    this.socket.on('emotion-alert', (data: EmotionAlertEvent) => {
      this.emotionAlertSubject.next(data);
    });

    // Listen for student joined
    this.socket.on('student-joined', (data: any) => {
      this.studentJoinedSubject.next(data);
    });

    // Listen for student left
    this.socket.on('student-left', (data: any) => {
      this.studentLeftSubject.next(data);
    });

    // Listen for engagement data
    this.socket.on('engagement-data', (data: EngagementData) => {
      this.engagementDataSubject.next(data);
    });

    // Listen for alerts data
    this.socket.on('alerts-data', (data: any) => {
      this.alertsDataSubject.next(data);
    });
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Join a meeting room
   */
  joinMeeting(meetingId: string, studentId: string, studentName: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('join-meeting', {
      meetingId,
      studentId,
      studentName
    });
  }

  /**
   * Leave a meeting room
   */
  leaveMeeting(meetingId: string, studentId: string, studentName: string): void {
    if (!this.socket) {
      return;
    }

    this.socket.emit('leave-meeting', {
      meetingId,
      studentId,
      studentName
    });
  }

  /**
   * Send emotion update to server
   */
  sendEmotionUpdate(
    meetingId: string,
    studentId: string,
    emotions: any,
    dominantEmotion: string,
    faceDetected: boolean,
    confidence: number,
    sessionId: string
  ): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('emotion-update', {
      meetingId,
      studentId,
      emotions,
      dominantEmotion,
      faceDetected,
      confidence,
      sessionId,
      timestamp: new Date()
    });
  }

  /**
   * Request current engagement data (Lecturer)
   */
  requestEngagement(meetingId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('request-engagement', { meetingId });
  }

  /**
   * Request alerts data (Lecturer)
   */
  requestAlerts(meetingId: string): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('request-alerts', { meetingId });
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}
