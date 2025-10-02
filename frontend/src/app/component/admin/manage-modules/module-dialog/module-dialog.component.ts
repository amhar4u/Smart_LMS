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
import { FirebaseService } from '../../../../services/firebase.service';

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
    private firebaseService: FirebaseService,
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
      title: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      department: ['', Validators.required],
      course: ['', Validators.required],
      batch: ['', Validators.required],
      semester: ['', Validators.required],
      subjectId: ['', Validators.required],
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
    console.log('🔍 [MODULE DIALOG] Loading departments...');
    this.departmentService.getDepartments().subscribe({
      next: (response: any) => {
        console.log('📋 [MODULE DIALOG] Departments response:', response);
        if (response.success && response.data) {
          this.departments = response.data;
          console.log(`✅ [MODULE DIALOG] Loaded ${this.departments.length} departments`);
        } else {
          console.warn('⚠️ [MODULE DIALOG] Invalid departments response:', response);
        }
      },
      error: (error) => {
        console.error('❌ [MODULE DIALOG] Error loading departments:', error);
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
    console.log('🔍 [MODULE DIALOG] Loading courses for department:', departmentId);
    this.courseService.getCoursesByDepartment(departmentId).subscribe({
      next: (response: any) => {
        console.log('📋 [MODULE DIALOG] Courses response:', response);
        if (response.success && response.data) {
          this.courses = response.data;
          console.log(`✅ [MODULE DIALOG] Loaded ${this.courses.length} courses`);
        } else {
          console.warn('⚠️ [MODULE DIALOG] Invalid courses response:', response);
        }
      },
      error: (error) => {
        console.error('❌ [MODULE DIALOG] Error loading courses:', error);
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
    console.log('🔍 [MODULE DIALOG] Populating form with module:', module);
    
    this.moduleForm.patchValue({
      title: module.title || module.name,
      name: module.name,
      code: module.code,
      description: module.description,
      order: module.order,
      isActive: module.isActive,
      subjectId: module.subject?._id || module.subject
    });

    // If we have subject data with the reference IDs, load the hierarchical data
    if (module.subject) {
      const subject = module.subject;
      console.log('📋 [MODULE DIALOG] Subject data:', subject);
      
      // Load department and set it
      if (subject.departmentId) {
        const departmentId = subject.departmentId._id || subject.departmentId;
        console.log('🏢 [MODULE DIALOG] Setting department:', departmentId);
        this.moduleForm.patchValue({ department: departmentId });
        this.loadCoursesByDepartment(departmentId);
        
        // After courses are loaded, set course
        setTimeout(() => {
          if (subject.courseId) {
            const courseId = subject.courseId._id || subject.courseId;
            console.log('📚 [MODULE DIALOG] Setting course:', courseId);
            this.moduleForm.patchValue({ course: courseId });
            this.loadBatchesByCourse(courseId);
            
            // After batches are loaded, set batch
            setTimeout(() => {
              if (subject.batchId) {
                const batchId = subject.batchId._id || subject.batchId;
                console.log('🎓 [MODULE DIALOG] Setting batch:', batchId);
                this.moduleForm.patchValue({ batch: batchId });
                this.loadSemestersByBatch(batchId);
                
                // After semesters are loaded, set semester
                setTimeout(() => {
                  if (subject.semesterId) {
                    const semesterId = subject.semesterId._id || subject.semesterId;
                    console.log('📅 [MODULE DIALOG] Setting semester:', semesterId);
                    this.moduleForm.patchValue({ semester: semesterId });
                    this.loadSubjectsBySemester(semesterId);
                    
                    // Finally set the subject
                    setTimeout(() => {
                      console.log('📖 [MODULE DIALOG] Setting subject:', subject._id);
                      this.moduleForm.patchValue({ subjectId: subject._id });
                    }, 500);
                  }
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
        return this.validateDocumentFile(file);
      }) as File[];

      this.selectedDocuments = [...this.selectedDocuments, ...validFiles];
    }
  }

  onVideoSelect(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (this.validateVideoFile(file)) {
        this.selectedVideo = file;
      }
    }
  }

  // Methods for viewing documents and videos
  viewDocument(document: any): void {
    if (document.firebaseURL) {
      this.firebaseService.openFile(document.firebaseURL);
    } else {
      this.snackBar.open('Document URL not available', 'Close', { duration: 3000 });
    }
  }

  downloadDocument(document: any): void {
    if (document.firebaseURL) {
      this.firebaseService.downloadFile(document.firebaseURL, document.name);
    } else {
      this.snackBar.open('Document URL not available', 'Close', { duration: 3000 });
    }
  }

  playVideo(): void {
    if (this.data.module?.video?.firebaseURL) {
      this.firebaseService.openFile(this.data.module.video.firebaseURL);
    } else {
      this.snackBar.open('Video URL not available', 'Close', { duration: 3000 });
    }
  }

  removeDocument(index: number): void {
    if (this.data.mode === 'edit' && this.data.module?.documents) {
      const documentId = this.data.module.documents[index]._id;
      if (documentId) {
        // Call API to remove document
        this.moduleService.deleteDocument(this.data.module._id, documentId).subscribe({
          next: () => {
            this.data.module.documents.splice(index, 1);
            this.snackBar.open('Document removed successfully', 'Close', { duration: 3000 });
          },
          error: (error) => {
            this.snackBar.open(
              error.error?.message || 'Failed to remove document',
              'Close',
              { duration: 5000 }
            );
          }
        });
      }
    } else {
      // Remove from selected files array for create mode
      this.selectedDocuments.splice(index, 1);
    }
  }

  removeVideo(): void {
    if (this.data.mode === 'edit' && this.data.module?.video) {
      // Call API to remove video
      this.moduleService.deleteVideo(this.data.module._id).subscribe({
        next: () => {
          this.data.module.video = null;
          this.snackBar.open('Video removed successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.snackBar.open(
            error.error?.message || 'Failed to remove video',
            'Close',
            { duration: 5000 }
          );
        }
      });
    } else {
      // Remove from selected file for create mode
      this.selectedVideo = null;
    }
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

    // Validate that at least one document is present (existing or new)
    const hasExistingDocuments = this.data.mode === 'edit' && this.data.module?.documents?.length > 0;
    const hasNewDocuments = this.selectedDocuments.length > 0;
    
    if (!hasExistingDocuments && !hasNewDocuments) {
      this.snackBar.open('At least one PDF document is required', 'Close', { duration: 5000 });
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

  // File validation
  private validateDocumentFile(file: File): boolean {
    if (file.type !== 'application/pdf') {
      this.snackBar.open('Only PDF files are allowed for documents', 'Close', { duration: 3000 });
      return false;
    }
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      this.snackBar.open('Document file size must be less than 50MB', 'Close', { duration: 3000 });
      return false;
    }
    return true;
  }

  private validateVideoFile(file: File): boolean {
    if (!file.type.startsWith('video/')) {
      this.snackBar.open('Only video files are allowed', 'Close', { duration: 3000 });
      return false;
    }
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      this.snackBar.open('Video file size must be less than 100MB', 'Close', { duration: 3000 });
      return false;
    }
    return true;
  }
}
