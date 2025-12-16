import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, ValidatorFn, ValidationErrors, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

import { Assignment, AssignmentService, AssignmentFilters, Question } from '../../../services/assignment.service';
import { AuthService } from '../../../services/auth.service';
import { SubjectService } from '../../../services/subject.service';
import { ModuleService } from '../../../services/module.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { LoadingService } from '../../../services/loading.service';
import { LecturerLayout } from '../lecturer-layout/lecturer-layout';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { ViewAssignmentDialogComponent } from '../../admin/view-assignment-dialog/view-assignment-dialog.component';

@Component({
  selector: 'app-lecturer-manage-assignments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatIconModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatExpansionModule,
    MatRadioModule,
    MatCheckboxModule,
    MatTooltipModule,
    LecturerLayout,
    LoadingSpinnerComponent
  ],
  templateUrl: './manage-assignments.component.html',
  styleUrls: ['./manage-assignments.component.css']
})
export class LecturerManageAssignmentsComponent implements OnInit {
  assignments: Assignment[] = [];
  displayedColumns: string[] = ['title', 'subject', 'batch', 'semester', 'assignmentType', 'assignmentLevel', 'dueDate', 'questionCount', 'isActive', 'actions'];
  
  // Pagination
  totalCount = 0;
  pageSize = 10;
  currentPage = 0;
  
  // Forms
  assignmentForm!: FormGroup;
  filterForm!: FormGroup;
  
  // Data for dropdowns (lecturer's subjects only)
  lecturerSubjects: any[] = [];
  modules: any[] = [];
  filteredModules: any[] = [];
  
  // Current user
  currentUser: any;
  
  // UI State
  showForm = false;
  editingAssignment: Assignment | null = null;
  isLoading = false;
  previewQuestions: Question[] = [];
  isPreviewingQuestions = false;
  selectedTab = 0;
  
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
    private assignmentService: AssignmentService,
    private authService: AuthService,
    private subjectService: SubjectService,
    private moduleService: ModuleService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.initializeForms();
  }

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadLecturerSubjects();
    this.loadAssignments();
    this.setupFormWatchers();
  }

  private setupFormWatchers(): void {
    // Watch for subject changes to load modules
    this.assignmentForm.get('subject')?.valueChanges.subscribe((subjectId) => {
      this.onSubjectChange(subjectId);
    });
  }

  private onSubjectChange(subjectId: string): void {
    if (subjectId) {
      // Load modules for the selected subject
      this.moduleService.getModules({ subject: subjectId }).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.filteredModules = response.data.modules || [];
          }
        },
        error: (error) => {
          console.error('Error loading modules:', error);
          this.filteredModules = [];
        }
      });
      
      // Reset modules selection
      this.assignmentForm.patchValue({
        modules: []
      });
    } else {
      this.filteredModules = [];
    }
  }

  initializeForms() {
    // Calculate default dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    weekFromNow.setHours(23, 59, 59, 999);

    this.assignmentForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      subject: ['', Validators.required],
      modules: [[], Validators.required],
      startDate: [tomorrow, Validators.required], // When students can start
      dueDate: [weekFromNow, Validators.required], // Due date
      endDate: [weekFromNow, Validators.required], // When assignment closes
      passingMarks: [40, [Validators.required, Validators.min(0)]], // Passing marks (default 40%)
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

    // Add custom validator for passingMarks vs maxMarks
    this.assignmentForm.setValidators(this.passingMarksValidator());

    // Re-validate when maxMarks or passingMarks changes
    this.assignmentForm.get('maxMarks')?.valueChanges.subscribe(() => {
      this.assignmentForm.updateValueAndValidity();
    });
    this.assignmentForm.get('passingMarks')?.valueChanges.subscribe(() => {
      this.assignmentForm.updateValueAndValidity();
    });

    this.filterForm = this.fb.group({
      subject: [''],
      assignmentLevel: [''],
      assignmentType: [''],
      isActive: ['']
    });
  }

  // Custom validator to ensure passing marks don't exceed max marks
  passingMarksValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      if (!(formGroup instanceof FormGroup)) {
        return null;
      }

      const passingMarks = formGroup.get('passingMarks')?.value;
      const maxMarks = formGroup.get('maxMarks')?.value;

      if (passingMarks && maxMarks && passingMarks > maxMarks) {
        // Set error on passingMarks control
        formGroup.get('passingMarks')?.setErrors({ exceedsMaxMarks: true });
        return { passingMarksExceedsMax: true };
      } else {
        // Clear the error if it was previously set
        const passingMarksControl = formGroup.get('passingMarks');
        if (passingMarksControl?.hasError('exceedsMaxMarks')) {
          passingMarksControl.setErrors(null);
        }
      }

      return null;
    };
  }

  async loadLecturerSubjects() {
    if (!this.currentUser || !this.currentUser._id) {
      this.snackBar.open('User not authenticated', 'Close', { duration: 3000 });
      return;
    }

    try {
      // Fetch subjects taught by this lecturer
      const response = await this.subjectService.getSubjects({
        lecturer: this.currentUser._id
      }).toPromise();

      if (response && response.success) {
        this.lecturerSubjects = Array.isArray(response.data) ? response.data : [response.data];
      }
    } catch (error) {
      console.error('Error loading lecturer subjects:', error);
      this.snackBar.open('Error loading subjects', 'Close', { duration: 3000 });
    }
  }

  loadAssignments() {
    this.isLoading = true;
    
    // Build filters to only show assignments for lecturer's subjects
    const filters: AssignmentFilters = {
      page: this.currentPage + 1,
      limit: this.pageSize,
      ...this.filterForm.value
    };

    // Remove empty filter values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof AssignmentFilters] === '' || filters[key as keyof AssignmentFilters] === null) {
        delete filters[key as keyof AssignmentFilters];
      }
    });

    this.assignmentService.getAssignments(filters).subscribe({
      next: (response) => {
        // Filter assignments to only show those for lecturer's subjects
        const lecturerSubjectIds = this.lecturerSubjects.map(s => s._id);
        this.assignments = response.data.filter((assignment: Assignment) => {
          const subjectId = typeof assignment.subject === 'object' && assignment.subject 
            ? assignment.subject._id 
            : assignment.subject;
          return lecturerSubjectIds.includes(subjectId);
        });
        
        this.totalCount = this.assignments.length;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
        this.snackBar.open('Error loading assignments', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAssignments();
  }

  onFilterChange() {
    this.currentPage = 0;
    this.loadAssignments();
  }

  clearFilters() {
    this.filterForm.reset();
    this.onFilterChange();
  }

  showCreateForm() {
    this.editingAssignment = null;
    this.showForm = true;
    this.selectedTab = 0;
    this.previewQuestions = [];
    this.filteredModules = [];
    
    this.assignmentForm.reset({
      submissionType: 'online',
      allowLateSubmission: false,
      lateSubmissionPenalty: 0,
      numberOfQuestions: 10,
      contentSource: 'module_name'
    });
  }

  showEditForm(assignment: Assignment) {
    this.editingAssignment = assignment;
    this.showForm = true;
    this.selectedTab = 0;
    this.previewQuestions = assignment.questions || [];
    
    // Patch the form with assignment data
    this.assignmentForm.patchValue({
      ...assignment,
      dueDate: new Date(assignment.dueDate),
      contentSource: 'module_name'
    });

    // Load modules for the selected subject
    setTimeout(() => {
      if (typeof assignment.subject === 'object' && assignment.subject) {
        this.onSubjectChange(assignment.subject._id);
      }
    }, 100);
  }

  hideForm() {
    this.showForm = false;
    this.editingAssignment = null;
    this.previewQuestions = [];
    this.assignmentForm.reset();
  }

  async previewQuestionsAction() {
    if (this.assignmentForm.invalid) {
      this.markFormGroupTouched(this.assignmentForm);
      return;
    }

    const formValue = this.assignmentForm.value;
    
    // Get the selected subject details
    const selectedSubject = this.lecturerSubjects.find(s => s._id === formValue.subject);
    if (!selectedSubject) {
      this.snackBar.open('Invalid subject selected', 'Close', { duration: 3000 });
      return;
    }
    
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
      
      this.selectedTab = 1; // Switch to preview tab
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
    
    // Get the selected subject to extract department, course, batch, semester
    const selectedSubject = this.lecturerSubjects.find(s => s._id === formValue.subject);
    if (!selectedSubject) {
      this.snackBar.open('Invalid subject selected', 'Close', { duration: 3000 });
      this.isLoading = false;
      return;
    }

    const assignmentData: Assignment = {
      ...formValue,
      questions: this.previewQuestions,
      startDate: formValue.startDate ? new Date(formValue.startDate) : new Date(),
      dueDate: formValue.dueDate ? new Date(formValue.dueDate) : new Date(),
      endDate: formValue.endDate ? new Date(formValue.endDate) : (formValue.dueDate ? new Date(formValue.dueDate) : new Date()),
      passingMarks: formValue.passingMarks ? Number(formValue.passingMarks) : Math.ceil(formValue.maxMarks * 0.4),
      department: selectedSubject.departmentId?._id || selectedSubject.departmentId,
      course: selectedSubject.courseId?._id || selectedSubject.courseId,
      batch: selectedSubject.batchId?._id || selectedSubject.batchId,
      semester: selectedSubject.semesterId?._id || selectedSubject.semesterId
    };

    try {
      if (this.editingAssignment) {
        await this.assignmentService.updateAssignment(this.editingAssignment._id!, assignmentData).toPromise();
        this.snackBar.open('Assignment updated successfully!', 'Close', { duration: 3000 });
      } else {
        await this.assignmentService.createAssignment(assignmentData).toPromise();
        this.snackBar.open('Assignment created successfully!', 'Close', { duration: 3000 });
      }
      
      this.hideForm();
      this.loadAssignments();
    } catch (error) {
      console.error('Error saving assignment:', error);
      this.snackBar.open('Error saving assignment. Please try again.', 'Close', { duration: 5000 });
    } finally {
      this.isLoading = false;
    }
  }

  async deleteAssignment(assignment: Assignment) {
    // Check dependencies before deletion
    const confirmed = await this.confirmationService.confirmDeleteWithDependencyCheck(
      assignment._id!,
      assignment.title,
      'assignment'
    ).toPromise();

    if (confirmed) {
      try {
        await this.assignmentService.deleteAssignment(assignment._id!).toPromise();
        this.snackBar.open('Assignment deleted successfully!', 'Close', { duration: 3000 });
        this.loadAssignments();
      } catch (error) {
        console.error('Error deleting assignment:', error);
        this.snackBar.open('Error deleting assignment', 'Close', { duration: 3000 });
      }
    }
  }

  viewAssignment(assignment: Assignment) {
    this.dialog.open(ViewAssignmentDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { assignment }
    });
  }

  async toggleAssignmentStatus(assignment: Assignment) {
    try {
      const response = await this.assignmentService.toggleAssignmentStatus(assignment._id!).toPromise();
      if (response) {
        assignment.isActive = response.data.isActive;
        this.snackBar.open(response.message, 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error toggling assignment status:', error);
      this.snackBar.open('Error updating assignment status', 'Close', { duration: 3000 });
    }
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
      if (errors['exceedsMaxMarks']) return 'Passing marks cannot exceed maximum marks';
    }
    return '';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getQuestionTypeBadgeClass(type: string): string {
    const classes = {
      'MCQ': 'bg-blue-100 text-blue-800',
      'short_answer': 'bg-green-100 text-green-800',
      'essay': 'bg-purple-100 text-purple-800'
    };
    return classes[type as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getLevelBadgeClass(level: string): string {
    const classes = {
      'easy': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'hard': 'bg-red-100 text-red-800'
    };
    return classes[level as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  // Helper methods for type safety
  getEntityName(entity: any): string {
    if (typeof entity === 'object' && entity && entity.name) {
      return entity.name;
    }
    return '';
  }

  getSubjectDetails(assignment: Assignment): { course: string, batch: string, semester: string } {
    const subject: any = typeof assignment.subject === 'object' ? assignment.subject : null;
    return {
      course: subject?.courseId?.name || subject?.course?.name || '',
      batch: subject?.batchId?.name || subject?.batch?.name || '',
      semester: subject?.semesterId?.name || subject?.semester?.name || ''
    };
  }
}
