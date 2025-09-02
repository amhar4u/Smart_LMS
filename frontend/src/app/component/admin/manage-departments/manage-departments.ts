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

import { DepartmentService, Department } from '../../../services/department.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { LoadingService } from '../../../services/loading.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { DepartmentDialogComponent } from './department-dialog.component';
import { AdminLayout } from '../admin-layout/admin-layout';

@Component({
  selector: 'app-manage-departments',
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
    LoadingSpinnerComponent,
    AdminLayout
  ],
  templateUrl: './manage-departments.html',
  styleUrl: './manage-departments.css'
})
export class ManageDepartments implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  displayedColumns: string[] = ['code', 'name', 'description', 'establishedYear', 'contactInfo', 'isActive', 'actions'];
  dataSource = new MatTableDataSource<Department>();
  
  // Search and filter
  searchTerm = '';
  
  constructor(
    private departmentService: DepartmentService,
    private confirmationService: ConfirmationService,
    private loadingService: LoadingService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loadDepartments();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadDepartments(): void {
    this.loadingService.show();
    
    this.departmentService.getDepartments().subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.dataSource.data = response.data;
        }
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Error loading departments:', error);
        this.snackBar.open('Error loading departments', 'Close', {
          duration: 3000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  applyFilter(): void {
    this.dataSource.filter = this.searchTerm.trim().toLowerCase();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.dataSource.filter = '';
  }

  showAddForm(): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {},
      panelClass: 'department-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createDepartment(result);
      }
    });
  }

  editDepartment(department: Department): void {
    const dialogRef = this.dialog.open(DepartmentDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: {
        department: department
      },
      panelClass: 'department-dialog-panel'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateDepartment(department._id, result);
      }
    });
  }

  createDepartment(departmentData: any): void {
    this.loadingService.show();
    
    // Transform form data to match API expectations
    const payload = {
      name: departmentData.name,
      code: departmentData.code.toUpperCase(),
      description: departmentData.description,
      establishedYear: departmentData.establishedYear,
      contactInfo: {
        email: departmentData.email,
        phone: departmentData.phone,
        office: departmentData.office
      },
      isActive: departmentData.isActive
    };
    
    this.departmentService.createDepartment(payload).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.snackBar.open('Department created successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadDepartments();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error.error?.message || 'Error creating department';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  updateDepartment(id: string, departmentData: any): void {
    this.loadingService.show();
    
    // Transform form data to match API expectations
    const payload = {
      name: departmentData.name,
      code: departmentData.code.toUpperCase(),
      description: departmentData.description,
      establishedYear: departmentData.establishedYear,
      contactInfo: {
        email: departmentData.email,
        phone: departmentData.phone,
        office: departmentData.office
      },
      isActive: departmentData.isActive
    };
    
    this.departmentService.updateDepartment(id, payload).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.snackBar.open('Department updated successfully', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.loadDepartments();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        const errorMessage = error.error?.message || 'Error updating department';
        this.snackBar.open(errorMessage, 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  deleteDepartment(department: Department): void {
    this.confirmationService.confirm({
      title: 'Delete Department',
      message: `Are you sure you want to delete the department "${department.name}"? This action cannot be undone and will affect all related courses and users.`,
      type: 'delete'
    }).subscribe(confirmed => {
      if (confirmed) {
        this.loadingService.show();
        
        this.departmentService.deleteDepartment(department._id).subscribe({
          next: (response) => {
            this.loadingService.hide();
            if (response.success) {
              this.snackBar.open('Department deleted successfully', 'Close', {
                duration: 3000,
                panelClass: ['success-snackbar']
              });
              this.loadDepartments();
            }
          },
          error: (error) => {
            this.loadingService.hide();
            const errorMessage = error.error?.message || 'Error deleting department';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        });
      }
    });
  }

  getContactInfo(department: Department): string {
    const contact = department.contactInfo;
    if (!contact) return 'No contact info';
    
    const parts = [];
    if (contact.email) parts.push(contact.email);
    if (contact.phone) parts.push(contact.phone);
    if (contact.office) parts.push(contact.office);
    
    return parts.length > 0 ? parts.join(' | ') : 'No contact info';
  }
}
