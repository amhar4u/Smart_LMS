import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ModuleService } from '../../../../services/module.service';
import { SubjectService } from '../../../../services/subject.service';
import { DepartmentService } from '../../../../services/department.service';
import { CourseService } from '../../../../services/course.service';
import { BatchService } from '../../../../services/batch.service';
import { SemesterService } from '../../../../services/semester.service';

export interface ModuleDialogData {
  module?: any;
  mode: 'create' | 'edit';
}

@Component({
  selector: 'app-module-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule,
    MatCheckboxModule,
    MatSnackBarModule
  ],
  templateUrl: './module-dialog.component.html',
  styleUrls: ['./module-dialog.component.css']
})
export class ModuleDialogComponent implements OnInit {
  moduleForm: FormGroup;
  departments: any[] = [];
  courses: any[] = [];
  batches: any[] = [];
  semesters: any[] = [];
  subjects: any[] = [];
  loading = false;
  uploading = false;
  uploadProgress = 0;
  selectedDocuments: File[] = [];
  selectedVideo: File | null = null;

  constructor(
    private fb: FormBuilder,
    private moduleService: ModuleService,
    private subjectService: SubjectService,
    private departmentService: DepartmentService,
    private courseService: CourseService,
    private batchService: BatchService,
    private semesterService: SemesterService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ModuleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ModuleDialogData
  ) {
    this.moduleForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadDepartments();
    if (this.data.mode === 'edit' && this.data.module) {
      this.populateForm(this.data.module);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      department: ['', Validators.required],
      course: ['', Validators.required],
      batch: ['', Validators.required],
      semester: ['', Validators.required],
      subject: ['', Validators.required],
      order: [1, [Validators.required, Validators.min(1)]],
      isActive: [true]
    });
  }

  private loadSubjects(): void {
    this.subjectService.getSubjects().subscribe({
      next: (response: any) => {
        if (Array.isArray(response)) {
          this.subjects = response;
        } else if (response.data && Array.isArray(response.data.subjects)) {
          this.subjects = response.data.subjects;
        } else if (response.subjects && Array.isArray(response.subjects)) {
          this.subjects = response.subjects;
        } else {
          this.subjects = [];
        }
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.snackBar.open('Failed to load subjects', 'Close', { duration: 3000 });
      }
    });
  }

  private loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.departments = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.snackBar.open('Failed to load departments', 'Close', { duration: 3000 });
      }
    });
  }

  onDepartmentChange(departmentId: string): void {
    // Reset dependent dropdowns
    this.courses = [];
    this.batches = [];
    this.semesters = [];
    this.subjects = [];
    this.moduleForm.patchValue({
      course: '',
      batch: '',
      semester: '',
      subject: ''
    });

    if (departmentId) {
      this.loadCoursesByDepartment(departmentId);
    }
  }

  onCourseChange(courseId: string): void {
    // Reset dependent dropdowns
    this.batches = [];
    this.semesters = [];
    this.subjects = [];
    this.moduleForm.patchValue({
      batch: '',
      semester: '',
      subject: ''
    });

    if (courseId) {
      this.loadBatchesByCourse(courseId);
    }
  }

  onBatchChange(batchId: string): void {
    // Reset dependent dropdowns
    this.semesters = [];
    this.subjects = [];
    this.moduleForm.patchValue({
      semester: '',
      subject: ''
    });

    if (batchId) {
      this.loadSemestersByBatch(batchId);
    }
  }

  onSemesterChange(semesterId: string): void {
    // Reset dependent dropdowns
    this.subjects = [];
    this.moduleForm.patchValue({
      subject: ''
    });

    if (semesterId) {
      this.loadSubjectsBySemester(semesterId);
    }
  }

  private loadCoursesByDepartment(departmentId: string): void {
    this.courseService.getCoursesByDepartment(departmentId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.courses = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.snackBar.open('Failed to load courses', 'Close', { duration: 3000 });
      }
    });
  }

  private loadBatchesByCourse(courseId: string): void {
    this.batchService.getBatchesByCourse(courseId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.batches = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading batches:', error);
        this.snackBar.open('Failed to load batches', 'Close', { duration: 3000 });
      }
    });
  }

  private loadSemestersByBatch(batchId: string): void {
    this.semesterService.getSemestersByBatch(batchId).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.semesters = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading semesters:', error);
        this.snackBar.open('Failed to load semesters', 'Close', { duration: 3000 });
      }
    });
  }

  private loadSubjectsBySemester(semesterId: string): void {
    // Use the existing subjects service with semester filter
    this.subjectService.getSubjects({ semester: semesterId }).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.subjects = response.data;
        } else if (Array.isArray(response)) {
          this.subjects = response;
        }
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.snackBar.open('Failed to load subjects', 'Close', { duration: 3000 });
      }
    });
  }

  private populateForm(module: any): void {
    this.moduleForm.patchValue({
      name: module.name,
      code: module.code,
      description: module.description,
      order: module.order,
      isActive: module.isActive
    });

    // If we have subject data with populated references, load the hierarchical data
    if (module.subject) {
      const subject = module.subject;
      
      // Load department and set it
      if (subject.departmentId) {
        const departmentId = subject.departmentId._id || subject.departmentId;
        this.moduleForm.patchValue({ department: departmentId });
        this.loadCoursesByDepartment(departmentId);
        
        // After courses are loaded, set course
        setTimeout(() => {
          if (subject.courseId) {
            const courseId = subject.courseId._id || subject.courseId;
            this.moduleForm.patchValue({ course: courseId });
            this.loadBatchesByCourse(courseId);
            
            // After batches are loaded, set batch
            setTimeout(() => {
              if (subject.semesterId && subject.semesterId.batch) {
                const batchId = subject.semesterId.batch._id || subject.semesterId.batch;
                this.moduleForm.patchValue({ batch: batchId });
                this.loadSemestersByBatch(batchId);
                
                // After semesters are loaded, set semester
                setTimeout(() => {
                  const semesterId = subject.semesterId._id || subject.semesterId;
                  this.moduleForm.patchValue({ semester: semesterId });
                  this.loadSubjectsBySemester(semesterId);
                  
                  // Finally set the subject
                  setTimeout(() => {
                    this.moduleForm.patchValue({ subject: subject._id || subject });
                  }, 500);
                }, 500);
              }
            }, 500);
          }
        }, 500);
      }
    }
  }

  onDocumentSelect(event: any): void {
    const files = event.target.files;
    if (files) {
      // Validate file types (PDFs only)
      const validFiles = Array.from(files).filter((file: any) => {
        if (file.type !== 'application/pdf') {
          this.snackBar.open(`${file.name} is not a PDF file`, 'Close', { duration: 3000 });
          return false;
        }
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          this.snackBar.open(`${file.name} is too large (max 10MB)`, 'Close', { duration: 3000 });
          return false;
        }
        return true;
      }) as File[];

      this.selectedDocuments = [...this.selectedDocuments, ...validFiles];
    }
  }

  onVideoSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Check file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        this.snackBar.open('Video file is too large (max 100MB)', 'Close', { duration: 3000 });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('video/')) {
        this.snackBar.open('Please select a valid video file', 'Close', { duration: 3000 });
        return;
      }
      
      this.selectedVideo = file;
    }
  }

  removeDocument(index: number): void {
    this.selectedDocuments.splice(index, 1);
  }

  removeVideo(): void {
    this.selectedVideo = null;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  onSubmit(): void {
    if (this.moduleForm.invalid) {
      this.markFormGroupTouched(this.moduleForm);
      return;
    }

    this.loading = true;
    this.uploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    
    // Add form fields
    Object.keys(this.moduleForm.value).forEach(key => {
      formData.append(key, this.moduleForm.value[key]);
    });

    // Add documents
    this.selectedDocuments.forEach((file, index) => {
      formData.append('documents', file);
    });

    // Add video
    if (this.selectedVideo) {
      formData.append('video', this.selectedVideo);
    }

    const request$ = this.data.mode === 'create' 
      ? this.moduleService.createModuleWithFiles(formData)
      : this.moduleService.updateModuleWithFiles(this.data.module._id, formData);

    request$.subscribe({
      next: (response) => {
        this.snackBar.open(
          `Module ${this.data.mode === 'create' ? 'created' : 'updated'} successfully`,
          'Close',
          { duration: 3000 }
        );
        this.dialogRef.close(response);
      },
      error: (error: any) => {
        console.error('Error saving module:', error);
        this.snackBar.open(
          error.error?.message || `Failed to ${this.data.mode} module`,
          'Close',
          { duration: 5000 }
        );
        this.loading = false;
        this.uploading = false;
        this.uploadProgress = 0;
      },
      complete: () => {
        this.loading = false;
        this.uploading = false;
        this.uploadProgress = 0;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.moduleForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
      }
      if (control.errors['minlength']) {
        return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
      if (control.errors['pattern']) {
        return 'Code must contain only uppercase letters, numbers, and hyphens';
      }
      if (control.errors['min']) {
        return 'Order must be at least 1';
      }
    }
    return '';
  }

  get dialogTitle(): string {
    return this.data.mode === 'create' ? 'Create New Module' : 'Edit Module';
  }

  get submitButtonText(): string {
    if (this.uploading) return 'Uploading...';
    return this.data.mode === 'create' ? 'Create Module' : 'Update Module';
  }
}
