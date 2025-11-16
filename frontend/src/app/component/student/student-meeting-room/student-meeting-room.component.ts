import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import DailyIframe from '@daily-co/daily-js';
import { SocketService } from '../../../services/socket.service';
import { EmotionTrackingService, EmotionResult } from '../../../services/emotion-tracking.service';
import { ConfigService } from '../../../services/config.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-student-meeting-room',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="meeting-room-container">
      <div class="meeting-header" *ngIf="!loading">
        <h2>{{ meetingTopic }}</h2>
        <div class="header-actions">
          <button mat-raised-button color="warn" (click)="leaveMeeting()">
            <mat-icon>exit_to_app</mat-icon> Leave Meeting
          </button>
        </div>
      </div>

      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Joining meeting...</p>
      </div>

      <div #dailyContainer class="daily-container" [class.hidden]="loading"></div>

      <div *ngIf="error" class="error-container">
        <mat-icon>error</mat-icon>
        <p>{{ error }}</p>
        <button mat-raised-button color="primary" (click)="goBack()">
          Go Back
        </button>
      </div>
    </div>
  `,
  styles: [`
    .meeting-room-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background-color: #000;
    }

    .meeting-header {
      background-color: #1e1e1e;
      color: white;
      padding: 15px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 1000;
    }

    .meeting-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .daily-container {
      flex: 1;
      width: 100%;
      position: relative;
    }

    .daily-container.hidden {
      display: none;
    }

    .loading-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
    }

    .loading-container p {
      margin-top: 20px;
      font-size: 16px;
    }

    .error-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      gap: 20px;
    }

    .error-container mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #f44336;
    }

    .error-container p {
      font-size: 18px;
      text-align: center;
    }
  `]
})
export class StudentMeetingRoomComponent implements OnInit, OnDestroy {
  @ViewChild('dailyContainer', { static: false }) dailyContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private socketService = inject(SocketService);
  private emotionService = inject(EmotionTrackingService);
  private configService = inject(ConfigService);
  private authService = inject(AuthService);

  loading = true;
  error = '';
  meetingTopic = '';
  meetingId = '';
  
  private callFrame: any = null;
  private currentUser: any = null;
  private sessionId: string = '';
  private emotionTrackingInterval = 60000; // Default 1 minute

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
    this.cleanupCallFrame();
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

  private async joinWithToken(roomUrl: string, token: string) {
    try {
      // Create Daily call frame
      this.callFrame = DailyIframe.createFrame(this.dailyContainer.nativeElement, {
        showLeaveButton: false,
        showFullscreenButton: true,
        iframeStyle: {
          position: 'absolute',
          width: '100%',
          height: '100%',
          border: '0',
          borderRadius: '8px'
        }
      });

      // Set up event listeners
      this.callFrame
        .on('joined-meeting', () => {
          this.loading = false;
          this.snackBar.open('You have joined the meeting', 'Close', { duration: 3000 });
          
          // Join meeting via Socket.IO for attendance tracking
          this.socketService.joinMeeting(
            this.meetingId,
            this.currentUser._id,
            `${this.currentUser.firstName} ${this.currentUser.lastName}`
          );
          
          // Start emotion tracking
          this.initializeEmotionTracking();
        })
        .on('left-meeting', () => {
          this.handleLeaveMeeting();
        })
        .on('error', (error: any) => {
          console.error('Daily error:', error);
          this.loading = false;
          this.error = 'An error occurred during the meeting';
          this.snackBar.open('Meeting error occurred', 'Close', { duration: 3000 });
        });

      // Join the meeting
      await this.callFrame.join({ url: roomUrl, token });
      
    } catch (error: any) {
      console.error('Error joining meeting:', error);
      this.loading = false;
      this.error = 'Failed to join meeting room';
      this.snackBar.open('Failed to join meeting', 'Close', { duration: 3000 });
    }
  }

  leaveMeeting() {
    if (this.callFrame) {
      this.callFrame.leave();
    } else {
      this.goBack();
    }
  }

  private handleLeaveMeeting() {
    this.cleanupCallFrame();
    this.snackBar.open('You have left the meeting', 'Close', { duration: 3000 });
    this.goBack();
  }

  private cleanupCallFrame() {
    if (this.callFrame) {
      try {
        this.callFrame.destroy();
      } catch (error) {
        console.error('Error destroying call frame:', error);
      }
      this.callFrame = null;
    }
  }

  goBack() {
    this.router.navigate(['/student/meetings']);
  }

  /**
   * Initialize emotion tracking
   */
  private async initializeEmotionTracking() {
    try {
      // Load Face-API models
      await this.emotionService.loadModels();
      
      // Start webcam
      await this.emotionService.startWebcam();
      
      // Start emotion tracking with callback
      this.emotionService.startTracking(
        (emotionResult: EmotionResult) => this.handleEmotionUpdate(emotionResult),
        this.emotionTrackingInterval
      );
      
      this.snackBar.open('Emotion tracking started', 'Close', { duration: 2000 });
      
    } catch (error: any) {
      console.error('❌ Error initializing emotion tracking:', error);
      this.snackBar.open(
        error.message || 'Failed to start emotion tracking. Please check camera permissions.',
        'Close',
        { duration: 5000 }
      );
    }
  }

  /**
   * Handle emotion update from tracking service
   */
  private handleEmotionUpdate(emotionResult: EmotionResult) {
    // Send emotion update to server via Socket.IO
    this.socketService.sendEmotionUpdate(
      this.meetingId,
      this.currentUser._id,
      emotionResult.emotions,
      emotionResult.dominantEmotion,
      emotionResult.faceDetected,
      emotionResult.confidence,
      this.sessionId
    );
  }

  /**
   * Cleanup emotion tracking resources
   */
  private cleanupEmotionTracking() {
    this.emotionService.cleanup();
  }
}
