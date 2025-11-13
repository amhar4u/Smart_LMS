import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
import { AdminLayout } from '../admin-layout/admin-layout';

@Component({
  selector: 'app-assignment-submissions',
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
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatBadgeModule,
    AdminLayout
  ],
  templateUrl: './assignment-submissions.component.html',
  styleUrls: ['./assignment-submissions.component.css']
})
export class AssignmentSubmissionsComponent implements OnInit {
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
    this.route.params.subscribe(params => {
      this.assignmentId = params['id'];
      if (this.assignmentId && this.assignmentId !== 'all') {
        this.loadSubmissions();
      } else {
        // Show all assignments overview
        this.loadAllAssignments();
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

  loadAllAssignments(): void {
    this.loading = true;
    this.assignmentService.getAssignments({ page: 1, limit: 100 })
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
            this.statistics = response.data.statistics;
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
            // Also update assignment data with questions if provided
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
            if (this.selectedSubmission && this.selectedSubmission._id === submissionId) {
              this.selectedSubmission = response.data;
            }
          }
          this.evaluatingSubmission = false;
        },
        error: (error) => {
          console.error('Error evaluating submission:', error);
          this.snackBar.open(
            error.error?.message || 'Failed to evaluate submission',
            'Close',
            { duration: 5000 }
          );
          this.evaluatingSubmission = false;
        }
      });
  }

  evaluateAllSubmissions(): void {
    if (!confirm('Are you sure you want to evaluate ALL pending submissions? This may take some time.')) {
      return;
    }

    this.evaluatingAll = true;
    this.assignmentService.evaluateAllSubmissions(this.assignmentId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open(
              response.message || 'All submissions evaluated successfully!',
              'Close',
              { duration: 5000 }
            );
            this.loadSubmissions();
          }
          this.evaluatingAll = false;
        },
        error: (error) => {
          console.error('Error evaluating all submissions:', error);
          this.snackBar.open(
            error.error?.message || 'Failed to evaluate all submissions',
            'Close',
            { duration: 5000 }
          );
          this.evaluatingAll = false;
        }
      });
  }

  publishEvaluation(submissionId: string): void {
    if (!confirm('Publish this evaluation? Students will be able to see their results.')) {
      return;
    }

    this.assignmentService.publishEvaluation(this.assignmentId, submissionId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Evaluation published successfully!', 'Close', { duration: 3000 });
            this.loadSubmissions();
            if (this.selectedSubmission && this.selectedSubmission._id === submissionId) {
              this.selectedSubmission = response.data;
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
    if (!confirm('Publish ALL evaluated submissions? Students will be able to see their results.')) {
      return;
    }

    this.assignmentService.publishAllEvaluations(this.assignmentId)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open(
              response.message || 'All evaluations published successfully!',
              'Close',
              { duration: 3000 }
            );
            this.loadSubmissions();
          }
        },
        error: (error) => {
          console.error('Error publishing evaluations:', error);
          this.snackBar.open('Failed to publish evaluations', 'Close', { duration: 3000 });
        }
      });
  }

  getLevelColor(level: string): string {
    switch (level?.toLowerCase()) {
      case 'beginner':
        return '#ff6b6b';
      case 'intermediate':
        return '#ffd93d';
      case 'advanced':
        return '#6bcf7f';
      default:
        return '#999';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'completed':
        return '#6bcf7f';
      case 'pending':
        return '#ffd93d';
      case 'evaluating':
        return '#4ecdc4';
      case 'failed':
        return '#ff6b6b';
      default:
        return '#999';
    }
  }

  getPercentageColor(percentage: number): string {
    if (percentage <= 40) {
      return '#ff6b6b';
    } else if (percentage <= 70) {
      return '#ffd93d';
    } else {
      return '#6bcf7f';
    }
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }

  getQuestionText(questionId: string): string {
    if (!this.assignment || !this.assignment.questions) {
      return 'Question text not available';
    }
    const question = this.assignment.questions.find((q: any) => q._id === questionId);
    return question?.question || 'Question not found';
  }

  getQuestionType(questionId: string): string {
    if (!this.assignment || !this.assignment.questions) {
      return '';
    }
    const question = this.assignment.questions.find((q: any) => q._id === questionId);
    return question?.type || '';
  }

  getQuestionMarks(questionId: string): number {
    if (!this.assignment || !this.assignment.questions) {
      return 0;
    }
    const question = this.assignment.questions.find((q: any) => q._id === questionId);
    return question?.marks || 0;
  }

  getQuestionOptions(questionId: string): any[] {
    if (!this.assignment || !this.assignment.questions) {
      return [];
    }
    const question = this.assignment.questions.find((q: any) => q._id === questionId);
    return question?.options || [];
  }

  isSelectedOption(answer: any, optionText: string): boolean {
    return answer.answer === optionText || answer.selectedOption === optionText;
  }

  getStudentName(student: any): string {
    if (!student) return 'Unknown Student';
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    if (student.firstName) return student.firstName;
    if (student.lastName) return student.lastName;
    return student.email || 'Unknown Student';
  }

  goBack(): void {
    if (this.assignmentId && this.assignmentId !== 'all') {
      this.router.navigate(['/admin/manage-assignments']);
    } else {
      this.router.navigate(['/admin/dashboard']);
    }
  }

  // Add String reference for template
  String = String;

  viewAssignmentSubmissions(assignment: any): void {
    this.router.navigate(['/admin/assignments', assignment._id, 'submissions']);
  }
}
