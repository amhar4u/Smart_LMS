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
    CourseDialogComponent,
    AdminLayout
  ],
  templateUrl: './manage-courses.component.html',
  styleUrls: ['./manage-courses.component.css']
})
export class ManageCoursesComponent implements OnInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['code', 'name', 'category', 'description', 'isActive', 'createdAt', 'actions'];
  dataSource = new MatTableDataSource<Course>();
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Filters
  searchTerm = '';
  selectedCategory = '';
  categories: string[] = [];

  constructor(
    private courseService: CourseService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.categories = this.courseService.getCourseCategories();
    this.loadCourses();
  }

  loadCourses(): void {
    this.loadingService.show();
    
    this.courseService.getCoursesForAdmin(
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      this.selectedCategory
    ).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.dataSource.data = response.data.courses;
          this.totalItems = response.data.pagination.totalItems;
          this.totalPages = response.data.pagination.totalPages;
        }
      },
      error: (error) => {
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

  onCategoryFilter(): void {
    this.currentPage = 1;
    this.loadCourses();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.currentPage = 1;
    this.loadCourses();
  }

  showAddForm(): void {
    const dialogRef = this.dialog.open(CourseDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        categories: this.categories
      },
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
        course: course,
        categories: this.categories
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
        }
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error.error?.message || 'Error updating course';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteCourse(course: Course): void {
    this.confirmationService.confirm({
      title: 'Delete Course',
      message: `Are you sure you want to delete the course "${course.name}"? This action cannot be undone.`,
      type: 'delete'
    }).subscribe(confirmed => {
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
              this.courseService.refreshCourses(); // Refresh the courses list for other components
            }
          },
          error: (error) => {
            this.loadingService.hide();
            const errorMessage = error.error?.message || `Error ${action}ing course`;
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  getCategoryColor(category: string): string {
    const colors: { [key: string]: string } = {
      'Technology': 'primary',
      'Business': 'accent',
      'Science': 'warn',
      'Engineering': 'primary',
      'Arts': 'accent',
      'Medicine': 'warn',
      'Other': ''
    };
    return colors[category] || '';
  }
}
