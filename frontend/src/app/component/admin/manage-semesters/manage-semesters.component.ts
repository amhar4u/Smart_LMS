import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { SemesterService, Semester } from '../../../services/semester.service';
import { BatchService, Batch } from '../../../services/batch.service';
import { DepartmentService, Department } from '../../../services/department.service';
import { CourseService, Course } from '../../../services/course.service';
import { SemesterDialogComponent } from './semester-dialog.component';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { AdminLayout } from '../admin-layout/admin-layout';

@Component({
  selector: 'app-manage-semesters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatChipsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    AdminLayout
  ],
  templateUrl: './manage-semesters.component.html',
  styleUrls: ['./manage-semesters.component.css']
})
export class ManageSemestersComponent implements OnInit {
  Math = Math; // For template usage
  
  semesters: Semester[] = [];
  filteredSemesters: Semester[] = [];
  batches: Batch[] = [];
  filteredBatches: Batch[] = [];
  departments: Department[] = [];
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  
  displayedColumns: string[] = ['name', 'code', 'department', 'course', 'batch', 'type', 'year', 'startDate', 'endDate', 'isActive', 'actions'];
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalCount = 0;
  
  // Search and Filter
  searchTerm = '';
  selectedDepartment = '';
  selectedCourse = '';
  selectedBatch = '';
  selectedType = '';
  selectedYear = '';
  
  // Form
  filterForm!: FormGroup;
  
  // Loading states
  isLoading = false;

  constructor(
    private semesterService: SemesterService,
    private batchService: BatchService,
    private departmentService: DepartmentService,
    private courseService: CourseService,
    private fb: FormBuilder,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initializeFilterForm();
  }

  ngOnInit(): void {
    this.loadSemesters();
    this.loadDepartments();
    this.loadCourses();
    this.loadBatches();
  }

  initializeFilterForm(): void {
    this.filterForm = this.fb.group({
      department: [''],
      course: [''],
      batch: [''],
      type: [''],
      year: ['']
    });

    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  loadSemesters(): void {
    this.isLoading = true;
    this.semesterService.getSemesters().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.semesters = response.data;
          this.applyFilters();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading semesters:', error);
        this.snackBar.open('Error loading semesters', 'Close', { 
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (response) => {
        if (response.success) {
          this.departments = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (response) => {
        if (response.success) {
          this.courses = response.data;
          this.filteredCourses = [];
        }
      },
      error: (error) => {
        console.error('Error loading courses:', error);
      }
    });
  }

  loadCoursesByDepartment(departmentId: string): void {
    this.courseService.getCoursesByDepartment(departmentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.courses = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading courses:', error);
      }
    });
  }

  loadBatches(): void {
    this.batchService.getBatches().subscribe({
      next: (response) => {
        if (response.success) {
          this.batches = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading batches:', error);
      }
    });
  }

  loadBatchesByCourse(courseId: string): void {
    this.batchService.getBatchesByCourse(courseId).subscribe({
      next: (response) => {
        if (response.success) {
          this.batches = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading batches:', error);
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.semesters];

    // Apply search term filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(semester => 
        semester.name.toLowerCase().includes(term) ||
        semester.code.toLowerCase().includes(term) ||
        semester.type.toLowerCase().includes(term)
      );
    }

    // Apply other filters
    const filters = this.filterForm.value;
    
    // Filter by department
    if (filters.department) {
      filtered = filtered.filter(semester => {
        if (typeof semester.batch === 'object' && semester.batch !== null) {
          const batch = semester.batch as any; // Cast to any to access department
          const batchDepId = typeof batch.department === 'object' 
            ? batch.department._id 
            : batch.department;
          return batchDepId === filters.department;
        }
        return false;
      });
    }

    // Filter by course
    if (filters.course) {
      filtered = filtered.filter(semester => {
        if (typeof semester.batch === 'object' && semester.batch !== null) {
          const batch = semester.batch as any; // Cast to any to access course
          const batchCourseId = typeof batch.course === 'object' 
            ? batch.course._id 
            : batch.course;
          return batchCourseId === filters.course;
        }
        return false;
      });
    }

    // Filter by batch
    if (filters.batch) {
      filtered = filtered.filter(semester => 
        typeof semester.batch === 'object' ? semester.batch._id === filters.batch : semester.batch === filters.batch
      );
    }
    
    if (filters.type) {
      filtered = filtered.filter(semester => semester.type === filters.type);
    }
    if (filters.year) {
      filtered = filtered.filter(semester => semester.year === parseInt(filters.year));
    }

    this.filteredSemesters = filtered;
    this.totalCount = filtered.length;
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.filterForm.reset();
    this.filteredCourses = [];
    this.filteredBatches = [];
    this.applyFilters();
  }

  showAddDialog(): void {
    const dialogRef = this.dialog.open(SemesterDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        batches: this.batches
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createSemester(result);
      }
    });
  }

  editSemester(semester: Semester): void {
    const dialogRef = this.dialog.open(SemesterDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        semester: semester,
        batches: this.batches
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateSemester(semester._id!, result);
      }
    });
  }

  createSemester(semesterData: any): void {
    this.semesterService.createSemester(semesterData).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Semester created successfully', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadSemesters();
        }
      },
      error: (error) => {
        console.error('Error creating semester:', error);
        this.snackBar.open(
          error.error?.message || 'Error creating semester', 
          'Close', 
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  updateSemester(id: string, semesterData: any): void {
    this.semesterService.updateSemester(id, semesterData).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackBar.open('Semester updated successfully', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadSemesters();
        }
      },
      error: (error) => {
        console.error('Error updating semester:', error);
        this.snackBar.open(
          error.error?.message || 'Error updating semester', 
          'Close', 
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  deleteSemester(semester: Semester): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Semester',
        message: `Are you sure you want to delete "${semester.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.semesterService.deleteSemester(semester._id!).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Semester deleted successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadSemesters();
            }
          },
          error: (error) => {
            console.error('Error deleting semester:', error);
            this.snackBar.open(
              error.error?.message || 'Error deleting semester',
              'Close',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
          }
        });
      }
    });
  }

  getBatchName(batch: any): string {
    if (typeof batch === 'object' && batch !== null) {
      return batch.name || '';
    }
    return '';
  }

  getDepartmentName(batch: any): string {
    if (typeof batch === 'object' && batch !== null) {
      if (typeof batch.department === 'object' && batch.department !== null) {
        return batch.department.name || '';
      }
    }
    return '';
  }

  getCourseName(batch: any): string {
    if (typeof batch === 'object' && batch !== null) {
      if (typeof batch.course === 'object' && batch.course !== null) {
        return batch.course.name || '';
      }
    }
    return '';
  }

  getActiveSemestersCount(): number {
    return this.semesters.filter(s => s.isActive).length;
  }

  getCurrentSemestersCount(): number {
    return this.semesters.filter(s => s.isCurrent).length;
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  getPaginatedSemesters(): Semester[] {
    const startIndex = this.pageIndex * this.pageSize;
    return this.filteredSemesters.slice(startIndex, startIndex + this.pageSize);
  }

  onDepartmentChange(departmentId: string): void {
    if (departmentId) {
      // Filter courses by selected department
      this.filteredCourses = this.courses.filter(course => {
        const courseDepId = typeof course.department === 'object' 
          ? course.department._id 
          : course.department;
        return courseDepId === departmentId;
      });
    } else {
      this.filteredCourses = [];
    }
    
    // Reset dependent dropdowns
    this.filteredBatches = [];
    this.filterForm.patchValue({
      course: '',
      batch: ''
    });
    this.applyFilters();
  }

  onCourseChange(courseId: string): void {
    if (courseId) {
      // Filter batches by selected course
      this.filteredBatches = this.batches.filter(batch => {
        const batchCourseId = typeof batch.course === 'object' 
          ? batch.course._id 
          : batch.course;
        return batchCourseId === courseId;
      });
    } else {
      this.filteredBatches = [];
    }
    
    // Reset dependent dropdown
    this.filterForm.patchValue({
      batch: ''
    });
    this.applyFilters();
  }
}
