import { Component, OnInit, OnDestroy, inject, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import DailyIframe from '@daily-co/daily-js';
import { MeetingService } from '../../../services/meeting.service';

@Component({
  selector: 'app-meeting-room',
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
        <p>Loading meeting room...</p>
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
export class MeetingRoomComponent implements OnInit, OnDestroy {
  @ViewChild('dailyContainer', { static: false }) dailyContainer!: ElementRef;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private meetingService = inject(MeetingService);

  loading = true;
  error = '';
  meetingTopic = '';
  meetingId = '';
  
  private callFrame: any = null;

  ngOnInit() {
    this.meetingId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.meetingId) {
      this.error = 'Invalid meeting ID';
      this.loading = false;
      return;
    }

    this.loadMeetingAndJoin();
  }

  ngOnDestroy() {
    this.cleanupCallFrame();
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
          console.log('Joined meeting successfully');
          this.loading = false;
        })
        .on('left-meeting', () => {
          console.log('Left meeting');
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
    this.router.navigate(['/lecturer/meetings']);
  }
}
