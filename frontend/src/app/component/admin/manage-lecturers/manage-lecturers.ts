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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { AdminLayout } from '../admin-layout/admin-layout';
import { UserManagementService, User } from '../../../services/user-management.service';
import { UserDialogComponent, UserDialogData } from '../../../shared/user-dialog/user-dialog.component';
import { ConfirmationDialogComponent } from '../../../shared/confirmation-dialog/confirmation-dialog';
import { ConfirmationService } from '../../../services/confirmation.service';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith, switchMap, map, catchError } from 'rxjs/operators';

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
    MatDialogModule,
    AdminLayout
  ],
  templateUrl: './manage-lecturers.html',
  styleUrl: './manage-lecturers.css'
})
export class ManageLecturers implements OnInit, OnDestroy {
  displayedColumns: string[] = ['profilePicture', 'id', 'name', 'email', 'phone', 'department', 'createdAt', 'status', 'actions'];
  lecturers$: Observable<User[]>;
  searchControl = new FormControl('');
  isLoading$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserManagementService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private confirmationService: ConfirmationService
  ) {
    // Setup live search with better error handling
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
      catchError(error => {
        console.error('❌ [ManageLecturers] Error loading lecturers:', error);
        this.isLoading$.next(false);
        this.snackBar.open('Error loading lecturers. Please try again.', 'Close', {
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
    this.refreshLecturers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addLecturer(): void {
    const dialogData: UserDialogData = {
      mode: 'create',
      role: 'teacher'
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
              this.snackBar.open('Lecturer created successfully', 'Close', {
                duration: 3000
              });
              this.refreshLecturers();
            } else {
              this.snackBar.open('Failed to create lecturer', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error('Error creating lecturer:', error);
            this.snackBar.open('Error creating lecturer', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  editLecturer(lecturer: User): void {
    const dialogData: UserDialogData = {
      user: lecturer,
      mode: 'edit',
      role: 'teacher'
    };

    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '700px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const lecturerId = lecturer._id || lecturer.id;
        if (!lecturerId) {
          this.snackBar.open('Lecturer ID not found', 'Close', { duration: 3000 });
          return;
        }

        this.userService.updateUser(lecturerId, result).subscribe({
          next: (updatedUser) => {
            if (updatedUser) {
              this.snackBar.open('Lecturer updated successfully', 'Close', {
                duration: 3000
              });
              this.refreshLecturers();
            } else {
              this.snackBar.open('Failed to update lecturer', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error('Error updating lecturer:', error);
            this.snackBar.open('Error updating lecturer', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  viewLecturer(lecturer: User): void {
    const dialogData: UserDialogData = {
      user: lecturer,
      mode: 'view',
      role: 'teacher'
    };

    this.dialog.open(UserDialogComponent, {
      width: '700px',
      data: dialogData
    });
  }

  deleteLecturer(lecturer: User): void {
    const name = lecturer.fullName || `${lecturer.firstName} ${lecturer.lastName}`;
    const lecturerId = lecturer._id || lecturer.id;
    
    if (!lecturerId) {
      this.snackBar.open('Lecturer ID not found', 'Close', { duration: 3000 });
      return;
    }

    // Check dependencies before deletion
    this.confirmationService.confirmDeleteWithDependencyCheck(
      lecturerId,
      name,
      'lecturer'
    ).subscribe(result => {
      if (result) {
        this.userService.deleteUser(lecturerId, 'teacher').subscribe({
          next: (success) => {
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
          error: (error) => {
            console.error('Error deleting lecturer:', error);
            this.snackBar.open('Error deleting lecturer', 'Close', { duration: 3000 });
          }
        });
      }
    });
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

  getDepartmentName(lecturer: User): string {
    if (lecturer.department && typeof lecturer.department === 'object') {
      return (lecturer.department as { name: string }).name || 'N/A';
    }
    return 'N/A';
  }

  getFormattedDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  getAvatarLetter(lecturer: User): string {
    const name = lecturer.fullName || `${lecturer.firstName} ${lecturer.lastName}`;
    return name.charAt(0).toUpperCase();
  }

  approveLecturer(lecturer: User): void {
    const name = lecturer.fullName || `${lecturer.firstName} ${lecturer.lastName}`;
    const lecturerId = lecturer._id || lecturer.id;
    
    if (!lecturerId) {
      this.snackBar.open('Lecturer ID not found', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Approve Lecturer',
        message: `Are you sure you want to approve ${name}?`,
        confirmText: 'Approve',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.approveUser(lecturerId).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open(`${name} approved successfully`, 'Close', {
                duration: 3000
              });
              this.refreshLecturers();
            } else {
              this.snackBar.open('Failed to approve lecturer', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error('Error approving lecturer:', error);
            this.snackBar.open('Error approving lecturer', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  rejectLecturer(lecturer: User): void {
    const name = lecturer.fullName || `${lecturer.firstName} ${lecturer.lastName}`;
    const lecturerId = lecturer._id || lecturer.id;
    
    if (!lecturerId) {
      this.snackBar.open('Lecturer ID not found', 'Close', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Reject Lecturer',
        message: `Are you sure you want to reject ${name}? This action can be reversed later.`,
        confirmText: 'Reject',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.rejectUser(lecturerId).subscribe({
          next: (response) => {
            if (response.success) {
              this.snackBar.open(`${name} rejected successfully`, 'Close', {
                duration: 3000
              });
              this.refreshLecturers();
            } else {
              this.snackBar.open('Failed to reject lecturer', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error('Error rejecting lecturer:', error);
            this.snackBar.open('Error rejecting lecturer', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  private refreshLecturers(): void {
    // Force refresh by triggering the search control
    this.userService.refreshUsersByRole('teacher');
    const currentSearchTerm = this.searchControl.value || '';
    // Use updateValueAndValidity to trigger the search even with the same value
    this.searchControl.setValue('');
    setTimeout(() => {
      this.searchControl.setValue(currentSearchTerm);
    }, 100);
  }
}
