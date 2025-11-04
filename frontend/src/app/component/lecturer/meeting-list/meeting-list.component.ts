import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MeetingService, Meeting } from '../../../services/meeting.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  template: `
    <div class="meeting-list-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>My Meetings</mat-card-title>
          <button mat-raised-button color="primary" (click)="createMeeting()">
            <mat-icon>add</mat-icon> Create Meeting
          </button>
        </mat-card-header>

        <mat-card-content>
          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
          </div>

          <div *ngIf="!loading && meetings.length === 0" class="no-meetings">
            <p>No meetings found</p>
            <button mat-raised-button color="primary" (click)="createMeeting()">
              Create Your First Meeting
            </button>
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
                <p><strong>Description:</strong> {{ meeting.description }}</p>
                <p><strong>Subject:</strong> {{ getSubjectName(meeting) }}</p>
                <p><strong>Date:</strong> {{ meeting.startTime | date:'medium' }}</p>
                <p><strong>Modules:</strong> {{ getModuleNames(meeting) }}</p>
                <p *ngIf="meeting.studentCount > 0">
                  <strong>Students Attended:</strong> {{ meeting.studentCount }}
                </p>
              </div>

              <div class="meeting-actions">
                <button mat-raised-button color="primary" 
                        *ngIf="meeting.status === 'scheduled' && canStartMeeting(meeting)"
                        (click)="startMeeting(meeting)">
                  <mat-icon>videocam</mat-icon> Start Meeting
                </button>

                <button mat-raised-button 
                        *ngIf="meeting.status === 'scheduled' && !canStartMeeting(meeting)"
                        disabled
                        matTooltip="Meeting will be available at scheduled time">
                  <mat-icon>schedule</mat-icon> Waiting
                </button>

                <button mat-raised-button color="accent"
                        *ngIf="meeting.status === 'ongoing'"
                        (click)="joinMeeting(meeting)">
                  <mat-icon>meeting_room</mat-icon> Join Meeting
                </button>

                <button mat-raised-button color="warn"
                        *ngIf="meeting.status === 'ongoing'"
                        (click)="endMeeting(meeting)">
                  <mat-icon>stop</mat-icon> End Meeting
                </button>

                <button mat-button *ngIf="meeting.status === 'scheduled'"
                        (click)="editMeeting(meeting)">
                  <mat-icon>edit</mat-icon> Edit
                </button>

                <button mat-button color="warn" *ngIf="meeting.status === 'scheduled'"
                        (click)="cancelMeeting(meeting)">
                  <mat-icon>cancel</mat-icon> Cancel
                </button>

                <button mat-button *ngIf="meeting.status === 'completed'"
                        (click)="viewDetails(meeting)">
                  <mat-icon>visibility</mat-icon> View Details
                </button>
              </div>

              <div class="time-info" *ngIf="meeting.status === 'scheduled'">
                <small>{{ getTimeUntilMeeting(meeting) }}</small>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .meeting-list-container {
      padding: 20px;
    }

    mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .loading-container {
      display: flex;
      justify-content: center;
      padding: 40px;
    }

    .no-meetings {
      text-align: center;
      padding: 40px;
    }

    .meetings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }

    .meeting-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      background-color: #fff;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      transition: box-shadow 0.3s;
    }

    .meeting-card:hover {
      box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .meeting-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .meeting-header h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }

    .meeting-details {
      margin-bottom: 15px;
    }

    .meeting-details p {
      margin: 8px 0;
      font-size: 14px;
      color: #666;
    }

    .meeting-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 15px;
    }

    .time-info {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 12px;
    }

    mat-chip.status-scheduled {
      background-color: #2196F3;
      color: white;
    }

    mat-chip.status-ongoing {
      background-color: #4CAF50;
      color: white;
    }

    mat-chip.status-completed {
      background-color: #9E9E9E;
      color: white;
    }

    mat-chip.status-cancelled {
      background-color: #F44336;
      color: white;
    }
  `]
})
export class MeetingListComponent implements OnInit, OnDestroy {
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
    this.meetingService.getMeetings().subscribe({
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

  createMeeting() {
    this.router.navigate(['/lecturer/meetings/create']);
  }

  canStartMeeting(meeting: Meeting): boolean {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    return now >= startTime && meeting.status === 'scheduled';
  }

  startMeeting(meeting: Meeting) {
    if (!meeting._id) return;

    this.meetingService.canStartMeeting(meeting._id).subscribe({
      next: (response) => {
        if (response.canStart) {
          this.meetingService.startMeeting(meeting._id!).subscribe({
            next: (startResponse) => {
              this.snackBar.open('Meeting started successfully!', 'Close', { duration: 3000 });
              this.router.navigate(['/lecturer/meetings/room', meeting._id], {
                state: { token: startResponse.token, roomUrl: startResponse.roomUrl }
              });
            },
            error: (error) => {
              this.snackBar.open(error.error?.message || 'Failed to start meeting', 'Close', { 
                duration: 3000 
              });
            }
          });
        } else {
          this.snackBar.open('Meeting cannot be started yet', 'Close', { duration: 3000 });
        }
      },
      error: (error) => {
        this.snackBar.open('Failed to check meeting status', 'Close', { duration: 3000 });
      }
    });
  }

  joinMeeting(meeting: Meeting) {
    this.router.navigate(['/lecturer/meetings/room', meeting._id]);
  }

  endMeeting(meeting: Meeting) {
    if (!meeting._id) return;

    const studentCount = prompt('Enter the number of students who attended:');
    if (studentCount !== null) {
      const count = parseInt(studentCount, 10);
      if (isNaN(count) || count < 0) {
        this.snackBar.open('Please enter a valid number', 'Close', { duration: 3000 });
        return;
      }

      this.meetingService.endMeeting(meeting._id, count).subscribe({
        next: () => {
          this.snackBar.open('Meeting ended successfully!', 'Close', { duration: 3000 });
          this.loadMeetings();
        },
        error: (error) => {
          this.snackBar.open('Failed to end meeting', 'Close', { duration: 3000 });
        }
      });
    }
  }

  editMeeting(meeting: Meeting) {
    this.router.navigate(['/lecturer/meetings/edit', meeting._id]);
  }

  cancelMeeting(meeting: Meeting) {
    if (!meeting._id) return;

    if (confirm(`Are you sure you want to cancel the meeting "${meeting.topic}"?`)) {
      this.meetingService.deleteMeeting(meeting._id).subscribe({
        next: () => {
          this.snackBar.open('Meeting cancelled successfully!', 'Close', { duration: 3000 });
          this.loadMeetings();
        },
        error: (error) => {
          this.snackBar.open('Failed to cancel meeting', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewDetails(meeting: Meeting) {
    this.router.navigate(['/lecturer/meetings/details', meeting._id]);
  }

  getSubjectName(meeting: Meeting): string {
    if (typeof meeting.subjectId === 'string') {
      return meeting.subjectId;
    }
    return (meeting.subjectId as any)?.name || 'N/A';
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
