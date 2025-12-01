import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { DailyCallManagerService, ParticipantInfo } from '../../../services/daily-call-manager.service';
import { MeetingService } from '../../../services/meeting.service';
import { SocketService, EmotionUpdateEvent, EmotionAlertEvent } from '../../../services/socket.service';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';

interface StudentEmotion {
  studentId: string;
  studentName: string;
  emotion: string;
  timestamp: Date;
  emotions: any;
}

@Component({
  selector: 'app-meeting-room',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatMenuModule
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
        <div class="emotion-summary" *ngIf="studentEmotions.length > 0">
          <h3><mat-icon>sentiment_satisfied_alt</mat-icon> Student Emotions</h3>
          <div class="emotion-list">
            <div *ngFor="let se of studentEmotions" class="emotion-item" [class.alert]="isNegativeEmotion(se.emotion)">
              <span class="student-name">{{ se.studentName }}</span>
              <mat-icon [style.color]="getEmotionColor(se.emotion)">mood</mat-icon>
              <span class="emotion-label" [style.color]="getEmotionColor(se.emotion)">{{ se.emotion }}</span>
            </div>
          </div>
        </div>
        <div class="header-actions">
          <button mat-raised-button color="warn" (click)="leaveMeeting()">
            <mat-icon>exit_to_app</mat-icon> End Meeting
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Starting meeting...</p>
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

          <!-- Screen Share -->
          <button 
            mat-fab 
            [color]="isScreenSharing ? 'accent' : 'primary'"
            (click)="toggleScreenShare()"
            matTooltip="{{ isScreenSharing ? 'Stop Sharing' : 'Share Screen' }}">
            <mat-icon>{{ isScreenSharing ? 'stop_screen_share' : 'screen_share' }}</mat-icon>
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
  styleUrls: ['./meeting-room.component.scss']
})
export class MeetingRoomComponent implements OnInit, OnDestroy {
  @ViewChild('videoGrid', { static: false }) videoGrid!: ElementRef;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private meetingService = inject(MeetingService);
  private dailyCallManager = inject(DailyCallManagerService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);

  loading = true;
  error = '';
  meetingTopic = '';
  studentEmotions: StudentEmotion[] = [];
  meetingId = '';
  
  // Call state
  participants: ParticipantInfo[] = [];
  participantCount = 0;
  isAudioEnabled = true;
  isVideoEnabled = true;
  isScreenSharing = false;
  activeSpeaker: string | null = null;

  // Devices
  cameraDevices: any[] = [];
  micDevices: any[] = [];

  private subscriptions: Subscription[] = [];

  ngOnInit() {
    this.meetingId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.meetingId) {
      this.error = 'Invalid meeting ID';
      this.loading = false;
      return;
    }

    // Connect to Socket.IO FIRST to receive emotion updates
    console.log('🔌 Connecting to Socket.IO for emotion updates...');
    this.socketService.connect();

    // Initialize Daily call manager
    this.dailyCallManager.createCallObject();
    this.setupCallStateListeners();

    this.loadMeetingAndJoin();
  }

  ngOnDestroy() {
    this.cleanup();
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
        this.isScreenSharing = state.screenShare;
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
        this.snackBar.open('Participant left', '', { duration: 2000 });
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

    // Listen for student emotion updates
    this.subscriptions.push(
      this.socketService.emotionUpdate$.subscribe((data: EmotionUpdateEvent) => {
        this.updateStudentEmotion(data);
      })
    );

    // Listen for emotion alerts
    this.subscriptions.push(
      this.socketService.emotionAlert$.subscribe((alert: EmotionAlertEvent) => {
        this.showEmotionAlert(alert);
      })
    );
  }

  private loadMeetingAndJoin() {
    this.meetingService.getMeetingById(this.meetingId).subscribe({
      next: (response) => {
        if (response.meeting) {
          this.meetingTopic = response.meeting.topic;
          
          // Get the navigation state for token and room URL
          const navigation = this.router.getCurrentNavigation();
          const state = navigation?.extras?.state || history.state;
          
          if (state?.token && state?.roomUrl) {
            this.joinWithToken(state.roomUrl, state.token);
          } else {
            // If no token in state, we need to request it
            this.requestMeetingAccess();
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = 'Failed to load meeting details';
        this.snackBar.open('Failed to load meeting', 'Close', { duration: 3000 });
      }
    });
  }

  private requestMeetingAccess() {
    // For lecturer starting the meeting
    this.meetingService.startMeeting(this.meetingId).subscribe({
      next: (response) => {
        this.joinWithToken(response.roomUrl, response.token);
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to join meeting';
        this.snackBar.open(this.error, 'Close', { duration: 3000 });
      }
    });
  }

  private async joinWithToken(roomUrl: string, token: string) {
    try {
      // ✅ CRITICAL: Validate camera permission BEFORE joining
      console.log('📹 Checking camera permissions...');
      const hasCamera = await this.checkAndRequestCameraPermission();
      
      if (!hasCamera) {
        this.loading = false;
        this.error = 'Camera access is required to start the meeting. Please enable your camera and try again.';
        this.snackBar.open('Camera access required', 'Close', { duration: 5000 });
        return;
      }
      
      console.log('✅ Camera permission granted');
      
      const currentUser = this.authService.getCurrentUser();
      const lecturerName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Lecturer';
      
      await this.dailyCallManager.join(roomUrl, token, lecturerName);
      this.loading = false;
      this.snackBar.open('Meeting started successfully', 'Close', { duration: 2000 });

      // Join Socket.IO room to receive emotion updates
      if (currentUser && currentUser._id) {
        this.socketService.joinMeeting(
          this.meetingId,
          currentUser._id,
          lecturerName
        );
        console.log('✅ Lecturer joined Socket.IO room for emotion updates');
      }

      // Load available devices
      await this.loadDevices();

      // Attach initial tracks with multiple attempts to prevent video disappearing
      this.scheduleTrackAttachments();
      
    } catch (error: any) {
      console.error('Error joining meeting:', error);
      this.loading = false;
      this.error = 'Failed to start meeting';
      this.snackBar.open('Failed to start meeting', 'Close', { duration: 3000 });
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
   * Toggle screen share
   */
  async toggleScreenShare(): Promise<void> {
    try {
      if (this.isScreenSharing) {
        this.dailyCallManager.stopScreenShare();
      } else {
        await this.dailyCallManager.startScreenShare();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      this.snackBar.open('Failed to share screen', 'Close', { duration: 3000 });
    }
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
   * Leave meeting and update status
   */
  async leaveMeeting(): Promise<void> {
    try {
      // Leave Daily call first
      await this.dailyCallManager.leave();
      
      // Update meeting status to completed
      const studentCount = this.participants.filter(p => !p.local).length;
      this.meetingService.endMeeting(this.meetingId, studentCount).subscribe({
        next: () => {
          this.snackBar.open('Meeting ended successfully', 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Error ending meeting:', error);
          this.snackBar.open('Meeting ended (status update failed)', 'Close', { duration: 2000 });
        }
      });
      
      this.goBack();
    } catch (error) {
      console.error('Error leaving meeting:', error);
      this.goBack();
    }
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.dailyCallManager.destroy();
  }

  /**
   * Update student emotion in the summary
   */
  private updateStudentEmotion(data: EmotionUpdateEvent): void {
    console.log('📊 Received emotion update:', data);
    
    // Only add if this is a student (not the lecturer)
    const currentUserId = this.authService.getCurrentUser()?._id;
    if (data.studentId === currentUserId) {
      console.log('⏭️ Skipping own emotion (lecturer)');
      return; // Don't show lecturer's own emotions
    }
    
    const existingIndex = this.studentEmotions.findIndex(se => se.studentId === data.studentId);
    
    const emotionData: StudentEmotion = {
      studentId: data.studentId,
      studentName: data.studentName,
      emotion: data.dominantEmotion,
      timestamp: new Date(),
      emotions: data.emotions
    };

    if (existingIndex >= 0) {
      this.studentEmotions[existingIndex] = emotionData;
      console.log(`✅ Updated emotion for ${data.studentName}: ${data.dominantEmotion}`);
    } else {
      this.studentEmotions.push(emotionData);
      console.log(`✅ Added new emotion for ${data.studentName}: ${data.dominantEmotion}`);
    }
    
    console.log(`📈 Total student emotions tracked: ${this.studentEmotions.length}`);
  }

  /**
   * Show emotion alert for negative emotions
   */
  private showEmotionAlert(alert: EmotionAlertEvent): void {
    const message = alert.emotion 
      ? `${alert.studentName} is feeling ${alert.emotion}` 
      : (alert.message || 'Emotion alert');
    
    this.snackBar.open(message, 'Dismiss', { 
      duration: 5000,
      panelClass: ['emotion-alert-snackbar']
    });
  }

  /**
   * Check if emotion is negative
   */
  isNegativeEmotion(emotion: string): boolean {
    return ['sad', 'angry', 'fearful', 'disgusted'].includes(emotion.toLowerCase());
  }

  /**
   * Get color for emotion
   */
  getEmotionColor(emotion: string): string {
    const colors: Record<string, string> = {
      happy: '#4caf50',
      sad: '#2196f3',
      angry: '#f44336',
      surprised: '#ff9800',
      fearful: '#9c27b0',
      disgusted: '#795548',
      neutral: '#9e9e9e'
    };
    return colors[emotion.toLowerCase()] || '#9e9e9e';
  }

  goBack() {
    this.router.navigate(['/lecturer/meetings']);
  }
}
