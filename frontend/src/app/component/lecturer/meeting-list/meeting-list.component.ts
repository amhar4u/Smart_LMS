import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MeetingService, Meeting } from '../../../services/meeting.service';
import { SubjectService } from '../../../services/subject.service';
import { AuthService } from '../../../services/auth.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { LecturerLayout } from '../lecturer-layout/lecturer-layout';
import { MeetingDialogComponent } from '../../admin/meeting-dialog/meeting-dialog.component';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-meeting-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatPaginatorModule,
    LecturerLayout
  ],
  template: `
    <app-lecturer-layout>
      <div class="manage-meetings-page">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-left">
            <mat-icon class="page-icon">videocam</mat-icon>
            <div class="header-text">
              <h1>Manage Meetings</h1>
              <p class="subtitle">Create and manage video meetings for your subjects</p>
            </div>
          </div>
          <button mat-raised-button color="primary" class="create-btn" (click)="openCreateMeetingDialog()">
            <mat-icon>add</mat-icon>
            Create Meeting
          </button>
        </div>

        <!-- Filters Section -->
        <div class="filters-section">
          <h3 class="filters-title">
            <mat-icon>filter_list</mat-icon>
            Filters
          </h3>
          <div class="filters-grid">
            <mat-form-field appearance="outline">
              <mat-label>Subject</mat-label>
              <mat-select [(ngModel)]="filters.subjectId" (selectionChange)="onFilterChange()">
                <mat-option value="">All Subjects</mat-option>
                <mat-option *ngFor="let subject of lecturerSubjects" [value]="subject._id">
                  {{ subject.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="filters.status" (selectionChange)="onFilterChange()">
                <mat-option value="">All Status</mat-option>
                <mat-option value="scheduled">Scheduled</mat-option>
                <mat-option value="ongoing">Ongoing</mat-option>
                <mat-option value="completed">Completed</mat-option>
                <mat-option value="cancelled">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-stroked-button class="clear-btn" (click)="clearFilters()">
              <mat-icon>close</mat-icon>
              Clear
            </button>
          </div>
        </div>

        <!-- Meetings List -->
        <div class="content-section">
          <div class="section-header">
            <h3>
              <mat-icon>list</mat-icon>
              My Meetings ({{ meetings.length }})
            </h3>
          </div>

          <div *ngIf="loading" class="loading-container">
            <mat-spinner></mat-spinner>
          </div>

          <div *ngIf="!loading && meetings.length === 0" class="no-data">
            <mat-icon>event_busy</mat-icon>
            <p>No meetings found</p>
            <button mat-raised-button color="primary" (click)="openCreateMeetingDialog()">
              Create Your First Meeting
            </button>
          </div>

          <div *ngIf="!loading && meetings.length > 0" class="table-container">
            <table mat-table [dataSource]="meetings" class="data-table">
              <!-- Topic Column -->
              <ng-container matColumnDef="topic">
                <th mat-header-cell *matHeaderCellDef>Topic</th>
                <td mat-cell *matCellDef="let meeting">
                  <div class="topic-cell">
                    <strong>{{ meeting.topic }}</strong>
                    <small>{{ meeting.description | slice:0:50 }}{{ meeting.description.length > 50 ? '...' : '' }}</small>
                  </div>
                </td>
              </ng-container>

              <!-- Subject Column -->
              <ng-container matColumnDef="subject">
                <th mat-header-cell *matHeaderCellDef>Subject</th>
                <td mat-cell *matCellDef="let meeting">{{ getSubjectName(meeting) }}</td>
              </ng-container>

              <!-- Batch Column -->
              <ng-container matColumnDef="batch">
                <th mat-header-cell *matHeaderCellDef>Batch</th>
                <td mat-cell *matCellDef="let meeting">{{ getBatchName(meeting) }}</td>
              </ng-container>

              <!-- Date/Time Column -->
              <ng-container matColumnDef="dateTime">
                <th mat-header-cell *matHeaderCellDef>Date & Time</th>
                <td mat-cell *matCellDef="let meeting">{{ meeting.startTime | date:'short' }}</td>
              </ng-container>

              <!-- Duration Column -->
              <ng-container matColumnDef="duration">
                <th mat-header-cell *matHeaderCellDef>Duration</th>
                <td mat-cell *matCellDef="let meeting">{{ getDuration(meeting) }} min</td>
              </ng-container>

              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef>Status</th>
                <td mat-cell *matCellDef="let meeting">
                  <span class="status-badge" [ngClass]="'status-' + meeting.status">
                    {{ meeting.status | uppercase }}
                  </span>
                </td>
              </ng-container>

              <!-- Students Column -->
              <ng-container matColumnDef="students">
                <th mat-header-cell *matHeaderCellDef>Students</th>
                <td mat-cell *matCellDef="let meeting">
                  <span class="student-count">{{ getMaxStudents(meeting) }}</span>
                </td>
              </ng-container>

              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let meeting">
                  <div class="action-buttons">
                    <!-- Host Meeting Button -->
                    <button mat-mini-fab color="primary" 
                            [matTooltip]="'Host Meeting'"
                            [disabled]="meeting.status !== 'scheduled'"
                            (click)="hostMeeting(meeting)"
                            class="host-btn">
                      <mat-icon>video_call</mat-icon>
                    </button>
                    
                    <button mat-icon-button color="primary" 
                            [matTooltip]="'Edit Meeting'"
                            [disabled]="meeting.status !== 'scheduled'"
                            (click)="editMeeting(meeting)">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button color="accent" 
                            [matTooltip]="'Reschedule'"
                            [disabled]="meeting.status !== 'scheduled'"
                            (click)="rescheduleMeeting(meeting)">
                      <mat-icon>schedule</mat-icon>
                    </button>
                    <button mat-icon-button color="warn" 
                            [matTooltip]="'Delete Meeting'"
                            [disabled]="meeting.status === 'ongoing'"
                            (click)="deleteMeeting(meeting)">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </div>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>

            <!-- Pagination -->
            <mat-paginator 
              [length]="meetings.length"
              [pageSize]="10"
              [pageSizeOptions]="[5, 10, 25, 50]"
              showFirstLastButtons>
            </mat-paginator>
          </div>
        </div>
      </div>
    </app-lecturer-layout>
  `,
  styles: [`
    .manage-meetings-page {
      padding: 30px;
      background: #f5f7fa;
      min-height: 100vh;
    }

    /* Page Header */
    .page-header {
      background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
      padding: 40px;
      border-radius: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      box-shadow: 0 10px 30px rgba(33, 150, 243, 0.3);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
      color: white;
    }

    .page-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .header-text h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
    }

    .subtitle {
      margin: 8px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }

    .create-btn {
      height: 48px;
      padding: 0 32px;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }

    /* Filters Section */
    .filters-section {
      background: white;
      padding: 24px;
      border-radius: 12px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .filters-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      align-items: center;
    }

    .clear-btn {
      height: 56px;
    }

    /* Content Section */
    .content-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .section-header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f0f0f0;
    }

    .section-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    /* Loading & No Data */
    .loading-container {
      display: flex;
      justify-content: center;
      padding: 80px 20px;
    }

    .no-data {
      text-align: center;
      padding: 80px 20px;
      color: #999;
    }

    .no-data mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      opacity: 0.5;
    }

    .no-data p {
      margin-top: 16px;
      font-size: 18px;
      margin-bottom: 20px;
    }

    /* Table */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
    }

    .data-table th {
      background: #f8f9fa;
      font-weight: 600;
      color: #495057;
      padding: 16px;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-table td {
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .data-table tr:hover {
      background: #f8f9fa;
    }

    .topic-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px 0;
    }

    .topic-cell strong {
      color: #333;
      font-size: 15px;
      margin-bottom: 4px;
    }

    .topic-cell small {
      color: #666;
      font-size: 13px;
    }

    /* Status Badges */
    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      display: inline-block;
    }

    .status-badge.status-scheduled {
      background: #e3f2fd;
      color: #1976d2;
    }

    .status-badge.status-ongoing {
      background: #e8f5e9;
      color: #388e3c;
      animation: pulse 2s infinite;
    }

    .status-badge.status-completed {
      background: #f5f5f5;
      color: #757575;
    }

    .status-badge.status-cancelled {
      background: #ffebee;
      color: #c62828;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .student-count {
      font-weight: 600;
      color: #2196F3;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .action-buttons button[disabled] {
      opacity: 0.4;
    }

    .host-btn {
      background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%) !important;
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
    }

    /* Pagination */
    mat-paginator {
      background: transparent;
      margin-top: 16px;
    }
  `]
})
export class MeetingListComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private meetingService = inject(MeetingService);
  private subjectService = inject(SubjectService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);

  meetings: Meeting[] = [];
  lecturerSubjects: any[] = [];
  loading = false;
  currentUser: any = null;
  private refreshSubscription?: Subscription;
  
  filters = {
    subjectId: '',
    status: ''
  };

  displayedColumns: string[] = ['topic', 'subject', 'batch', 'dateTime', 'duration', 'status', 'students', 'actions'];

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadLecturerSubjects();
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

  async loadLecturerSubjects() {
    if (!this.currentUser || !this.currentUser._id) {
      return;
    }

    try {
      const response = await this.subjectService.getSubjects({
        lecturer: this.currentUser._id
      }).toPromise();

      if (response && response.success) {
        this.lecturerSubjects = Array.isArray(response.data) ? response.data : [response.data];
      }
    } catch (error) {
      console.error('Failed to load lecturer subjects', error);
    }
  }

  loadMeetings() {
    this.loading = true;
    const filters: any = {};
    
    if (this.filters.subjectId) filters.subjectId = this.filters.subjectId;
    if (this.filters.status) filters.status = this.filters.status;
    
    // Note: lecturerId filter is automatically applied by backend based on user role

    this.meetingService.getMeetings(filters).subscribe({
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

  onFilterChange() {
    this.loadMeetings();
  }

  clearFilters() {
    this.filters = {
      subjectId: '',
      status: ''
    };
    this.loadMeetings();
  }

  openCreateMeetingDialog() {
    const dialogRef = this.dialog.open(MeetingDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
      data: { meeting: null, lecturerId: this.currentUser._id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMeetings();
      }
    });
  }

  editMeeting(meeting: Meeting) {
    if (meeting.status !== 'scheduled') {
      this.snackBar.open('Only scheduled meetings can be edited', 'Close', { duration: 3000 });
      return;
    }
    
    const dialogRef = this.dialog.open(MeetingDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
      data: { meeting: meeting, lecturerId: this.currentUser._id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMeetings();
      }
    });
  }

  rescheduleMeeting(meeting: Meeting) {
    if (meeting.status !== 'scheduled') {
      this.snackBar.open('Only scheduled meetings can be rescheduled', 'Close', { duration: 3000 });
      return;
    }

    const newDateTime = prompt('Enter new date and time (YYYY-MM-DDTHH:MM):');
    if (!newDateTime) return;

    if (!meeting._id) return;

    this.meetingService.updateMeeting(meeting._id, {
      startTime: new Date(newDateTime).toISOString()
    }).subscribe({
      next: (response) => {
        this.snackBar.open('Meeting rescheduled successfully', 'Close', { duration: 3000 });
        this.loadMeetings();
      },
      error: (error) => {
        this.snackBar.open(
          error.error?.message || 'Failed to reschedule meeting',
          'Close',
          { duration: 3000 }
        );
      }
    });
  }

  deleteMeeting(meeting: Meeting) {
    if (meeting.status === 'ongoing') {
      this.snackBar.open('Cannot delete an ongoing meeting', 'Close', { duration: 3000 });
      return;
    }

    if (!meeting._id) return;

    // Check dependencies before deletion
    this.confirmationService.confirmDeleteWithDependencyCheck(
      meeting._id,
      meeting.topic,
      'meeting'
    ).subscribe(confirmed => {
      if (confirmed && meeting._id) {
        this.meetingService.deleteMeeting(meeting._id).subscribe({
          next: (response) => {
            this.snackBar.open('Meeting deleted successfully', 'Close', { duration: 3000 });
            this.loadMeetings();
          },
          error: (error) => {
            this.snackBar.open(
              error.error?.message || 'Failed to delete meeting',
              'Close',
              { duration: 3000 }
            );
          }
        });
      }
    });
  }

  getSubjectName(meeting: Meeting): string {
    if (typeof meeting.subjectId === 'string') {
      return meeting.subjectId;
    }
    return (meeting.subjectId as any)?.name || 'N/A';
  }

  getBatchName(meeting: Meeting): string {
    if (typeof meeting.batchId === 'string') {
      return meeting.batchId;
    }
    return (meeting.batchId as any)?.name || 'N/A';
  }

  getMaxStudents(meeting: Meeting): number {
    // First try to get studentCount from meeting itself (saved value)
    if (meeting.studentCount !== undefined && meeting.studentCount !== null) {
      return meeting.studentCount;
    }
    
    // Fallback: try to get from batch if populated
    if (typeof meeting.batchId !== 'string') {
      const batch = meeting.batchId as any;
      return batch?.maxStudents || 0;
    }
    
    return 0;
  }

  getDuration(meeting: Meeting): number {
    // Calculate duration from startTime and endTime
    if (meeting.startTime && meeting.endTime) {
      const start = new Date(meeting.startTime);
      const end = new Date(meeting.endTime);
      
      // Check if dates are valid
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return 0;
      }
      
      const diffMs = end.getTime() - start.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      
      return diffMinutes;
    }
    
    return 0;
  }

  hostMeeting(meeting: Meeting) {
    if (meeting.status !== 'scheduled') {
      this.snackBar.open('Only scheduled meetings can be hosted', 'Close', { duration: 3000 });
      return;
    }

    // Check if meeting time has arrived
    const now = new Date();
    const meetingStart = new Date(meeting.startTime);
    const timeDiff = meetingStart.getTime() - now.getTime();
    const minutesDiff = Math.floor(timeDiff / (1000 * 60));

    // Allow hosting 15 minutes before scheduled time
    if (minutesDiff > 15) {
      this.snackBar.open(
        `Meeting can be hosted starting 15 minutes before scheduled time (${minutesDiff} minutes remaining)`,
        'Close',
        { duration: 5000 }
      );
      return;
    }

    // Start meeting and get token
    if (meeting._id) {
      this.meetingService.startMeeting(meeting._id).subscribe({
        next: (response) => {
          // Navigate to our custom meeting room component with token
          this.router.navigate(['/lecturer/meetings/room', meeting._id], {
            state: {
              token: response.token,
              roomUrl: response.roomUrl,
              meetingInfo: {
                topic: meeting.topic,
                description: meeting.description
              }
            }
          });
          this.snackBar.open('Starting meeting...', 'Close', { duration: 2000 });
        },
        error: (error) => {
          console.error('Failed to start meeting', error);
          this.snackBar.open(
            error.error?.message || 'Failed to start meeting',
            'Close',
            { duration: 3000 }
          );
        }
      });
    } else {
      this.snackBar.open('Meeting ID not found', 'Close', { duration: 3000 });
    }
  }
}

