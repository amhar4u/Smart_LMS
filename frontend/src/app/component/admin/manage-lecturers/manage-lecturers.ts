import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminLayout } from '../admin-layout/admin-layout';
import { UserManagementService, User } from '../../../services/user-management.service';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith, switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-manage-lecturers',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    AdminLayout
  ],
  templateUrl: './manage-lecturers.html',
  styleUrl: './manage-lecturers.css'
})
export class ManageLecturers implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'email', 'department', 'qualification', 'status', 'actions'];
  lecturers$: Observable<User[]>;
  searchControl = new FormControl('');
  isLoading$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserManagementService,
    private snackBar: MatSnackBar
  ) {
    // Setup live search
    this.lecturers$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        this.isLoading$.next(true);
        if (searchTerm && searchTerm.trim()) {
          return this.userService.searchUsers(searchTerm.trim(), 'teacher');
        } else {
          return this.userService.getUsersByRole('teacher');
        }
      }),
      map(users => {
        this.isLoading$.next(false);
        return users;
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    // Initial load handled by search control
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addLecturer(): void {
    this.snackBar.open('Add Lecturer functionality will be implemented', 'Close', {
      duration: 3000
    });
  }

  editLecturer(lecturer: User): void {
    if (confirm(`Are you sure you want to update ${lecturer.fullName || `${lecturer.firstName} ${lecturer.lastName}`}?`)) {
      const updates: Partial<User> = {
        isActive: !lecturer.isActive
      };
      
      const lecturerId = lecturer._id || lecturer.id;
      if (!lecturerId) {
        this.snackBar.open('Lecturer ID not found', 'Close', { duration: 3000 });
        return;
      }
      
      this.userService.updateUser(lecturerId, updates).subscribe({
        next: (updatedUser: User | null) => {
          if (updatedUser) {
            this.snackBar.open(`${lecturer.fullName || `${lecturer.firstName} ${lecturer.lastName}`} updated successfully`, 'Close', {
              duration: 3000
            });
            this.refreshLecturers();
          } else {
            this.snackBar.open('Failed to update lecturer', 'Close', { duration: 3000 });
          }
        },
        error: (error: any) => {
          console.error('Error updating lecturer:', error);
          this.snackBar.open('Error updating lecturer', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewLecturer(lecturer: User): void {
    const name = lecturer.fullName || `${lecturer.firstName} ${lecturer.lastName}`;
    this.snackBar.open(`Viewing ${name} - Full view dialog will be implemented`, 'Close', {
      duration: 3000
    });
  }

  deleteLecturer(lecturer: User): void {
    const name = lecturer.fullName || `${lecturer.firstName} ${lecturer.lastName}`;
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      const lecturerId = lecturer._id || lecturer.id;
      if (!lecturerId) {
        this.snackBar.open('Lecturer ID not found', 'Close', { duration: 3000 });
        return;
      }
      
      this.userService.deleteUser(lecturerId, 'teacher').subscribe({
        next: (success: boolean) => {
          if (success) {
            this.snackBar.open(`${name} deleted successfully`, 'Close', {
              duration: 3000
            });
            this.refreshLecturers();
          } else {
            this.snackBar.open('Failed to delete lecturer', 'Close', {
              duration: 3000
            });
          }
        },
        error: (error: any) => {
          console.error('Error deleting lecturer:', error);
          this.snackBar.open('Error deleting lecturer', 'Close', { duration: 3000 });
        }
      });
    }
  }

  exportLecturers(): void {
    this.lecturers$.pipe(takeUntil(this.destroy$)).subscribe(lecturers => {
      if (lecturers.length > 0) {
        this.userService.exportUsersToCSV(lecturers, 'lecturers.csv');
        this.snackBar.open('Lecturers data exported successfully', 'Close', {
          duration: 3000
        });
      } else {
        this.snackBar.open('No lecturer data to export', 'Close', {
          duration: 3000
        });
      }
    });
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getLecturerId(lecturer: User): string {
    return lecturer.teacherId || lecturer.employeeId || lecturer._id || lecturer.id || 'N/A';
  }

  getLecturerName(lecturer: User): string {
    return lecturer.fullName || `${lecturer.firstName} ${lecturer.lastName}`;
  }

  getLecturerStatus(lecturer: User): string {
    return lecturer.status || (lecturer.isActive ? 'Active' : 'Inactive');
  }

  private refreshLecturers(): void {
    this.userService.refreshUsersByRole('teacher');
    const currentSearchTerm = this.searchControl.value || '';
    this.searchControl.setValue(currentSearchTerm);
  }
}
