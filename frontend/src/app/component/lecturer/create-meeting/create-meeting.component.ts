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

            <!-- Department -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Department</mat-label>
              <mat-select formControlName="departmentId" (selectionChange)="onDepartmentChange()">
                <mat-option *ngFor="let dept of departments" [value]="dept._id">
                  {{ dept.name }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="meetingForm.get('departmentId')?.hasError('required')">
                Department is required
              </mat-error>
            </mat-form-field>

            <!-- Course -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Course</mat-label>
              <mat-select formControlName="courseId" (selectionChange)="onCourseChange()" 
                          [disabled]="!meetingForm.get('departmentId')?.value">
                <mat-option *ngFor="let course of courses" [value]="course._id">
                  {{ course.name }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="meetingForm.get('courseId')?.hasError('required')">
                Course is required
              </mat-error>
            </mat-form-field>

            <!-- Batch -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Batch</mat-label>
              <mat-select formControlName="batchId" (selectionChange)="onBatchChange()" 
                          [disabled]="!meetingForm.get('courseId')?.value">
                <mat-option *ngFor="let batch of batches" [value]="batch._id">
                  {{ batch.name }} - {{ batch.year }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="meetingForm.get('batchId')?.hasError('required')">
                Batch is required
              </mat-error>
            </mat-form-field>

            <!-- Semester -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Semester</mat-label>
              <mat-select formControlName="semesterId" (selectionChange)="onSemesterChange()" 
                          [disabled]="!meetingForm.get('batchId')?.value">
                <mat-option *ngFor="let semester of semesters" [value]="semester._id">
                  {{ semester.name }}
                </mat-option>
              </mat-select>
              <mat-error *ngIf="meetingForm.get('semesterId')?.hasError('required')">
                Semester is required
              </mat-error>
            </mat-form-field>

            <!-- Subject -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Subject</mat-label>
              <mat-select formControlName="subjectId" (selectionChange)="onSubjectChange()" 
                          [disabled]="!meetingForm.get('semesterId')?.value">
                <mat-option *ngFor="let subject of subjects" [value]="subject._id">
                  {{ subject.name }} ({{ subject.code }})
                </mat-option>
              </mat-select>
              <mat-error *ngIf="meetingForm.get('subjectId')?.hasError('required')">
                Subject is required
              </mat-error>
            </mat-form-field>

            <!-- Lecturer Info (Read-only) -->
            <mat-form-field appearance="outline" class="full-width" *ngIf="lecturerInfo">
              <mat-label>Lecturer</mat-label>
              <input matInput [value]="lecturerInfo" readonly>
            </mat-form-field>

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
    this.loadDepartments();
  }

  initForm() {
    this.meetingForm = this.fb.group({
      topic: ['', Validators.required],
      description: ['', Validators.required],
      departmentId: ['', Validators.required],
      courseId: ['', Validators.required],
      batchId: ['', Validators.required],
      semesterId: ['', Validators.required],
      subjectId: ['', Validators.required],
      meetingDate: ['', Validators.required],
      startTime: ['', Validators.required]
    });
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (response: any) => {
        this.departments = response.departments || response;
      },
      error: (error) => {
        this.snackBar.open('Failed to load departments', 'Close', { duration: 3000 });
      }
    });
  }

  onDepartmentChange() {
    const departmentId = this.meetingForm.get('departmentId')?.value;
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

    if (departmentId) {
      this.courseService.getCoursesByDepartment(departmentId).subscribe({
        next: (response: any) => {
          this.courses = response.courses || response;
        },
        error: (error) => {
          this.snackBar.open('Failed to load courses', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onCourseChange() {
    const courseId = this.meetingForm.get('courseId')?.value;
    this.batches = [];
    this.semesters = [];
    this.subjects = [];
    this.modules = [];
    this.meetingForm.patchValue({
      batchId: '',
      semesterId: '',
      subjectId: ''
    });

    if (courseId) {
      this.batchService.getBatchesByCourse(courseId).subscribe({
        next: (response: any) => {
          this.batches = response.batches || response;
        },
        error: (error) => {
          this.snackBar.open('Failed to load batches', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onBatchChange() {
    this.semesters = [];
    this.subjects = [];
    this.modules = [];
    this.meetingForm.patchValue({
      semesterId: '',
      subjectId: ''
    });

    this.semesterService.getSemesters().subscribe({
      next: (response: any) => {
        this.semesters = response.semesters || response;
      },
      error: (error) => {
        this.snackBar.open('Failed to load semesters', 'Close', { duration: 3000 });
      }
    });
  }

  onSemesterChange() {
    const semesterId = this.meetingForm.get('semesterId')?.value;
    const departmentId = this.meetingForm.get('departmentId')?.value;
    const courseId = this.meetingForm.get('courseId')?.value;
    const batchId = this.meetingForm.get('batchId')?.value;
    
    this.subjects = [];
    this.modules = [];
    this.meetingForm.patchValue({ subjectId: '' });

    if (semesterId && departmentId && courseId && batchId) {
      this.subjectService.getSubjects({
        department: departmentId,
        course: courseId,
        semester: semesterId
      }).subscribe({
        next: (response: any) => {
          this.subjects = response.data || response.subjects || response;
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
    this.selectedModules = [];

    if (subjectId) {
      // Get lecturer info
      const subject = this.subjects.find(s => s._id === subjectId);
      if (subject && subject.lecturerId) {
        this.lecturerInfo = `${subject.lecturerId.firstName} ${subject.lecturerId.lastName}`;
      }

      // Get modules
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
