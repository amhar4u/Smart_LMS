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
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>{{ data.department ? 'edit' : 'account_balance' }}</mat-icon>
          </div>
          <div class="header-text">
            <h2 mat-dialog-title>
              {{ data.department ? 'Edit Department' : 'Create New Department' }}
            </h2>
            <p class="header-subtitle" *ngIf="!data.department">Add a new academic department to your institution</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <form [formGroup]="departmentForm" class="department-form">
          
          <!-- Basic Information Section -->
          <div class="form-section">
            <div class="section-header">
              <mat-icon>info</mat-icon>
              <h3>Basic Information</h3>
              <span class="required-badge">Required</span>
            </div>
            
            <div class="form-grid">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Department Name</mat-label>
                <mat-icon matPrefix>business</mat-icon>
                <input matInput formControlName="name" placeholder="e.g., Computer Science">
                <mat-error>{{ getErrorMessage('name') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Department Code</mat-label>
                <mat-icon matPrefix>tag</mat-icon>
                <input matInput formControlName="code" placeholder="e.g., CS" style="text-transform: uppercase;">
                <mat-error>{{ getErrorMessage('code') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>Description (Optional)</mat-label>
                <mat-icon matPrefix>description</mat-icon>
                <textarea matInput formControlName="description" rows="3" placeholder="Brief description of the department..." maxlength="500"></textarea>
                <mat-hint align="end">{{ departmentForm.get('description')?.value?.length || 0 }}/500</mat-hint>
                <mat-error>{{ getErrorMessage('description') }}</mat-error>
              </mat-form-field>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Contact Information Section -->
          <div class="form-section">
            <div class="section-header">
              <mat-icon>contact_mail</mat-icon>
              <h3>Contact Information</h3>
              <span class="optional-badge">Optional</span>
            </div>
            
            <div class="form-grid">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Contact Email</mat-label>
                <mat-icon matPrefix>email</mat-icon>
                <input matInput formControlName="email" type="email" placeholder="dept@university.edu">
                <mat-error>{{ getErrorMessage('email') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Phone Number</mat-label>
                <mat-icon matPrefix>phone</mat-icon>
                <input matInput formControlName="phone" placeholder="+1 234 567 8900">
                <mat-error>{{ getErrorMessage('phone') }}</mat-error>
              </mat-form-field>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Additional Details Section -->
          <div class="form-section">
            <div class="section-header">
              <mat-icon>more_horiz</mat-icon>
              <h3>Additional Details</h3>
              <span class="optional-badge">Optional</span>
            </div>
            
            <div class="form-grid">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Office Location</mat-label>
                <mat-icon matPrefix>location_on</mat-icon>
                <input matInput formControlName="office" placeholder="e.g., Building A, Room 201">
                <mat-error>{{ getErrorMessage('office') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Established Year</mat-label>
                <mat-icon matPrefix>calendar_today</mat-icon>
                <input matInput formControlName="establishedYear" type="number" placeholder="e.g., 2000" min="1900" max="2025">
                <mat-error>{{ getErrorMessage('establishedYear') }}</mat-error>
              </mat-form-field>
            </div>

            <div class="status-toggle">
              <mat-slide-toggle formControlName="isActive" color="primary">
                <div class="toggle-label">
                  <mat-icon>{{ departmentForm.get('isActive')?.value ? 'check_circle' : 'cancel' }}</mat-icon>
                  <span>{{ departmentForm.get('isActive')?.value ? 'Active Department' : 'Inactive Department' }}</span>
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
          <button mat-raised-button color="primary" (click)="onSave()" [disabled]="departmentForm.invalid">
            <mat-icon>{{ data.department ? 'save' : 'add_circle' }}</mat-icon>
            {{ data.department ? 'Update Department' : 'Create Department' }}
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

    .department-form {
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

    .optional-badge {
      background: #e3f2fd;
      color: #1976d2;
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

    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e0e0e0, transparent);
      margin: 8px 0;
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
