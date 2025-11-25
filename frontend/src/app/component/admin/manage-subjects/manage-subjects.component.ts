import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';

import { SubjectService, Subject, Department, Course, Lecturer } from '../../../services/subject.service';
import { DepartmentService } from '../../../services/department.service';
import { SemesterService, Semester } from '../../../services/semester.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { LoadingService } from '../../../services/loading.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { SubjectDialogComponent } from './subject-dialog.component';
import { AdminLayout } from '../admin-layout/admin-layout';

@Component({
  selector: 'app-manage-subjects',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDialogModule,
    MatSnackBarModule,
    MatSelectModule,
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    LoadingSpinnerComponent,
    AdminLayout
  ],
  templateUrl: './manage-subjects.component.html',
  styleUrls: ['./manage-subjects.component.css']
})
export class ManageSubjectsComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  dataSource = new MatTableDataSource<Subject>();
  displayedColumns: string[] = [
    'name',
    'code',
    'department',
    'course',
    'batch',
    'semester',
    'creditHours',
    'lecturer',
    'actions'
  ];

  // Data
  subjects: Subject[] = [];
  departments: Department[] = [];
  courses: Course[] = [];
  semesters: Semester[] = [];
  lecturers: Lecturer[] = [];

  // Filters
  searchTerm = '';
  selectedDepartment = '';
  selectedCourse = '';
  selectedSemester = '';
  selectedLecturer = '';

  // Pagination
  pageIndex = 0;
  pageSize = 10;
  totalSubjects = 0;

  constructor(
    private subjectService: SubjectService,
    private departmentService: DepartmentService,
    private semesterService: SemesterService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService
  ) {}

  ngOnInit() {
    this.loadInitialData();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.createFilter();
  }

  async loadInitialData() {
    this.loadingService.show();
    try {
      await Promise.all([
        this.loadSubjects(),
        this.loadDepartments(),
        this.loadSemesters(),
        this.loadLecturers()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
      this.showError('Failed to load data');
    } finally {
      this.loadingService.hide();
    }
  }

  async loadSubjects() {
    try {
      const filters = this.getFilters();
      const response = await this.subjectService.getSubjects(filters).toPromise();
      
      if (response?.success && Array.isArray(response.data)) {
        this.subjects = response.data;
        this.dataSource.data = this.subjects;
        this.totalSubjects = this.subjects.length;
        this.subjectService.updateSubjectsState(this.subjects);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      this.showError('Failed to load subjects');
    }
  }

  async loadDepartments() {
    try {
      const response = await this.departmentService.getDepartments().toPromise();
      if (response?.success && Array.isArray(response.data)) {
        this.departments = response.data;
      }
    } catch (error) {
      console.error('Error loading departments:', error);
    }
  }

  async loadSemesters() {
    try {
      const response = await this.semesterService.getSemesters().toPromise();
      if (response?.success && Array.isArray(response.data)) {
        this.semesters = response.data;
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
    }
  }

  async loadLecturers() {
    try {
      const response = await this.subjectService.getLecturers().toPromise();
      if (response?.success && Array.isArray(response.data)) {
        this.lecturers = response.data;
      }
    } catch (error) {
      console.error('Error loading lecturers:', error);
    }
  }

  async onDepartmentChange() {
    this.selectedCourse = '';
    this.courses = [];
    
    if (this.selectedDepartment) {
      try {
        const response = await this.subjectService.getCoursesByDepartment(this.selectedDepartment).toPromise();
        if (response?.success && Array.isArray(response.data)) {
          this.courses = response.data;
        }
      } catch (error) {
        console.error('Error loading courses:', error);
      }
    }
    
    this.applyFilter();
  }

  getFilters() {
    const filters: any = {};
    
    if (this.selectedDepartment) {
      filters.department = this.selectedDepartment;
    }
    if (this.selectedCourse) {
      filters.course = this.selectedCourse;
    }
    if (this.selectedSemester) {
      filters.semester = this.selectedSemester;
    }
    if (this.selectedLecturer) {
      filters.lecturer = this.selectedLecturer;
    }
    
    return Object.keys(filters).length > 0 ? filters : undefined;
  }

  applyFilter() {
    this.loadSubjects();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedDepartment = '';
    this.selectedCourse = '';
    this.selectedSemester = '';
    this.selectedLecturer = '';
    this.courses = [];
    this.loadSubjects();
  }

  createFilter(): (data: Subject, filter: string) => boolean {
    return (data: Subject, filter: string): boolean => {
      const searchString = filter.toLowerCase();
      
      const subjectName = (data.name || '').toLowerCase();
      const subjectCode = (data.code || '').toLowerCase();
      const departmentName = this.getDepartmentName(data.departmentId);
      const courseName = this.getCourseName(data.courseId);
      const semesterName = this.getSemesterName(data.semesterId);
      const lecturerName = this.getLecturerName(data.lecturerId);
      
      return subjectName.includes(searchString) ||
             subjectCode.includes(searchString) ||
             departmentName.includes(searchString) ||
             courseName.includes(searchString) ||
             semesterName.includes(searchString) ||
             lecturerName.includes(searchString);
    };
  }

  onSearchChange() {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  getDepartmentName(departmentId: any): string {
    if (typeof departmentId === 'object' && departmentId?.name) {
      return departmentId.name.toLowerCase();
    }
    const dept = this.departments.find(d => d._id === departmentId);
    return dept ? dept.name.toLowerCase() : '';
  }

  getCourseName(courseId: any): string {
    if (typeof courseId === 'object' && courseId?.name) {
      return courseId.name.toLowerCase();
    }
    const course = this.courses.find(c => c._id === courseId);
    return course ? course.name.toLowerCase() : '';
  }

  getBatchName(batchId: any): string {
    if (typeof batchId === 'object' && batchId?.name) {
      return batchId.name;
    }
    // Since we don't have batches loaded globally, return empty string
    // The populated data from backend will be used instead
    return '';
  }

  getSemesterName(semesterId: any): string {
    if (typeof semesterId === 'object' && semesterId?.name) {
      return semesterId.name.toLowerCase();
    }
    const semester = this.semesters.find(s => s._id === semesterId);
    return semester ? semester.name.toLowerCase() : '';
  }

  getLecturerName(lecturerId: any): string {
    if (typeof lecturerId === 'object' && lecturerId?.firstName) {
      return `${lecturerId.firstName} ${lecturerId.lastName}`.toLowerCase();
    }
    const lecturer = this.lecturers.find(l => l._id === lecturerId);
    return lecturer ? `${lecturer.firstName} ${lecturer.lastName}`.toLowerCase() : '';
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(SubjectDialogComponent, {
      width: '600px',
      data: {
        mode: 'create',
        departments: this.departments,
        lecturers: this.lecturers
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSubjects();
        this.showSuccess('Subject created successfully');
      }
    });
  }

  openEditDialog(subject: Subject) {
    const dialogRef = this.dialog.open(SubjectDialogComponent, {
      width: '600px',
      data: {
        mode: 'edit',
        subject: { ...subject },
        departments: this.departments,
        lecturers: this.lecturers
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSubjects();
        this.showSuccess('Subject updated successfully');
      }
    });
  }

  openDuplicateDialog(subject: Subject) {
    // Create a copy of the subject without the _id to make it a new record
    const duplicateSubject = {
      ...subject,
      _id: undefined, // Remove ID so it creates a new record
      name: `${subject.name} (Copy)`,
      code: `${subject.code}-COPY` // Modify code to avoid duplicate
    };

    const dialogRef = this.dialog.open(SubjectDialogComponent, {
      width: '600px',
      data: {
        mode: 'duplicate',
        subject: duplicateSubject,
        departments: this.departments,
        lecturers: this.lecturers
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadSubjects();
        this.showSuccess('Subject duplicated successfully');
      }
    });
  }

  async deleteSubject(subject: Subject) {
    // Check dependencies before deletion
    const confirmed = await this.confirmationService.confirmDeleteWithDependencyCheck(
      subject._id!,
      subject.name,
      'subject'
    ).toPromise();

    if (confirmed) {
      this.loadingService.show();
      try {
        const response = await this.subjectService.deleteSubject(subject._id!).toPromise();
        
        if (response?.success) {
          this.loadSubjects();
          this.showSuccess('Subject deleted successfully');
        } else {
          this.showError(response?.message || 'Failed to delete subject');
        }
      } catch (error: any) {
        console.error('Error deleting subject:', error);
        this.showError(error?.error?.message || 'Failed to delete subject');
      } finally {
        this.loadingService.hide();
      }
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }

  showSuccess(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  showError(message: string) {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }
}
