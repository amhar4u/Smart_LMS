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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { Semester } from '../../../services/semester.service';

export interface SemesterDialogData {
  semester?: Semester;
}

@Component({
  selector: 'app-semester-dialog',
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
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="semester-dialog">
      <h2 mat-dialog-title>
        <mat-icon>{{ data.semester ? 'edit' : 'add' }}</mat-icon>
        {{ data.semester ? 'Edit Semester' : 'Add New Semester' }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="semesterForm" class="semester-form">
          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Semester Name</mat-label>
              <input matInput formControlName="name" placeholder="Enter semester name">
              <mat-error>{{ getErrorMessage('name') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Semester Code</mat-label>
              <input matInput formControlName="code" placeholder="Enter semester code" style="text-transform: uppercase;">
              <mat-error>{{ getErrorMessage('code') }}</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Year</mat-label>
              <input matInput formControlName="year" type="number" placeholder="Enter year" min="2020" max="2030">
              <mat-error>{{ getErrorMessage('year') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Semester Type</mat-label>
              <mat-select formControlName="type">
                <mat-option value="fall">Fall Semester</mat-option>
                <mat-option value="spring">Spring Semester</mat-option>
                <mat-option value="summer">Summer Semester</mat-option>
              </mat-select>
              <mat-error>{{ getErrorMessage('type') }}</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
              <mat-error>{{ getErrorMessage('startDate') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
              <mat-error>{{ getErrorMessage('endDate') }}</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Registration Start Date</mat-label>
              <input matInput [matDatepicker]="regStartPicker" formControlName="registrationStartDate">
              <mat-datepicker-toggle matSuffix [for]="regStartPicker"></mat-datepicker-toggle>
              <mat-datepicker #regStartPicker></mat-datepicker>
              <mat-error>{{ getErrorMessage('registrationStartDate') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Registration End Date</mat-label>
              <input matInput [matDatepicker]="regEndPicker" formControlName="registrationEndDate">
              <mat-datepicker-toggle matSuffix [for]="regEndPicker"></mat-datepicker-toggle>
              <mat-datepicker #regEndPicker></mat-datepicker>
              <mat-error>{{ getErrorMessage('registrationEndDate') }}</mat-error>
            </mat-form-field>
          </div>

          <div class="toggle-section">
            <div class="toggle-row">
              <mat-slide-toggle formControlName="isActive" color="primary">
                Active Semester
              </mat-slide-toggle>
              <span class="toggle-description">Allow enrollment and course management</span>
            </div>
            
            <div class="toggle-row">
              <mat-slide-toggle formControlName="isCurrent" color="accent">
                Current Semester
              </mat-slide-toggle>
              <span class="toggle-description">Set as the currently active academic semester</span>
            </div>
          </div>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="onCancel()">
          <mat-icon>cancel</mat-icon>
          Cancel
        </button>
        <button mat-raised-button color="primary" (click)="onSave()" [disabled]="semesterForm.invalid">
          <mat-icon>{{ data.semester ? 'save' : 'add' }}</mat-icon>
          {{ data.semester ? 'Update Semester' : 'Create Semester' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .semester-dialog h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      color: #333;
      font-weight: 600;
    }

    .semester-form {
      min-width: 500px;
      padding: 16px 0;
    }

    .form-row {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 8px;
    }

    .form-field {
      flex: 1;
      min-width: 200px;
    }

    .toggle-section {
      padding: 16px 0 8px 0;
      border-top: 1px solid #e0e0e0;
      margin-top: 16px;
    }

    .toggle-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 12px;
    }

    .toggle-description {
      color: #666;
      font-size: 14px;
      font-style: italic;
    }

    mat-dialog-actions {
      gap: 12px;
      padding: 16px 0 8px 0;
    }

    mat-dialog-actions button {
      min-width: 120px;
    }

    @media (max-width: 600px) {
      .semester-form {
        min-width: 320px;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .toggle-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }
  `]
})
export class SemesterDialogComponent implements OnInit {
  semesterForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SemesterDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SemesterDialogData
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {}

  initializeForm(): void {
    this.semesterForm = this.fb.group({
      name: [
        this.data.semester?.name || '', 
        [Validators.required, Validators.minLength(2), Validators.maxLength(100)]
      ],
      code: [
        this.data.semester?.code || '', 
        [Validators.required, Validators.minLength(2), Validators.maxLength(10)]
      ],
      year: [
        this.data.semester?.year || new Date().getFullYear(),
        [Validators.required, Validators.min(2020), Validators.max(2030)]
      ],
      type: [
        this.data.semester?.type || 'fall',
        [Validators.required]
      ],
      startDate: [
        this.data.semester?.startDate || '',
        [Validators.required]
      ],
      endDate: [
        this.data.semester?.endDate || '',
        [Validators.required]
      ],
      registrationStartDate: [
        this.data.semester?.registrationStartDate || ''
      ],
      registrationEndDate: [
        this.data.semester?.registrationEndDate || ''
      ],
      isActive: [
        this.data.semester?.isActive !== undefined ? this.data.semester.isActive : true
      ],
      isCurrent: [
        this.data.semester?.isCurrent !== undefined ? this.data.semester.isCurrent : false
      ]
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.semesterForm.get(fieldName);
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
    if (this.semesterForm.valid) {
      this.dialogRef.close(this.semesterForm.value);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.semesterForm.controls).forEach(key => {
      const control = this.semesterForm.get(key);
      control?.markAsTouched();
    });
  }
}
