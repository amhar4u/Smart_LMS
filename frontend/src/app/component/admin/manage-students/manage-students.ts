import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminLayout } from '../admin-layout/admin-layout';
import { UserManagementService, User } from '../../../services/user-management.service';
import { UserDialogComponent, UserDialogData } from '../../../shared/user-dialog/user-dialog.component';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith, switchMap, map, catchError } from 'rxjs/operators';

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
  displayedColumns: string[] = ['id', 'name', 'email', 'course', 'department', 'batch', 'status', 'createdAt', 'actions'];
  students$: Observable<User[]>;
  searchControl = new FormControl('');
  isLoading$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserManagementService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Setup live search with better error handling
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
      catchError(error => {
        console.error('❌ [ManageStudents] Error loading students:', error);
        this.isLoading$.next(false);
        this.snackBar.open('Error loading students. Please try again.', 'Close', {
          duration: 5000
        });
        return of([]);
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    // Initial load will be handled by the search control with empty string
    // Force an initial load
    this.refreshStudents();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addStudent(): void {
    const dialogData: UserDialogData = {
      mode: 'create',
      role: 'student'
    };

    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '700px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.createUser(result).subscribe({
          next: (newUser) => {
            if (newUser) {
              this.snackBar.open('Student created successfully', 'Close', {
                duration: 3000
              });
              this.refreshStudents();
            } else {
              this.snackBar.open('Failed to create student', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error('Error creating student:', error);
            this.snackBar.open('Error creating student', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  editStudent(student: User): void {
    const dialogData: UserDialogData = {
      user: student,
      mode: 'edit',
      role: 'student'
    };

    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '700px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const studentId = student._id || student.id;
        if (!studentId) {
          this.snackBar.open('Student ID not found', 'Close', { duration: 3000 });
          return;
        }

        this.userService.updateUser(studentId, result).subscribe({
          next: (updatedUser) => {
            if (updatedUser) {
              this.snackBar.open('Student updated successfully', 'Close', {
                duration: 3000
              });
              this.refreshStudents();
            } else {
              this.snackBar.open('Failed to update student', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error('Error updating student:', error);
            this.snackBar.open('Error updating student', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  viewStudent(student: User): void {
    const dialogData: UserDialogData = {
      user: student,
      mode: 'view',
      role: 'student'
    };

    this.dialog.open(UserDialogComponent, {
      width: '700px',
      data: dialogData
    });
  }

  deleteStudent(student: User): void {
    const name = student.fullName || `${student.firstName} ${student.lastName}`;
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Student',
        message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const studentId = student._id || student.id;
        if (!studentId) {
          this.snackBar.open('Student ID not found', 'Close', { duration: 3000 });
          return;
        }
        
        this.userService.deleteUser(studentId, 'student').subscribe({
          next: (success) => {
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
          error: (error) => {
            console.error('Error deleting student:', error);
            this.snackBar.open('Error deleting student', 'Close', { duration: 3000 });
          }
        });
      }
    });
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

  getDepartmentName(student: User): string {
    if (typeof student.department === 'object' && student.department) {
      return `${student.department.name} (${student.department.code})`;
    }
    return student.department || 'N/A';
  }

  getBatchName(student: User): string {
    if (typeof student.batch === 'object' && student.batch) {
      return `${student.batch.name} (${student.batch.code})`;
    }
    return student.batch || 'N/A';
  }

  getCourseName(student: User): string {
    if (typeof student.course === 'object' && student.course) {
      return `${student.course.name} (${student.course.code})`;
    }
    return student.course || 'N/A';
  }

  private refreshStudents(): void {
    // Force refresh by triggering the search control
    this.userService.refreshUsersByRole('student');
    const currentSearchTerm = this.searchControl.value || '';
    // Use updateValueAndValidity to trigger the search even with the same value
    this.searchControl.setValue('');
    setTimeout(() => {
      this.searchControl.setValue(currentSearchTerm);
    }, 100);
  }
}
