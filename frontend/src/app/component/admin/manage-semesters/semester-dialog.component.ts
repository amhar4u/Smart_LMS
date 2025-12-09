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
import { Batch, BatchService } from '../../../services/batch.service';
import { Course, CourseService } from '../../../services/course.service';
import { Department, DepartmentService } from '../../../services/department.service';

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
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>{{ data.semester ? 'edit' : 'calendar_month' }}</mat-icon>
          </div>
          <div class="header-text">
            <h2 mat-dialog-title>
              {{ data.semester ? 'Edit Semester' : 'Create New Semester' }}
            </h2>
            <p class="header-subtitle" *ngIf="!data.semester">Set up a new academic semester for your institution</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <form [formGroup]="semesterForm" class="semester-form">
          
          <!-- Basic Information Section -->
          <div class="form-section">
            <div class="section-header">
              <mat-icon>info</mat-icon>
              <h3>Basic Information</h3>
              <span class="required-badge">Required</span>
            </div>
            
            <div class="form-grid">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Semester Name</mat-label>
                <mat-icon matPrefix>label</mat-icon>
                <input matInput formControlName="name" placeholder="e.g., Fall 2024">
                <mat-error>{{ getErrorMessage('name') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Semester Code</mat-label>
                <mat-icon matPrefix>tag</mat-icon>
                <input matInput formControlName="code" placeholder="e.g., F24" style="text-transform: uppercase;">
                <mat-error>{{ getErrorMessage('code') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Semester Type</mat-label>
                <mat-icon matPrefix>event</mat-icon>
                <mat-select formControlName="type">
                  <mat-option value="fall">🍂 Fall</mat-option>
                  <mat-option value="spring">🌸 Spring</mat-option>
                  <mat-option value="summer">☀️ Summer</mat-option>
                </mat-select>
                <mat-error>{{ getErrorMessage('type') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Year</mat-label>
                <mat-icon matPrefix>calendar_today</mat-icon>
                <input matInput type="number" formControlName="year" placeholder="2024" min="2020" max="2030">
                <mat-error>{{ getErrorMessage('year') }}</mat-error>
              </mat-form-field>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Academic Structure Section -->
          <div class="form-section">
            <div class="section-header">
              <mat-icon>account_tree</mat-icon>
              <h3>Academic Structure</h3>
              <span class="required-badge">Required</span>
            </div>
            
            <div class="form-grid">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Department</mat-label>
                <mat-icon matPrefix>business</mat-icon>
                <mat-select formControlName="department">
                  <mat-option *ngFor="let dept of departments" [value]="dept._id">
                    {{ dept.name }}
                  </mat-option>
                </mat-select>
                <mat-error>{{ getErrorMessage('department') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Course</mat-label>
                <mat-icon matPrefix>menu_book</mat-icon>
                <mat-select formControlName="course" [disabled]="!filteredCourses.length">
                  <mat-option *ngFor="let course of filteredCourses" [value]="course._id">
                    {{ course.name }}
                  </mat-option>
                </mat-select>
                <mat-hint *ngIf="!filteredCourses.length" class="info-hint">
                  <mat-icon>info</mat-icon> Select department first
                </mat-hint>
                <mat-error>{{ getErrorMessage('course') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>Batch</mat-label>
                <mat-icon matPrefix>group</mat-icon>
                <mat-select formControlName="batch" [disabled]="!filteredBatches.length">
                  <mat-option *ngFor="let batch of filteredBatches" [value]="batch._id">
                    {{ batch.name }} ({{ batch.startYear }}-{{ batch.endYear }})
                  </mat-option>
                </mat-select>
                <mat-hint *ngIf="!filteredBatches.length" class="info-hint">
                  <mat-icon>info</mat-icon> Select course first
                </mat-hint>
                <mat-error>{{ getErrorMessage('batch') }}</mat-error>
              </mat-form-field>
            </div>
          </div>

          <div class="divider"></div>

          <!-- Duration & Details Section -->
          <div class="form-section">
            <div class="section-header">
              <mat-icon>schedule</mat-icon>
              <h3>Duration & Details</h3>
              <span class="required-badge">Required</span>
            </div>
            
            <div class="form-grid">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Start Date</mat-label>
                <mat-icon matPrefix>event_available</mat-icon>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                <mat-error>{{ getErrorMessage('startDate') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>End Date</mat-label>
                <mat-icon matPrefix>event_busy</mat-icon>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
                <mat-error>{{ getErrorMessage('endDate') }}</mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field full-width">
                <mat-label>Description (Optional)</mat-label>
                <mat-icon matPrefix>description</mat-icon>
                <textarea matInput formControlName="description" rows="3" placeholder="Brief description of the semester..." maxlength="500"></textarea>
                <mat-hint align="end">{{ semesterForm.get('description')?.value?.length || 0 }}/500</mat-hint>
                <mat-error>{{ getErrorMessage('description') }}</mat-error>
              </mat-form-field>
            </div>

            <div class="status-toggles">
              <mat-slide-toggle formControlName="isActive" color="primary">
                <div class="toggle-label">
                  <mat-icon>{{ semesterForm.get('isActive')?.value ? 'check_circle' : 'cancel' }}</mat-icon>
                  <span>{{ semesterForm.get('isActive')?.value ? 'Active Semester' : 'Inactive Semester' }}</span>
                </div>
              </mat-slide-toggle>
              <mat-slide-toggle formControlName="isCurrent" color="accent">
                <div class="toggle-label">
                  <mat-icon>{{ semesterForm.get('isCurrent')?.value ? 'star' : 'star_border' }}</mat-icon>
                  <span>{{ semesterForm.get('isCurrent')?.value ? 'Current Semester' : 'Not Current' }}</span>
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
          <button mat-raised-button color="primary" (click)="onSave()" [disabled]="semesterForm.invalid">
            <mat-icon>{{ data.semester ? 'save' : 'add_circle' }}</mat-icon>
            {{ data.semester ? 'Update Semester' : 'Create Semester' }}
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

    .semester-form {
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

    .divider {
      height: 1px;
      background: linear-gradient(to right, transparent, #e0e0e0, transparent);
      margin: 8px 0;
    }

    .status-toggles {
      display: flex;
      gap: 24px;
      padding: 16px 0 0 0;
      border-top: 1px solid #f0f0f0;
      margin-top: 16px;
      flex-wrap: wrap;
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

    .info-hint {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
      font-size: 12px;
    }

    .info-hint mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
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

    @media (max-width: 768px) {
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

      .status-toggles {
        flex-direction: column;
        gap: 12px;
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

    @media (max-width: 480px) {
      .semester-form {
        min-width: 100%;
      }
    }
  `]
})
export class SemesterDialogComponent implements OnInit {
  semesterForm!: FormGroup;
  departments: Department[] = [];
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  filteredBatches: Batch[] = [];
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SemesterDialogComponent>,
    private batchService: BatchService,
    private courseService: CourseService,
    private departmentService: DepartmentService,
    @Inject(MAT_DIALOG_DATA) public data: SemesterDialogData
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadInitialData().then(() => {
      if (this.data.semester) {
        this.populateFormForEdit();
      }
    });
  }

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
      department: ['', [Validators.required]],
      course: ['', [Validators.required]],
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

    // Set up form change listeners
    this.semesterForm.get('department')?.valueChanges.subscribe(departmentId => {
      this.onDepartmentChange(departmentId);
    });

    this.semesterForm.get('course')?.valueChanges.subscribe(courseId => {
      this.onCourseChange(courseId);
    });
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    
    try {
      const [departmentsRes, coursesRes] = await Promise.all([
        this.departmentService.getDepartments().toPromise(),
        this.courseService.getCourses().toPromise()
      ]);

      // Handle different response formats
      if (Array.isArray(departmentsRes)) {
        this.departments = departmentsRes;
      } else if (departmentsRes && 'data' in departmentsRes) {
        this.departments = (departmentsRes as any).data;
      }

      if (Array.isArray(coursesRes)) {
        this.courses = coursesRes;
      } else if (coursesRes && 'data' in coursesRes) {
        this.courses = (coursesRes as any).data;
      }

      this.isLoading = false;
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.isLoading = false;
    }
  }

  populateFormForEdit(): void {
    if (this.data.semester) {
      // Get the batch to extract department and course info
      const batchId = typeof this.data.semester.batch === 'object' 
        ? this.data.semester.batch._id 
        : this.data.semester.batch;
      
      const batch = this.data.batches.find(b => b._id === batchId);
      
      if (batch) {
        const departmentId = typeof batch.department === 'object' 
          ? batch.department._id 
          : batch.department;
        
        const courseId = typeof batch.course === 'object' 
          ? batch.course._id 
          : batch.course;

        // Set department and course values
        this.semesterForm.patchValue({
          department: departmentId,
          course: courseId
        });

        // Trigger filtering
        this.onDepartmentChange(departmentId);
        this.onCourseChange(courseId);
      }
    }
  }

  onDepartmentChange(departmentId: string): void {
    if (!departmentId) {
      this.filteredCourses = [];
      this.filteredBatches = [];
      this.semesterForm.patchValue({ course: '', batch: '' });
      return;
    }

    // Filter courses by department
    this.filteredCourses = this.courses.filter(course => {
      const courseDepId = typeof course.department === 'object' 
        ? course.department._id 
        : course.department;
      return courseDepId === departmentId;
    });

    // Reset course and batch if current course is not in filtered courses
    const currentCourse = this.semesterForm.get('course')?.value;
    if (currentCourse && !this.filteredCourses.find(c => c._id === currentCourse)) {
      this.semesterForm.patchValue({ course: '', batch: '' });
    }
  }

  onCourseChange(courseId: string): void {
    if (!courseId) {
      this.filteredBatches = [];
      this.semesterForm.patchValue({ batch: '' });
      return;
    }

    // Filter batches by course
    this.filteredBatches = this.data.batches.filter(batch => {
      const batchCourseId = typeof batch.course === 'object' 
        ? batch.course._id 
        : batch.course;
      return batchCourseId === courseId;
    });

    // Reset batch if current batch is not in filtered batches
    const currentBatch = this.semesterForm.get('batch')?.value;
    if (currentBatch && !this.filteredBatches.find(b => b._id === currentBatch)) {
      this.semesterForm.patchValue({ batch: '' });
    }
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
      department: 'Department',
      course: 'Course',
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
