import { Component, Inject } from '@angular/core';
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

export interface CourseDialogData {
  course?: Course;
  categories: string[];
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
              <mat-label>Category</mat-label>
              <mat-select formControlName="category">
                <mat-option *ngFor="let category of data.categories" [value]="category">
                  {{ category }}
                </mat-option>
              </mat-select>
              <mat-error>{{ getErrorMessage('category') }}</mat-error>
            </mat-form-field>

            <div class="form-field status-field">
              <mat-slide-toggle formControlName="isActive" color="primary">
                Active Course
              </mat-slide-toggle>
            </div>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description (Optional)</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Enter course description"></textarea>
            <mat-error>{{ getErrorMessage('description') }}</mat-error>
          </mat-form-field>
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

    .status-field {
      display: flex;
      align-items: center;
      min-height: 56px;
      padding: 8px 0;
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
export class CourseDialogComponent {
  courseForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CourseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CourseDialogData
  ) {
    this.initializeForm();
  }

  initializeForm(): void {
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
      category: [
        this.data.course?.category || '', 
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
