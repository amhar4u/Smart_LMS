import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

import { BatchService, Batch } from '../../../services/batch.service';
import { CourseService, Course } from '../../../services/course.service';
import { DepartmentService, Department } from '../../../services/department.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { LoadingService } from '../../../services/loading.service';
import { BatchDialogComponent } from './batch-dialog/batch-dialog.component';
import { AdminLayout } from '../admin-layout/admin-layout';

@Component({
  selector: 'app-manage-batches',
  standalone: true,
  imports: [
    CommonModule,
    AdminLayout,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatProgressBarModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSortModule,
    ReactiveFormsModule
  ],
  templateUrl: './manage-batches.component.html',
  styleUrls: ['./manage-batches.component.css']
})
export class ManageBatchesComponent implements OnInit {
  batches: Batch[] = [];
  courses: Course[] = [];
  departments: Department[] = [];
  
  displayedColumns: string[] = [
    'name', 
    'course', 
    'department', 
    'year', 
    'enrollment', 
    'status',
    'actions'
  ];
  
  // Pagination
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  
  // Loading states
  isLoading = false;
  
  // Filter form
  filterForm: FormGroup;
  
  // Add Math reference for template
  Math = Math;
  
  constructor(
    private batchService: BatchService,
    private courseService: CourseService,
    private departmentService: DepartmentService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      search: [''],
      department: ['']
    });
  }

  ngOnInit(): void {
    this.loadBatches();
    this.loadCourses();
    this.loadDepartments();
    this.setupFilterSubscription();
  }

  setupFilterSubscription(): void {
    this.filterForm.valueChanges.subscribe(() => {
      this.currentPage = 1;
      this.loadBatches();
    });
  }

  loadBatches(): void {
    this.isLoading = true;
    
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    if (!token) {
      this.isLoading = false;
      this.snackBar.open('Please login to access this page', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }
    
    const filters = {
      page: this.currentPage,
      limit: this.pageSize,
      ...this.filterForm.value
    };

    // Remove empty filter values
    Object.keys(filters).forEach(key => {
      if (filters[key] === '' || filters[key] === null || filters[key] === undefined) {
        delete filters[key];
      }
    });

    this.batchService.getBatches(filters).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.success) {
          this.batches = response.data;
          this.totalItems = response.pagination?.totalItems || 0;
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Error loading batches:', error);
        
        if (error.status === 401) {
          this.snackBar.open('Authentication required. Please login again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        } else {
          this.snackBar.open('Error loading batches. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      }
    });
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
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

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadBatches();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadBatches();
  }

  getStatusColor(status: string): string {
    return this.batchService.getStatusColor(status);
  }

  getEnrollmentStatusColor(batch: Batch): string {
    return this.batchService.getEnrollmentStatusColor(batch);
  }

  getEnrollmentPercentage(batch: Batch): number {
    return this.batchService.getEnrollmentPercentage(batch);
  }

  formatYearRange(batch: Batch): string {
    return `${batch.startYear}-${batch.endYear}`;
  }

  openCreateBatchDialog(): void {
    const dialogRef = this.dialog.open(BatchDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'create'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBatches();
      }
    });
  }

  openEditBatchDialog(batch: Batch): void {
    const dialogRef = this.dialog.open(BatchDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        mode: 'edit',
        batch: batch
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBatches();
      }
    });
  }

  viewBatchDetails(batch: Batch): void {
    // TODO: Implement batch details view
    this.snackBar.open('Batch details view will be implemented soon', 'Close', {
      duration: 3000
    });
  }

  manageBatchSemesters(batch: Batch): void {
    // TODO: Implement batch semester management
    this.snackBar.open('Batch semester management will be implemented soon', 'Close', {
      duration: 3000
    });
  }

  setCurrentSemester(batch: Batch): void {
    // TODO: Implement set current semester dialog
    this.snackBar.open('Set current semester dialog will be implemented soon', 'Close', {
      duration: 3000
    });
  }

  deleteBatch(batch: Batch): void {
    const message = `Are you sure you want to delete batch "${batch.name}"? This action cannot be undone.`;
    
    this.confirmationService.confirm({
      title: 'Delete Batch',
      message: message,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    }).subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.performDelete(batch);
      }
    });
  }

  private performDelete(batch: Batch): void {
    this.loadingService.show();
    
    this.batchService.deleteBatch(batch._id).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.snackBar.open('Batch deleted successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadBatches();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Error deleting batch:', error);
        const errorMessage = error.error?.message || 'Error deleting batch. Please try again.';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  toggleBatchStatus(batch: Batch): void {
    const newStatus = batch.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    const message = `Are you sure you want to ${action} batch "${batch.name}"?`;
    
    this.confirmationService.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Batch`,
      message: message,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel'
    }).subscribe((confirmed: boolean) => {
      if (confirmed) {
        this.performStatusToggle(batch, newStatus);
      }
    });
  }

  private performStatusToggle(batch: Batch, newStatus: string): void {
    this.loadingService.show();
    
    this.batchService.updateBatch(batch._id, { status: newStatus as any }).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          const action = newStatus === 'active' ? 'activated' : 'deactivated';
          this.snackBar.open(`Batch ${action} successfully`, 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadBatches();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Error updating batch status:', error);
        this.snackBar.open('Error updating batch status. Please try again.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  // Additional methods for template
  getActiveBatchesCount(): number {
    return this.batches.filter(batch => batch.isActive).length;
  }

  getTotalEnrolledStudents(): number {
    return this.batches.reduce((total, batch) => total + (batch.currentEnrollment || 0), 0);
  }

  getTotalAvailableSlots(): number {
    return this.batches.reduce((total, batch) => {
      const available = (batch.maxStudents || 0) - (batch.currentEnrollment || 0);
      return total + Math.max(0, available);
    }, 0);
  }

  getAvailableYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 5; i++) {
      years.push(i);
    }
    return years;
  }

  getStatusIcon(status: string): string {
    return status === 'active' ? 'check_circle' : 'radio_button_unchecked';
  }

  exportBatches(): void {
    // TODO: Implement batch export functionality
    this.snackBar.open('Export functionality coming soon!', 'Close', { duration: 3000 });
  }
}
