import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

import { Course } from '../../../services/course.service';
import { Department, DepartmentService } from '../../../services/department.service';

export interface CourseDialogData {
  course?: Course;
}

@Component({
  selector: 'app-course-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule
  ],
  template: `
    <div class="course-dialog">
      <h2 mat-dialog-title>
        <mat-icon>{{ data.course ? 'edit' : 'add' }}</mat-icon>
        {{ data.course ? 'Edit Course' : 'Add New Course' }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="courseForm" class="course-form">
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Course Name</mat-label>
              <input matInput formControlName="name" placeholder="Enter course name">
              <mat-error>{{ getErrorMessage('name') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Course Code</mat-label>
              <input matInput formControlName="code" placeholder="Enter course code" style="text-transform: uppercase;">
              <mat-error>{{ getErrorMessage('code') }}</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Department *</mat-label>
              <mat-select formControlName="department" required>
                <mat-option *ngFor="let dept of departments" [value]="dept._id">
                  {{ dept.name }} ({{ dept.code }})
                </mat-option>
              </mat-select>
              <mat-error>{{ getErrorMessage('department') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Credits</mat-label>
              <input matInput type="number" formControlName="credits" placeholder="Enter credits" min="1" max="10">
              <mat-error>{{ getErrorMessage('credits') }}</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Duration</mat-label>
              <mat-select formControlName="duration">
                <mat-option value="semester">Semester</mat-option>
                <mat-option value="year">Year</mat-option>
                <mat-option value="trimester">Trimester</mat-option>
              </mat-select>
              <mat-error>{{ getErrorMessage('duration') }}</mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description (Optional)</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Enter course description"></textarea>
            <mat-error>{{ getErrorMessage('description') }}</mat-error>
          </mat-form-field>

          <div class="status-toggle">
            <mat-slide-toggle formControlName="isActive" color="primary">
              Active Course
            </mat-slide-toggle>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">
          <mat-icon>cancel</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="primary" (click)="onSave()" [disabled]="courseForm.invalid">
          <mat-icon>{{ data.course ? 'save' : 'add' }}</mat-icon>
          {{ data.course ? 'Update Course' : 'Create Course' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .course-dialog h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      color: #333;
      font-weight: 600;
    }

    .course-form {
      min-width: 500px;
      padding: 16px 0;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
    }

    .form-field {
      flex: 1;
      min-width: 200px;
    }

    .status-toggle {
      padding: 16px 0 8px 0;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-actions {
      gap: 12px;
      padding: 16px 0 8px 0;
    }

    mat-dialog-actions button {
      min-width: 120px;
    }

    @media (max-width: 600px) {
      .course-form {
        min-width: 320px;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class CourseDialogComponent implements OnInit {
  courseForm!: FormGroup;
  departments: Department[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CourseDialogComponent>,
    private departmentService: DepartmentService,
    @Inject(MAT_DIALOG_DATA) public data: CourseDialogData
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadDepartments();
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

  initializeForm(): void {
    // Handle department value - it could be an object or a string
    let departmentValue = '';
    if (this.data.course?.department) {
      departmentValue = typeof this.data.course.department === 'string' 
        ? this.data.course.department 
        : this.data.course.department._id;
    }

    this.courseForm = this.fb.group({
      name: [
        this.data.course?.name || '', 
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)]
      ],
      code: [
        this.data.course?.code || '', 
        [Validators.required, Validators.minLength(2), Validators.maxLength(10)]
      ],
      description: [
        this.data.course?.description || '', 
        [Validators.maxLength(500)]
      ],
      department: [
        departmentValue,
        Validators.required
      ],
      credits: [
        this.data.course?.credits || 3,
        [Validators.required, Validators.min(1), Validators.max(10)]
      ],
      duration: [
        this.data.course?.duration || 'semester',
        Validators.required
      ],
      isActive: [
        this.data.course?.isActive !== undefined ? this.data.course.isActive : true
      ]
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.courseForm.get(fieldName);
    if (!field || !field.touched) return '';

    if (field.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field.hasError('minlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors?.['minlength']?.requiredLength} characters`;
    }
    if (field.hasError('maxlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot exceed ${field.errors?.['maxlength']?.requiredLength} characters`;
    }
    if (field.hasError('min')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors?.['min']?.min}`;
    }
    if (field.hasError('max')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} cannot exceed ${field.errors?.['max']?.max}`;
    }

    return '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.courseForm.valid) {
      this.dialogRef.close(this.courseForm.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.courseForm.controls).forEach(key => {
      const control = this.courseForm.get(key);
      control?.markAsTouched();
    });
  }
}
