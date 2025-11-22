import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, NativeDateAdapter, DateAdapter, MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MeetingService, Meeting } from '../../../services/meeting.service';
import { DepartmentService } from '../../../services/department.service';
import { CourseService } from '../../../services/course.service';
import { BatchService } from '../../../services/batch.service';
import { SemesterService } from '../../../services/semester.service';
import { SubjectService } from '../../../services/subject.service';

@Component({
  selector: 'app-meeting-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatIconModule
  ],
  providers: [
    { provide: DateAdapter, useClass: NativeDateAdapter },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS }
  ],
  template: `
    <div class="meeting-dialog">
      <h2 mat-dialog-title>
        <mat-icon>{{ isEditMode ? 'edit' : 'add_circle' }}</mat-icon>
        {{ isEditMode ? 'Edit Meeting' : 'Create New Meeting' }}
      </h2>

      <mat-dialog-content>
        <form [formGroup]="meetingForm" class="meeting-form">
          <!-- Meeting Topic -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Meeting Topic</mat-label>
            <input matInput formControlName="topic" placeholder="Enter meeting topic">
            <mat-icon matPrefix>topic</mat-icon>
            <mat-error *ngIf="meetingForm.get('topic')?.hasError('required')">
              Topic is required
            </mat-error>
          </mat-form-field>

          <!-- Meeting Description -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Meeting Description</mat-label>
            <textarea matInput formControlName="description" rows="3" 
                      placeholder="Enter meeting description"></textarea>
            <mat-icon matPrefix>description</mat-icon>
            <mat-error *ngIf="meetingForm.get('description')?.hasError('required')">
              Description is required
            </mat-error>
          </mat-form-field>

          <!-- Subject (For Lecturers - Show First) -->
          <mat-form-field appearance="outline" class="full-width" *ngIf="data.lecturerId">
            <mat-label>Subject</mat-label>
            <mat-select formControlName="subjectId" (selectionChange)="onSubjectChange()">
              <mat-option *ngFor="let subject of subjects" [value]="subject._id">
                {{ subject.name }} ({{ subject.code }})
              </mat-option>
            </mat-select>
            <mat-icon matPrefix>subject</mat-icon>
            <mat-error *ngIf="meetingForm.get('subjectId')?.hasError('required')">
              Subject is required
            </mat-error>
          </mat-form-field>

          <!-- Auto-populated Info Panel (For Lecturers) -->
          <div class="auto-populated-info" *ngIf="data.lecturerId && meetingForm.get('subjectId')?.value">
            <div class="info-header">
              <mat-icon>info</mat-icon>
              <h4>Auto-populated Information</h4>
            </div>
            <div class="info-grid">
              <div class="info-item">
                <label>Department</label>
                <span>{{ getSelectedSubjectInfo('department') }}</span>
              </div>
              <div class="info-item">
                <label>Course</label>
                <span>{{ getSelectedSubjectInfo('course') }}</span>
              </div>
              <div class="info-item">
                <label>Batch</label>
                <span>{{ getSelectedSubjectInfo('batch') }}</span>
              </div>
              <div class="info-item">
                <label>Semester</label>
                <span>{{ getSelectedSubjectInfo('semester') }}</span>
              </div>
            </div>
          </div>

          <!-- Admin Mode: Cascading Dropdowns -->
          <ng-container *ngIf="!data.lecturerId">
            <!-- Department -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Department</mat-label>
              <mat-select formControlName="departmentId" (selectionChange)="onDepartmentChange()">
                <mat-option *ngFor="let dept of departments" [value]="dept._id">
                  {{ dept.name }} ({{ dept.code }})
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>account_balance</mat-icon>
              <mat-error *ngIf="meetingForm.get('departmentId')?.hasError('required')">
                Department is required
              </mat-error>
            </mat-form-field>

            <!-- Course -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Course</mat-label>
              <mat-select formControlName="courseId" (selectionChange)="onCourseChange()">
                <mat-option *ngFor="let course of courses" [value]="course._id">
                  {{ course.name }} ({{ course.code }})
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>school</mat-icon>
              <mat-error *ngIf="meetingForm.get('courseId')?.hasError('required')">
                Course is required
              </mat-error>
            </mat-form-field>

            <!-- Batch -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Batch</mat-label>
              <mat-select formControlName="batchId" (selectionChange)="onBatchChange()">
                <mat-option *ngFor="let batch of batches" [value]="batch._id">
                  {{ batch.name }} - {{ batch.year }}
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>groups</mat-icon>
              <mat-error *ngIf="meetingForm.get('batchId')?.hasError('required')">
                Batch is required
              </mat-error>
            </mat-form-field>

            <!-- Semester -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Semester</mat-label>
              <mat-select formControlName="semesterId" (selectionChange)="onSemesterChange()">
                <mat-option *ngFor="let semester of semesters" [value]="semester._id">
                  {{ semester.name }}
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>event_note</mat-icon>
              <mat-error *ngIf="meetingForm.get('semesterId')?.hasError('required')">
                Semester is required
              </mat-error>
            </mat-form-field>

            <!-- Subject -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Subject</mat-label>
              <mat-select formControlName="subjectId" (selectionChange)="onSubjectChange()">
                <mat-option *ngFor="let subject of subjects" [value]="subject._id">
                  {{ subject.name }} ({{ subject.code }})
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>subject</mat-icon>
              <mat-error *ngIf="meetingForm.get('subjectId')?.hasError('required')">
                Subject is required
              </mat-error>
            </mat-form-field>
          </ng-container>

          <!-- Lecturer Info (Read-only) -->
          <mat-form-field appearance="outline" class="full-width" *ngIf="lecturerInfo">
            <mat-label>Meeting Incharge (Subject Lecturer)</mat-label>
            <input matInput [value]="lecturerInfo" readonly>
            <mat-icon matPrefix>person</mat-icon>
          </mat-form-field>

          <!-- Student Count (Read-only, from Batch) -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Max Students (From Batch)</mat-label>
            <input matInput formControlName="studentCount" readonly>
            <mat-icon matPrefix>groups</mat-icon>
            <mat-hint>This value is automatically fetched from the selected batch</mat-hint>
          </mat-form-field>

          <!-- Module Selection -->
          <div class="module-section" *ngIf="modules.length > 0">
            <div class="section-header">
              <mat-icon>view_module</mat-icon>
              <h3>Select Module(s) <span class="required">*</span></h3>
            </div>
            <div class="module-list">
              <mat-checkbox *ngFor="let module of modules" 
                            [checked]="isModuleSelected(module._id)"
                            (change)="onModuleToggle(module._id, $event.checked)"
                            class="module-checkbox">
                <div class="module-info">
                  <strong>{{ module.name }}</strong>
                  <span class="module-code">{{ module.code }}</span>
                  <small>{{ module.title }}</small>
                </div>
              </mat-checkbox>
            </div>
            <div class="error-message" *ngIf="selectedModules.length === 0 && formSubmitted">
              <mat-icon>error</mat-icon>
              Please select at least one module
            </div>
          </div>

          <!-- Meeting Date -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Meeting Date</mat-label>
            <input matInput 
                   [matDatepicker]="picker" 
                   formControlName="meetingDate" 
                   [min]="minDate" 
                   (dateChange)="calculateEndTime()"
                   placeholder="Select meeting date">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-error *ngIf="meetingForm.get('meetingDate')?.hasError('required')">
              Meeting date is required
            </mat-error>
          </mat-form-field>

          <!-- Meeting Start Time -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Meeting Start Time</mat-label>
            <input matInput type="time" formControlName="startTime" 
                   (change)="calculateEndTime()">
            <mat-icon matPrefix>access_time</mat-icon>
            <mat-error *ngIf="meetingForm.get('startTime')?.hasError('required')">
              Start time is required
            </mat-error>
          </mat-form-field>

          <!-- Meeting Duration -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Duration (minutes)</mat-label>
            <input matInput type="number" formControlName="duration" 
                   placeholder="Enter duration in minutes" min="1" max="480" 
                   (input)="calculateEndTime()">
            <mat-icon matPrefix>schedule</mat-icon>
            <mat-error *ngIf="meetingForm.get('duration')?.hasError('required')">
              Duration is required
            </mat-error>
            <mat-error *ngIf="meetingForm.get('duration')?.hasError('min')">
              Duration must be at least 1 minute
            </mat-error>
            <mat-error *ngIf="meetingForm.get('duration')?.hasError('max')">
              Duration cannot exceed 480 minutes (8 hours)
            </mat-error>
          </mat-form-field>

          <!-- Meeting End Time (Read-only, Auto-calculated) -->
          <mat-form-field appearance="outline" class="full-width" *ngIf="calculatedEndTime">
            <mat-label>Meeting End Time (Auto-calculated)</mat-label>
            <input matInput [value]="calculatedEndTime" readonly>
            <mat-icon matPrefix>event</mat-icon>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="loading">
          Cancel
        </button>
        <button mat-raised-button color="primary" (click)="onSubmit()" 
                [disabled]="loading || meetingForm.invalid || selectedModules.length === 0">
          <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
          <span *ngIf="!loading">{{ isEditMode ? 'Update Meeting' : 'Create Meeting' }}</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .meeting-dialog {
      width: 600px;
      max-width: 90vw;
    }

    h2[mat-dialog-title] {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #333;
      margin: 0;
      padding: 20px 24px;
      border-bottom: 2px solid #f0f0f0;
    }

    h2[mat-dialog-title] mat-icon {
      color: #667eea;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    mat-dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .meeting-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .full-width {
      width: 100%;
    }

    .auto-populated-info {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 12px;
      margin: 16px 0;
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .info-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);
    }

    .info-header mat-icon {
      color: white;
    }

    .info-header h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .info-item label {
      font-size: 12px;
      opacity: 0.9;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-item span {
      font-size: 14px;
      font-weight: 600;
    }

    .module-section {
      margin: 16px 0;
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .section-header mat-icon {
      color: #667eea;
    }

    .section-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .required {
      color: #f44336;
    }

    .module-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .module-checkbox {
      padding: 12px;
      background: white;
      border-radius: 6px;
      border: 1px solid #e0e0e0;
      transition: all 0.2s;
    }

    .module-checkbox:hover {
      border-color: #667eea;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
    }

    .module-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-left: 8px;
    }

    .module-info strong {
      color: #333;
      font-size: 14px;
    }

    .module-code {
      color: #667eea;
      font-size: 12px;
      font-weight: 600;
    }

    .module-info small {
      color: #666;
      font-size: 12px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      font-size: 12px;
      margin-top: 8px;
    }

    .error-message mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #f0f0f0;
      gap: 12px;
    }

    mat-dialog-actions button {
      min-width: 100px;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    ::ng-deep .mat-mdc-form-field-icon-prefix {
      padding-right: 12px;
    }

    /* Ensure datepicker toggle is visible */
    ::ng-deep .mat-datepicker-toggle {
      display: inline-block !important;
      position: relative !important;
    }

    ::ng-deep .mat-datepicker-toggle-default-icon {
      width: 24px !important;
      height: 24px !important;
    }

    ::ng-deep .mat-mdc-form-field-icon-suffix {
      padding-left: 12px;
    }

    /* Fix for Material 3 datepicker */
    ::ng-deep .mat-mdc-icon-button.mat-mdc-button-base {
      width: 40px;
      height: 40px;
      padding: 8px;
    }
  `]
})
export class MeetingDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private meetingService = inject(MeetingService);
  private departmentService = inject(DepartmentService);
  private courseService = inject(CourseService);
  private batchService = inject(BatchService);
  private semesterService = inject(SemesterService);
  private subjectService = inject(SubjectService);
  private dialogRef = inject(MatDialogRef<MeetingDialogComponent>);

  meetingForm!: FormGroup;
  loading = false;
  formSubmitted = false;
  isEditMode = false;
  minDate = new Date();
  minDateTime = '';

  departments: any[] = [];
  courses: any[] = [];
  batches: any[] = [];
  semesters: any[] = [];
  subjects: any[] = [];
  modules: any[] = [];
  selectedModules: string[] = [];
  lecturerInfo: string = '';
  calculatedEndTime: string = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: { meeting?: Meeting, lecturerId?: string }) {
    this.isEditMode = !!data?.meeting;
    this.setMinDateTime();
  }

  ngOnInit() {
    this.initForm();
    
    // If lecturerId is provided, this is lecturer mode - only load lecturer's subjects
    if (this.data.lecturerId) {
      this.loadLecturerSubjects();
    } else {
      // Admin mode - load departments for cascading dropdowns
      this.loadDepartments();
    }

    if (this.isEditMode && this.data.meeting) {
      this.populateFormForEdit(this.data.meeting);
    }
  }

  setMinDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.minDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  initForm() {
    // For lecturers: dept/course/batch/semester are optional and auto-populated from subject
    const isLecturer = !!this.data.lecturerId;
    
    this.meetingForm = this.fb.group({
      topic: ['', Validators.required],
      description: ['', Validators.required],
      departmentId: ['', isLecturer ? [] : Validators.required],
      courseId: [{ value: '', disabled: true }, isLecturer ? [] : Validators.required],
      batchId: [{ value: '', disabled: true }, isLecturer ? [] : Validators.required],
      semesterId: [{ value: '', disabled: true }, isLecturer ? [] : Validators.required],
      subjectId: [{ value: '', disabled: true }, Validators.required],
      meetingDate: ['', Validators.required],
      startTime: ['', Validators.required],
      duration: ['', [Validators.required, Validators.min(1), Validators.max(480)]],
      studentCount: [{ value: 0, disabled: true }]
    });
  }

  populateFormForEdit(meeting: Meeting) {
    // Calculate duration if both startTime and endTime exist
    let duration = 60; // Default 60 minutes
    if (meeting.startTime && meeting.endTime) {
      const start = new Date(meeting.startTime);
      const end = new Date(meeting.endTime);
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    }

    // Extract time from startTime
    const startDate = new Date(meeting.startTime);
    const hours = String(startDate.getHours()).padStart(2, '0');
    const minutes = String(startDate.getMinutes()).padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    // Populate form with existing meeting data
    this.meetingForm.patchValue({
      topic: meeting.topic,
      description: meeting.description,
      departmentId: typeof meeting.departmentId === 'string' ? meeting.departmentId : (meeting.departmentId as any)?._id,
      courseId: typeof meeting.courseId === 'string' ? meeting.courseId : (meeting.courseId as any)?._id,
      batchId: typeof meeting.batchId === 'string' ? meeting.batchId : (meeting.batchId as any)?._id,
      semesterId: typeof meeting.semesterId === 'string' ? meeting.semesterId : (meeting.semesterId as any)?._id,
      subjectId: typeof meeting.subjectId === 'string' ? meeting.subjectId : (meeting.subjectId as any)?._id,
      meetingDate: new Date(meeting.meetingDate),
      startTime: timeString,
      duration: duration,
      studentCount: meeting.studentCount || 0
    });

    // Calculate and display end time
    this.calculateEndTime();

    // Set selected modules
    if (meeting.moduleIds) {
      this.selectedModules = meeting.moduleIds.map((m: any) => 
        typeof m === 'string' ? m : m._id
      );
    }

    // Load cascading data - Use setTimeout to ensure form is ready
    if (this.meetingForm.get('departmentId')?.value) {
      setTimeout(() => {
        this.onDepartmentChange();
      }, 100);
    }
  }

  loadLecturerSubjects() {
    if (!this.data.lecturerId) return;
    
    this.subjectService.getSubjects({ lecturer: this.data.lecturerId }).subscribe({
      next: (response: any) => {
        this.subjects = response.data || response.subjects || response;
        this.meetingForm.get('subjectId')?.enable();
      },
      error: (error) => {
        this.snackBar.open('Failed to load subjects', 'Close', { duration: 3000 });
      }
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (response: any) => {
        this.departments = response.departments || response.data || response;
      },
      error: (error) => {
        this.snackBar.open('Failed to load departments', 'Close', { duration: 3000 });
      }
    });
  }

  onDepartmentChange() {
    const departmentId = this.meetingForm.get('departmentId')?.value;
    const currentCourseId = this.meetingForm.getRawValue().courseId;
    
    // Only reset if not in edit mode or if manually changed
    if (!this.isEditMode || !currentCourseId) {
      this.courses = [];
      this.batches = [];
      this.semesters = [];
      this.subjects = [];
      this.modules = [];
      
      this.meetingForm.patchValue({
        courseId: '',
        batchId: '',
        semesterId: '',
        subjectId: ''
      });
      this.meetingForm.get('batchId')?.disable();
      this.meetingForm.get('semesterId')?.disable();
      this.meetingForm.get('subjectId')?.disable();
    }

    if (departmentId) {
      this.courseService.getCoursesByDepartment(departmentId).subscribe({
        next: (response: any) => {
          this.courses = response.courses || response.data || response;
          this.meetingForm.get('courseId')?.enable();
          
          // If in edit mode and has existing courseId, trigger course change
          if (this.isEditMode && currentCourseId) {
            setTimeout(() => this.onCourseChange(), 50);
          }
        },
        error: (error) => {
          this.snackBar.open('Failed to load courses', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.meetingForm.get('courseId')?.disable();
    }
  }

  onCourseChange() {
    const courseId = this.meetingForm.get('courseId')?.value;
    const currentBatchId = this.meetingForm.getRawValue().batchId;
    
    // Only reset if not in edit mode or if manually changed
    if (!this.isEditMode || !currentBatchId) {
      this.batches = [];
      this.semesters = [];
      this.subjects = [];
      this.modules = [];
      
      this.meetingForm.patchValue({
        batchId: '',
        semesterId: '',
        subjectId: ''
      });
      this.meetingForm.get('semesterId')?.disable();
      this.meetingForm.get('subjectId')?.disable();
    }

    if (courseId) {
      this.batchService.getBatchesByCourse(courseId).subscribe({
        next: (response: any) => {
          this.batches = response.batches || response.data || response;
          this.meetingForm.get('batchId')?.enable();
          
          // If in edit mode and has existing batchId, trigger batch change
          if (this.isEditMode && currentBatchId) {
            setTimeout(() => this.onBatchChange(), 50);
          }
        },
        error: (error) => {
          this.snackBar.open('Failed to load batches', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.meetingForm.get('batchId')?.disable();
    }
  }

  onBatchChange() {
    const currentSemesterId = this.meetingForm.getRawValue().semesterId;
    const batchId = this.meetingForm.get('batchId')?.value;
    
    // Update student count from selected batch
    if (batchId) {
      const selectedBatch = this.batches.find((b: any) => b._id === batchId);
      if (selectedBatch) {
        this.meetingForm.patchValue({
          studentCount: selectedBatch.maxStudents || 0
        });
      }
    }
    
    // Only reset if not in edit mode or if manually changed
    if (!this.isEditMode || !currentSemesterId) {
      this.semesters = [];
      this.subjects = [];
      this.modules = [];
      
      this.meetingForm.patchValue({
        semesterId: '',
        subjectId: ''
      });
      this.meetingForm.get('subjectId')?.disable();
    }

    if (batchId) {
      // Load semesters for the selected batch
      this.batchService.getBatchById(batchId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const batch = response.data;
            
            if (batch.semesters && batch.semesters.length > 0) {
              // The batch.semesters are already populated objects from the API
              this.semesters = batch.semesters.map((sem: any) => ({
                _id: sem._id,
                name: sem.name,
                code: sem.code,
                year: sem.year,
                type: sem.type,
                startDate: sem.startDate,
                endDate: sem.endDate
              }));
            } else {
              this.semesters = [];
            }
            
            this.meetingForm.get('semesterId')?.enable();
            
            // If in edit mode and has existing semesterId, trigger semester change
            if (this.isEditMode && currentSemesterId) {
              setTimeout(() => this.onSemesterChange(), 50);
            }
          }
        },
        error: (error) => {
          console.error('Error loading batch details:', error);
          this.semesters = [];
          this.snackBar.open('Failed to load semesters for this batch', 'Close', { duration: 3000 });
        }
      });
    } else {
      this.meetingForm.get('semesterId')?.disable();
    }
  }

  onSemesterChange() {
    const semesterId = this.meetingForm.get('semesterId')?.value;
    const departmentId = this.meetingForm.get('departmentId')?.value;
    const courseId = this.meetingForm.getRawValue().courseId;
    const currentSubjectId = this.meetingForm.getRawValue().subjectId;
    
    // Only reset if not in edit mode or if manually changed
    if (!this.isEditMode || !currentSubjectId) {
      this.subjects = [];
      this.modules = [];
      this.meetingForm.patchValue({ subjectId: '' });
    }

    if (semesterId && departmentId && courseId) {
      this.subjectService.getSubjects({
        department: departmentId,
        course: courseId,
        semester: semesterId
      }).subscribe({
        next: (response: any) => {
          this.subjects = response.data || response.subjects || response;
          this.meetingForm.get('subjectId')?.enable();
          
          // If in edit mode and has existing subjectId, trigger subject change
          if (this.isEditMode && currentSubjectId) {
            setTimeout(() => this.onSubjectChange(), 50);
          }
        },
        error: (error) => {
          this.snackBar.open('Failed to load subjects', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onSubjectChange() {
    const subjectId = this.meetingForm.get('subjectId')?.value;
    this.modules = [];
    
    if (!this.isEditMode) {
      this.selectedModules = [];
    }

    if (subjectId) {
      // Get lecturer info and auto-populate fields for lecturers
      const subject = this.subjects.find(s => s._id === subjectId);
      
      if (subject) {
        // Set lecturer info
        if (subject.lecturerId) {
          const lecturer = subject.lecturerId;
          this.lecturerInfo = typeof lecturer === 'string' 
            ? lecturer 
            : `${lecturer.firstName} ${lecturer.lastName} (${lecturer.email})`;
        }
        
        // For lecturers: auto-populate dept/course/batch/semester from subject
        if (this.data.lecturerId) {
          const deptId = typeof subject.departmentId === 'string' ? subject.departmentId : subject.departmentId?._id;
          const courseId = typeof subject.courseId === 'string' ? subject.courseId : subject.courseId?._id;
          const batchId = typeof subject.batchId === 'string' ? subject.batchId : subject.batchId?._id;
          const semesterId = typeof subject.semesterId === 'string' ? subject.semesterId : subject.semesterId?._id;
          
          this.meetingForm.patchValue({
            departmentId: deptId || '',
            courseId: courseId || '',
            batchId: batchId || '',
            semesterId: semesterId || ''
          });
          
          // Update student count from batch
          if (subject.batchId && typeof subject.batchId !== 'string') {
            this.meetingForm.patchValue({
              studentCount: subject.batchId.maxStudents || 0
            });
          }
        }
      }

      // Get modules
      this.meetingService.getModulesBySubject(subjectId).subscribe({
        next: (response: any) => {
          this.modules = response.modules || response.data || response;
        },
        error: (error) => {
          this.snackBar.open('Failed to load modules', 'Close', { duration: 3000 });
        }
      });
    }
  }

  isModuleSelected(moduleId: string): boolean {
    return this.selectedModules.includes(moduleId);
  }

  onModuleToggle(moduleId: string, checked: boolean) {
    if (checked) {
      if (!this.selectedModules.includes(moduleId)) {
        this.selectedModules.push(moduleId);
      }
    } else {
      this.selectedModules = this.selectedModules.filter(id => id !== moduleId);
    }
  }

  getSelectedSubjectInfo(field: 'department' | 'course' | 'batch' | 'semester'): string {
    const subjectId = this.meetingForm.get('subjectId')?.value;
    if (!subjectId) return 'N/A';
    
    const subject = this.subjects.find(s => s._id === subjectId);
    if (!subject) return 'N/A';
    
    switch (field) {
      case 'department':
        if (typeof subject.departmentId === 'string') return subject.departmentId;
        return subject.departmentId?.name || 'N/A';
      case 'course':
        if (typeof subject.courseId === 'string') return subject.courseId;
        return subject.courseId?.name || 'N/A';
      case 'batch':
        if (typeof subject.batchId === 'string') return subject.batchId;
        return subject.batchId?.name || 'N/A';
      case 'semester':
        if (typeof subject.semesterId === 'string') return subject.semesterId;
        return subject.semesterId?.name || 'N/A';
      default:
        return 'N/A';
    }
  }

  calculateEndTime() {
    const meetingDate = this.meetingForm.get('meetingDate')?.value;
    const startTime = this.meetingForm.get('startTime')?.value;
    const duration = this.meetingForm.get('duration')?.value;

    if (meetingDate && startTime && duration && duration > 0) {
      // Combine date and time
      const date = new Date(meetingDate);
      const [hours, minutes] = startTime.split(':');
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      // Calculate end time
      const end = new Date(date.getTime() + duration * 60000);
      
      // Format the end time for display
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      this.calculatedEndTime = end.toLocaleString('en-US', options);
    } else {
      this.calculatedEndTime = '';
    }
  }

  onSubmit() {
    this.formSubmitted = true;

    if (this.meetingForm.invalid || this.selectedModules.length === 0) {
      this.snackBar.open('Please fill all required fields and select at least one module', 'Close', { 
        duration: 3000 
      });
      return;
    }

    this.loading = true;
    const formValue = this.meetingForm.getRawValue(); // Get all values including disabled fields
    
    // Combine date and time into a single DateTime
    const meetingDate = new Date(formValue.meetingDate);
    const [hours, minutes] = formValue.startTime.split(':');
    meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Calculate end time from start time and duration
    const endTime = new Date(meetingDate.getTime() + formValue.duration * 60000);
    
    const meetingData = {
      ...formValue,
      moduleIds: this.selectedModules,
      meetingDate: new Date(formValue.meetingDate).toISOString(),
      startTime: meetingDate.toISOString(),
      endTime: endTime.toISOString()
    };

    if (this.isEditMode && this.data.meeting?._id) {
      // Update existing meeting
      this.meetingService.updateMeeting(this.data.meeting._id, meetingData).subscribe({
        next: (response) => {
          this.loading = false;
          this.snackBar.open('Meeting updated successfully!', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open(error.error?.message || 'Failed to update meeting', 'Close', { 
            duration: 3000 
          });
        }
      });
    } else {
      // Create new meeting
      this.meetingService.createMeeting(meetingData).subscribe({
        next: (response) => {
          this.loading = false;
          this.snackBar.open('Meeting created successfully!', 'Close', { duration: 3000 });
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.loading = false;
          this.snackBar.open(error.error?.message || 'Failed to create meeting', 'Close', { 
            duration: 3000 
          });
        }
      });
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
