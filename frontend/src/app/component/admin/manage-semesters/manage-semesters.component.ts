import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { SemesterService, Semester } from '../../../services/semester.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';

@Component({
  selector: 'app-manage-semesters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatSortModule,
    MatTooltipModule,
    MatChipsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './manage-semesters.component.html',
  styleUrls: ['./manage-semesters.component.css']
})
export class ManageSemestersComponent implements OnInit {
  semesters: Semester[] = [];
  filteredSemesters: Semester[] = [];
  displayedColumns: string[] = ['code', 'name', 'year', 'type', 'duration', 'status', 'current', 'actions'];
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalCount = 0;
  
  // Search and Filter
  searchTerm = '';
  selectedDuration = '';
  durations: string[] = ['4 months', '5 months', '6 months', 'Custom'];
  
  // Form
  semesterForm!: FormGroup;
  isEditing = false;
  editingSemesterId: string | null = null;
  showForm = false;
  
  // Loading states
  isLoading = false;
  isSubmitting = false;

  constructor(
    private semesterService: SemesterService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadSemesters();
  }

  initializeForm(): void {
    this.semesterForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      order: ['', [Validators.required, Validators.min(1), Validators.max(20)]],
      description: ['', [Validators.maxLength(200)]],
      duration: ['6 months', Validators.required],
      creditRange: this.fb.group({
        min: [12, [Validators.required, Validators.min(1)]],
        max: [24, [Validators.required, Validators.min(1)]]
      })
    });

    // Add validator to ensure max >= min
    this.semesterForm.get('creditRange')?.setValidators(this.creditRangeValidator);
  }

  creditRangeValidator(control: AbstractControl): ValidationErrors | null {
    const group = control as FormGroup;
    const min = group.get('min')?.value;
    const max = group.get('max')?.value;
    return max >= min ? null : { invalidRange: true };
  }

  loadSemesters(): void {
    this.isLoading = true;
    this.semesterService.getSemesters().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.semesters = response.data.sort((a, b) => a.order - b.order);
          this.applyFilters();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading semesters:', error);
        this.snackBar.open('Error loading semesters', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.semesters];
    
    // Search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(semester => 
        semester.name.toLowerCase().includes(searchLower) ||
        semester.code.toLowerCase().includes(searchLower) ||
        (semester.description && semester.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Duration filter
    if (this.selectedDuration) {
      filtered = filtered.filter(semester => semester.duration === this.selectedDuration);
    }
    
    this.filteredSemesters = filtered;
    this.totalCount = filtered.length;
    
    // Reset pagination if needed
    if (this.pageIndex * this.pageSize >= this.totalCount) {
      this.pageIndex = 0;
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onDurationFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDuration = '';
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.filteredSemesters = [...this.semesters];
      return;
    }

    this.filteredSemesters = this.filteredSemesters.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name': return this.compare(a.name, b.name, isAsc);
        case 'code': return this.compare(a.code, b.code, isAsc);
        case 'order': return this.compare(a.order, b.order, isAsc);
        case 'duration': return this.compare(a.duration, b.duration, isAsc);
        default: return 0;
      }
    });
  }

  private compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  showAddForm(): void {
    this.isEditing = false;
    this.editingSemesterId = null;
    this.showForm = true;
    this.semesterForm.reset({
      duration: '6 months',
      creditRange: { min: 12, max: 24 }
    });
  }

  editSemester(semester: Semester): void {
    this.isEditing = true;
    this.editingSemesterId = semester._id;
    this.showForm = true;
    
    this.semesterForm.patchValue({
      name: semester.name,
      code: semester.code,
      order: semester.order,
      description: semester.description,
      duration: semester.duration,
      creditRange: {
        min: semester.creditRange.min,
        max: semester.creditRange.max
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingSemesterId = null;
    this.semesterForm.reset();
  }

  onSubmit(): void {
    if (this.semesterForm.valid) {
      this.isSubmitting = true;
      const formData = this.semesterForm.value;

      const operation = this.isEditing
        ? this.semesterService.updateSemester(this.editingSemesterId!, formData)
        : this.semesterService.createSemester(formData);

      operation.subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.snackBar.open(
              `Semester ${this.isEditing ? 'updated' : 'created'} successfully`,
              'Close',
              { duration: 3000, panelClass: ['success-snackbar'] }
            );
            this.loadSemesters();
            this.cancelForm();
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error saving semester:', error);
          this.snackBar.open(
            error.error?.message || `Error ${this.isEditing ? 'updating' : 'creating'} semester`,
            'Close',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
        }
      });
    }
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
        this.semesterService.deleteSemester(semester._id).subscribe({
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

  getFormErrorMessage(fieldName: string): string {
    const field = this.semesterForm.get(fieldName);
    if (!field || !field.touched) return '';

    if (field.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field.hasError('minlength')) {
      return `Minimum length is ${field.errors?.['minlength']?.requiredLength}`;
    }
    if (field.hasError('maxlength')) {
      return `Maximum length is ${field.errors?.['maxlength']?.requiredLength}`;
    }
    if (field.hasError('min')) {
      return `Minimum value is ${field.errors?.['min']?.min}`;
    }
    if (field.hasError('max')) {
      return `Maximum value is ${field.errors?.['max']?.max}`;
    }

    // Credit range validation
    const creditRange = this.semesterForm.get('creditRange');
    if (creditRange?.hasError('invalidRange')) {
      return 'Maximum credits must be greater than or equal to minimum credits';
    }

    return '';
  }

  getCreditRangeError(): string {
    const creditRange = this.semesterForm.get('creditRange');
    if (creditRange?.touched && creditRange?.hasError('invalidRange')) {
      return 'Maximum credits must be greater than or equal to minimum credits';
    }
    return '';
  }
}
