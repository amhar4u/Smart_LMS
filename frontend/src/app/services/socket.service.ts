import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmotionUpdateEvent {
  studentId: string;
  studentName: string;
  emotions: any;
  dominantEmotion: string;
  faceDetected: boolean;
  attentiveness: number;
  timestamp: Date;
}

export interface EmotionAlertEvent {
  type: string;
  studentId: string;
  studentName: string;
  emotion?: string;
  value?: number;
  attentiveness?: number;
  severity: string;
  message?: string;
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
    if (this.connected && this.socket?.connected) {
      console.log('✅ Socket already connected');
      return;
    }

    const apiUrl = environment.apiUrl.replace('/api', ''); // Remove /api suffix
    
    console.log('🔌 Connecting to Socket.IO server:', apiUrl);
    
    this.socket = io(apiUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      this.connected = true;
      console.log('✅ Socket.IO connected successfully');
      console.log('   Socket ID:', this.socket?.id);
      console.log('   Connected:', this.socket?.connected);
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      console.warn('⚠️ Socket.IO disconnected');
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

    // Note: attendance-recorded and attendance-error are handled in joinMeeting() method
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
  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Wait for socket connection
   */
  private async waitForConnection(maxWait: number = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      if (this.socket?.connected) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return false;
  }

  /**
   * Join a meeting room with retry logic
   */
  async joinMeeting(meetingId: string, studentId: string, studentName: string): Promise<void> {
    console.log('\n🔔 JOIN-MEETING CALLED');
    console.log('   Meeting ID:', meetingId);
    console.log('   Student ID:', studentId);
    console.log('   Student Name:', studentName);
    
    if (!this.socket) {
      console.error('❌ Socket not initialized');
      throw new Error('Socket not initialized');
    }

    // Wait for connection with timeout
    console.log('⏳ Waiting for socket connection...');
    const isConnected = await this.waitForConnection(5000);
    
    if (!isConnected) {
      console.error('❌ Socket failed to connect after 5 seconds');
      console.error('   Socket state:', {
        exists: !!this.socket,
        connected: this.socket?.connected,
        disconnected: this.socket?.disconnected
      });
      throw new Error('Socket connection timeout');
    }

    console.log('✅ Socket connected, emitting join-meeting event...');
    console.log('   Socket ID:', this.socket.id);
    console.log('   Socket connected:', this.socket.connected);
    
    // Return a promise that resolves when attendance is recorded or rejects on error
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Attendance recording timeout'));
      }, 10000); // 10 second timeout

      // Listen for attendance recorded confirmation
      const onAttendanceRecorded = (data: any) => {
        clearTimeout(timeout);
        this.socket?.off('attendance-recorded', onAttendanceRecorded);
        this.socket?.off('attendance-error', onAttendanceError);
        console.log('✅ Attendance confirmed:', data);
        resolve();
      };

      // Listen for attendance error
      const onAttendanceError = (data: any) => {
        clearTimeout(timeout);
        this.socket?.off('attendance-recorded', onAttendanceRecorded);
        this.socket?.off('attendance-error', onAttendanceError);
        console.error('❌ Attendance error:', data);
        reject(new Error(data.message || 'Attendance recording failed'));
      };

      // Set up one-time listeners
      this.socket?.once('attendance-recorded', onAttendanceRecorded);
      this.socket?.once('attendance-error', onAttendanceError);

      // Emit the join-meeting event
      this.socket!.emit('join-meeting', {
        meetingId,
        studentId,
        studentName
      });
      
      console.log('✅ join-meeting event emitted, waiting for confirmation...');
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
    sessionId: string,
    studentName?: string,
    educationalState?: any,
    behavior?: any,
    dominantEducationalState?: string
  ): void {
    if (!this.socket) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('emotion-update', {
      meetingId,
      studentId,
      studentName,
      emotions,
      dominantEmotion,
      faceDetected,
      confidence,
      sessionId,
      educationalState,
      behavior,
      dominantEducationalState,
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
   * Get socket ID
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}
