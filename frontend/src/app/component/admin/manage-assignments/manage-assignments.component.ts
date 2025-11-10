import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
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
import { DepartmentService } from '../../../services/department.service';
import { CourseService } from '../../../services/course.service';
import { BatchService } from '../../../services/batch.service';
import { SemesterService } from '../../../services/semester.service';
import { SubjectService } from '../../../services/subject.service';
import { ModuleService } from '../../../services/module.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { LoadingService } from '../../../services/loading.service';
import { AdminLayout } from '../admin-layout/admin-layout';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { ViewAssignmentDialogComponent } from '../view-assignment-dialog/view-assignment-dialog.component';

@Component({
  selector: 'app-manage-assignments',
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
    AdminLayout,
    LoadingSpinnerComponent
  ],
  templateUrl: './manage-assignments.component.html',
  styleUrls: ['./manage-assignments.component.css']
})
export class ManageAssignmentsComponent implements OnInit {
  assignments: Assignment[] = [];
  displayedColumns: string[] = ['title', 'department', 'course', 'batch', 'subject', 'assignmentType', 'assignmentLevel', 'dueDate', 'questionCount', 'isActive', 'actions'];
  
  // Pagination
  totalCount = 0;
  pageSize = 10;
  currentPage = 0;
  
  // Forms
  assignmentForm!: FormGroup;
  filterForm!: FormGroup;
  
  // Data for dropdowns
  departments: any[] = [];
  courses: any[] = [];
  batches: any[] = [];
  semesters: any[] = [];
  subjects: any[] = [];
  modules: any[] = [];

  // Filtered data based on selections
  filteredCourses: any[] = [];
  filteredBatches: any[] = [];
  filteredSemesters: any[] = [];
  filteredSubjects: any[] = [];
  filteredModules: any[] = [];
  
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
    private departmentService: DepartmentService,
    private courseService: CourseService,
    private batchService: BatchService,
    private semesterService: SemesterService,
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
    this.loadInitialData();
    this.loadAssignments();
    this.setupFormWatchers();
  }

  private setupFormWatchers(): void {
    // Watch for department changes
    this.assignmentForm.get('department')?.valueChanges.subscribe((departmentId) => {
      this.onDepartmentChange(departmentId);
    });

    // Watch for course changes
    this.assignmentForm.get('course')?.valueChanges.subscribe((courseId) => {
      this.onCourseChange(courseId);
    });

    // Watch for semester changes
    this.assignmentForm.get('semester')?.valueChanges.subscribe((semesterId) => {
      this.onSemesterChange(semesterId);
    });

    // Watch for subject changes
    this.assignmentForm.get('subject')?.valueChanges.subscribe((subjectId) => {
      this.onSubjectChange(subjectId);
    });
  }

  private onDepartmentChange(departmentId: string): void {
    if (departmentId) {
      // Load courses filtered by department
      this.courseService.getCourses(departmentId).subscribe({
        next: (response) => {
          if (response.success) {
            this.filteredCourses = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading courses:', error);
          this.filteredCourses = [];
        }
      });
      
      // Load batches filtered by department
      this.batchService.getBatchesByDepartment(departmentId).subscribe({
        next: (response) => {
          if (response.success) {
            this.filteredBatches = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading batches:', error);
          this.filteredBatches = [];
        }
      });
      
      // Reset dependent fields
      this.assignmentForm.patchValue({
        course: '',
        batch: '',
        semester: '',
        subject: '',
        modules: []
      });
      
      this.filteredSemesters = [];
      this.filteredSubjects = [];
      this.filteredModules = [];
    } else {
      this.filteredCourses = [];
      this.filteredBatches = [];
      this.filteredSemesters = [];
      this.filteredSubjects = [];
      this.filteredModules = [];
    }
  }

  private onCourseChange(courseId: string): void {
    if (courseId) {
      // Load batches filtered by course
      this.batchService.getBatchesByCourse(courseId).subscribe({
        next: (response) => {
          if (response.success) {
            this.filteredBatches = response.data;
          }
        },
        error: (error) => {
          console.error('Error loading batches:', error);
          this.filteredBatches = [];
        }
      });
      
      // Load semesters - we need to filter them based on available data
      // For now, show all semesters and let user select
      this.filteredSemesters = this.semesters;
      
      // Reset dependent fields
      this.assignmentForm.patchValue({
        batch: '',
        semester: '',
        subject: '',
        modules: []
      });
      
      this.filteredSubjects = [];
      this.filteredModules = [];
    } else {
      this.filteredBatches = [];
      this.filteredSemesters = [];
      this.filteredSubjects = [];
      this.filteredModules = [];
    }
  }

  private onSemesterChange(semesterId: string): void {
    if (semesterId) {
      const courseId = this.assignmentForm.get('course')?.value;
      const departmentId = this.assignmentForm.get('department')?.value;
      
      // Load subjects filtered by semester, course, and department
      this.subjectService.getSubjects({
        semester: semesterId,
        course: courseId,
        department: departmentId
      }).subscribe({
        next: (response) => {
          if (response.success) {
            // Handle the case where data can be a single Subject or an array
            this.filteredSubjects = Array.isArray(response.data) ? response.data : [response.data];
          }
        },
        error: (error) => {
          console.error('Error loading subjects:', error);
          this.filteredSubjects = [];
        }
      });
      
      // Reset dependent fields
      this.assignmentForm.patchValue({
        subject: '',
        modules: []
      });
      
      this.filteredModules = [];
    } else {
      this.filteredSubjects = [];
      this.filteredModules = [];
    }
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

    this.filterForm = this.fb.group({
      department: [''],
      course: [''],
      batch: [''],
      semester: [''],
      subject: [''],
      assignmentLevel: [''],
      assignmentType: [''],
      isActive: ['']
    });
  }

  async loadInitialData() {
    try {
      // Load all base data first
      const departments = await this.departmentService.getDepartments().toPromise();
      this.departments = departments?.data || [];

      // Initialize filtered arrays
      this.filteredCourses = [];
      this.filteredBatches = [];
      this.filteredSemesters = [];
      this.filteredSubjects = [];
      this.filteredModules = [];

      // Load all reference data
      const [courses, batches, semesters, subjects, modules] = await Promise.all([
        this.courseService.getCourses().toPromise(),
        this.batchService.getBatches().toPromise(),
        this.semesterService.getSemesters().toPromise(),
        this.subjectService.getSubjects().toPromise(),
        this.moduleService.getModules().toPromise()
      ]);

      this.courses = courses?.data || [];
      this.batches = batches?.data || [];
      this.semesters = semesters?.data || [];
      this.subjects = Array.isArray(subjects?.data) ? subjects.data : [];
      this.modules = Array.isArray(modules?.data) ? modules.data : [];

    } catch (error) {
      console.error('Error loading initial data:', error);
      this.snackBar.open('Error loading dropdown data', 'Close', { duration: 3000 });
    }
  }

  loadAssignments() {
    this.isLoading = true;
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
        this.assignments = response.data;
        this.totalCount = response.pagination?.total || 0;
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
    
    // Reset all filtered arrays
    this.filteredCourses = [];
    this.filteredBatches = [];
    this.filteredSemesters = [];
    this.filteredSubjects = [];
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
    
    // First patch the form with assignment data
    this.assignmentForm.patchValue({
      ...assignment,
      dueDate: new Date(assignment.dueDate),
      contentSource: 'module_name'
    });

    // Then trigger the cascading dropdown updates
    setTimeout(() => {
      if (typeof assignment.department === 'object' && assignment.department) {
        this.onDepartmentChange(assignment.department._id);
        setTimeout(() => {
          if (typeof assignment.course === 'object' && assignment.course) {
            this.onCourseChange(assignment.course._id);
            setTimeout(() => {
              if (typeof assignment.semester === 'object' && assignment.semester) {
                this.onSemesterChange(assignment.semester._id);
                setTimeout(() => {
                  if (typeof assignment.subject === 'object' && assignment.subject) {
                    this.onSubjectChange(assignment.subject._id);
                  }
                }, 100);
              }
            }, 100);
          }
        }, 100);
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
    const assignmentData: Assignment = {
      ...formValue,
      questions: this.previewQuestions,
      dueDate: new Date(formValue.dueDate)
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
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Assignment',
      message: `Are you sure you want to delete "${assignment.title}"? This action cannot be undone.`,
      type: 'delete'
    }).toPromise();

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
}
