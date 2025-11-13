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
import { LecturerService, LecturerAssignment } from '../../../services/lecturer.service';
import { SubjectService } from '../../../services/subject.service';

@Component({
  selector: 'app-lecturer-assignments-list',
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
  templateUrl: './lecturer-assignments-list.component.html',
  styleUrls: ['./lecturer-assignments-list.component.css']
})
export class LecturerAssignmentsListComponent implements OnInit {
  assignments: LecturerAssignment[] = [];
  loading = false;
  lecturerId: string = '';
  
  // Filters
  filterForm: FormGroup;
  subjects: any[] = [];
  
  // Pagination
  pageSize = 10;
  currentPage = 1;
  totalAssignments = 0;

  // Table columns
  displayedColumns: string[] = ['title', 'subject', 'batch', 'type', 'level', 'dueDate', 'questions', 'marks', 'status', 'actions'];

  constructor(
    private authService: AuthService,
    private lecturerService: LecturerService,
    private subjectService: SubjectService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      subject: [''],
      assignmentLevel: [''],
      assignmentType: [''],
      isActive: ['']
    });
  }

  ngOnInit(): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser._id) {
      this.lecturerId = currentUser._id;
      this.loadSubjects();
      this.loadAssignments();
    }

    // Watch for filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadAssignments();
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

  loadAssignments(): void {
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

    this.lecturerService.getAssignments(this.lecturerId, filters).subscribe({
      next: (response) => {
        if (response.success) {
          this.assignments = response.data;
          if (response.pagination) {
            this.totalAssignments = response.pagination.total;
          }
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

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadAssignments();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadAssignments();
  }

  viewAssignment(assignment: LecturerAssignment): void {
    // Navigate to assignment details or open a dialog
    this.router.navigate(['/lecturer/assignments', assignment._id]);
  }

  viewSubmissions(assignment: LecturerAssignment): void {
    this.router.navigate(['/lecturer/assignments', assignment._id, 'submissions']);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusClass(assignment: LecturerAssignment): string {
    return assignment.isActive ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(assignment: LecturerAssignment): string {
    return assignment.isActive ? 'Active' : 'Inactive';
  }

  getLevelBadgeClass(level: string): string {
    const classes: any = {
      'easy': 'level-easy',
      'medium': 'level-medium',
      'hard': 'level-hard'
    };
    return classes[level] || 'level-default';
  }

  getTypeBadgeClass(type: string): string {
    const classes: any = {
      'MCQ': 'type-mcq',
      'short_answer': 'type-short',
      'essay': 'type-essay'
    };
    return classes[type] || 'type-default';
  }
}
