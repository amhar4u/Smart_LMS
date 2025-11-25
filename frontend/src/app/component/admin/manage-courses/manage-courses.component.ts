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

import { CourseService, Course } from '../../../services/course.service';
import type { CoursesAdminResponse } from '../../../services/course.service';
import { DepartmentService, Department } from '../../../services/department.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { LoadingService } from '../../../services/loading.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { CourseDialogComponent } from './course-dialog.component';
import { AdminLayout } from '../admin-layout/admin-layout';

@Component({
  selector: 'app-manage-courses',
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
  templateUrl: './manage-courses.component.html',
  styleUrls: ['./manage-courses.component.css']
})
export class ManageCoursesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['code', 'name', 'department', 'credits', 'status', 'actions'];
  dataSource = new MatTableDataSource<Course>();
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Filters
  searchTerm = '';
  selectedDepartment = '';
  departments: Department[] = [];

  constructor(
    private courseService: CourseService,
    private departmentService: DepartmentService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
    this.loadCourses();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (response) => {
        if (response.success) {
          this.departments = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      }
    });
  }

  loadCourses(): void {
    this.loadingService.show();
    
    this.courseService.getCoursesAdmin(
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      this.selectedDepartment
    ).subscribe({
      next: (response: CoursesAdminResponse) => {
        this.loadingService.hide();
        if (response.success && response.data) {
          this.dataSource.data = response.data.courses;
          this.totalItems = response.data.pagination.totalItems;
        }
      },
      error: (error: any) => {
        this.loadingService.hide();
        console.error('Error loading courses:', error);
        this.snackBar.open('Error loading courses', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.loadCourses();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadCourses();
  }

  onDepartmentFilter(): void {
    this.currentPage = 1;
    this.loadCourses();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedDepartment = '';
    this.currentPage = 1;
    this.loadCourses();
  }

  showAddForm(): void {
    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {},
      panelClass: 'course-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createCourse(result);
      }
    });
  }

  editCourse(course: Course): void {
    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        course: course
      },
      panelClass: 'course-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateCourse(course._id!, result);
      }
    });
  }

  createCourse(courseData: any): void {
    this.loadingService.show();
    
    this.courseService.createCourse(courseData).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.snackBar.open('Course created successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadCourses();
          this.courseService.refreshCourses();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error.error?.message || 'Error creating course';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  updateCourse(id: string, courseData: any): void {
    this.loadingService.show();
    
    this.courseService.updateCourse(id, courseData).subscribe({
      next: (response) => {
        this.loadingService.hide();
        
        if (response.success) {
          this.snackBar.open('Course updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadCourses();
          this.courseService.refreshCourses();
        } else {
          this.snackBar.open(response.message || 'Failed to update course', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Update error:', error);
        
        const errorMessage = error.error?.message || error.message || 'Error updating course';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteCourse(course: Course): void {
    // Check dependencies before deletion
    this.confirmationService.confirmDeleteWithDependencyCheck(
      course._id!,
      course.name,
      'course'
    ).subscribe(confirmed => {
      if (confirmed) {
        this.loadingService.show();
        
        this.courseService.deleteCourse(course._id!).subscribe({
          next: (response) => {
            this.loadingService.hide();
            if (response.success) {
              this.snackBar.open('Course deleted successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadCourses();
              this.courseService.refreshCourses(); // Refresh the courses list for other components
            }
          },
          error: (error) => {
            this.loadingService.hide();
            const errorMessage = error.error?.message || 'Error deleting course';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  toggleCourseStatus(course: Course): void {
    const action = course.isActive ? 'deactivate' : 'activate';
    
    this.confirmationService.confirm({
      title: 'Toggle Course Status',
      message: `Are you sure you want to ${action} the course "${course.name}"?`,
      type: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.loadingService.show();
        
        this.courseService.toggleCourseStatus(course._id!).subscribe({
          next: (response) => {
            this.loadingService.hide();
            
            if (response.success) {
              this.snackBar.open(`Course ${action}d successfully`, 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadCourses();
              this.courseService.refreshCourses();
            } else {
              this.snackBar.open(response.message || `Failed to ${action} course`, 'Close', {
                duration: 5000,
                panelClass: ['error-snackbar']
              });
            }
          },
          error: (error) => {
            this.loadingService.hide();
            console.error('Toggle error:', error);
            
            const errorMessage = error.error?.message || error.message || `Error ${action}ing course`;
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  getDepartmentName(department: any): string {
    if (typeof department === 'string') {
      // If department is just an ID, find the name from our departments array
      const dept = this.departments.find(d => d._id === department);
      return dept ? `${dept.name} (${dept.code})` : 'Unknown Department';
    } else if (department && department.name) {
      // If department is populated object
      return `${department.name} (${department.code})`;
    }
    return 'No Department';
  }
}
