import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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

import { DepartmentService, Department } from '../../../services/department.service';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog';

@Component({
  selector: 'app-manage-departments',
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
    MatChipsModule
  ],
  templateUrl: './manage-departments.component.html',
  styleUrls: ['./manage-departments.component.css']
})
export class ManageDepartmentsComponent implements OnInit {
  departments: Department[] = [];
  filteredDepartments: Department[] = [];
  displayedColumns: string[] = ['code', 'name', 'description', 'createdAt', 'status', 'actions'];
  
  // Pagination
  pageSize = 10;
  pageIndex = 0;
  totalCount = 0;
  
  // Search and Filter
  searchTerm = '';
  selectedFaculty = '';
  faculties: string[] = [];
  
  // Form
  departmentForm!: FormGroup;
  isEditing = false;
  editingDepartmentId: string | null = null;
  showForm = false;
  
  // Loading states
  isLoading = false;
  isSubmitting = false;

  constructor(
    private departmentService: DepartmentService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadDepartments();
  }

  initializeForm(): void {
    this.departmentForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      description: ['', [Validators.maxLength(500)]],
      establishedYear: ['', [Validators.min(1900), Validators.max(new Date().getFullYear())]],
      faculty: ['', [Validators.maxLength(100)]],
      contactInfo: this.fb.group({
        email: ['', [Validators.email]],
        phone: [''],
        office: ['', [Validators.maxLength(100)]]
      })
    });
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.departmentService.getDepartments().subscribe({
      next: (response) => {
        this.isLoading = false;
        if (response.success) {
          this.departments = response.data;
          this.applyFilters();
          this.extractFaculties();
        }
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error loading departments:', error);
        this.snackBar.open('Error loading departments', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  extractFaculties(): void {
    const facultySet = new Set<string>();
    this.departments.forEach(dept => {
      if (dept.faculty) {
        facultySet.add(dept.faculty);
      }
    });
    this.faculties = Array.from(facultySet).sort();
  }

  applyFilters(): void {
    let filtered = [...this.departments];
    
    // Search filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(dept => 
        dept.name.toLowerCase().includes(searchLower) ||
        dept.code.toLowerCase().includes(searchLower) ||
        (dept.description && dept.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Faculty filter
    if (this.selectedFaculty) {
      filtered = filtered.filter(dept => dept.faculty === this.selectedFaculty);
    }
    
    this.filteredDepartments = filtered;
    this.totalCount = filtered.length;
    
    // Reset pagination if needed
    if (this.pageIndex * this.pageSize >= this.totalCount) {
      this.pageIndex = 0;
    }
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFacultyFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedFaculty = '';
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  sortData(sort: Sort): void {
    if (!sort.active || sort.direction === '') {
      this.filteredDepartments = [...this.departments];
      return;
    }

    this.filteredDepartments = this.filteredDepartments.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'name': return this.compare(a.name, b.name, isAsc);
        case 'code': return this.compare(a.code, b.code, isAsc);
        case 'faculty': return this.compare(a.faculty || '', b.faculty || '', isAsc);
        case 'establishedYear': return this.compare(a.establishedYear || 0, b.establishedYear || 0, isAsc);
        default: return 0;
      }
    });
  }

  private compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  showAddForm(): void {
    this.isEditing = false;
    this.editingDepartmentId = null;
    this.showForm = true;
    this.departmentForm.reset();
  }

  editDepartment(department: Department): void {
    this.isEditing = true;
    this.editingDepartmentId = department._id;
    this.showForm = true;
    
    this.departmentForm.patchValue({
      name: department.name,
      code: department.code,
      description: department.description,
      establishedYear: department.establishedYear,
      faculty: department.faculty,
      contactInfo: {
        email: department.contactInfo?.email || '',
        phone: department.contactInfo?.phone || '',
        office: department.contactInfo?.office || ''
      }
    });
  }

  cancelForm(): void {
    this.showForm = false;
    this.isEditing = false;
    this.editingDepartmentId = null;
    this.departmentForm.reset();
  }

  onSubmit(): void {
    if (this.departmentForm.valid) {
      this.isSubmitting = true;
      const formData = this.departmentForm.value;
      
      // Clean up contactInfo - remove empty fields
      if (formData.contactInfo) {
        Object.keys(formData.contactInfo).forEach(key => {
          if (!formData.contactInfo[key]) {
            delete formData.contactInfo[key];
          }
        });
        if (Object.keys(formData.contactInfo).length === 0) {
          delete formData.contactInfo;
        }
      }

      const operation = this.isEditing
        ? this.departmentService.updateDepartment(this.editingDepartmentId!, formData)
        : this.departmentService.createDepartment(formData);

      operation.subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.snackBar.open(
              `Department ${this.isEditing ? 'updated' : 'created'} successfully`,
              'Close',
              { duration: 3000, panelClass: ['success-snackbar'] }
            );
            this.loadDepartments();
            this.cancelForm();
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error saving department:', error);
          this.snackBar.open(
            error.error?.message || `Error ${this.isEditing ? 'updating' : 'creating'} department`,
            'Close',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
        }
      });
    }
  }

  deleteDepartment(department: Department): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Department',
        message: `Are you sure you want to delete "${department.name}"? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.departmentService.deleteDepartment(department._id).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open('Department deleted successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadDepartments();
            }
          },
          error: (error) => {
            console.error('Error deleting department:', error);
            this.snackBar.open(
              error.error?.message || 'Error deleting department',
              'Close',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
          }
        });
      }
    });
  }

  getFormErrorMessage(fieldName: string): string {
    const field = this.departmentForm.get(fieldName);
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
    if (field.hasError('email')) {
      return 'Please enter a valid email address';
    }
    if (field.hasError('min')) {
      return `Minimum value is ${field.errors?.['min']?.min}`;
    }
    if (field.hasError('max')) {
      return `Maximum value is ${field.errors?.['max']?.max}`;
    }

    return '';
  }
}
