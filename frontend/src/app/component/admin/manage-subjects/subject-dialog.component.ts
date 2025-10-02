import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { SubjectService, Subject, Department, Course, Batch, Semester, Lecturer } from '../../../services/subject.service';
import { LoadingService } from '../../../services/loading.service';

interface DialogData {
  mode: 'create' | 'edit';
  subject?: Subject;
  departments: Department[];
  lecturers: Lecturer[];
}

@Component({
  selector: 'app-subject-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './subject-dialog.component.html',
  styleUrls: ['./subject-dialog.component.css']
})
export class SubjectDialogComponent implements OnInit {
  form: FormGroup;
  isEdit: boolean;
  courses: Course[] = [];
  batches: Batch[] = [];
  semesters: Semester[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SubjectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private subjectService: SubjectService,
    private snackBar: MatSnackBar,
    private loadingService: LoadingService
  ) {
    this.isEdit = data.mode === 'edit';
    this.form = this.createForm();
  }

  ngOnInit() {
    if (this.isEdit && this.data.subject) {
      this.populateForm();
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(10)]],
      departmentId: ['', [Validators.required]],
      courseId: ['', [Validators.required]],
      batchId: ['', [Validators.required]],
      semesterId: ['', [Validators.required]],
      creditHours: ['', [Validators.required, Validators.min(1), Validators.max(10)]],
      lecturerId: ['', [Validators.required]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  async populateForm() {
    if (!this.data.subject) return;

    const subject = this.data.subject;
    
    // Load courses for the selected department
    if (subject.departmentId) {
      const departmentId = typeof subject.departmentId === 'string' 
        ? subject.departmentId 
        : subject.departmentId._id;
      await this.loadCoursesByDepartment(departmentId);
    }

    // Load batches for the selected course
    if (subject.courseId) {
      const courseId = typeof subject.courseId === 'string' 
        ? subject.courseId 
        : subject.courseId._id;
      await this.loadBatchesByCourse(courseId);
    }

    // Load semesters for the selected batch
    if (subject.batchId) {
      const batchId = typeof subject.batchId === 'string' 
        ? subject.batchId 
        : subject.batchId._id;
      await this.loadSemestersByBatch(batchId);
    }

    this.form.patchValue({
      name: subject.name,
      code: subject.code,
      departmentId: typeof subject.departmentId === 'string' 
        ? subject.departmentId 
        : subject.departmentId._id,
      courseId: typeof subject.courseId === 'string' 
        ? subject.courseId 
        : subject.courseId._id,
      batchId: typeof subject.batchId === 'string' 
        ? subject.batchId 
        : subject.batchId._id,
      semesterId: typeof subject.semesterId === 'string' 
        ? subject.semesterId 
        : subject.semesterId._id,
      creditHours: subject.creditHours,
      lecturerId: typeof subject.lecturerId === 'string' 
        ? subject.lecturerId 
        : subject.lecturerId._id,
      description: subject.description || ''
    });
  }

  async onDepartmentChange() {
    const departmentId = this.form.get('departmentId')?.value;
    
    // Reset dependent selections
    this.form.get('courseId')?.setValue('');
    this.form.get('batchId')?.setValue('');
    this.form.get('semesterId')?.setValue('');
    this.courses = [];
    this.batches = [];
    this.semesters = [];
    
    if (departmentId) {
      await this.loadCoursesByDepartment(departmentId);
    }
  }

  async onCourseChange() {
    const courseId = this.form.get('courseId')?.value;
    
    // Reset dependent selections
    this.form.get('batchId')?.setValue('');
    this.form.get('semesterId')?.setValue('');
    this.batches = [];
    this.semesters = [];
    
    if (courseId) {
      await this.loadBatchesByCourse(courseId);
    }
  }

  async onBatchChange() {
    const batchId = this.form.get('batchId')?.value;
    
    // Reset semester selection
    this.form.get('semesterId')?.setValue('');
    this.semesters = [];
    
    if (batchId) {
      await this.loadSemestersByBatch(batchId);
    }
  }

  async loadCoursesByDepartment(departmentId: string) {
    try {
      const response = await this.subjectService.getCoursesByDepartment(departmentId).toPromise();
      if (response?.success && Array.isArray(response.data)) {
        this.courses = response.data;
      }
    } catch (error) {
      console.error('Error loading courses:', error);
      this.showError('Failed to load courses for selected department');
    }
  }

  async loadBatchesByCourse(courseId: string) {
    try {
      const response = await this.subjectService.getBatchesByCourse(courseId).toPromise();
      if (response?.success && Array.isArray(response.data)) {
        this.batches = response.data;
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      this.showError('Failed to load batches for selected course');
    }
  }

  async loadSemestersByBatch(batchId: string) {
    try {
      const response = await this.subjectService.getSemestersByBatch(batchId).toPromise();
      if (response?.success && Array.isArray(response.data)) {
        this.semesters = response.data;
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
      this.showError('Failed to load semesters for selected batch');
    }
  }

  async onSubmit() {
    if (this.form.valid) {
      this.loadingService.show();
      
      try {
        const formData = this.form.value;
        
        // Transform form data to match API expectations
        const subjectData = {
          name: formData.name.trim(),
          code: formData.code.toUpperCase().trim(),
          departmentId: formData.departmentId,
          courseId: formData.courseId,
          batchId: formData.batchId,
          semesterId: formData.semesterId,
          creditHours: Number(formData.creditHours),
          lecturerId: formData.lecturerId,
          description: formData.description?.trim() || undefined
        };

        let response;
        if (this.isEdit) {
          response = await this.subjectService.updateSubject(this.data.subject!._id!, subjectData).toPromise();
        } else {
          response = await this.subjectService.createSubject(subjectData).toPromise();
        }

        if (response?.success) {
          this.dialogRef.close(response.data);
        } else {
          this.showError(response?.message || 'Operation failed');
        }
      } catch (error: any) {
        console.error('Error saving subject:', error);
        this.showError(error?.error?.message || 'Failed to save subject');
      } finally {
        this.loadingService.hide();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  markFormGroupTouched() {
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      control?.markAsTouched();
    });
  }

  onCancel() {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const control = this.form.get(fieldName);
    
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    
    if (control?.hasError('minlength')) {
      const minLength = control.errors?.['minlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLength} characters`;
    }
    
    if (control?.hasError('maxlength')) {
      const maxLength = control.errors?.['maxlength'].requiredLength;
      return `${this.getFieldLabel(fieldName)} cannot exceed ${maxLength} characters`;
    }
    
    if (control?.hasError('min')) {
      const min = control.errors?.['min'].min;
      return `${this.getFieldLabel(fieldName)} must be at least ${min}`;
    }
    
    if (control?.hasError('max')) {
      const max = control.errors?.['max'].max;
      return `${this.getFieldLabel(fieldName)} cannot exceed ${max}`;
    }
    
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      name: 'Subject name',
      code: 'Subject code',
      departmentId: 'Department',
      courseId: 'Course',
      batchId: 'Batch',
      semesterId: 'Semester',
      creditHours: 'Credit hours',
      lecturerId: 'Lecturer',
      description: 'Description'
    };
    
    return labels[fieldName] || fieldName;
  }

  showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
