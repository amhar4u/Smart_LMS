import { Component, OnInit, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { StudentLayout } from '../student-layout/student-layout';

import { StudentAssignment, StudentAssignmentService } from '../../../services/student-assignment.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-view-assignments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    MatDividerModule,
    StudentLayout
  ],
  templateUrl: './view-assignments-table.component.html',
  styleUrls: ['./view-assignments-table.component.css']
})
export class ViewAssignmentsComponent implements OnInit {
  assignments: StudentAssignment[] = [];
  filteredAssignments: StudentAssignment[] = [];
  subjects: any[] = [];
  
  // Filters
  selectedSubject: string = '';
  selectedDueDateRange: string = '';
  selectedType: string = '';
  selectedStatus: string = '';
  
  // Table columns
  displayedColumns: string[] = ['title', 'subject', 'type', 'totalMarks', 'dueDate', 'duration', 'status', 'actions'];
  
  isLoading = false;
  currentUser: any;

  constructor(
    private studentAssignmentService: StudentAssignmentService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadAssignments();
  }

  loadCurrentUser() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (!user) {
        this.snackBar.open('Please log in to view assignments', 'Close', { duration: 3000 });
      }
    });
  }

  loadAssignments() {
    this.isLoading = true;
    
    this.studentAssignmentService.getActiveAssignments().subscribe({
      next: (response) => {
        this.assignments = response.data;
        this.extractSubjects();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
        this.snackBar.open('Error loading assignments', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  extractSubjects() {
    const subjectMap = new Map();
    this.assignments.forEach(assignment => {
      if (assignment.subject && assignment.subject._id) {
        subjectMap.set(assignment.subject._id, assignment.subject);
      }
    });
    this.subjects = Array.from(subjectMap.values());
  }

  applyFilters() {
    this.filteredAssignments = this.assignments.filter(assignment => {
      // Subject filter
      if (this.selectedSubject && assignment.subject?._id !== this.selectedSubject) {
        return false;
      }

      // Due date range filter
      if (this.selectedDueDateRange) {
        if (!this.matchesDueDateRange(assignment.dueDate, this.selectedDueDateRange)) {
          return false;
        }
      }

      // Type filter
      if (this.selectedType && assignment.assignmentType !== this.selectedType) {
        return false;
      }

      // Status filter
      if (this.selectedStatus) {
        const status = this.getAssignmentStatus(assignment);
        if (status !== this.selectedStatus) {
          return false;
        }
      }

      return true;
    });
  }

  matchesDueDateRange(dueDate: Date | string, range: string): boolean {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    switch (range) {
      case 'today':
        return diffDays === 0;
      case 'tomorrow':
        return diffDays === 1;
      case 'this_week':
        return diffDays >= 0 && diffDays <= 7;
      case 'next_week':
        return diffDays > 7 && diffDays <= 14;
      case 'overdue':
        return diffTime < 0;
      default:
        return true;
    }
  }

  getAssignmentStatus(assignment: StudentAssignment): string {
    if (assignment.hasSubmitted) {
      if (assignment.submissionStatus?.evaluationStatus === 'completed') {
        return 'graded';
      }
      return 'submitted';
    }
    if (this.isAssignmentExpired(assignment)) {
      return 'expired';
    }
    if (this.canStartAssignment(assignment)) {
      return 'available';
    }
    return 'upcoming';
  }

  clearFilters() {
    this.selectedSubject = '';
    this.selectedDueDateRange = '';
    this.selectedType = '';
    this.selectedStatus = '';
    this.applyFilters();
  }

  hasActiveFilters(): boolean {
    return !!(this.selectedSubject || this.selectedDueDateRange || this.selectedType || this.selectedStatus);
  }

  refreshAssignments() {
    this.loadAssignments();
    this.snackBar.open('Assignments refreshed', 'Close', { duration: 2000 });
  }

  canStartAssignment(assignment: StudentAssignment): boolean {
    const now = new Date();
    const startDate = new Date(assignment.startDate);
    const endDate = new Date(assignment.dueDate);
    
    return !assignment.hasSubmitted && 
           !assignment.isStarted && 
           startDate <= now && 
           endDate >= now;
  }

  isAssignmentExpired(assignment: StudentAssignment): boolean {
    const now = new Date();
    const endDate = new Date(assignment.dueDate);
    return endDate < now;
  }

  isUrgent(assignment: StudentAssignment): boolean {
    const now = new Date();
    const due = new Date(assignment.dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    return diffTime > 0 && diffHours <= 24;
  }

  startAssignment(assignment: StudentAssignment) {
    if (!this.canStartAssignment(assignment)) {
      this.snackBar.open('This assignment cannot be started at this time', 'Close', { duration: 3000 });
      return;
    }

    this.router.navigate(['/student/take-assignment', assignment._id]);
  }

  viewResults(assignment: StudentAssignment) {
    if (!assignment.hasSubmitted) {
      this.snackBar.open('You have not submitted this assignment yet', 'Close', { duration: 3000 });
      return;
    }

    this.router.navigate(['/student/assignment-result', assignment._id]);
  }

  viewAssignmentDetails(assignment: StudentAssignment) {
    this.dialog.open(AssignmentDetailsDialog, {
      width: '800px',
      maxHeight: '90vh',
      data: assignment
    });
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getDuration(assignment: StudentAssignment): string {
    // Show the time limit for the assignment
    if (assignment.timeLimit) {
      const minutes = assignment.timeLimit;
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remainingMins = minutes % 60;
        if (remainingMins === 0) {
          return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
        }
        return `${hours}h ${remainingMins}m`;
      }
      return `${minutes} ${minutes === 1 ? 'min' : 'mins'}`;
    }
    return 'N/A';
  }

  getTimeRemaining(endDate: Date | string): string {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    
    if (diffTime <= 0) {
      return 'Expired';
    }
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      const diffMinutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes}m`;
    }
  }

  getUrgencyClass(endDate: Date | string): string {
    const now = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    
    if (diffTime <= 0) return 'urgency-expired';
    if (diffHours <= 6) return 'urgency-critical';
    if (diffHours <= 24) return 'urgency-high';
    if (diffHours <= 72) return 'urgency-medium';
    return 'urgency-normal';
  }

  getTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'MCQ': 'type-mcq',
      'short_answer': 'type-short',
      'essay': 'type-essay'
    };
    return classes[type] || 'type-normal';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'MCQ': 'Multiple Choice',
      'short_answer': 'Short Answer',
      'essay': 'Essay'
    };
    return labels[type] || type;
  }

  getStatusBadgeClass(assignment: StudentAssignment): string {
    if (assignment.hasSubmitted) {
      if (assignment.submissionStatus?.evaluationStatus === 'completed') {
        return 'status-graded';
      }
      return 'status-submitted';
    }
    if (this.isAssignmentExpired(assignment)) {
      return 'status-expired';
    }
    if (this.canStartAssignment(assignment)) {
      return 'status-available';
    }
    return 'status-upcoming';
  }

  getStatusText(assignment: StudentAssignment): string {
    if (assignment.hasSubmitted) {
      if (assignment.submissionStatus?.evaluationStatus === 'completed') {
        return 'Graded';
      }
      if (assignment.submissionStatus?.evaluationStatus === 'evaluating') {
        return 'Evaluating';
      }
      return 'Submitted';
    }
    if (this.isAssignmentExpired(assignment)) {
      return 'Expired';
    }
    if (this.canStartAssignment(assignment)) {
      return 'Available';
    }
    return 'Upcoming';
  }
}

// Assignment Details Dialog Component
@Component({
  selector: 'assignment-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="assignment-details-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>assignment</mat-icon>
          Assignment Details
        </h2>
        <button mat-icon-button mat-dialog-close>
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <!-- Title Section -->
        <div class="title-section">
          <h1 class="assignment-main-title">{{data.title}}</h1>
          <p class="assignment-description" *ngIf="data.description">{{data.description}}</p>
        </div>

        <mat-divider></mat-divider>

        <!-- Basic Information Section -->
        <div class="section-block">
          <div class="section-header">
            <mat-icon>info</mat-icon>
            <h3>Basic Information</h3>
          </div>
          <div class="details-grid">
            <div class="detail-item">
              <span class="label">Subject</span>
              <span class="value">
                <mat-chip class="subject-chip">{{data.subject?.name || 'N/A'}}</mat-chip>
                <span class="subject-code" *ngIf="data.subject?.code">{{data.subject.code}}</span>
              </span>
            </div>

            <div class="detail-item">
              <span class="label">Course</span>
              <span class="value">{{data.course?.name || 'N/A'}}</span>
            </div>

            <div class="detail-item">
              <span class="label">Assignment Type</span>
              <span class="value">
                <mat-chip [class]="getTypeBadgeClass(data.assignmentType)">
                  {{getTypeLabel(data.assignmentType)}}
                </mat-chip>
              </span>
            </div>

            <div class="detail-item">
              <span class="label">Difficulty Level</span>
              <span class="value">
                <mat-chip [class]="'level-' + data.assignmentLevel">
                  {{data.assignmentLevel | titlecase}}
                </mat-chip>
              </span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Assessment Details Section -->
        <div class="section-block">
          <div class="section-header">
            <mat-icon>quiz</mat-icon>
            <h3>Assessment Details</h3>
          </div>
          <div class="details-grid">
            <div class="detail-item">
              <span class="label">Total Marks</span>
              <span class="value marks-highlight">
                <mat-icon>grade</mat-icon>
                <strong>{{ (data.totalMarks || data.maxMarks || 0) }}</strong> marks
              </span>
            </div>

            <div class="detail-item">
              <span class="label">Passing Marks</span>
              <span class="value">
                <strong>{{ data.passingMarks || 'Not set' }}</strong>
              </span>
            </div>

            <div class="detail-item">
              <span class="label">Number of Questions</span>
              <span class="value">
                <mat-icon>help_outline</mat-icon>
                <strong>{{ data.numberOfQuestions || (data.questions && data.questions.length) || 0 }}</strong>
              </span>
            </div>

            <div class="detail-item">
              <span class="label">Time Limit</span>
              <span class="value time-highlight">
                <mat-icon>timer</mat-icon>
                <strong>{{ getTimeLimit(data.timeLimit) }}</strong>
              </span>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Schedule Section -->
        <div class="section-block">
          <div class="section-header">
            <mat-icon>schedule</mat-icon>
            <h3>Schedule</h3>
          </div>
          <div class="details-grid">
            <div class="detail-item">
              <span class="label">Start Date</span>
              <span class="value">
                <mat-icon>play_circle_outline</mat-icon>
                {{ formatDateTime(data.startDate) }}
              </span>
            </div>

            <div class="detail-item">
              <span class="label">Due Date</span>
              <span class="value due-date-highlight">
                <mat-icon>event</mat-icon>
                <strong>{{ formatDateTime(data.dueDate) }}</strong>
              </span>
            </div>
          </div>
        </div>

        <mat-divider *ngIf="data.modules && data.modules.length > 0"></mat-divider>

        <!-- Modules Section -->
        <div class="section-block" *ngIf="data.modules && data.modules.length > 0">
          <div class="section-header">
            <mat-icon>library_books</mat-icon>
            <h3>Related Modules</h3>
          </div>
          <div class="modules-container">
            <mat-chip *ngFor="let module of data.modules" class="module-chip">
              <mat-icon>book</mat-icon>
              {{module.title || module.name || 'Module'}}
            </mat-chip>
          </div>
        </div>

        <mat-divider *ngIf="(data.batch || data.semester)"></mat-divider>

        <!-- Additional Info Section -->
        <div class="section-block" *ngIf="(data.batch || data.semester)">
          <div class="section-header">
            <mat-icon>school</mat-icon>
            <h3>Class Information</h3>
          </div>
          <div class="details-grid">
            <div class="detail-item" *ngIf="data.batch">
              <span class="label">Batch</span>
              <span class="value">{{data.batch.name}}</span>
            </div>

            <div class="detail-item" *ngIf="data.semester">
              <span class="label">Semester</span>
              <span class="value">{{data.semester.name}}</span>
            </div>
          </div>
        </div>

        <mat-divider *ngIf="data.instructions"></mat-divider>

        <!-- Instructions Section -->
        <div class="section-block" *ngIf="data.instructions">
          <div class="section-header">
            <mat-icon>description</mat-icon>
            <h3>Instructions</h3>
          </div>
          <div class="instructions-content">
            {{data.instructions}}
          </div>
        </div>

        <mat-divider *ngIf="data.hasSubmitted && data.submissionStatus"></mat-divider>

        <!-- Submission Status Section -->
        <div class="section-block submission-section" *ngIf="data.hasSubmitted && data.submissionStatus">
          <div class="section-header">
            <mat-icon>check_circle</mat-icon>
            <h3>Submission Status</h3>
          </div>
          <div class="details-grid">
            <div class="detail-item">
              <span class="label">Submitted At</span>
              <span class="value">
                <mat-icon>done</mat-icon>
                {{formatDateTime(data.submissionStatus.submittedAt)}}
              </span>
            </div>

            <div class="detail-item">
              <span class="label">Evaluation Status</span>
              <span class="value">
                <mat-chip [class]="'status-' + data.submissionStatus.evaluationStatus">
                  {{data.submissionStatus.evaluationStatus | titlecase}}
                </mat-chip>
              </span>
            </div>

            <!-- Show evaluation in progress message -->
            <div class="detail-item full-width" *ngIf="data.submissionStatus.evaluationStatus === 'evaluating'">
              <span class="value" style="color: #ff9800; font-style: italic;">
                <mat-icon style="vertical-align: middle;">hourglass_empty</mat-icon>
                Your assignment is being evaluated. Results will be available soon.
              </span>
            </div>

            <!-- Show results only when evaluation is completed -->
            <div class="detail-item" *ngIf="data.submissionStatus.evaluationStatus === 'completed' && data.submissionStatus.marks !== undefined">
              <span class="label">Marks Obtained</span>
              <span class="value marks-obtained">
                <strong>{{data.submissionStatus.marks}}</strong> / {{data.totalMarks || data.maxMarks}}
              </span>
            </div>

            <div class="detail-item" *ngIf="data.submissionStatus.evaluationStatus === 'completed' && data.submissionStatus.percentage !== undefined">
              <span class="label">Percentage</span>
              <span class="value percentage-highlight">
                <strong>{{data.submissionStatus.percentage}}%</strong>
              </span>
            </div>

            <div class="detail-item full-width" *ngIf="data.submissionStatus.evaluationStatus === 'completed' && data.submissionStatus.level">
              <span class="label">Performance Level</span>
              <span class="value">
                <mat-chip [class]="'level-' + data.submissionStatus.level">
                  {{data.submissionStatus.level | titlecase}}
                </mat-chip>
              </span>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="dialog-actions">
        <button mat-button mat-dialog-close class="close-btn">Close</button>
        <button 
          mat-raised-button 
          color="primary"
          *ngIf="!data.hasSubmitted && data.canStart"
          [mat-dialog-close]="true"
          (click)="onStartAssignment()"
          class="start-btn">
          <mat-icon>play_arrow</mat-icon>
          Start Assignment
        </button>
        <button 
          mat-raised-button 
          color="accent"
          *ngIf="data.hasSubmitted && data.submissionStatus?.evaluationStatus === 'completed'"
          [mat-dialog-close]="true"
          (click)="onViewResults()"
          class="results-btn">
          <mat-icon>visibility</mat-icon>
          View Results
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .assignment-details-dialog {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 4px 4px 0 0;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 1.5rem;
      color: white;
    }

    .dialog-header button {
      color: white;
    }

    .dialog-content {
      padding: 0 !important;
      overflow-y: auto;
    }

    .title-section {
      padding: 24px;
      background: #f8f9fa;
    }

    .assignment-main-title {
      margin: 0 0 12px 0;
      font-size: 1.75rem;
      font-weight: 600;
      color: #212529;
    }

    .assignment-description {
      color: #6c757d;
      line-height: 1.6;
      margin: 0;
      font-size: 1rem;
    }

    .section-block {
      padding: 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e9ecef;
    }

    .section-header mat-icon {
      color: #667eea;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #495057;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 24px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .detail-item.full-width {
      grid-column: 1 / -1;
    }

    .label {
      font-weight: 600;
      color: #6c757d;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .value {
      color: #212529;
      font-size: 1rem;
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .value mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #667eea;
    }

    .value strong {
      font-size: 1.125rem;
      color: #212529;
    }

    .marks-highlight strong {
      color: #667eea;
      font-size: 1.5rem;
    }

    .time-highlight strong {
      color: #f57c00;
    }

    .due-date-highlight strong {
      color: #c62828;
    }

    .marks-obtained strong {
      color: #2e7d32;
      font-size: 1.25rem;
    }

    .percentage-highlight strong {
      color: #1976d2;
      font-size: 1.25rem;
    }

    .subject-chip {
      background: #e3f2fd !important;
      color: #1976d2 !important;
      font-weight: 500;
    }

    .subject-code {
      color: #6c757d;
      font-size: 0.875rem;
      margin-left: 4px;
    }

    .modules-container {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .module-chip {
      background: #f3e5f5 !important;
      color: #7b1fa2 !important;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px !important;
      height: auto !important;
    }

    .module-chip mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #7b1fa2;
    }

    .instructions-content {
      background: #fff3e0;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #f57c00;
      line-height: 1.8;
      color: #5d4037;
      white-space: pre-wrap;
      font-size: 1rem;
    }

    .submission-section {
      background: #e8f5e9;
      border-left: 4px solid #2e7d32;
    }

    mat-chip {
      font-weight: 500;
      padding: 6px 12px !important;
      height: auto !important;
    }

    .type-mcq {
      background: #e1f5fe !important;
      color: #0277bd !important;
    }

    .type-short {
      background: #fff3e0 !important;
      color: #e65100 !important;
    }

    .type-essay {
      background: #fce4ec !important;
      color: #c2185b !important;
    }

    .level-easy {
      background: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    .level-medium {
      background: #fff3e0 !important;
      color: #f57c00 !important;
    }

    .level-hard {
      background: #ffebee !important;
      color: #c62828 !important;
    }

    .status-completed {
      background: #e8f5e9 !important;
      color: #2e7d32 !important;
    }

    .status-evaluating {
      background: #fff3e0 !important;
      color: #f57c00 !important;
    }

    .status-pending {
      background: #f5f5f5 !important;
      color: #666 !important;
    }

    .dialog-actions {
      padding: 16px 24px !important;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      gap: 12px;
    }

    .close-btn {
      color: #6c757d;
    }

    .start-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      padding: 0 24px !important;
      height: 44px !important;
      font-size: 1rem !important;
      font-weight: 500 !important;
    }

    .results-btn {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;
      color: white !important;
      padding: 0 24px !important;
      height: 44px !important;
      font-size: 1rem !important;
      font-weight: 500 !important;
    }

    @media (max-width: 768px) {
      .details-grid {
        grid-template-columns: 1fr;
      }

      .assignment-main-title {
        font-size: 1.5rem;
      }

      .section-header h3 {
        font-size: 1.125rem;
      }
    }
  `]
})
export class AssignmentDetailsDialog {
  private router = inject(Router);
  private dialogRef = inject(MatDialogRef<AssignmentDetailsDialog>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: StudentAssignment) {
    console.log('Assignment Details Data:', data);
    console.log('Total Marks:', data.totalMarks, 'Max Marks:', data.maxMarks);
    console.log('Number of Questions:', data.numberOfQuestions);
    console.log('Time Limit:', data.timeLimit);
    console.log('Course:', data.course);
    console.log('Subject:', data.subject);
  }

  onStartAssignment() {
    this.dialogRef.close();
    this.router.navigate(['/student/take-assignment', this.data._id]);
  }

  onViewResults() {
    this.dialogRef.close();
    this.router.navigate(['/student/assignment-result', this.data._id]);
  }

  formatDateTime(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeLimit(minutes: number): string {
    if (!minutes || minutes === 0) return 'Not specified';
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      if (remainingMins === 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      }
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMins} ${remainingMins === 1 ? 'minute' : 'minutes'}`;
    }
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }

  getTypeBadgeClass(type: string): string {
    const classes: { [key: string]: string } = {
      'MCQ': 'type-mcq',
      'short_answer': 'type-short',
      'essay': 'type-essay'
    };
    return classes[type] || 'type-normal';
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'MCQ': 'Multiple Choice',
      'short_answer': 'Short Answer',
      'essay': 'Essay'
    };
    return labels[type] || type;
  }
}
