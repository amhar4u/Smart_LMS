import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MeetingService } from '../../../services/meeting.service';
import { DepartmentService } from '../../../services/department.service';
import { CourseService } from '../../../services/course.service';
import { BatchService } from '../../../services/batch.service';
import { SemesterService } from '../../../services/semester.service';
import { SubjectService } from '../../../services/subject.service';

@Component({
  selector: 'app-create-meeting',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCheckboxModule,
    MatIconModule
  ],
  template: `
    <div class="create-meeting-container">
      <mat-card class="attractive-card">
        <mat-card-header class="gradient-header">
          <div class="header-content">
            <div class="icon-wrapper">
              <mat-icon class="large-icon">videocam</mat-icon>
            </div>
            <div class="title-wrapper">
              <mat-card-title>Create Video Meeting</mat-card-title>
              <mat-card-subtitle>Schedule a live meeting session for your students</mat-card-subtitle>
            </div>
          </div>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="meetingForm" (ngSubmit)="onSubmit()">
            <div class="form-section">
              <h3><mat-icon>title</mat-icon> Meeting Details</h3>
              
              <!-- Meeting Topic -->
              <mat-form-field appearance="outline" class="full-width animated-field">
                <mat-label>Meeting Topic</mat-label>
                <input matInput formControlName="topic" placeholder="e.g., Introduction to Data Structures">
                <mat-icon matPrefix>topic</mat-icon>
                <mat-error *ngIf="meetingForm.get('topic')?.hasError('required')">
                  Topic is required
                </mat-error>
              </mat-form-field>

              <!-- Meeting Description -->
              <mat-form-field appearance="outline" class="full-width animated-field">
                <mat-label>Meeting Description</mat-label>
                <textarea matInput formControlName="description" rows="3" 
                          placeholder="Describe what will be covered in this meeting"></textarea>
                <mat-icon matPrefix>description</mat-icon>
                <mat-error *ngIf="meetingForm.get('description')?.hasError('required')">
                  Description is required
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-section">
              <h3><mat-icon>school</mat-icon> Academic Information</h3>
              
              <!-- Subject Selection - Only field lecturer needs to select -->
              <mat-form-field appearance="outline" class="full-width animated-field">
                <mat-label>Select Your Subject</mat-label>
                <mat-select formControlName="subjectId" (selectionChange)="onSubjectChange()">
                  <mat-option *ngFor="let subject of subjects" [value]="subject._id">
                    <div class="subject-option">
                      <strong>{{ subject.name }}</strong>
                      <span class="subject-code">({{ subject.code }})</span>
                      <span *ngIf="subject.departmentId && typeof subject.departmentId === 'object'" class="subject-dept">
                        - {{ subject.departmentId.name }}
                      </span>
                    </div>
                  </mat-option>
                </mat-select>
                <mat-icon matPrefix>subject</mat-icon>
                <mat-error *ngIf="meetingForm.get('subjectId')?.hasError('required')">
                  Subject is required
                </mat-error>
                <mat-hint *ngIf="subjects.length === 0">No subjects assigned to you yet</mat-hint>
              </mat-form-field>
            </div>

            <!-- Auto-populated information (Read-only) -->
            <div class="auto-populated-info" *ngIf="meetingForm.get('subjectId')?.value">
              <div class="info-header">
                <mat-icon>info</mat-icon>
                <h3>Subject Details</h3>
              </div>
              <div class="info-grid">
                <div class="info-item" *ngIf="getSelectedSubjectInfo().department">
                  <div class="info-icon"><mat-icon>business</mat-icon></div>
                  <div class="info-content">
                    <span class="info-label">Department</span>
                    <span class="info-value">{{ getSelectedSubjectInfo().department }}</span>
                  </div>
                </div>
                <div class="info-item" *ngIf="getSelectedSubjectInfo().course">
                  <div class="info-icon"><mat-icon>menu_book</mat-icon></div>
                  <div class="info-content">
                    <span class="info-label">Course</span>
                    <span class="info-value">{{ getSelectedSubjectInfo().course }}</span>
                  </div>
                </div>
                <div class="info-item" *ngIf="getSelectedSubjectInfo().batch">
                  <div class="info-icon"><mat-icon>groups</mat-icon></div>
                  <div class="info-content">
                    <span class="info-label">Batch</span>
                    <span class="info-value">{{ getSelectedSubjectInfo().batch }}</span>
                  </div>
                </div>
                <div class="info-item" *ngIf="getSelectedSubjectInfo().semester">
                  <div class="info-icon"><mat-icon>schedule</mat-icon></div>
                  <div class="info-content">
                    <span class="info-label">Semester</span>
                    <span class="info-value">{{ getSelectedSubjectInfo().semester }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Module Selection -->
            <div class="module-selection form-section" *ngIf="modules.length > 0">
              <h3><mat-icon>library_books</mat-icon> Select Module(s)</h3>
              <div class="module-list">
                <mat-checkbox 
                  *ngFor="let module of modules" 
                  [checked]="isModuleSelected(module._id)"
                  (change)="onModuleToggle(module._id, $event.checked)"
                  class="module-checkbox">
                  <div class="module-item">
                    <mat-icon class="module-icon">bookmark</mat-icon>
                    <div class="module-info">
                      <span class="module-name">{{ module.name }}</span>
                      <span class="module-title">{{ module.title }}</span>
                    </div>
                  </div>
                </mat-checkbox>
              </div>
              <mat-error *ngIf="selectedModules.length === 0 && formSubmitted" class="error-message">
                <mat-icon>error</mat-icon> Please select at least one module
              </mat-error>
            </div>

            <div class="form-section">
              <h3><mat-icon>event</mat-icon> Schedule</h3>
              <div class="date-time-row">
                <!-- Meeting Date -->
                <mat-form-field appearance="outline" class="animated-field">
                  <mat-label>Meeting Date</mat-label>
                  <input matInput [matDatepicker]="picker" formControlName="meetingDate">
                  <mat-icon matPrefix>calendar_today</mat-icon>
                  <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
                  <mat-datepicker #picker></mat-datepicker>
                  <mat-error *ngIf="meetingForm.get('meetingDate')?.hasError('required')">
                    Meeting date is required
                  </mat-error>
                </mat-form-field>

                <!-- Meeting Time -->
                <mat-form-field appearance="outline" class="animated-field">
                  <mat-label>Meeting Start Time</mat-label>
                  <input matInput type="datetime-local" formControlName="startTime">
                  <mat-icon matPrefix>access_time</mat-icon>
                  <mat-error *ngIf="meetingForm.get('startTime')?.hasError('required')">
                    Start time is required
                  </mat-error>
                </mat-form-field>
              </div>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button mat-stroked-button type="button" (click)="onCancel()" class="cancel-btn">
                <mat-icon>close</mat-icon>
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="loading || meetingForm.invalid || selectedModules.length === 0"
                      class="submit-btn">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
                <mat-icon *ngIf="!loading">videocam</mat-icon>
                <span *ngIf="!loading">Create Meeting</span>
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .create-meeting-container {
      padding: 24px;
      max-width: 900px;
      margin: 0 auto;
      animation: fadeIn 0.3s ease-in;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .attractive-card {
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .gradient-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 32px 24px !important;
      margin: 0 !important;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .icon-wrapper {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .large-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: white;
    }

    .title-wrapper {
      flex: 1;
    }

    .gradient-header mat-card-title {
      color: white;
      font-size: 28px;
      font-weight: 600;
      margin: 0 0 8px 0;
    }

    .gradient-header mat-card-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      margin: 0;
    }

    mat-card-content {
      padding: 32px 24px !important;
    }

    .form-section {
      margin-bottom: 32px;
      animation: slideIn 0.4s ease-out;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .form-section h3 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
      padding-bottom: 12px;
      border-bottom: 2px solid #e0e0e0;
    }

    .form-section h3 mat-icon {
      color: #667eea;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .animated-field {
      transition: all 0.3s ease;
    }

    .animated-field:focus-within {
      transform: translateY(-2px);
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .date-time-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .subject-option {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 4px 0;
    }

    .subject-code {
      color: #666;
      font-size: 14px;
    }

    .subject-dept {
      color: #999;
      font-size: 12px;
    }

    .auto-populated-info {
      margin: 24px 0;
      padding: 20px;
      background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
      animation: slideDown 0.4s ease-out;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .info-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .info-header mat-icon {
      color: #667eea;
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .info-header h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
      border: none;
      padding: 0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }

    .info-item:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .info-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 10px;
      padding: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .info-icon mat-icon {
      color: white;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .info-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 14px;
      color: #333;
      font-weight: 600;
    }

    .module-selection {
      margin: 0;
    }

    .module-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #f8f9ff 100%);
      border-radius: 12px;
      border: 2px solid #e3e8ef;
    }

    .module-checkbox {
      background: white;
      padding: 12px 16px;
      border-radius: 10px;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }

    .module-checkbox:hover {
      border-color: #667eea;
      box-shadow: 0 2px 12px rgba(102, 126, 234, 0.15);
    }

    .module-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .module-icon {
      color: #667eea;
      font-size: 22px;
      width: 22px;
      height: 22px;
    }

    .module-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .module-name {
      font-weight: 600;
      color: #333;
      font-size: 15px;
    }

    .module-title {
      color: #666;
      font-size: 13px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 12px 16px;
      background: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 8px;
      color: #c62828;
      font-size: 14px;
    }

    .error-message mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 2px solid #e0e0e0;
    }

    .cancel-btn {
      padding: 0 24px;
      height: 48px;
      font-size: 16px;
      font-weight: 500;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .cancel-btn:hover {
      border-color: #999;
      background: #f5f5f5;
    }

    .submit-btn {
      padding: 0 32px;
      height: 48px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
      transition: all 0.3s ease;
    }

    .submit-btn:hover:not([disabled]) {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(102, 126, 234, 0.4);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .submit-btn mat-icon,
    .cancel-btn mat-icon {
      margin-right: 8px;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .create-meeting-container {
        padding: 16px;
      }

      .gradient-header {
        padding: 24px 16px !important;
      }

      .header-content {
        flex-direction: column;
        text-align: center;
      }

      .gradient-header mat-card-title {
        font-size: 24px;
      }

      .date-time-row {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }

      .cancel-btn,
      .submit-btn {
        width: 100%;
      }
    }
  `]
})
export class CreateMeetingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private meetingService = inject(MeetingService);
  private departmentService = inject(DepartmentService);
  private courseService = inject(CourseService);
  private batchService = inject(BatchService);
  private semesterService = inject(SemesterService);
  private subjectService = inject(SubjectService);

  meetingForm!: FormGroup;
  loading = false;
  formSubmitted = false;

  departments: any[] = [];
  courses: any[] = [];
  batches: any[] = [];
  semesters: any[] = [];
  subjects: any[] = [];
  modules: any[] = [];
  selectedModules: string[] = [];
  lecturerInfo: string = '';

  ngOnInit() {
    this.initForm();
    this.loadLecturerSubjects();
  }

  initForm() {
    this.meetingForm = this.fb.group({
      topic: ['', Validators.required],
      description: ['', Validators.required],
      departmentId: [''],
      courseId: [''],
      batchId: [''],
      semesterId: [''],
      subjectId: ['', Validators.required],
      meetingDate: ['', Validators.required],
      startTime: ['', Validators.required]
    });
  }

  loadLecturerSubjects() {
    // Get current user ID from auth service or local storage
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const lecturerId = currentUser._id;

    if (lecturerId) {
      this.subjectService.getSubjects({ lecturer: lecturerId }).subscribe({
        next: (response: any) => {
          this.subjects = response.data || response.subjects || response;
          if (this.subjects.length === 0) {
            this.snackBar.open('No subjects assigned to you', 'Close', { duration: 3000 });
          }
        },
        error: (error) => {
          this.snackBar.open('Failed to load your subjects', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onSubjectChange() {
    const subjectId = this.meetingForm.get('subjectId')?.value;
    this.modules = [];
    this.selectedModules = [];

    if (subjectId) {
      // Get subject details including department, course, batch, semester
      const subject = this.subjects.find(s => s._id === subjectId);
      
      if (subject) {
        // Auto-populate department, course, batch, semester from subject
        const departmentId = typeof subject.departmentId === 'object' ? subject.departmentId._id : subject.departmentId;
        const courseId = typeof subject.courseId === 'object' ? subject.courseId._id : subject.courseId;
        const batchId = typeof subject.batchId === 'object' ? subject.batchId._id : subject.batchId;
        const semesterId = typeof subject.semesterId === 'object' ? subject.semesterId._id : subject.semesterId;

        this.meetingForm.patchValue({
          departmentId: departmentId,
          courseId: courseId,
          batchId: batchId,
          semesterId: semesterId
        });

        // Set lecturer info
        if (subject.lecturerId) {
          const lecturer = typeof subject.lecturerId === 'object' ? subject.lecturerId : null;
          if (lecturer) {
            this.lecturerInfo = `${lecturer.firstName} ${lecturer.lastName}`;
          }
        }
      }

      // Get modules for the subject
      this.meetingService.getModulesBySubject(subjectId).subscribe({
        next: (response: any) => {
          this.modules = response.modules || response;
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

  getSelectedSubjectInfo(): any {
    const subjectId = this.meetingForm.get('subjectId')?.value;
    if (!subjectId) return {};

    const subject = this.subjects.find(s => s._id === subjectId);
    if (!subject) return {};

    return {
      department: typeof subject.departmentId === 'object' ? subject.departmentId.name : '',
      course: typeof subject.courseId === 'object' ? subject.courseId.name : '',
      batch: typeof subject.batchId === 'object' ? 
        `${subject.batchId.name} (${subject.batchId.startYear} - ${subject.batchId.endYear})` : '',
      semester: typeof subject.semesterId === 'object' ? subject.semesterId.name : ''
    };
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

    const formValue = this.meetingForm.value;
    const meetingData = {
      ...formValue,
      moduleIds: this.selectedModules,
      meetingDate: new Date(formValue.meetingDate).toISOString(),
      startTime: new Date(formValue.startTime).toISOString()
    };

    this.meetingService.createMeeting(meetingData).subscribe({
      next: (response) => {
        this.loading = false;
        this.snackBar.open('Meeting created successfully!', 'Close', { duration: 3000 });
        this.router.navigate(['/lecturer/meetings']);
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open(error.error?.message || 'Failed to create meeting', 'Close', { 
          duration: 3000 
        });
      }
    });
  }

  onCancel() {
    this.router.navigate(['/lecturer/meetings']);
  }
}
