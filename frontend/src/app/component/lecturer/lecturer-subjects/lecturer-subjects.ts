import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { LecturerLayout } from '../lecturer-layout/lecturer-layout';
import { AuthService } from '../../../services/auth.service';
import { LecturerService, SubjectDetail } from '../../../services/lecturer.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subject-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatCardModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>class</mat-icon>
          {{ subject.name }}
        </h2>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <!-- Subject Code and Credits -->
        <div class="header-info">
          <mat-chip class="code-chip">{{ subject.code }}</mat-chip>
          <mat-chip class="credit-chip">{{ subject.creditHours }} Credit{{ subject.creditHours > 1 ? 's' : '' }}</mat-chip>
        </div>

        <!-- Course & Batch Info -->
        <div class="info-section">
          <div class="info-row">
            <div class="info-item">
              <mat-icon class="info-icon">school</mat-icon>
              <div class="info-details">
                <span class="info-label">Course</span>
                <span class="info-value">{{ subject.course.name }}</span>
                <span class="info-code">{{ subject.course.code }}</span>
              </div>
            </div>
          </div>

          <div class="info-row">
            <div class="info-item">
              <mat-icon class="info-icon">group</mat-icon>
              <div class="info-details">
                <span class="info-label">Batch</span>
                <span class="info-value">{{ subject.batch.name }}</span>
                <span class="info-code">{{ subject.batch.startYear }} - {{ subject.batch.endYear }}</span>
              </div>
            </div>
          </div>

          <div class="info-row">
            <div class="info-item">
              <mat-icon class="info-icon">calendar_today</mat-icon>
              <div class="info-details">
                <span class="info-label">Semester</span>
                <span class="info-value">{{ subject.semester.name }}</span>
              </div>
            </div>
          </div>

          <div class="info-row">
            <div class="info-item">
              <mat-icon class="info-icon">business</mat-icon>
              <div class="info-details">
                <span class="info-label">Department</span>
                <span class="info-value">{{ subject.department.name }}</span>
                <span class="info-code">{{ subject.department.code }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Description -->
        <div class="description-section" *ngIf="subject.description">
          <h3>Description</h3>
          <p>{{ subject.description }}</p>
        </div>

        <!-- Statistics Grid -->
        <h3>Statistics</h3>
        <div class="stats-grid">
          <!-- Modules -->
          <div class="stat-box modules">
            <mat-icon>menu_book</mat-icon>
            <div class="stat-info">
              <span class="stat-number">{{ subject.statistics.moduleCount }}</span>
              <span class="stat-label">Modules</span>
            </div>
          </div>

          <!-- Assignments -->
          <div class="stat-box assignments">
            <mat-icon>assignment</mat-icon>
            <div class="stat-info">
              <span class="stat-number">{{ subject.statistics.assignmentCount }}</span>
              <span class="stat-label">Assignments</span>
            </div>
            <div class="sub-stat">
              <span class="pending">{{ subject.statistics.assignmentBreakdown.pending }} pending</span>
              <span class="completed">{{ subject.statistics.assignmentBreakdown.completed }} done</span>
            </div>
          </div>

          <!-- Meetings -->
          <div class="stat-box meetings">
            <mat-icon>video_call</mat-icon>
            <div class="stat-info">
              <span class="stat-number">{{ subject.statistics.meetingCount }}</span>
              <span class="stat-label">Meetings</span>
            </div>
            <div class="sub-stat">
              <span class="scheduled">{{ subject.statistics.meetingBreakdown.scheduled }} scheduled</span>
              <span class="completed">{{ subject.statistics.meetingBreakdown.completed }} done</span>
            </div>
          </div>

          <!-- Students -->
          <div class="stat-box students">
            <mat-icon>people</mat-icon>
            <div class="stat-info">
              <span class="stat-number">{{ subject.statistics.studentCount }}</span>
              <span class="stat-label">Students</span>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-raised-button mat-dialog-close>Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      max-width: 800px;
      min-width: 600px;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-header h2 {
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #2c3e50;
      font-size: 1.5em;
    }

    .close-btn {
      color: #666;
    }

    .dialog-content {
      padding: 24px !important;
      max-height: 70vh;
      overflow-y: auto;
    }

    .header-info {
      display: flex;
      gap: 12px;
      margin-bottom: 24px;
    }

    .code-chip {
      background: #f5f5f5;
      color: #666;
      font-family: monospace;
    }

    .credit-chip {
      background: linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%);
      color: white;
    }

    .info-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .info-row {
      display: flex;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 12px;
      flex: 1;
    }

    .info-icon {
      color: #9C27B0;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .info-label {
      font-size: 0.75em;
      color: #6c757d;
      font-weight: 500;
      text-transform: uppercase;
    }

    .info-value {
      font-size: 1em;
      color: #2c3e50;
      font-weight: 600;
    }

    .info-code {
      font-size: 0.8em;
      color: #9e9e9e;
      font-family: monospace;
    }

    .description-section {
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 3px solid #9C27B0;
    }

    .description-section h3 {
      margin: 0 0 12px;
      color: #2c3e50;
      font-size: 1em;
    }

    .description-section p {
      margin: 0;
      color: #495057;
      line-height: 1.6;
    }

    h3 {
      color: #2c3e50;
      margin: 0 0 16px;
      font-size: 1.1em;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .stat-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
    }

    .stat-box mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-number {
      font-size: 2em;
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.85em;
      font-weight: 500;
      text-transform: uppercase;
    }

    .sub-stat {
      margin-top: 8px;
      font-size: 0.75em;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .sub-stat span {
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }

    .stat-box.modules {
      background: #e8eaf6;
      color: #5e35b1;
    }

    .stat-box.assignments {
      background: #fff3e0;
      color: #ef6c00;
    }

    .stat-box.assignments .pending {
      background: #ffccbc;
      color: #d84315;
    }

    .stat-box.assignments .completed {
      background: #c8e6c9;
      color: #2e7d32;
    }

    .stat-box.meetings {
      background: #e0f2f1;
      color: #00897b;
    }

    .stat-box.meetings .scheduled {
      background: #b2dfdb;
      color: #00695c;
    }

    .stat-box.meetings .completed {
      background: #c8e6c9;
      color: #2e7d32;
    }

    .stat-box.students {
      background: #f3e5f5;
      color: #8e24aa;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class SubjectDetailDialog {
  subject!: SubjectDetail;
}

@Component({
  selector: 'app-lecturer-subjects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSelectModule,
    LecturerLayout
  ],
  templateUrl: './lecturer-subjects.html',
  styleUrl: './lecturer-subjects.css'
})
export class LecturerSubjects implements OnInit {
  loading = true;
  subjects: SubjectDetail[] = [];
  filteredSubjects: SubjectDetail[] = [];
  lecturerId: string = '';
  
  // Filter properties
  searchText: string = '';
  selectedCourse: string = 'all';
  selectedBatch: string = 'all';
  selectedSemester: string = 'all';
  
  // For filters
  courses: string[] = [];
  batches: string[] = [];
  semesters: string[] = [];
  
  // Table columns
  displayedColumns: string[] = ['subject', 'course', 'batch', 'semester', 'modules', 'assignments', 'meetings', 'students', 'actions'];

  constructor(
    private authService: AuthService,
    private lecturerService: LecturerService,
    private router: Router,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Get current user ID
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser._id) {
      this.lecturerId = currentUser._id;
      this.loadSubjects();
    } else {
      console.error('No user logged in');
      this.loading = false;
    }
  }

  loadSubjects(): void {
    this.loading = true;
    this.lecturerService.getSubjectDetails(this.lecturerId).subscribe({
      next: (response) => {
        if (response.success) {
          this.subjects = response.data;
          this.filteredSubjects = [...this.subjects];
          this.extractFilterOptions();
          console.log('Subjects loaded:', this.subjects);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.loading = false;
      }
    });
  }

  extractFilterOptions(): void {
    // Extract unique courses, batches, and semesters
    this.courses = [...new Set(this.subjects.map(s => s.course.name))];
    this.batches = [...new Set(this.subjects.map(s => s.batch.name))];
    this.semesters = [...new Set(this.subjects.map(s => s.semester.name))];
  }

  applyFilters(): void {
    this.filteredSubjects = this.subjects.filter(subject => {
      const matchesSearch = this.searchText === '' || 
        subject.name.toLowerCase().includes(this.searchText.toLowerCase()) ||
        subject.code.toLowerCase().includes(this.searchText.toLowerCase());
      
      const matchesCourse = this.selectedCourse === 'all' || subject.course.name === this.selectedCourse;
      const matchesBatch = this.selectedBatch === 'all' || subject.batch.name === this.selectedBatch;
      const matchesSemester = this.selectedSemester === 'all' || subject.semester.name === this.selectedSemester;
      
      return matchesSearch && matchesCourse && matchesBatch && matchesSemester;
    });
  }

  clearFilters(): void {
    this.searchText = '';
    this.selectedCourse = 'all';
    this.selectedBatch = 'all';
    this.selectedSemester = 'all';
    this.applyFilters();
  }

  viewSubjectDetails(subject: SubjectDetail): void {
    const dialogRef = this.dialog.open(SubjectDetailDialog, {
      width: '800px',
      maxWidth: '90vw',
      data: subject,
      panelClass: 'subject-detail-dialog'
    });

    dialogRef.componentInstance.subject = subject;
  }
}
