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
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>{{ data.course ? 'edit' : 'menu_book' }}</mat-icon>
          </div>
          <div class="header-text">
            <h2 mat-dialog-title>
              {{ data.course ? 'Edit Course' : 'Create New Course' }}
            </h2>
            <p class="header-subtitle" *ngIf="!data.course">Add a new academic course to your institution</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <form [formGroup]="courseForm" class="course-form">
          
          <!-- Basic Information Section -->
          <div class="form-section">
            <div class="section-header">
              <mat-icon>info</mat-icon>
              <h3>Basic Information</h3>
              <span class="required-badge">Required</span>
            </div>
            
            <div class="form-grid">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Course Name</mat-label>
                <mat-icon matPrefix>school</mat-icon>
                <input matInput formControlName="name" placeholder="e.g., Bachelor of Computer Science">
                <mat-error>{{ getErrorMessage('name') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Course Code</mat-label>
                <mat-icon matPrefix>tag</mat-icon>
                <input matInput formControlName="code" placeholder="e.g., BCS" style="text-transform: uppercase;">
                <mat-error>{{ getErrorMessage('code') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Department</mat-label>
                <mat-icon matPrefix>business</mat-icon>
                <mat-select formControlName="department" required>
                  <mat-option *ngFor="let dept of departments" [value]="dept._id">
                    <div class="dept-option">
                      <span>{{ dept.name }}</span>
                      <span class="dept-code">({{ dept.code }})</span>
                    </div>
                  </mat-option>
                </mat-select>
                <mat-error>{{ getErrorMessage('department') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Duration</mat-label>
                <mat-icon matPrefix>schedule</mat-icon>
                <mat-select formControlName="duration">
                  <mat-option value="1 month">1 Month</mat-option>
                  <mat-option value="3 months">3 Months</mat-option>
                  <mat-option value="6 months">6 Months</mat-option>
                  <mat-option value="semester">1 Semester</mat-option>
                  <mat-option value="1 semester">1 Semester</mat-option>
                  <mat-option value="2 semesters">2 Semesters</mat-option>
                  <mat-option value="1 year">1 Year</mat-option>
                  <mat-option value="2 years">2 Years</mat-option>
                  <mat-option value="3 years">3 Years</mat-option>
                  <mat-option value="4 years">4 Years</mat-option>
                  <mat-option value="5 years">5 Years</mat-option>
                </mat-select>
                <mat-error>{{ getErrorMessage('duration') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>Description (Optional)</mat-label>
                <mat-icon matPrefix>description</mat-icon>
                <textarea matInput formControlName="description" rows="3" placeholder="Brief description of the course..." maxlength="500"></textarea>
                <mat-hint align="end">{{ courseForm.get('description')?.value?.length || 0 }}/500</mat-hint>
                <mat-error>{{ getErrorMessage('description') }}</mat-error>
              </mat-form-field>
            </div>

            <div class="status-toggle">
              <mat-slide-toggle formControlName="isActive" color="primary">
                <div class="toggle-label">
                  <mat-icon>{{ courseForm.get('isActive')?.value ? 'check_circle' : 'cancel' }}</mat-icon>
                  <span>{{ courseForm.get('isActive')?.value ? 'Active Course' : 'Inactive Course' }}</span>
                </div>
              </mat-slide-toggle>
            </div>
          </div>

        </form>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <div class="left-actions">
          <button mat-stroked-button type="button" (click)="onCancel()">
            <mat-icon>close</mat-icon>
            Cancel
          </button>
        </div>
        <div class="right-actions">
          <button mat-raised-button color="primary" (click)="onSave()" [disabled]="courseForm.invalid">
            <mat-icon>{{ data.course ? 'save' : 'add_circle' }}</mat-icon>
            {{ data.course ? 'Update Course' : 'Create Course' }}
          </button>
        </div>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      max-width: 700px;
      width: 100%;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-icon mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
      color: white;
    }

    .header-text h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      color: white;
    }

    .header-subtitle {
      margin: 4px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
      color: rgba(255, 255, 255, 0.9);
    }

    .close-button {
      color: white !important;
    }

    .close-button mat-icon {
      color: white;
    }

    .dialog-content {
      padding: 24px !important;
      max-height: 65vh;
      overflow-y: auto;
      background: #f8f9fa;
    }

    .course-form {
      display: flex;
      flex-direction: column;
    }

    .form-section {
      background: white;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .form-section:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #f0f0f0;
    }

    .section-header mat-icon {
      color: #667eea;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .section-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
      flex: 1;
    }

    .required-badge {
      background: #fef3e2;
      color: #f59e0b;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .form-field {
      width: 100%;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .status-toggle {
      padding: 16px 0 0 0;
      border-top: 1px solid #f0f0f0;
      margin-top: 16px;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #333;
    }

    .toggle-label mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .dept-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .dept-code {
      color: #666;
      font-size: 12px;
    }

    ::ng-deep .mat-mdc-form-field .mat-mdc-text-field-wrapper {
      background: #fafafa;
    }

    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-text-field-wrapper {
      background: white;
    }

    .dialog-actions {
      display: flex;
      justify-content: space-between;
      padding: 16px 24px !important;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }

    .left-actions, .right-actions {
      display: flex;
      gap: 12px;
    }

    .dialog-actions button {
      min-width: 140px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 600px) {
      .dialog-header {
        padding: 20px 16px;
      }

      .header-content {
        gap: 12px;
      }

      .header-icon {
        width: 40px;
        height: 40px;
      }

      .header-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .header-text h2 {
        font-size: 18px;
      }

      .header-subtitle {
        font-size: 12px;
      }

      .dialog-content {
        padding: 16px !important;
      }

      .form-section {
        padding: 16px;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .dialog-actions {
        flex-direction: column;
        gap: 12px;
      }

      .left-actions, .right-actions {
        width: 100%;
      }

      .dialog-actions button {
        width: 100%;
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
      duration: [
        this.data.course?.duration || '4 years',
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
