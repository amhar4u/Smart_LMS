import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { AssignmentService } from '../../../services/assignment.service';
import { LecturerService } from '../../../services/lecturer.service';
import { AuthService } from '../../../services/auth.service';
import { LecturerLayout } from '../lecturer-layout/lecturer-layout';

@Component({
  selector: 'app-lecturer-assignment-submissions',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
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
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatBadgeModule,
    LecturerLayout
  ],
  templateUrl: './assignment-submissions.component.html',
  styleUrls: ['./assignment-submissions.component.css']
})
export class LecturerAssignmentSubmissionsComponent implements OnInit {
  assignmentId: string = '';
  assignment: any = null;
  assignments: any[] = [];
  submissions: any[] = [];
  statistics: any = null;
  loading = false;
  selectedSubmission: any = null;
  showSubmissionDetails = false;
  evaluatingSubmission = false;
  evaluatingAll = false;
  lecturerId: string = '';

  // Filters
  filterForm: FormGroup;
  
  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalSubmissions = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private assignmentService: AssignmentService,
    private lecturerService: LecturerService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
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
    }

    this.route.params.subscribe(params => {
      this.assignmentId = params['id'];
      if (this.assignmentId && this.assignmentId !== 'all') {
        this.loadSubmissions();
      } else {
        // Show all assignments overview (only lecturer's assignments)
        this.loadLecturerAssignments();
      }
    });

    // Watch for filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1;
      if (this.assignmentId && this.assignmentId !== 'all') {
        this.loadSubmissions();
      }
    });
  }

  loadLecturerAssignments(): void {
    this.loading = true;
    this.lecturerService.getAssignments(this.lecturerId, { page: 1, limit: 100 })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.assignments = response.data;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading assignments:', error);
          this.snackBar.open('Failed to load assignments', 'Close', { duration: 3000 });
          this.loading = false;
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

    this.assignmentService.getAssignmentSubmissions(this.assignmentId, filters)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.assignment = response.data.assignment;
            this.submissions = response.data.submissions;
            // Map statistics from backend format to frontend format
            const backendStats = response.data.statistics;
            this.statistics = {
              total: backendStats.totalSubmissions || 0,
              completed: backendStats.evaluated || 0,
              pending: backendStats.pending || 0,
              averagePercentage: backendStats.avgPercentage || 0
            };
            this.totalSubmissions = response.pagination.total;
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
    this.loadSubmissions();
  }

  viewSubmissionDetails(submission: any): void {
    this.loading = true;
    this.assignmentService.getSubmissionDetails(this.assignmentId, submission._id)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.selectedSubmission = response.data.submission;
            if (response.data.assignment) {
              this.assignment = response.data.assignment;
            }
            this.showSubmissionDetails = true;
          }
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading submission details:', error);
          this.snackBar.open('Failed to load submission details', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
  }

  closeSubmissionDetails(): void {
    this.showSubmissionDetails = false;
    this.selectedSubmission = null;
  }

  evaluateSubmission(submissionId: string): void {
    if (!confirm('Are you sure you want to evaluate this submission using AI?')) {
      return;
    }

    this.evaluatingSubmission = true;
    this.assignmentService.evaluateSubmission(this.assignmentId, submissionId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Submission evaluated successfully!', 'Close', { duration: 3000 });
            this.loadSubmissions();
            if (this.showSubmissionDetails && this.selectedSubmission?._id === submissionId) {
              this.viewSubmissionDetails({ _id: submissionId });
            }
          }
          this.evaluatingSubmission = false;
        },
        error: (error) => {
          console.error('Error evaluating submission:', error);
          this.snackBar.open('Failed to evaluate submission', 'Close', { duration: 3000 });
          this.evaluatingSubmission = false;
        }
      });
  }

  evaluateAllSubmissions(): void {
    if (!confirm(`Are you sure you want to evaluate all ${this.statistics?.pending || 0} pending submissions?`)) {
      return;
    }

    this.evaluatingAll = true;
    this.assignmentService.evaluateAllSubmissions(this.assignmentId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open(response.message, 'Close', { duration: 5000 });
            this.loadSubmissions();
          }
          this.evaluatingAll = false;
        },
        error: (error) => {
          console.error('Error evaluating submissions:', error);
          this.snackBar.open('Failed to evaluate submissions', 'Close', { duration: 3000 });
          this.evaluatingAll = false;
        }
      });
  }

  publishEvaluation(submissionId: string): void {
    this.assignmentService.publishEvaluation(this.assignmentId, submissionId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Evaluation published successfully!', 'Close', { duration: 3000 });
            this.loadSubmissions();
            if (this.showSubmissionDetails && this.selectedSubmission?._id === submissionId) {
              this.viewSubmissionDetails({ _id: submissionId });
            }
          }
        },
        error: (error) => {
          console.error('Error publishing evaluation:', error);
          this.snackBar.open('Failed to publish evaluation', 'Close', { duration: 3000 });
        }
      });
  }

  publishAllEvaluations(): void {
    if (!confirm('Are you sure you want to publish all evaluated submissions?')) {
      return;
    }

    this.assignmentService.publishAllEvaluations(this.assignmentId)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.snackBar.open(response.message, 'Close', { duration: 3000 });
            this.loadSubmissions();
          }
        },
        error: (error: any) => {
          console.error('Error publishing evaluations:', error);
          this.snackBar.open('Failed to publish evaluations', 'Close', { duration: 3000 });
        }
      });
  }

  viewAssignmentSubmissions(assignment: any): void {
    this.router.navigate(['/lecturer/assignments', assignment._id, 'submissions']);
  }

  goBack(): void {
    if (this.showSubmissionDetails) {
      this.closeSubmissionDetails();
    } else if (this.assignmentId && this.assignmentId !== 'all') {
      this.router.navigate(['/lecturer/assignment-submissions']);
    } else {
      this.router.navigate(['/lecturer/subjects']);
    }
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusChipClass(status: string): string {
    const classes: any = {
      'pending': 'status-pending',
      'evaluating': 'status-evaluating',
      'completed': 'status-completed',
      'failed': 'status-failed'
    };
    return classes[status] || '';
  }

  getLevelChipClass(level: string): string {
    const classes: any = {
      'beginner': 'level-beginner',
      'intermediate': 'level-intermediate',
      'advanced': 'level-advanced'
    };
    return classes[level] || '';
  }

  getPercentageColor(percentage: number): string {
    if (percentage >= 75) return '#4caf50';
    if (percentage >= 50) return '#ff9800';
    return '#f44336';
  }

  // Helper methods for submission details
  getQuestionMarks(questionId: string): number {
    if (!this.assignment || !this.assignment.questions) return 0;
    const question = this.assignment.questions.find((q: any) => q._id === questionId);
    return question?.marks || 0;
  }

  getQuestionText(questionId: string): string {
    if (!this.assignment || !this.assignment.questions) return 'Question not found';
    const question = this.assignment.questions.find((q: any) => q._id === questionId);
    return question?.questionText || 'Question not found';
  }

  getQuestionType(questionId: string): string {
    if (!this.assignment || !this.assignment.questions) return '';
    const question = this.assignment.questions.find((q: any) => q._id === questionId);
    return question?.type || '';
  }

  getQuestionOptions(questionId: string): any[] {
    if (!this.assignment || !this.assignment.questions) return [];
    const question = this.assignment.questions.find((q: any) => q._id === questionId);
    return question?.options || [];
  }

  isSelectedOption(answer: any, optionText: string): boolean {
    return answer.selectedOption === optionText || answer.answer === optionText;
  }

  getStudentName(student: any): string {
    if (!student) return 'Unknown Student';
    if (student.name) return student.name;
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    if (student.firstName) return student.firstName;
    if (student.lastName) return student.lastName;
    return 'Unknown Student';
  }

  String = String; // Make String available in template
}

