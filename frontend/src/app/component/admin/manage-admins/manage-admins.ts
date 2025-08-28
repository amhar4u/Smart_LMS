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
    private snackBar: MatSnackBar
  ) {
    // Setup live search
    this.admins$ = this.searchControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(searchTerm => {
        this.isLoading$.next(true);
        if (searchTerm && searchTerm.trim()) {
          return this.userService.searchUsers(searchTerm.trim(), 'admin');
        } else {
          return this.userService.getUsersByRole('admin');
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

  addAdmin(): void {
    this.snackBar.open('Add Admin functionality will be implemented', 'Close', {
      duration: 3000
    });
  }

  editAdmin(admin: User): void {
    if (confirm(`Are you sure you want to update ${admin.fullName || `${admin.firstName} ${admin.lastName}`}?`)) {
      const updates: Partial<User> = {
        isActive: !admin.isActive
      };
      
      const adminId = admin._id || admin.id;
      if (!adminId) {
        this.snackBar.open('Admin ID not found', 'Close', { duration: 3000 });
        return;
      }
      
      this.userService.updateUser(adminId, updates).subscribe({
        next: (updatedUser: User | null) => {
          if (updatedUser) {
            this.snackBar.open(`${admin.fullName || `${admin.firstName} ${admin.lastName}`} updated successfully`, 'Close', {
              duration: 3000
            });
            this.refreshAdmins();
          } else {
            this.snackBar.open('Failed to update admin', 'Close', { duration: 3000 });
          }
        },
        error: (error: any) => {
          console.error('Error updating admin:', error);
          this.snackBar.open('Error updating admin', 'Close', { duration: 3000 });
        }
      });
    }
  }

  viewAdmin(admin: User): void {
    const name = admin.fullName || `${admin.firstName} ${admin.lastName}`;
    this.snackBar.open(`Viewing ${name} - Full view dialog will be implemented`, 'Close', {
      duration: 3000
    });
  }

  deleteAdmin(admin: User): void {
    const name = admin.fullName || `${admin.firstName} ${admin.lastName}`;
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      const adminId = admin._id || admin.id;
      if (!adminId) {
        this.snackBar.open('Admin ID not found', 'Close', { duration: 3000 });
        return;
      }
      
      this.userService.deleteUser(adminId, 'admin').subscribe({
        next: (success: boolean) => {
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
        error: (error: any) => {
          console.error('Error deleting admin:', error);
          this.snackBar.open('Error deleting admin', 'Close', { duration: 3000 });
        }
      });
    }
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
    this.userService.refreshUsersByRole('admin');
    const currentSearchTerm = this.searchControl.value || '';
    this.searchControl.setValue(currentSearchTerm);
  }
}
