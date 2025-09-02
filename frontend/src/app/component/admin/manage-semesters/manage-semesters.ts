import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
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
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatBadgeModule } from '@angular/material/badge';
import { MatSelectModule } from '@angular/material/select';

import { SemesterService, Semester } from '../../../services/semester.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { LoadingService } from '../../../services/loading.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { SemesterDialogComponent } from './semester-dialog.component';
import { AdminLayout } from '../admin-layout/admin-layout';

@Component({
  selector: 'app-manage-semesters',
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
    MatChipsModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatBadgeModule,
    MatSelectModule,
    LoadingSpinnerComponent,
    AdminLayout
  ],
  templateUrl: './manage-semesters.html',
  styleUrl: './manage-semesters.css'
})
export class ManageSemesters implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['code', 'name', 'year', 'type', 'duration', 'status', 'current', 'actions'];
  dataSource = new MatTableDataSource<Semester>();
  
  // Search and filter
  searchTerm = '';
  selectedYear = '';
  availableYears: number[] = [];
  
  constructor(
    private semesterService: SemesterService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.generateAvailableYears();
  }

  ngOnInit(): void {
    this.loadSemesters();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  generateAvailableYears(): void {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear - 2; year <= currentYear + 3; year++) {
      this.availableYears.push(year);
    }
  }

  loadSemesters(): void {
    this.loadingService.show();
    
    this.semesterService.getSemesters().subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.dataSource.data = response.data;
          this.applyFilters();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Error loading semesters:', error);
        this.snackBar.open('Error loading semesters', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilters(): void {
    this.dataSource.filterPredicate = (data: Semester, filter: string) => {
      const searchString = filter.toLowerCase();
      const matchesSearch = !this.searchTerm || 
        data.name.toLowerCase().includes(searchString) ||
        data.code.toLowerCase().includes(searchString) ||
        data.type.toLowerCase().includes(searchString);
      
      const matchesYear = !this.selectedYear || data.year.toString() === this.selectedYear;
      
      return matchesSearch && matchesYear;
    };
    
    this.dataSource.filter = this.searchTerm.toLowerCase();
  }

  onSearch(): void {
    this.applyFilters();
  }

  onYearFilter(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedYear = '';
    this.dataSource.filter = '';
    this.applyFilters();
  }

  showAddForm(): void {
    const dialogRef = this.dialog.open(SemesterDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {},
      panelClass: 'semester-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createSemester(result);
      }
    });
  }

  editSemester(semester: Semester): void {
    const dialogRef = this.dialog.open(SemesterDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        semester: semester
      },
      panelClass: 'semester-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateSemester(semester._id!, result);
      }
    });
  }

  createSemester(semesterData: any): void {
    this.loadingService.show();
    
    const payload = {
      ...semesterData,
      code: semesterData.code.toUpperCase()
    };
    
    this.semesterService.createSemester(payload).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.snackBar.open('Semester created successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadSemesters();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error.error?.message || 'Error creating semester';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  updateSemester(id: string, semesterData: any): void {
    this.loadingService.show();
    
    const payload = {
      ...semesterData,
      code: semesterData.code.toUpperCase()
    };
    
    this.semesterService.updateSemester(id, payload).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.snackBar.open('Semester updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadSemesters();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error.error?.message || 'Error updating semester';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteSemester(semester: Semester): void {
    this.confirmationService.confirm({
      title: 'Delete Semester',
      message: `Are you sure you want to delete the semester "${semester.name} ${semester.year}"? This action cannot be undone and will affect all related enrollments.`,
      type: 'delete'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.loadingService.show();
        
        this.semesterService.deleteSemester(semester._id!).subscribe({
          next: (response) => {
            this.loadingService.hide();
            if (response.success) {
              this.snackBar.open('Semester deleted successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadSemesters();
            }
          },
          error: (error) => {
            this.loadingService.hide();
            const errorMessage = error.error?.message || 'Error deleting semester';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  setCurrentSemester(semester: Semester): void {
    this.confirmationService.confirm({
      title: 'Set Current Semester',
      message: `Are you sure you want to set "${semester.name} ${semester.year}" as the current semester? This will affect all system operations.`,
      type: 'warning'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.loadingService.show();
        
        this.semesterService.setCurrentSemester(semester._id!).subscribe({
          next: (response) => {
            this.loadingService.hide();
            if (response.success) {
              this.snackBar.open('Current semester updated successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadSemesters();
            }
          },
          error: (error) => {
            this.loadingService.hide();
            const errorMessage = error.error?.message || 'Error setting current semester';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  getSemesterTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      'fall': 'Fall',
      'spring': 'Spring',
      'summer': 'Summer'
    };
    return typeLabels[type] || type;
  }

  getDurationText(semester: Semester): string {
    if (!semester.startDate || !semester.endDate) return 'No dates';
    
    const start = new Date(semester.startDate);
    const end = new Date(semester.endDate);
    
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return `${startStr} - ${endStr}`;
  }
}
