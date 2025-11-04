import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MeetingService, Meeting } from '../../../services/meeting.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-student-meetings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="student-meetings-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Available Meetings</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
          </div>

          <div *ngIf="!loading && meetings.length === 0" class="no-meetings">
            <mat-icon>event_busy</mat-icon>
            <p>No meetings available at this time</p>
          </div>

          <div *ngIf="!loading && meetings.length > 0" class="meetings-grid">
            <div *ngFor="let meeting of meetings" class="meeting-card">
              <div class="meeting-header">
                <h3>{{ meeting.topic }}</h3>
                <mat-chip [class]="'status-' + meeting.status">
                  {{ meeting.status }}
                </mat-chip>
              </div>

              <div class="meeting-details">
                <div class="detail-row">
                  <mat-icon>subject</mat-icon>
                  <span>{{ getSubjectName(meeting) }}</span>
                </div>
                
                <div class="detail-row">
                  <mat-icon>person</mat-icon>
                  <span>{{ getLecturerName(meeting) }}</span>
                </div>

                <div class="detail-row">
                  <mat-icon>schedule</mat-icon>
                  <span>{{ meeting.startTime | date:'medium' }}</span>
                </div>

                <div class="detail-row">
                  <mat-icon>description</mat-icon>
                  <span>{{ meeting.description }}</span>
                </div>

                <div class="detail-row">
                  <mat-icon>book</mat-icon>
                  <span>Modules: {{ getModuleNames(meeting) }}</span>
                </div>
              </div>

              <div class="meeting-actions">
                <button mat-raised-button color="primary"
                        *ngIf="meeting.status === 'ongoing'"
                        (click)="joinMeeting(meeting)">
                  <mat-icon>meeting_room</mat-icon> Join Meeting
                </button>

                <button mat-raised-button 
                        *ngIf="meeting.status === 'scheduled'"
                        disabled>
                  <mat-icon>schedule</mat-icon> Scheduled
                </button>

                <div class="time-info" *ngIf="meeting.status === 'scheduled'">
                  <small>{{ getTimeUntilMeeting(meeting) }}</small>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .student-meetings-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    mat-card-header {
      margin-bottom: 20px;
    }

    mat-card-title {
      font-size: 24px;
      color: #333;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .no-meetings {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-meetings mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #999;
    }

    .no-meetings p {
      margin-top: 20px;
      font-size: 18px;
    }

    .meetings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
    }

    .meeting-card {
      border: 1px solid #ddd;
      border-radius: 12px;
      padding: 24px;
      background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: all 0.3s ease;
    }

    .meeting-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.15);
      transform: translateY(-2px);
    }

    .meeting-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #e0e0e0;
    }

    .meeting-header h3 {
      margin: 0;
      font-size: 20px;
      color: #1a1a1a;
      font-weight: 600;
    }

    .meeting-details {
      margin-bottom: 20px;
    }

    .detail-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 12px;
      color: #555;
    }

    .detail-row mat-icon {
      color: #666;
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-top: 2px;
    }

    .detail-row span {
      flex: 1;
      font-size: 14px;
      line-height: 1.5;
    }

    .meeting-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 20px;
    }

    .meeting-actions button {
      width: 100%;
    }

    .time-info {
      text-align: center;
      padding: 8px;
      background-color: #f0f0f0;
      border-radius: 4px;
      color: #666;
      font-size: 13px;
    }

    mat-chip.status-scheduled {
      background-color: #2196F3;
      color: white;
    }

    mat-chip.status-ongoing {
      background-color: #4CAF50;
      color: white;
      animation: pulse 2s infinite;
    }

    mat-chip.status-completed {
      background-color: #9E9E9E;
      color: white;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.7;
      }
    }

    @media (max-width: 768px) {
      .meetings-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StudentMeetingsComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private meetingService = inject(MeetingService);

  meetings: Meeting[] = [];
  loading = false;
  private refreshSubscription?: Subscription;

  ngOnInit() {
    this.loadMeetings();
    
    // Refresh meeting status every minute
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadMeetings();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadMeetings() {
    this.loading = true;
    this.meetingService.getMeetings({ status: 'scheduled,ongoing' }).subscribe({
      next: (response) => {
        this.meetings = response.meetings || [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to load meetings', 'Close', { duration: 3000 });
      }
    });
  }

  joinMeeting(meeting: Meeting) {
    if (!meeting._id) return;

    this.meetingService.joinMeeting(meeting._id).subscribe({
      next: (response) => {
        this.router.navigate(['/student/meetings/room', meeting._id], {
          state: { 
            token: response.token, 
            roomUrl: response.roomUrl,
            meetingInfo: response.meeting
          }
        });
      },
      error: (error) => {
        this.snackBar.open(
          error.error?.message || 'Failed to join meeting', 
          'Close', 
          { duration: 3000 }
        );
      }
    });
  }

  getSubjectName(meeting: Meeting): string {
    if (typeof meeting.subjectId === 'string') {
      return meeting.subjectId;
    }
    return (meeting.subjectId as any)?.name || 'N/A';
  }

  getLecturerName(meeting: Meeting): string {
    if (typeof meeting.lecturerId === 'string') {
      return meeting.lecturerId;
    }
    const lecturer = meeting.lecturerId as any;
    return lecturer ? `${lecturer.firstName} ${lecturer.lastName}` : 'N/A';
  }

  getModuleNames(meeting: Meeting): string {
    if (!meeting.moduleIds || meeting.moduleIds.length === 0) {
      return 'N/A';
    }
    
    return meeting.moduleIds.map((module: any) => module.name || module).join(', ');
  }

  getTimeUntilMeeting(meeting: Meeting): string {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const diff = startTime.getTime() - now.getTime();

    if (diff < 0) {
      return 'Meeting time has passed';
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `Starts in ${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `Starts in ${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      return `Starts in ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  }
}
