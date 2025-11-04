import { Component, OnInit, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule, DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
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
    MatNativeDateModule
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
            <input matInput [matDatepicker]="picker" formControlName="meetingDate" 
                   [min]="minDate" (dateChange)="calculateEndTime()">
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-icon matPrefix>calendar_today</mat-icon>
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

  constructor(@Inject(MAT_DIALOG_DATA) public data: { meeting?: Meeting }) {
    this.isEditMode = !!data?.meeting;
    this.setMinDateTime();
  }

  ngOnInit() {
    this.initForm();
    this.loadDepartments();

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
    this.meetingForm = this.fb.group({
      topic: ['', Validators.required],
      description: ['', Validators.required],
      departmentId: ['', Validators.required],
      courseId: [{ value: '', disabled: true }, Validators.required],
      batchId: [{ value: '', disabled: true }, Validators.required],
      semesterId: [{ value: '', disabled: true }, Validators.required],
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

    this.semesterService.getSemesters().subscribe({
      next: (response: any) => {
        this.semesters = response.semesters || response.data || response;
        this.meetingForm.get('semesterId')?.enable();
        
        // If in edit mode and has existing semesterId, trigger semester change
        if (this.isEditMode && currentSemesterId) {
          setTimeout(() => this.onSemesterChange(), 50);
        }
      },
      error: (error) => {
        this.snackBar.open('Failed to load semesters', 'Close', { duration: 3000 });
      }
    });
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
      // Get lecturer info
      const subject = this.subjects.find(s => s._id === subjectId);
      if (subject && subject.lecturerId) {
        const lecturer = subject.lecturerId;
        this.lecturerInfo = typeof lecturer === 'string' 
          ? lecturer 
          : `${lecturer.firstName} ${lecturer.lastName} (${lecturer.email})`;
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
