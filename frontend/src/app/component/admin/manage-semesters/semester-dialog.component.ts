import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';

import { Semester } from '../../../services/semester.service';
import { Batch } from '../../../services/batch.service';

export interface SemesterDialogData {
  semester?: Semester;
  batches: Batch[];
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatIconModule
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
              <input matInput formControlName="name" placeholder="e.g., Fall 2024">
              <mat-error>{{ getErrorMessage('name') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Semester Code</mat-label>
              <input matInput formControlName="code" placeholder="e.g., F24" style="text-transform: uppercase;">
              <mat-error>{{ getErrorMessage('code') }}</mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Semester Type</mat-label>
              <mat-select formControlName="type">
                <mat-option value="fall">Fall</mat-option>
                <mat-option value="spring">Spring</mat-option>
                <mat-option value="summer">Summer</mat-option>
              </mat-select>
              <mat-error>{{ getErrorMessage('type') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Year</mat-label>
              <input matInput type="number" formControlName="year" placeholder="2024" min="2020" max="2030">
              <mat-error>{{ getErrorMessage('year') }}</mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Batch</mat-label>
            <mat-select formControlName="batch">
              <mat-option *ngFor="let batch of data.batches" [value]="batch._id">
                {{ batch.name }}
              </mat-option>
            </mat-select>
            <mat-error>{{ getErrorMessage('batch') }}</mat-error>
          </mat-form-field>

          <div class="form-row">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="startDate">
              <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
              <mat-error>{{ getErrorMessage('startDate') }}</mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="endDate">
              <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
              <mat-error>{{ getErrorMessage('endDate') }}</mat-error>
            </mat-form-field>
          </div>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description (Optional)</mat-label>
            <textarea matInput formControlName="description" rows="3" placeholder="Enter semester description"></textarea>
            <mat-error>{{ getErrorMessage('description') }}</mat-error>
          </mat-form-field>

          <div class="status-toggles">
            <mat-slide-toggle formControlName="isActive" color="primary">
              Active Semester
            </mat-slide-toggle>
            <mat-slide-toggle formControlName="isCurrent" color="accent">
              Current Semester
            </mat-slide-toggle>
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
      min-width: 600px;
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

    .status-toggles {
      display: flex;
      gap: 24px;
      padding: 16px 0 8px 0;
      flex-wrap: wrap;
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

    @media (max-width: 768px) {
      .semester-form {
        min-width: 400px;
      }

      .form-row {
        flex-direction: column;
        gap: 0;
      }

      .status-toggles {
        flex-direction: column;
        gap: 12px;
      }
    }

    @media (max-width: 480px) {
      .semester-form {
        min-width: 320px;
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
      type: [
        this.data.semester?.type || '', 
        [Validators.required]
      ],
      year: [
        this.data.semester?.year || '', 
        [Validators.required, Validators.min(2020), Validators.max(2030)]
      ],
      batch: [
        typeof this.data.semester?.batch === 'object' ? this.data.semester.batch._id : (this.data.semester?.batch || ''), 
        [Validators.required]
      ],
      startDate: [
        this.data.semester?.startDate ? new Date(this.data.semester.startDate) : null, 
        [Validators.required]
      ],
      endDate: [
        this.data.semester?.endDate ? new Date(this.data.semester.endDate) : null, 
        [Validators.required]
      ],
      description: [
        this.data.semester?.description || '', 
        [Validators.maxLength(500)]
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
      return `${this.getFieldDisplayName(fieldName)} is required`;
    }
    if (field.hasError('minlength')) {
      return `${this.getFieldDisplayName(fieldName)} must be at least ${field.errors?.['minlength']?.requiredLength} characters`;
    }
    if (field.hasError('maxlength')) {
      return `${this.getFieldDisplayName(fieldName)} cannot exceed ${field.errors?.['maxlength']?.requiredLength} characters`;
    }
    if (field.hasError('min')) {
      return `Year cannot be earlier than ${field.errors?.['min']?.min}`;
    }
    if (field.hasError('max')) {
      return `Year cannot be later than ${field.errors?.['max']?.max}`;
    }

    return '';
  }

  private getFieldDisplayName(fieldName: string): string {
    const fieldMap: { [key: string]: string } = {
      name: 'Semester name',
      code: 'Semester code',
      type: 'Semester type',
      year: 'Year',
      batch: 'Batch',
      startDate: 'Start date',
      endDate: 'End date',
      description: 'Description'
    };
    return fieldMap[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
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
