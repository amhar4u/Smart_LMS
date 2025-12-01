import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { DailyCallManagerService, ParticipantInfo } from '../../../services/daily-call-manager.service';
import { SocketService } from '../../../services/socket.service';
import { EmotionTrackingService, EmotionResult } from '../../../services/emotion-tracking.service';
import { ConfigService } from '../../../services/config.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-meeting-room',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule,
    MatBadgeModule
  ],
  template: `
    <div class="meeting-room-container">
      <!-- Header -->
      <div class="meeting-header" *ngIf="!loading">
        <div class="header-left">
          <h2>{{ meetingTopic }}</h2>
          <span class="participant-count">
            <mat-icon>people</mat-icon>
            {{ participantCount }}
          </span>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="warn" (click)="leaveMeeting()">
            <mat-icon>exit_to_app</mat-icon> Leave Meeting
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Joining meeting...</p>
      </div>

      <!-- Video Grid -->
      <div #videoGrid class="video-grid" *ngIf="!loading && !error">
        <div 
          *ngFor="let participant of participants" 
          class="video-container"
          [class.active-speaker]="participant.session_id === activeSpeaker"
          [class.local]="participant.local"
          [attr.data-participant-id]="participant.session_id">
          
          <video 
            #videoElement
            class="video-element"
            autoplay
            playsinline
            [muted]="participant.local"
            [id]="'video-' + participant.session_id"></video>
          
          <audio
            *ngIf="!participant.local"
            #audioElement
            autoplay
            playsinline
            [id]="'audio-' + participant.session_id"></audio>
          
          <div class="video-overlay">
            <span class="participant-name">{{ participant.user_name }}</span>
            <mat-icon *ngIf="!participant.tracks.video?.persistentTrack" class="camera-off-icon">
              videocam_off
            </mat-icon>
            <mat-icon *ngIf="participant.local" class="local-badge">person</mat-icon>
          </div>
        </div>
      </div>

      <!-- Controls Bar -->
      <div class="controls-bar" *ngIf="!loading && !error">
        <div class="controls-group">
          <!-- Microphone Toggle -->
          <button 
            mat-fab 
            [color]="isAudioEnabled ? 'primary' : 'warn'"
            (click)="toggleAudio()"
            matTooltip="{{ isAudioEnabled ? 'Mute' : 'Unmute' }}">
            <mat-icon>{{ isAudioEnabled ? 'mic' : 'mic_off' }}</mat-icon>
          </button>

          <!-- Camera Toggle -->
          <button 
            mat-fab 
            [color]="isVideoEnabled ? 'primary' : 'warn'"
            (click)="toggleVideo()"
            matTooltip="{{ isVideoEnabled ? 'Stop Video' : 'Start Video' }}">
            <mat-icon>{{ isVideoEnabled ? 'videocam' : 'videocam_off' }}</mat-icon>
          </button>

          <!-- Settings Menu -->
          <button 
            mat-fab 
            color="primary"
            [matMenuTriggerFor]="settingsMenu"
            matTooltip="Settings">
            <mat-icon>settings</mat-icon>
          </button>

          <mat-menu #settingsMenu="matMenu">
            <button mat-menu-item [matMenuTriggerFor]="cameraMenu">
              <mat-icon>videocam</mat-icon>
              <span>Camera</span>
            </button>
            <button mat-menu-item [matMenuTriggerFor]="micMenu">
              <mat-icon>mic</mat-icon>
              <span>Microphone</span>
            </button>
          </mat-menu>

          <mat-menu #cameraMenu="matMenu">
            <button mat-menu-item *ngFor="let device of cameraDevices" (click)="selectCamera(device.deviceId)">
              {{ device.label }}
            </button>
          </mat-menu>

          <mat-menu #micMenu="matMenu">
            <button mat-menu-item *ngFor="let device of micDevices" (click)="selectMicrophone(device.deviceId)">
              {{ device.label }}
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-container">
        <mat-icon>error</mat-icon>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          Go Back
        </button>
      </div>
    </div>
  `,
  styleUrls: ['./student-meeting-room.component.scss']
})
export class StudentMeetingRoomComponent implements OnInit, OnDestroy {
  @ViewChild('videoGrid', { static: false }) videoGrid!: ElementRef;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dailyCallManager = inject(DailyCallManagerService);
  private socketService = inject(SocketService);
  private emotionService = inject(EmotionTrackingService);
  private configService = inject(ConfigService);
  private authService = inject(AuthService);

  loading = true;
  error = '';
  meetingTopic = '';
  meetingId = '';
  
  // Call state
  participants: ParticipantInfo[] = [];
  participantCount = 0;
  isAudioEnabled = true;
  isVideoEnabled = true;
  activeSpeaker: string | null = null;

  // Emotion tracking
  emotionTrackingActive = false;
  currentEmotion = 'neutral';
  private emotionTrackingInterval = 60000; // Default 1 minute

  // Devices
  cameraDevices: any[] = [];
  micDevices: any[] = [];
  
  private currentUser: any = null;
  private sessionId: string = '';
  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.meetingId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.meetingId) {
      this.error = 'Invalid meeting ID';
      this.loading = false;
      return;
    }

    // Get current user
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.error = 'User not authenticated';
      this.loading = false;
      return;
    }

    // Generate unique session ID
    this.sessionId = `${this.currentUser._id}_${this.meetingId}_${Date.now()}`;

    // Connect to Socket.IO
    this.socketService.connect();

    // Initialize Daily call manager
    this.dailyCallManager.createCallObject();
    this.setupCallStateListeners();

    // Get emotion tracking configuration
    this.configService.getEmotionConfig().subscribe({
      next: (config) => {
        this.emotionTrackingInterval = config.interval;
      },
      error: (error) => {
        console.warn('Failed to get emotion tracking config, using default:', error);
      }
    });

    // Get the navigation state for token and room URL
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    if (state?.token && state?.roomUrl && state?.meetingInfo) {
      this.meetingTopic = state.meetingInfo.topic;
      this.joinWithToken(state.roomUrl, state.token);
    } else {
      this.error = 'Invalid meeting access. Please try again.';
      this.loading = false;
    }
  }

  ngOnDestroy() {
    this.cleanup();
    this.cleanupEmotionTracking();
    
    // Leave meeting via Socket.IO
    if (this.meetingId && this.currentUser) {
      this.socketService.leaveMeeting(
        this.meetingId,
        this.currentUser._id,
        `${this.currentUser.firstName} ${this.currentUser.lastName}`
      );
    }
  }

  /**
   * Setup listeners for call state changes
   */
  private setupCallStateListeners(): void {
    // Subscribe to call state
    this.subscriptions.push(
      this.dailyCallManager.callState$.subscribe(state => {
        this.isAudioEnabled = state.localAudio;
        this.isVideoEnabled = state.localVideo;
        this.activeSpeaker = state.activeSpeaker;
        this.participants = Array.from(state.participants.values());
        this.participantCount = this.participants.length;

        if (state.error) {
          this.error = state.error;
        }
      })
    );

    // Subscribe to participant events
    this.subscriptions.push(
      this.dailyCallManager.participantJoined$.subscribe(participant => {
        this.snackBar.open(`${participant.user_name} joined`, '', { duration: 2000 });
      })
    );

    this.subscriptions.push(
      this.dailyCallManager.participantLeft$.subscribe(participantId => {
        this.removeParticipantTracks(participantId);
      })
    );

    this.subscriptions.push(
      this.dailyCallManager.participantUpdated$.subscribe(participant => {
        this.updateParticipantTracks(participant);
      })
    );

    this.subscriptions.push(
      this.dailyCallManager.trackStarted$.subscribe(event => {
        this.attachTrack(event.participantId, event.trackType, event.track);
      })
    );

    this.subscriptions.push(
      this.dailyCallManager.trackStopped$.subscribe(event => {
        this.detachTrack(event.participantId, event.trackType);
      })
    );
  }

  private async joinWithToken(roomUrl: string, token: string) {
    try {
      // ✅ CRITICAL: Validate camera permission BEFORE joining
      console.log('📹 Checking camera permissions...');
      const hasCamera = await this.checkAndRequestCameraPermission();
      
      if (!hasCamera) {
        this.loading = false;
        this.error = 'Camera access is required to join the meeting. Please enable your camera and try again.';
        this.snackBar.open('Camera access required', 'Close', { duration: 5000 });
        return;
      }
      
      console.log('✅ Camera permission granted');
      
      const userName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
      await this.dailyCallManager.join(roomUrl, token, userName);
      
      this.loading = false;
      this.snackBar.open('You have joined the meeting', 'Close', { duration: 2000 });

      // Join meeting via Socket.IO for attendance tracking
      this.socketService.joinMeeting(
        this.meetingId,
        this.currentUser._id,
        userName
      );

      // Load available devices
      await this.loadDevices();

      // Attach initial tracks with multiple attempts to prevent video disappearing
      this.scheduleTrackAttachments();
      
      // Start emotion tracking
      await this.initializeEmotionTracking();
      
    } catch (error: any) {
      console.error('Error joining meeting:', error);
      this.loading = false;
      this.error = 'Failed to join meeting';
      this.snackBar.open('Failed to join meeting', 'Close', { duration: 3000 });
    }
  }

  /**
   * Check and request camera permission
   */
  private async checkAndRequestCameraPermission(): Promise<boolean> {
    try {
      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: false 
      });
      
      // Check if we got a video track
      const videoTracks = stream.getVideoTracks();
      const hasVideo = videoTracks.length > 0 && videoTracks[0].readyState === 'live';
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      if (!hasVideo) {
        console.error('❌ No active video track found');
        return false;
      }
      
      console.log('✅ Camera permission validated and active');
      return true;
    } catch (error: any) {
      console.error('❌ Camera permission denied or unavailable:', error);
      
      // Show specific error message
      if (error.name === 'NotAllowedError') {
        this.snackBar.open('Camera permission denied. Please allow camera access.', 'Close', { duration: 5000 });
      } else if (error.name === 'NotFoundError') {
        this.snackBar.open('No camera found. Please connect a camera.', 'Close', { duration: 5000 });
      } else {
        this.snackBar.open('Camera access error: ' + error.message, 'Close', { duration: 5000 });
      }
      
      return false;
    }
  }

  /**
   * Load available camera and microphone devices
   */
  private async loadDevices(): Promise<void> {
    try {
      const { devices } = await this.dailyCallManager.getDevices();
      this.cameraDevices = devices.filter((d: any) => d.kind === 'videoinput');
      this.micDevices = devices.filter((d: any) => d.kind === 'audioinput');
    } catch (error) {
      console.error('Error loading devices:', error);
    }
  }

  /**
   * Schedule multiple track attachment attempts to prevent video disappearing
   */
  private scheduleTrackAttachments(): void {
    const attachmentSchedule = [200, 800, 2000, 5000];
    
    attachmentSchedule.forEach(delay => {
      setTimeout(() => {
        console.log(`🔄 Attempting track attachment at ${delay}ms`);
        this.attachAllTracks();
      }, delay);
    });
  }

  /**
   * Attach all participant tracks to video/audio elements
   */
  private attachAllTracks(): void {
    this.participants.forEach(participant => {
      this.updateParticipantTracks(participant);
    });
  }

  /**
   * Update tracks for a participant
   */
  private updateParticipantTracks(participant: ParticipantInfo): void {
    const { session_id, tracks, local } = participant;

    // Attach video track
    if (tracks.video?.persistentTrack) {
      this.attachTrack(session_id, 'video', tracks.video.persistentTrack);
    } else {
      this.detachTrack(session_id, 'video');
    }

    // Attach audio track (skip for local participant)
    if (!local && tracks.audio?.persistentTrack) {
      this.attachTrack(session_id, 'audio', tracks.audio.persistentTrack);
    }
  }

  /**
   * Attach a media track to an element
   */
  private attachTrack(participantId: string, trackType: string, track: MediaStreamTrack): void {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      const elementId = `${trackType}-${participantId}`;
      const element = document.getElementById(elementId) as HTMLVideoElement | HTMLAudioElement;

      if (!element) {
        console.warn(`❌ Element not found: ${elementId}`);
        return;
      }

      // Validate track is active FIRST
      if (track.readyState === 'ended') {
        console.warn(`❌ Track ${track.id} has ended, not attaching`);
        return;
      }

      // Check if track is already attached to avoid duplicates
      const currentStream = element.srcObject as MediaStream;
      if (currentStream) {
        const tracks = currentStream.getTracks();
        if (tracks.length > 0 && tracks[0].id === track.id && tracks[0].readyState === 'live') {
          console.log(`✅ Track ${track.id} already attached and live on ${elementId}`);
          return; // Track already attached and working
        }
        // Remove old stream without stopping tracks
        element.srcObject = null;
        element.pause();
      }

      // Create new stream with the track
      const stream = new MediaStream([track]);
      element.srcObject = stream;
      
      // Configure element for autoplay
      if (element instanceof HTMLVideoElement) {
        element.autoplay = true;
        element.playsInline = true;
        element.muted = participantId === this.dailyCallManager.getCurrentState().participants.get('local')?.session_id;
      }
      
      // Attempt to play with error handling
      element.play().then(() => {
        console.log(`✅ ${trackType} playing for ${participantId}`);
      }).catch(e => {
        // Retry play after a short delay
        if (e.name !== 'AbortError') {
          console.warn(`⚠️ Error playing ${trackType}, retrying...`, e.message);
          setTimeout(() => {
            element.play().catch(err => {
              if (err.name !== 'AbortError') {
                console.error(`❌ Failed to play ${trackType}:`, err.message);
              }
            });
          }, 100);
        }
      });
    });
  }

  /**
   * Detach a media track from an element
   */
  private detachTrack(participantId: string, trackType: string): void {
    const elementId = `${trackType}-${participantId}`;
    const element = document.getElementById(elementId) as HTMLVideoElement | HTMLAudioElement;

    if (element && element.srcObject) {
      const stream = element.srcObject as MediaStream;
      // Don't stop tracks as they might be used elsewhere
      element.srcObject = null;
      element.pause();
    }
  }

  /**
   * Remove all tracks for a participant
   */
  private removeParticipantTracks(participantId: string): void {
    this.detachTrack(participantId, 'video');
    this.detachTrack(participantId, 'audio');
  }

  /**
   * Toggle microphone
   */
  toggleAudio(): void {
    this.dailyCallManager.toggleAudio();
  }

  /**
   * Toggle camera
   */
  toggleVideo(): void {
    this.dailyCallManager.toggleVideo();
  }

  /**
   * Select camera device
   */
  async selectCamera(deviceId: string): Promise<void> {
    try {
      await this.dailyCallManager.setCameraDevice(deviceId);
      this.snackBar.open('Camera changed', '', { duration: 2000 });
    } catch (error) {
      console.error('Error changing camera:', error);
    }
  }

  /**
   * Select microphone device
   */
  async selectMicrophone(deviceId: string): Promise<void> {
    try {
      await this.dailyCallManager.setMicrophoneDevice(deviceId);
      this.snackBar.open('Microphone changed', '', { duration: 2000 });
    } catch (error) {
      console.error('Error changing microphone:', error);
    }
  }

  /**
   * Leave meeting
   */
  async leaveMeeting(): Promise<void> {
    await this.dailyCallManager.leave();
    this.snackBar.open('You have left the meeting', 'Close', { duration: 2000 });
    this.goBack();
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.dailyCallManager.destroy();
  }

  goBack() {
    this.router.navigate(['/student/meetings']);
  }

  /**
   * Initialize emotion tracking
   */
  private async initializeEmotionTracking() {
    try {
      console.log('🎭 Initializing emotion tracking...');
      
      // Load Face-API models with timeout
      const loadTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Model loading timeout')), 30000)
      );
      
      await Promise.race([
        this.emotionService.loadModels(),
        loadTimeout
      ]);
      console.log('✅ Face-API models loaded');
      
      // Start webcam
      await this.emotionService.startWebcam();
      console.log('✅ Webcam started');
      
      // Start emotion tracking with callback
      this.emotionService.startTracking(
        (emotionResult: EmotionResult) => this.handleEmotionUpdate(emotionResult),
        this.emotionTrackingInterval
      );
      
      this.emotionTrackingActive = true;
      console.log('✅ Emotion tracking started successfully');
      this.snackBar.open('Emotion tracking active', 'Close', { duration: 2000 });
      
    } catch (error: any) {
      console.error('❌ Error initializing emotion tracking:', error);
      this.emotionTrackingActive = false;
      this.snackBar.open(
        'Emotion tracking unavailable. Please check camera permissions.',
        'Close',
        { duration: 5000 }
      );
    }
  }

  /**
   * Handle emotion update from tracking service
   */
  private handleEmotionUpdate(emotionResult: EmotionResult) {
    // Update current emotion display
    this.currentEmotion = emotionResult.dominantEmotion;

    console.log(`🎭 Emotion detected: ${emotionResult.dominantEmotion} (confidence: ${emotionResult.confidence})`);

    // Send emotion update to server via Socket.IO
    const studentName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    this.socketService.sendEmotionUpdate(
      this.meetingId,
      this.currentUser._id,
      emotionResult.emotions,
      emotionResult.dominantEmotion,
      emotionResult.faceDetected,
      emotionResult.confidence,
      this.sessionId,
      studentName
    );
  }

  /**
   * Cleanup emotion tracking resources
   */
  private cleanupEmotionTracking() {
    this.emotionService.cleanup();
    this.emotionTrackingActive = false;
  }

  /**
   * Get color for emotion display
   */
  getEmotionColor(): string {
    const emotionColors: { [key: string]: string } = {
      'happy': '#4caf50',
      'sad': '#2196f3',
      'angry': '#f44336',
      'surprised': '#ff9800',
      'fearful': '#9c27b0',
      'disgusted': '#795548',
      'neutral': '#9e9e9e'
    };
    return emotionColors[this.currentEmotion] || '#9e9e9e';
  }
}
