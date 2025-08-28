import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminLayout } from '../admin-layout/admin-layout';
import { UserManagementService, User } from '../../../services/user-management.service';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith, switchMap, map } from 'rxjs/operators';

@Component({
  selector: 'app-manage-students',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    AdminLayout
  ],
  templateUrl: './manage-students.html',
  styleUrl: './manage-students.css'
})
export class ManageStudents implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'email', 'course', 'status', 'createdAt', 'actions'];
  students$: Observable<User[]>;
  searchControl = new FormControl('');
  isLoading$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserManagementService,
    private snackBar: MatSnackBar
  ) {
    // Setup live search
    this.students$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        this.isLoading$.next(true);
        if (searchTerm && searchTerm.trim()) {
          return this.userService.searchUsers(searchTerm.trim(), 'student');
        } else {
          return this.userService.getUsersByRole('student');
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
    // Initial load - this will be handled by the search control with empty string
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addStudent(): void {
    // Implement add student dialog
    this.snackBar.open('Add Student functionality will be implemented', 'Close', {
      duration: 3000
    });
  }

  editStudent(student: User): void {
    if (confirm(`Are you sure you want to update ${student.fullName || `${student.firstName} ${student.lastName}`}?`)) {
      // Example update - toggle status
      const updates: Partial<User> = {
        isActive: !student.isActive
      };
      
      const studentId = student._id || student.id;
      if (!studentId) {
        this.snackBar.open('Student ID not found', 'Close', { duration: 3000 });
        return;
      }
      
      this.userService.updateUser(studentId, updates).subscribe({
        next: (updatedUser: User | null) => {
          if (updatedUser) {
            this.snackBar.open(`${student.fullName || `${student.firstName} ${student.lastName}`} updated successfully`, 'Close', {
              duration: 3000
            });
            // Refresh the students list
            this.refreshStudents();
          } else {
            this.snackBar.open('Failed to update student', 'Close', { duration: 3000 });
          }
        },
        error: (error: any) => {
          console.error('Error updating student:', error);
          this.snackBar.open('Error updating student', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewStudent(student: User): void {
    const name = student.fullName || `${student.firstName} ${student.lastName}`;
    this.snackBar.open(`Viewing ${name} - Full view dialog will be implemented`, 'Close', {
      duration: 3000
    });
  }

  deleteStudent(student: User): void {
    const name = student.fullName || `${student.firstName} ${student.lastName}`;
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      const studentId = student._id || student.id;
      if (!studentId) {
        this.snackBar.open('Student ID not found', 'Close', { duration: 3000 });
        return;
      }
      
      this.userService.deleteUser(studentId, 'student').subscribe({
        next: (success: boolean) => {
          if (success) {
            this.snackBar.open(`${name} deleted successfully`, 'Close', {
              duration: 3000
            });
            this.refreshStudents();
          } else {
            this.snackBar.open('Failed to delete student', 'Close', {
              duration: 3000
            });
          }
        },
        error: (error: any) => {
          console.error('Error deleting student:', error);
          this.snackBar.open('Error deleting student', 'Close', { duration: 3000 });
        }
      });
    }
  }

  exportStudents(): void {
    this.students$.pipe(takeUntil(this.destroy$)).subscribe(students => {
      if (students.length > 0) {
        this.userService.exportUsersToCSV(students, 'students.csv');
        this.snackBar.open('Students data exported successfully', 'Close', {
          duration: 3000
        });
      } else {
        this.snackBar.open('No student data to export', 'Close', {
          duration: 3000
        });
      }
    });
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getStudentId(student: User): string {
    return student.studentId || student._id || student.id || 'N/A';
  }

  getStudentName(student: User): string {
    return student.fullName || `${student.firstName} ${student.lastName}`;
  }

  getStudentStatus(student: User): string {
    return student.status || (student.isActive ? 'Active' : 'Inactive');
  }

  private refreshStudents(): void {
    // Force refresh by triggering the search control
    this.userService.refreshUsersByRole('student');
    const currentSearchTerm = this.searchControl.value || '';
    this.searchControl.setValue(currentSearchTerm);
  }
}
