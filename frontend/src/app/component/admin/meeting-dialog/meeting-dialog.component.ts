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
  templateUrl: './meeting-dialog.component.html',
  styleUrls: ['./meeting-dialog.component.css']
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
