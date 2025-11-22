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
    MatCheckboxModule
  ],
  template: `
    <div class="create-meeting-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Create Video Meeting</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="meetingForm" (ngSubmit)="onSubmit()">
            <!-- Meeting Topic -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Meeting Topic</mat-label>
              <input matInput formControlName="topic" placeholder="Enter meeting topic">
              <mat-error *ngIf="meetingForm.get('topic')?.hasError('required')">
                Topic is required
              </mat-error>
            </mat-form-field>

            <!-- Meeting Description -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Meeting Description</mat-label>
              <textarea matInput formControlName="description" rows="3" 
                        placeholder="Enter meeting description"></textarea>
              <mat-error *ngIf="meetingForm.get('description')?.hasError('required')">
                Description is required
              </mat-error>
            </mat-form-field>

            <!-- Subject Selection - Only field lecturer needs to select -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Select Your Subject</mat-label>
              <mat-select formControlName="subjectId" (selectionChange)="onSubjectChange()">
                <mat-option *ngFor="let subject of subjects" [value]="subject._id">
                  {{ subject.name }} ({{ subject.code }})
                  <span *ngIf="subject.departmentId && typeof subject.departmentId === 'object'">
                    - {{ subject.departmentId.name }}
                  </span>
                </mat-option>
              </mat-select>
              <mat-error *ngIf="meetingForm.get('subjectId')?.hasError('required')">
                Subject is required
              </mat-error>
              <mat-hint *ngIf="subjects.length === 0">No subjects assigned to you yet</mat-hint>
            </mat-form-field>

            <!-- Auto-populated information (Read-only) -->
            <div class="auto-populated-info" *ngIf="meetingForm.get('subjectId')?.value">
              <h3>Subject Details</h3>
              <div class="info-grid">
                <div class="info-item" *ngIf="getSelectedSubjectInfo().department">
                  <strong>Department:</strong> {{ getSelectedSubjectInfo().department }}
                </div>
                <div class="info-item" *ngIf="getSelectedSubjectInfo().course">
                  <strong>Course:</strong> {{ getSelectedSubjectInfo().course }}
                </div>
                <div class="info-item" *ngIf="getSelectedSubjectInfo().batch">
                  <strong>Batch:</strong> {{ getSelectedSubjectInfo().batch }}
                </div>
                <div class="info-item" *ngIf="getSelectedSubjectInfo().semester">
                  <strong>Semester:</strong> {{ getSelectedSubjectInfo().semester }}
                </div>
              </div>
            </div>

            <!-- Module Selection -->
            <div class="module-selection" *ngIf="modules.length > 0">
              <h3>Select Module(s)</h3>
              <div class="module-list">
                <mat-checkbox *ngFor="let module of modules" 
                              [checked]="isModuleSelected(module._id)"
                              (change)="onModuleToggle(module._id, $event.checked)">
                  {{ module.name }} - {{ module.title }}
                </mat-checkbox>
              </div>
              <mat-error *ngIf="selectedModules.length === 0 && formSubmitted">
                Please select at least one module
              </mat-error>
            </div>

            <!-- Meeting Date -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Meeting Date</mat-label>
              <input matInput [matDatepicker]="picker" formControlName="meetingDate">
              <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
              <mat-datepicker #picker></mat-datepicker>
              <mat-error *ngIf="meetingForm.get('meetingDate')?.hasError('required')">
                Meeting date is required
              </mat-error>
            </mat-form-field>

            <!-- Meeting Time -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Meeting Start Time</mat-label>
              <input matInput type="datetime-local" formControlName="startTime">
              <mat-error *ngIf="meetingForm.get('startTime')?.hasError('required')">
                Start time is required
              </mat-error>
            </mat-form-field>

            <!-- Actions -->
            <div class="form-actions">
              <button mat-raised-button type="button" (click)="onCancel()">
                Cancel
              </button>
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="loading || meetingForm.invalid || selectedModules.length === 0">
                <mat-spinner *ngIf="loading" diameter="20"></mat-spinner>
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
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    mat-card {
      padding: 20px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }

    .module-selection {
      margin: 20px 0;
    }

    .module-selection h3 {
      margin-bottom: 10px;
      font-size: 16px;
      color: #333;
    }

    .module-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #f9f9f9;
    }

    .auto-populated-info {
      margin: 20px 0;
      padding: 15px;
      background-color: #e3f2fd;
      border-left: 4px solid #2196f3;
      border-radius: 4px;
    }

    .auto-populated-info h3 {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #1976d2;
      font-weight: 500;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 10px;
    }

    .info-item {
      padding: 8px;
      background-color: white;
      border-radius: 4px;
      font-size: 14px;
    }

    .info-item strong {
      color: #555;
      display: block;
      margin-bottom: 4px;
      font-size: 12px;
      text-transform: uppercase;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }

    mat-spinner {
      display: inline-block;
      margin-right: 5px;
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
