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
import { ExtraModuleService } from '../../../../services/extra-module.service';
import { SubjectService, Subject } from '../../../../services/subject.service';
import { DepartmentService } from '../../../../services/department.service';
import { CourseService } from '../../../../services/course.service';
import { BatchService } from '../../../../services/batch.service';
import { SemesterService } from '../../../../services/semester.service';
import { ExtraModule, StudentLevel, STUDENT_LEVELS } from '../../../../models/extra-module.model';

export interface ExtraModuleDialogData {
  extraModule?: ExtraModule;
  mode: 'create' | 'edit';
  lecturerId?: string;
  lecturerSubjects?: any[];
}

@Component({
  selector: 'app-extra-module-dialog',
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
  templateUrl: './extra-module-dialog.component.html',
  styleUrls: ['./extra-module-dialog.component.css']
})
export class ExtraModuleDialogComponent implements OnInit {
  extraModuleForm: FormGroup;
  departments: any[] = [];
  courses: any[] = [];
  batches: any[] = [];
  semesters: any[] = [];
  subjects: Subject[] = [];
  studentLevels = STUDENT_LEVELS;
  loading = false;
  uploading = false;
  uploadProgress = 0;
  selectedDocuments: File[] = [];
  selectedVideo: File | null = null;

  constructor(
    private fb: FormBuilder,
    private extraModuleService: ExtraModuleService,
    private subjectService: SubjectService,
    private departmentService: DepartmentService,
    private courseService: CourseService,
    private batchService: BatchService,
    private semesterService: SemesterService,
    private snackBar: MatSnackBar,
    public dialogRef: MatDialogRef<ExtraModuleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExtraModuleDialogData
  ) {
    this.extraModuleForm = this.createForm();
  }

  ngOnInit(): void {
    // If lecturerId is provided, this is lecturer mode - only load lecturer's subjects
    if (this.data.lecturerId) {
      this.loadLecturerSubjects();
    } else {
      // Admin mode - load departments for cascading dropdowns
      this.loadDepartments();
    }
    
    if (this.data.mode === 'edit' && this.data.extraModule) {
      this.populateForm(this.data.extraModule);
    }
  }

  private createForm(): FormGroup {
    // For lecturers: dept/course/batch/semester are optional and auto-populated from subject
    const isLecturer = !!this.data.lecturerId;
    
    return this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      code: ['', [Validators.required, Validators.pattern(/^[A-Z0-9-]+$/)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      department: ['', isLecturer ? [] : Validators.required],
      course: ['', isLecturer ? [] : Validators.required],
      batch: ['', isLecturer ? [] : Validators.required],
      semester: ['', isLecturer ? [] : Validators.required],
      subjectId: ['', Validators.required],
      studentLevel: ['', Validators.required],
      order: [1, [Validators.required, Validators.min(1)]],
      isActive: [true]
    });
  }

  private loadLecturerSubjects(): void {
    if (this.data.lecturerSubjects && this.data.lecturerSubjects.length > 0) {
      // Use provided lecturer subjects
      this.subjects = this.data.lecturerSubjects;
    } else if (this.data.lecturerId) {
      // Fetch lecturer subjects from API
      this.subjectService.getSubjects({ lecturer: this.data.lecturerId }).subscribe({
        next: (response: any) => {
          this.subjects = response.data || response.subjects || response;
        },
        error: (error) => {
          console.error('Error loading lecturer subjects:', error);
          this.snackBar.open('Failed to load subjects', 'Close', { duration: 3000 });
        }
      });
    }
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
    this.courses = [];
    this.batches = [];
    this.semesters = [];
    this.subjects = [];
    this.extraModuleForm.patchValue({
      course: '',
      batch: '',
      semester: '',
      subjectId: ''
    });

    if (departmentId) {
      this.loadCoursesByDepartment(departmentId);
    }
  }

  onCourseChange(courseId: string): void {
    this.batches = [];
    this.semesters = [];
    this.subjects = [];
    this.extraModuleForm.patchValue({
      batch: '',
      semester: '',
      subjectId: ''
    });

    if (courseId) {
      this.loadBatchesByCourse(courseId);
    }
  }

  onBatchChange(batchId: string): void {
    this.semesters = [];
    this.subjects = [];
    this.extraModuleForm.patchValue({
      semester: '',
      subjectId: ''
    });

    if (batchId) {
      this.loadSemestersByBatch(batchId);
    }
  }

  onSemesterChange(semesterId: string): void {
    this.subjects = [];
    this.extraModuleForm.patchValue({
      subjectId: ''
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

  private populateForm(extraModule: ExtraModule): void {
    this.extraModuleForm.patchValue({
      title: extraModule.title || extraModule.name,
      name: extraModule.name,
      code: extraModule.code,
      description: extraModule.description,
      studentLevel: extraModule.studentLevel,
      order: extraModule.order,
      isActive: extraModule.isActive,
      subjectId: typeof extraModule.subject === 'string' ? extraModule.subject : extraModule.subject?._id
    });

    // If we have subject data with the reference IDs, load the hierarchical data
    if (extraModule.subject && typeof extraModule.subject === 'object') {
      const subject: any = extraModule.subject;
      
      // Load department and set it
      if (subject.departmentId) {
        const departmentId = typeof subject.departmentId === 'string' ? subject.departmentId : subject.departmentId._id;
        this.extraModuleForm.patchValue({ department: departmentId });
        this.loadCoursesByDepartment(departmentId);
        
        // After courses are loaded, set course
        setTimeout(() => {
          if (subject.courseId) {
            const courseId = typeof subject.courseId === 'string' ? subject.courseId : subject.courseId._id;
            this.extraModuleForm.patchValue({ course: courseId });
            this.loadBatchesByCourse(courseId);
            
            // After batches are loaded, set batch
            setTimeout(() => {
              if (subject.batchId) {
                const batchId = typeof subject.batchId === 'string' ? subject.batchId : subject.batchId._id;
                this.extraModuleForm.patchValue({ batch: batchId });
                this.loadSemestersByBatch(batchId);
                
                // After semesters are loaded, set semester
                setTimeout(() => {
                  if (subject.semesterId) {
                    const semesterId = typeof subject.semesterId === 'string' ? subject.semesterId : subject.semesterId._id;
                    this.extraModuleForm.patchValue({ semester: semesterId });
                    this.loadSubjectsBySemester(semesterId);
                    
                    // Finally set the subject
                    setTimeout(() => {
                      this.extraModuleForm.patchValue({ subjectId: subject._id });
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

  onSubjectChange(subjectId: string): void {
    if (!subjectId || !this.data.lecturerId) return;
    
    // For lecturers: auto-populate dept/course/batch/semester from selected subject
    const subject = this.subjects.find(s => s._id === subjectId);
    if (subject) {
      const deptId = typeof subject.departmentId === 'string' ? subject.departmentId : subject.departmentId?._id;
      const courseId = typeof subject.courseId === 'string' ? subject.courseId : subject.courseId?._id;
      const batchId = typeof subject.batchId === 'string' ? subject.batchId : subject.batchId?._id;
      const semesterId = typeof subject.semesterId === 'string' ? subject.semesterId : subject.semesterId?._id;
      
      this.extraModuleForm.patchValue({
        department: deptId || '',
        course: courseId || '',
        batch: batchId || '',
        semester: semesterId || ''
      });
    }
  }

  getSelectedSubjectInfo(field: 'department' | 'course' | 'batch' | 'semester'): string {
    const subjectId = this.extraModuleForm.get('subjectId')?.value;
    if (!subjectId) return 'N/A';
    
    const subject = this.subjects.find(s => s._id === subjectId);
    if (!subject) return 'N/A';
    
    switch (field) {
      case 'department':
        if (typeof subject.departmentId === 'string') return subject.departmentId;
        return (subject.departmentId as any)?.name || 'N/A';
      case 'course':
        if (typeof subject.courseId === 'string') return subject.courseId;
        return (subject.courseId as any)?.name || 'N/A';
      case 'batch':
        if (typeof subject.batchId === 'string') return subject.batchId;
        return (subject.batchId as any)?.name || 'N/A';
      case 'semester':
        if (typeof subject.semesterId === 'string') return subject.semesterId;
        return (subject.semesterId as any)?.name || 'N/A';
      default:
        return 'N/A';
    }
  }

  onDocumentSelect(event: any): void {
    const files = event.target.files;
    if (files) {
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

  viewDocument(document: any): void {
    if (document.cloudinaryURL) {
      window.open(document.cloudinaryURL, '_blank');
    } else {
      this.snackBar.open('Document URL not available', 'Close', { duration: 3000 });
    }
  }

  downloadDocument(document: any): void {
    if (document.cloudinaryURL) {
      const link = document.createElement('a');
      link.href = document.cloudinaryURL;
      link.download = document.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      this.snackBar.open('Document URL not available', 'Close', { duration: 3000 });
    }
  }

  playVideo(): void {
    if (this.data.extraModule?.video?.cloudinaryURL) {
      window.open(this.data.extraModule.video.cloudinaryURL, '_blank');
    } else {
      this.snackBar.open('Video URL not available', 'Close', { duration: 3000 });
    }
  }

  downloadVideo(): void {
    if (this.data.extraModule?.video?.cloudinaryURL && this.data.extraModule?.video?.name) {
      const link = document.createElement('a');
      link.href = this.data.extraModule.video.cloudinaryURL;
      link.download = this.data.extraModule.video.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      this.snackBar.open('Video download started', 'Close', { duration: 2000 });
    } else {
      this.snackBar.open('Video URL not available', 'Close', { duration: 3000 });
    }
  }

  removeDocument(index: number): void {
    if (this.data.mode === 'edit' && this.data.extraModule?.documents) {
      const documentId = this.data.extraModule.documents[index]._id;
      if (documentId && this.data.extraModule._id) {
        this.extraModuleService.deleteDocument(this.data.extraModule._id, documentId).subscribe({
          next: () => {
            this.data.extraModule!.documents!.splice(index, 1);
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
      this.selectedDocuments.splice(index, 1);
    }
  }

  removeVideo(): void {
    if (this.data.mode === 'edit' && this.data.extraModule?.video && this.data.extraModule._id) {
      this.extraModuleService.deleteVideo(this.data.extraModule._id).subscribe({
        next: () => {
          this.data.extraModule!.video = undefined;
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
    if (this.extraModuleForm.invalid) {
      this.markFormGroupTouched(this.extraModuleForm);
      return;
    }

    const hasExistingDocuments = this.data.mode === 'edit' && this.data.extraModule?.documents?.length;
    const hasNewDocuments = this.selectedDocuments.length > 0;
    
    if (!hasExistingDocuments && !hasNewDocuments) {
      this.snackBar.open('At least one PDF document is required', 'Close', { duration: 5000 });
      return;
    }

    this.loading = true;
    this.uploading = true;
    this.uploadProgress = 0;

    const formData = new FormData();
    
    Object.keys(this.extraModuleForm.value).forEach(key => {
      formData.append(key, this.extraModuleForm.value[key]);
    });

    this.selectedDocuments.forEach((file) => {
      formData.append('documents', file);
    });

    if (this.selectedVideo) {
      formData.append('video', this.selectedVideo);
    }

    const request$ = this.data.mode === 'create' 
      ? this.extraModuleService.createExtraModuleWithFiles(formData)
      : this.extraModuleService.updateExtraModuleWithFiles(this.data.extraModule!._id!, formData);

    request$.subscribe({
      next: (response: any) => {
        this.snackBar.open(
          `Extra Module ${this.data.mode === 'create' ? 'created' : 'updated'} successfully`,
          'Close',
          { duration: 3000 }
        );
        this.dialogRef.close(response);
      },
      error: (error: any) => {
        console.error('Error saving extra module:', error);
        this.snackBar.open(
          error.error?.message || `Failed to ${this.data.mode} extra module`,
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
    const control = this.extraModuleForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} must be at least ${control.errors['minlength'].requiredLength} characters`;
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

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'Title',
      name: 'Name',
      code: 'Code',
      description: 'Description',
      department: 'Department',
      course: 'Course',
      batch: 'Batch',
      semester: 'Semester',
      subjectId: 'Subject',
      studentLevel: 'Student Level',
      order: 'Order'
    };
    return labels[fieldName] || fieldName;
  }

  get dialogTitle(): string {
    return this.data.mode === 'create' ? 'Create New Extra Module' : 'Edit Extra Module';
  }

  get submitButtonText(): string {
    if (this.uploading) return 'Uploading...';
    return this.data.mode === 'create' ? 'Create Extra Module' : 'Update Extra Module';
  }

  private validateDocumentFile(file: File): boolean {
    if (file.type !== 'application/pdf') {
      this.snackBar.open('Only PDF files are allowed for documents', 'Close', { duration: 3000 });
      return false;
    }
    if (file.size > 50 * 1024 * 1024) {
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
    if (file.size > 100 * 1024 * 1024) {
      this.snackBar.open('Video file size must be less than 100MB', 'Close', { duration: 3000 });
      return false;
    }
    return true;
  }

  getStudentLevelColor(level: StudentLevel): string {
    const colors: { [key in StudentLevel]: string } = {
      'Beginner': '#2196F3',
      'Intermediate': '#9C27B0',
      'Advanced': '#F44336',
      'All': '#757575'
    };
    return colors[level];
  }
}
