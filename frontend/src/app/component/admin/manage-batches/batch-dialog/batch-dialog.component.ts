import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { BatchService, Batch } from '../../../../services/batch.service';
import { CourseService, Course } from '../../../../services/course.service';
import { DepartmentService, Department } from '../../../../services/department.service';

export interface BatchDialogData {
  batch?: Batch;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-batch-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule
  ],
  templateUrl: './batch-dialog.component.html',
  styleUrls: ['./batch-dialog.component.css']
})
export class BatchDialogComponent implements OnInit {
  batchForm: FormGroup;
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  departments: Department[] = [];
  yearOptions: number[] = [];
  isLoading = false;
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<BatchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BatchDialogData,
    private fb: FormBuilder,
    private batchService: BatchService,
    private courseService: CourseService,
    private departmentService: DepartmentService,
    private snackBar: MatSnackBar
  ) {
    // Generate year options (current year to +10 years)
    this.generateYearOptions();
    
    this.batchForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9]+$/)]],
      department: ['', Validators.required],
      course: ['', Validators.required],
      startYear: ['', Validators.required],
      endYear: ['', Validators.required],
      maxStudents: ['', [Validators.required, Validators.min(1), Validators.max(200)]],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadInitialData().then(() => {
      if (this.data.mode === 'edit' && this.data.batch) {
        this.populateForm();
      }
    });

    // Auto-generate code when name changes
    this.batchForm.get('name')?.valueChanges.subscribe(name => {
      if (name && this.data.mode === 'create') {
        const code = this.generateBatchCode(name);
        this.batchForm.patchValue({ code }, { emitEvent: false });
      }
    });

    // Filter courses when department changes
    this.batchForm.get('department')?.valueChanges.subscribe(departmentId => {
      this.onDepartmentChange(departmentId);
    });

    // Auto-set end year when start year changes
    this.batchForm.get('startYear')?.valueChanges.subscribe(startYear => {
      if (startYear) {
        const endYear = parseInt(startYear) + 4; // Assuming 4-year programs
        // Only auto-set if the end year is within our year options
        if (this.yearOptions.includes(endYear)) {
          this.batchForm.patchValue({ endYear }, { emitEvent: false });
        }
      }
    });
  }

  loadInitialData(): Promise<void> {
    this.isLoading = true;

    const loadCourses = this.courseService.getCourses().toPromise();
    const loadDepartments = this.departmentService.getDepartments().toPromise();

    return Promise.all([loadCourses, loadDepartments])
      .then(([coursesResponse, departmentsResponse]) => {
        // Handle different response formats
        if (Array.isArray(coursesResponse)) {
          this.courses = coursesResponse;
        } else if (coursesResponse && 'data' in coursesResponse) {
          this.courses = (coursesResponse as any).data;
        } else {
          this.courses = [];
        }

        if (Array.isArray(departmentsResponse)) {
          this.departments = departmentsResponse;
        } else if (departmentsResponse && 'data' in departmentsResponse) {
          this.departments = (departmentsResponse as any).data;
        } else {
          this.departments = [];
        }

        // Initialize filtered courses as empty (will be populated when department is selected)
        this.filteredCourses = [];

        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error loading initial data:', error);
        this.snackBar.open('Error loading data', 'Close', { duration: 3000 });
        this.isLoading = false;
        throw error; // Re-throw to propagate the error
      });
  }

  populateForm() {
    if (this.data.batch) {
      // Extract IDs from populated objects
      const departmentId = typeof this.data.batch.department === 'object' 
        ? this.data.batch.department._id 
        : this.data.batch.department;
      
      const courseId = typeof this.data.batch.course === 'object' 
        ? this.data.batch.course._id 
        : this.data.batch.course;

      // First populate all fields except course
      this.batchForm.patchValue({
        name: this.data.batch.name,
        code: this.data.batch.code,
        department: departmentId,
        startYear: this.data.batch.startYear,
        endYear: this.data.batch.endYear,
        maxStudents: this.data.batch.maxStudents,
        description: this.data.batch.description || ''
      });

      // Trigger department change to filter courses, then set the course
      if (departmentId) {
        this.onDepartmentChange(departmentId);
        
        // Now set the course after filtering
        this.batchForm.patchValue({
          course: courseId
        });
      }
    }
  }

  generateBatchCode(name: string): string {
    // Generate a code from the batch name
    const words = name.split(' ');
    let code = '';
    
    if (words.length === 1) {
      code = words[0].substring(0, 4).toUpperCase();
    } else {
      code = words.map(word => word.charAt(0)).join('').toUpperCase();
    }
    
    // Add current year
    const year = new Date().getFullYear().toString().slice(-2);
    return `${code}${year}`;
  }

  onSubmit() {
    if (this.batchForm.valid) {
      this.isSubmitting = true;
      const formData = this.batchForm.value;

      if (this.data.mode === 'create') {
        this.createBatch(formData);
      } else {
        this.updateBatch(formData);
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  createBatch(batchData: any) {
    this.batchService.createBatch(batchData).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.snackBar.open('Batch created successfully', 'Close', { duration: 3000 });
        this.dialogRef.close(true);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error creating batch:', error);
        const errorMessage = error.error?.message || 'Error creating batch';
        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
      }
    });
  }

  updateBatch(batchData: any) {
    if (this.data.batch?._id) {
      this.batchService.updateBatch(this.data.batch._id, batchData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.snackBar.open('Batch updated successfully', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.isSubmitting = false;
          console.error('Error updating batch:', error);
          const errorMessage = error.error?.message || 'Error updating batch';
          this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched() {
    Object.keys(this.batchForm.controls).forEach(key => {
      const control = this.batchForm.get(key);
      control?.markAsTouched();
    });
  }

  private generateYearOptions() {
    const currentYear = new Date().getFullYear();
    this.yearOptions = [];
    for (let i = 0; i <= 10; i++) {
      this.yearOptions.push(currentYear + i);
    }
  }

  private onDepartmentChange(departmentId: string) {
    if (!departmentId) {
      this.filteredCourses = [];
      this.batchForm.patchValue({ course: '' });
      return;
    }

    // Filter courses based on selected department
    this.filteredCourses = this.courses.filter(course => {
      const courseDepId = typeof course.department === 'object' 
        ? course.department._id 
        : course.department;
      return courseDepId === departmentId;
    });

    // Reset course selection if current course is not available for the new department
    const currentCourse = this.batchForm.get('course')?.value;
    if (currentCourse && !this.filteredCourses.find(c => c._id === currentCourse)) {
      this.batchForm.patchValue({ course: '' });
    }
  }

  // Getter methods for form validation
  get nameControl() { return this.batchForm.get('name'); }
  get codeControl() { return this.batchForm.get('code'); }
  get departmentControl() { return this.batchForm.get('department'); }
  get courseControl() { return this.batchForm.get('course'); }
  get startYearControl() { return this.batchForm.get('startYear'); }
  get endYearControl() { return this.batchForm.get('endYear'); }
  get maxStudentsControl() { return this.batchForm.get('maxStudents'); }

  getTitle(): string {
    return this.data.mode === 'create' ? 'Create New Batch' : 'Edit Batch';
  }

  getSubmitButtonText(): string {
    if (this.isSubmitting) {
      return this.data.mode === 'create' ? 'Creating...' : 'Updating...';
    }
    return this.data.mode === 'create' ? 'Create Batch' : 'Update Batch';
  }
}
