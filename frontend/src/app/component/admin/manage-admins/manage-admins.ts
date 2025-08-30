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
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, startWith, switchMap, map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-manage-admins',
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
  templateUrl: './manage-admins.html',
  styleUrl: './manage-admins.css'
})
export class ManageAdmins implements OnInit, OnDestroy {
  displayedColumns: string[] = ['id', 'name', 'email', 'permissions', 'status', 'actions'];
  admins$: Observable<User[]>;
  searchControl = new FormControl('');
  isLoading$ = new BehaviorSubject<boolean>(false);
  private destroy$ = new Subject<void>();

  constructor(
    private userService: UserManagementService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    console.log('🚀 [ManageAdmins] Component initializing');
    
    // Setup live search with better error handling
    this.admins$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        console.log(`🔍 [ManageAdmins] Search term: "${searchTerm}"`);
        this.isLoading$.next(true);
        
        if (searchTerm && searchTerm.trim()) {
          return this.userService.searchUsers(searchTerm.trim(), 'admin');
        } else {
          return this.userService.getUsersByRole('admin');
        }
      }),
      map(users => {
        console.log(`✅ [ManageAdmins] Received ${users.length} admins:`, users);
        this.isLoading$.next(false);
        return users;
      }),
      catchError(error => {
        console.error('❌ [ManageAdmins] Error loading admins:', error);
        this.isLoading$.next(false);
        this.snackBar.open('Error loading admins. Please try again.', 'Close', {
          duration: 5000
        });
        return of([]);
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit(): void {
    console.log('🎯 [ManageAdmins] Component initialized');
    // Initial load will be handled by the search control with empty string
    // Force an initial load
    this.refreshAdmins();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addAdmin(): void {
    const dialogData: UserDialogData = {
      mode: 'create',
      role: 'admin'
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
              this.snackBar.open('Admin created successfully', 'Close', {
                duration: 3000
              });
              this.refreshAdmins();
            } else {
              this.snackBar.open('Failed to create admin', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error('Error creating admin:', error);
            this.snackBar.open('Error creating admin', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  editAdmin(admin: User): void {
    const dialogData: UserDialogData = {
      user: admin,
      mode: 'edit',
      role: 'admin'
    };

    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '700px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const adminId = admin._id || admin.id;
        if (!adminId) {
          this.snackBar.open('Admin ID not found', 'Close', { duration: 3000 });
          return;
        }

        this.userService.updateUser(adminId, result).subscribe({
          next: (updatedUser) => {
            if (updatedUser) {
              this.snackBar.open('Admin updated successfully', 'Close', {
                duration: 3000
              });
              this.refreshAdmins();
            } else {
              this.snackBar.open('Failed to update admin', 'Close', { duration: 3000 });
            }
          },
          error: (error) => {
            console.error('Error updating admin:', error);
            this.snackBar.open('Error updating admin', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  viewAdmin(admin: User): void {
    const dialogData: UserDialogData = {
      user: admin,
      mode: 'view',
      role: 'admin'
    };

    this.dialog.open(UserDialogComponent, {
      width: '700px',
      data: dialogData
    });
  }

  deleteAdmin(admin: User): void {
    const name = admin.fullName || `${admin.firstName} ${admin.lastName}`;
    
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Admin',
        message: `Are you sure you want to delete ${name}? This action cannot be undone.`,
        confirmText: 'Delete',
        cancelText: 'Cancel'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const adminId = admin._id || admin.id;
        if (!adminId) {
          this.snackBar.open('Admin ID not found', 'Close', { duration: 3000 });
          return;
        }
        
        this.userService.deleteUser(adminId, 'admin').subscribe({
          next: (success) => {
            if (success) {
              this.snackBar.open(`${name} deleted successfully`, 'Close', {
                duration: 3000
              });
              this.refreshAdmins();
            } else {
              this.snackBar.open('Failed to delete admin', 'Close', {
                duration: 3000
              });
            }
          },
          error: (error) => {
            console.error('Error deleting admin:', error);
            this.snackBar.open('Error deleting admin', 'Close', { duration: 3000 });
          }
        });
      }
    });
  }

  exportAdmins(): void {
    this.admins$.pipe(takeUntil(this.destroy$)).subscribe(admins => {
      if (admins.length > 0) {
        this.userService.exportUsersToCSV(admins, 'admins.csv');
        this.snackBar.open('Admins data exported successfully', 'Close', {
          duration: 3000
        });
      } else {
        this.snackBar.open('No admin data to export', 'Close', {
          duration: 3000
        });
      }
    });
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getAdminId(admin: User): string {
    return admin._id || admin.id || 'N/A';
  }

  getAdminName(admin: User): string {
    return admin.fullName || `${admin.firstName} ${admin.lastName}`;
  }

  getAdminStatus(admin: User): string {
    return admin.status || (admin.isActive ? 'Active' : 'Inactive');
  }

  getAdminPermissions(admin: User): string {
    return admin.permissions?.join(', ') || 'Standard Admin';
  }

  private refreshAdmins(): void {
    console.log('🔄 [ManageAdmins] Refreshing admins list');
    // Force refresh by triggering the search control
    this.userService.refreshUsersByRole('admin');
    const currentSearchTerm = this.searchControl.value || '';
    // Use updateValueAndValidity to trigger the search even with the same value
    this.searchControl.setValue('');
    setTimeout(() => {
      this.searchControl.setValue(currentSearchTerm);
    }, 100);
  }
}
