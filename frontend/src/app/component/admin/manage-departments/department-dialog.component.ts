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

import { Department } from '../../../services/department.service';

export interface DepartmentDialogData {
  department?: Department;
}

@Component({
  selector: 'app-department-dialog',
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
    <div class="department-dialog">
      <h2 mat-dialog-title>
        <mat-icon>{{ data.department ? 'edit' : 'add' }}</mat-icon>
        {{ data.department ? 'Edit Department' : 'Add New Department' }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="departmentForm" class="department-form">
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Department Name</mat-label>
              <input matInput formControlName="name" placeholder="Enter department name">
              <mat-error>{{ getErrorMessage('name') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Department Code</mat-label>
              <input matInput formControlName="code" placeholder="Enter department code" style="text-transform: uppercase;">
              <mat-error>{{ getErrorMessage('code') }}</mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description (Optional)</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Enter department description"></textarea>
            <mat-error>{{ getErrorMessage('description') }}</mat-error>
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Contact Email</mat-label>
              <input matInput formControlName="email" type="email" placeholder="Enter contact email">
              <mat-error>{{ getErrorMessage('email') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Phone Number</mat-label>
              <input matInput formControlName="phone" placeholder="Enter phone number">
              <mat-error>{{ getErrorMessage('phone') }}</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Office Location</mat-label>
              <input matInput formControlName="office" placeholder="Enter office location">
              <mat-error>{{ getErrorMessage('office') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Established Year</mat-label>
              <input matInput formControlName="establishedYear" type="number" placeholder="Enter year" min="1900" max="2025">
              <mat-error>{{ getErrorMessage('establishedYear') }}</mat-error>
            </mat-form-field>
          </div>

          <div class="status-toggle">
            <mat-slide-toggle formControlName="isActive" color="primary">
              Active Department
            </mat-slide-toggle>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">
          <mat-icon>cancel</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="primary" (click)="onSave()" [disabled]="departmentForm.invalid">
          <mat-icon>{{ data.department ? 'save' : 'add' }}</mat-icon>
          {{ data.department ? 'Update Department' : 'Create Department' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .department-dialog h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      color: #333;
      font-weight: 600;
    }

    .department-form {
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
      .department-form {
        min-width: 320px;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class DepartmentDialogComponent implements OnInit {
  departmentForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<DepartmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DepartmentDialogData
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {}

  initializeForm(): void {
    this.departmentForm = this.fb.group({
      name: [
        this.data.department?.name || '', 
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)]
      ],
      code: [
        this.data.department?.code || '', 
        [Validators.required, Validators.minLength(2), Validators.maxLength(10)]
      ],
      description: [
        this.data.department?.description || '', 
        [Validators.maxLength(500)]
      ],
      email: [
        this.data.department?.contactInfo?.email || '',
        [Validators.email, Validators.maxLength(100)]
      ],
      phone: [
        this.data.department?.contactInfo?.phone || '',
        [Validators.maxLength(20)]
      ],
      office: [
        this.data.department?.contactInfo?.office || '',
        [Validators.maxLength(100)]
      ],
      establishedYear: [
        this.data.department?.establishedYear || '',
        [Validators.min(1900), Validators.max(2025)]
      ],
      isActive: [
        this.data.department?.isActive !== undefined ? this.data.department.isActive : true
      ]
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.departmentForm.get(fieldName);
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
    if (field.hasError('email')) {
      return 'Please enter a valid email address';
    }

    return '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.departmentForm.valid) {
      this.dialogRef.close(this.departmentForm.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.departmentForm.controls).forEach(key => {
      const control = this.departmentForm.get(key);
      control?.markAsTouched();
    });
  }
}
