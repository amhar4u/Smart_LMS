import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Assignment, AssignmentService, Question } from '../../../services/assignment.service';
import { DepartmentService } from '../../../services/department.service';
import { CourseService } from '../../../services/course.service';
import { BatchService } from '../../../services/batch.service';
import { SemesterService } from '../../../services/semester.service';
import { SubjectService } from '../../../services/subject.service';
import { ModuleService } from '../../../services/module.service';

@Component({
  selector: 'app-create-assignment-dialog',
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
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatExpansionModule,
    MatRadioModule,
    MatSlideToggleModule,
    MatSnackBarModule
  ],
  templateUrl: './create-assignment-dialog.component.html',
  styleUrls: ['./create-assignment-dialog.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class CreateAssignmentDialogComponent implements OnInit {
  assignmentForm!: FormGroup;
  isLoading = false;
  selectedTab = 0;
  previewQuestions: Question[] = [];
  isPreviewingQuestions = false;

  // Dropdown data
  departments: any[] = [];
  filteredCourses: any[] = [];
  filteredBatches: any[] = [];
  filteredSemesters: any[] = [];
  filteredSubjects: any[] = [];
  filteredModules: any[] = [];

  // Assignment options
  assignmentLevels = [
    { value: 'easy', label: 'Easy' },
    { value: 'medium', label: 'Medium' },
    { value: 'hard', label: 'Hard' }
  ];

  assignmentTypes = [
    { value: 'MCQ', label: 'Multiple Choice Questions' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'essay', label: 'Essay' }
  ];

  submissionTypes = [
    { value: 'online', label: 'Online' },
    { value: 'file', label: 'File Upload' },
    { value: 'both', label: 'Both' }
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CreateAssignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { assignment?: Assignment },
    private assignmentService: AssignmentService,
    private departmentService: DepartmentService,
    private courseService: CourseService,
    private batchService: BatchService,
    private semesterService: SemesterService,
    private subjectService: SubjectService,
    private moduleService: ModuleService,
    private snackBar: MatSnackBar
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    this.loadDepartments();
    this.setupFormWatchers();

    if (this.data?.assignment) {
      this.loadAssignmentData(this.data.assignment);
    }
  }

  private initializeForm() {
    this.assignmentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      department: ['', Validators.required],
      course: ['', Validators.required],
      batch: ['', Validators.required],
      semester: ['', Validators.required],
      subject: ['', Validators.required],
      modules: [[], Validators.required],
      dueDate: ['', Validators.required],
      assignmentLevel: ['', Validators.required],
      assignmentType: ['', Validators.required],
      numberOfQuestions: [10, [Validators.required, Validators.min(1), Validators.max(100)]],
      maxMarks: [0, [Validators.required, Validators.min(1)]],
      instructions: ['', Validators.maxLength(3000)],
      submissionType: ['online'],
      allowLateSubmission: [false],
      lateSubmissionPenalty: [0, [Validators.min(0), Validators.max(100)]],
      timeLimit: [null, Validators.min(1)],
      contentSource: ['module_name'],
      moduleContent: ['']
    });
  }

  private setupFormWatchers(): void {
    this.assignmentForm.get('department')?.valueChanges.subscribe((departmentId) => {
      this.onDepartmentChange(departmentId);
    });

    this.assignmentForm.get('course')?.valueChanges.subscribe((courseId) => {
      this.onCourseChange(courseId);
    });

    this.assignmentForm.get('batch')?.valueChanges.subscribe((batchId) => {
      this.onBatchChange(batchId);
    });

    this.assignmentForm.get('semester')?.valueChanges.subscribe((semesterId) => {
      this.onSemesterChange(semesterId);
    });

    this.assignmentForm.get('subject')?.valueChanges.subscribe((subjectId) => {
      this.onSubjectChange(subjectId);
    });
  }

  private async loadDepartments() {
    try {
      const response = await this.departmentService.getDepartments().toPromise();
      this.departments = response?.data || [];
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }

  private onDepartmentChange(departmentId: string): void {
    if (departmentId) {
      this.courseService.getCourses(departmentId).subscribe({
        next: (response) => {
          if (response.success) {
            this.filteredCourses = response.data;
          }
        },
        error: () => this.filteredCourses = []
      });

      this.batchService.getBatchesByDepartment(departmentId).subscribe({
        next: (response) => {
          if (response.success) {
            this.filteredBatches = response.data;
          }
        },
        error: () => this.filteredBatches = []
      });

      this.assignmentForm.patchValue({
        course: '',
        batch: '',
        semester: '',
        subject: '',
        modules: []
      });
    }
  }

  private onCourseChange(courseId: string): void {
    if (courseId) {
      const departmentId = this.assignmentForm.get('department')?.value;
      if (departmentId) {
        this.batchService.getBatchesByDepartmentAndCourse(departmentId, courseId).subscribe({
          next: (response) => {
            if (response.success) {
              this.filteredBatches = response.data;
            }
          },
          error: () => {}
        });
      }
    }
  }

  private onBatchChange(batchId: string): void {
    if (batchId) {
      this.batchService.getBatchById(batchId).subscribe({
        next: (response) => {
          if (response.success && response.data?.semesters) {
            this.filteredSemesters = response.data.semesters;
          }
        },
        error: () => this.filteredSemesters = []
      });
    }
  }

  private onSemesterChange(semesterId: string): void {
    if (semesterId) {
      const courseId = this.assignmentForm.get('course')?.value;
      const departmentId = this.assignmentForm.get('department')?.value;

      this.subjectService.getSubjects({
        semester: semesterId,
        course: courseId,
        department: departmentId
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.filteredSubjects = Array.isArray(response.data) ? response.data : [response.data];
          }
        },
        error: () => this.filteredSubjects = []
      });
    }
  }

  private onSubjectChange(subjectId: string): void {
    if (subjectId) {
      this.moduleService.getModules({ subject: subjectId }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.filteredModules = response.data.modules || [];
          }
        },
        error: () => this.filteredModules = []
      });
    }
  }

  private loadAssignmentData(assignment: Assignment) {
    this.previewQuestions = assignment.questions || [];

    const departmentId = typeof assignment.department === 'object' && assignment.department ? assignment.department._id : assignment.department;
    const courseId = typeof assignment.course === 'object' && assignment.course ? assignment.course._id : assignment.course;
    const batchId = typeof assignment.batch === 'object' && assignment.batch ? assignment.batch._id : assignment.batch;
    const semesterId = typeof assignment.semester === 'object' && assignment.semester ? assignment.semester._id : assignment.semester;
    const subjectId = typeof assignment.subject === 'object' && assignment.subject ? assignment.subject._id : assignment.subject;
    const moduleIds = Array.isArray(assignment.modules) ? assignment.modules.map((m: any) => typeof m === 'object' ? m._id : m) : [];

    this.assignmentForm.patchValue({
      title: assignment.title,
      description: assignment.description,
      department: departmentId,
      course: courseId,
      batch: batchId,
      semester: semesterId,
      subject: subjectId,
      modules: moduleIds,
      dueDate: new Date(assignment.dueDate),
      assignmentLevel: assignment.assignmentLevel,
      assignmentType: assignment.assignmentType,
      numberOfQuestions: assignment.numberOfQuestions,
      maxMarks: assignment.maxMarks,
      instructions: assignment.instructions,
      submissionType: assignment.submissionType,
      allowLateSubmission: assignment.allowLateSubmission,
      lateSubmissionPenalty: assignment.lateSubmissionPenalty,
      timeLimit: assignment.timeLimit,
      contentSource: 'module_name'
    });
  }

  async previewQuestionsAction() {
    if (this.assignmentForm.invalid) {
      this.markFormGroupTouched(this.assignmentForm);
      return;
    }

    const formValue = this.assignmentForm.value;
    this.isPreviewingQuestions = true;

    try {
      const response = await this.assignmentService.previewQuestions({
        modules: formValue.modules,
        assignmentType: formValue.assignmentType,
        numberOfQuestions: formValue.numberOfQuestions,
        assignmentLevel: formValue.assignmentLevel,
        subject: formValue.subject,
        contentSource: formValue.contentSource,
        moduleContent: formValue.moduleContent
      }).toPromise();

      this.previewQuestions = response?.data.questions || [];
      this.assignmentForm.patchValue({
        maxMarks: response?.data.totalMarks || 0
      });

      this.selectedTab = 1;
      this.snackBar.open('Questions generated successfully!', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error generating questions:', error);
      this.snackBar.open('Error generating questions. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.isPreviewingQuestions = false;
    }
  }

  async saveAssignment() {
    if (this.assignmentForm.invalid) {
      this.markFormGroupTouched(this.assignmentForm);
      return;
    }

    if (this.previewQuestions.length === 0) {
      this.snackBar.open('Please preview questions first', 'Close', { duration: 3000 });
      return;
    }

    this.isLoading = true;

    const formValue = this.assignmentForm.value;
    const assignmentData: Assignment = {
      ...formValue,
      questions: this.previewQuestions,
      dueDate: new Date(formValue.dueDate)
    };

    try {
      if (this.data?.assignment) {
        await this.assignmentService.updateAssignment(this.data.assignment._id!, assignmentData).toPromise();
        this.snackBar.open('Assignment updated successfully!', 'Close', { duration: 3000 });
      } else {
        await this.assignmentService.createAssignment(assignmentData).toPromise();
        this.snackBar.open('Assignment created successfully!', 'Close', { duration: 3000 });
      }

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error saving assignment:', error);
      this.snackBar.open('Error saving assignment. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  cancel() {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getFormError(fieldName: string): string {
    const control = this.assignmentForm.get(fieldName);
    if (control && control.errors && control.touched) {
      const errors = control.errors;

      if (errors['required']) return `${fieldName} is required`;
      if (errors['minlength']) return `${fieldName} must be at least ${errors['minlength'].requiredLength} characters`;
      if (errors['maxlength']) return `${fieldName} cannot exceed ${errors['maxlength'].requiredLength} characters`;
      if (errors['min']) return `${fieldName} must be at least ${errors['min'].min}`;
      if (errors['max']) return `${fieldName} cannot exceed ${errors['max'].max}`;
    }
    return '';
  }

  getQuestionTypeBadgeClass(type: string): string {
    const classes = {
      'MCQ': 'bg-blue-100 text-blue-800',
      'short_answer': 'bg-green-100 text-green-800',
      'essay': 'bg-purple-100 text-purple-800'
    };
    return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }
}
