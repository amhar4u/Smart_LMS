import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AuthService } from '../../../services/auth.service';
import { LecturerService, LecturerSubmission } from '../../../services/lecturer.service';
import { SubjectService } from '../../../services/subject.service';
import { AssignmentService } from '../../../services/assignment.service';

@Component({
  selector: 'app-lecturer-submissions-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  templateUrl: './lecturer-submissions-list.component.html',
  styleUrls: ['./lecturer-submissions-list.component.css']
})
export class LecturerSubmissionsListComponent implements OnInit {
  submissions: LecturerSubmission[] = [];
  statistics: any = null;
  loading = false;
  lecturerId: string = '';
  
  // Filters
  filterForm: FormGroup;
  subjects: any[] = [];
  assignments: any[] = [];
  
  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalSubmissions = 0;

  // Table columns
  displayedColumns: string[] = ['student', 'assignment', 'subject', 'submittedAt', 'marks', 'percentage', 'level', 'status', 'actions'];

  constructor(
    private authService: AuthService,
    private lecturerService: LecturerService,
    private subjectService: SubjectService,
    private assignmentService: AssignmentService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      subject: [''],
      assignment: [''],
      evaluationStatus: [''],
      level: [''],
      minPercentage: [''],
      maxPercentage: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser._id) {
      this.lecturerId = currentUser._id;
      this.loadSubjects();
      this.loadSubmissions();
    }

    // Watch for filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadSubmissions();
    });

    // Watch subject selection to load assignments
    this.filterForm.get('subject')?.valueChanges.subscribe((subjectId) => {
      if (subjectId) {
        this.loadAssignmentsForSubject(subjectId);
      } else {
        this.assignments = [];
      }
    });
  }

  loadSubjects(): void {
    this.subjectService.getSubjects({ lecturer: this.lecturerId }).subscribe({
      next: (response) => {
        if (response.success) {
          this.subjects = Array.isArray(response.data) ? response.data : [response.data];
        }
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
      }
    });
  }

  loadAssignmentsForSubject(subjectId: string): void {
    this.assignmentService.getAssignments({ subject: subjectId, page: 1, limit: 100 }).subscribe({
      next: (response) => {
        if (response.success) {
          this.assignments = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
      }
    });
  }

  loadSubmissions(): void {
    this.loading = true;
    const filters = {
      page: this.currentPage,
      limit: this.pageSize,
      ...this.filterForm.value
    };

    // Remove empty filter values
    Object.keys(filters).forEach(key => {
      if (filters[key] === '' || filters[key] === null) {
        delete filters[key];
      }
    });

    this.lecturerService.getSubmissions(this.lecturerId, filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.submissions = response.data;
          this.statistics = response.statistics || null;
          if (response.pagination) {
            this.totalSubmissions = response.pagination.total;
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading submissions:', error);
        this.snackBar.open('Failed to load submissions', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadSubmissions();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.assignments = [];
    this.loadSubmissions();
  }

  viewSubmissionDetails(submission: LecturerSubmission): void {
    if (submission.assignmentId && submission._id) {
      this.router.navigate(['/lecturer/assignments', submission.assignmentId._id, 'submissions', submission._id]);
    }
  }

  evaluateSubmission(submission: LecturerSubmission): void {
    if (!confirm('Are you sure you want to evaluate this submission using AI?')) {
      return;
    }

    this.loading = true;
    this.assignmentService.evaluateSubmission(submission.assignmentId._id, submission._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Submission evaluated successfully!', 'Close', { duration: 3000 });
          this.loadSubmissions();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error evaluating submission:', error);
        this.snackBar.open('Failed to evaluate submission', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString() + ' ' + new Date(date).toLocaleTimeString();
  }

  getEvaluationStatusClass(status: string): string {
    const classes: any = {
      'pending': 'status-pending',
      'evaluating': 'status-evaluating',
      'completed': 'status-completed',
      'failed': 'status-failed'
    };
    return classes[status] || 'status-default';
  }

  getEvaluationStatusLabel(status: string): string {
    const labels: any = {
      'pending': 'Pending',
      'evaluating': 'Evaluating',
      'completed': 'Evaluated',
      'failed': 'Failed'
    };
    return labels[status] || status;
  }

  getLevelBadgeClass(level: string | null): string {
    if (!level) return 'level-default';
    const classes: any = {
      'beginner': 'level-beginner',
      'intermediate': 'level-intermediate',
      'advanced': 'level-advanced'
    };
    return classes[level] || 'level-default';
  }

  getStudentName(submission: LecturerSubmission): string {
    if (submission.studentId) {
      return `${submission.studentId.firstName} ${submission.studentId.lastName}`;
    }
    return 'Unknown';
  }

  getStudentId(submission: LecturerSubmission): string {
    return submission.studentId?.studentId || '';
  }
}
