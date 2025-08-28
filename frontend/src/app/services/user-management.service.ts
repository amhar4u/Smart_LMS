import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
// Using fixed API URL since environment is not available
// import { environment } from '../../environments/environment';

export interface User {
  _id?: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'student' | 'teacher';
  status?: 'Active' | 'Inactive' | 'Pending' | 'On Leave';
  isActive?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  
  // Student specific fields
  studentId?: string;
  course?: string;
  semester?: string;
  enrollmentDate?: Date;
  
  // Teacher specific fields
  teacherId?: string;
  employeeId?: string;
  department?: string;
  qualification?: string;
  experience?: number;
  specialization?: string[];
  
  // Admin specific fields
  permissions?: string[];
  
  // Display fields (computed)
  fullName?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface UsersResponse {
  users: User[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly baseUrl = 'http://localhost:5000/api';
  
  // Cache for users by role
  private usersCache = new Map<string, BehaviorSubject<User[]>>();
  
  constructor(private http: HttpClient) {
    // Initialize cache for each role
    this.usersCache.set('admin', new BehaviorSubject<User[]>([]));
    this.usersCache.set('student', new BehaviorSubject<User[]>([]));
    this.usersCache.set('teacher', new BehaviorSubject<User[]>([]));
    
    // Load initial data for all roles
    this.loadUsersByRole('admin');
    this.loadUsersByRole('student');
    this.loadUsersByRole('teacher');
  }

  // Get users by role from cache (observable)
  getUsersByRole(role: 'admin' | 'student' | 'teacher'): Observable<User[]> {
    const cache = this.usersCache.get(role);
    if (!cache) {
      this.loadUsersByRole(role);
      return this.usersCache.get(role)?.asObservable() || of([]);
    }
    return cache.asObservable();
  }

  // Load users by role from backend
  private loadUsersByRole(role: 'admin' | 'student' | 'teacher'): void {
    this.fetchUsersByRole(role).subscribe({
      next: (users) => {
        const cache = this.usersCache.get(role);
        if (cache) {
          cache.next(users);
        }
      },
      error: (error) => {
        console.error(`Failed to load ${role} users:`, error);
        // Set empty array on error
        const cache = this.usersCache.get(role);
        if (cache) {
          cache.next([]);
        }
      }
    });
  }

  // Fetch users by role from backend
  private fetchUsersByRole(role: 'admin' | 'student' | 'teacher'): Observable<User[]> {
    return this.http.get<ApiResponse<UsersResponse>>(`${this.baseUrl}/users/by-role/${role}`)
      .pipe(
        map(response => {
          if (response.success && response.data.users) {
            return response.data.users.map(user => this.transformUser(user));
          }
          return [];
        }),
        catchError(error => {
          console.error('Error fetching users by role:', error);
          return of([]);
        })
      );
  }

  // Get all users with optional filtering
  getAllUsers(options?: {
    role?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Observable<UsersResponse> {
    let params = new HttpParams();
    
    if (options) {
      if (options.role) params = params.set('role', options.role);
      if (options.search) params = params.set('search', options.search);
      if (options.page) params = params.set('page', options.page.toString());
      if (options.limit) params = params.set('limit', options.limit.toString());
    }

    return this.http.get<ApiResponse<UsersResponse>>(`${this.baseUrl}/users/all`, { params })
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return {
              ...response.data,
              users: response.data.users.map(user => this.transformUser(user))
            };
          }
          return { users: [], total: 0 };
        }),
        catchError(error => {
          console.error('Error fetching all users:', error);
          return of({ users: [], total: 0 });
        })
      );
  }

  // Search users by term and role
  searchUsers(searchTerm: string, role?: 'admin' | 'student' | 'teacher'): Observable<User[]> {
    return this.getAllUsers({ search: searchTerm, role })
      .pipe(map(response => response.users));
  }

  // Refresh users for a specific role
  refreshUsersByRole(role: 'admin' | 'student' | 'teacher'): void {
    this.loadUsersByRole(role);
  }

  // Refresh all users
  refreshAllUsers(): void {
    this.loadUsersByRole('admin');
    this.loadUsersByRole('student');
    this.loadUsersByRole('teacher');
  }

  // Transform user data for display
  private transformUser(user: any): User {
    return {
      ...user,
      id: user._id || user.id,
      fullName: `${user.firstName} ${user.lastName}`,
      status: user.isActive ? 'Active' : 'Inactive',
      createdAt: new Date(user.createdAt),
      updatedAt: user.updatedAt ? new Date(user.updatedAt) : undefined
    };
  }

  // Update user
  updateUser(userId: string, updates: Partial<User>): Observable<User | null> {
    return this.http.put<ApiResponse<{ user: User }>>(`${this.baseUrl}/users/profile`, updates)
      .pipe(
        map(response => {
          if (response.success && response.data.user) {
            const updatedUser = this.transformUser(response.data.user);
            // Update cache
            this.refreshUsersByRole(updatedUser.role);
            return updatedUser;
          }
          return null;
        }),
        catchError(error => {
          console.error('Error updating user:', error);
          return of(null);
        })
      );
  }

  // Delete user (if needed)
  deleteUser(userId: string, userRole: 'admin' | 'student' | 'teacher'): Observable<boolean> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/users/${userId}`)
      .pipe(
        map(response => {
          if (response.success) {
            // Refresh the cache for this role
            this.refreshUsersByRole(userRole);
            return true;
          }
          return false;
        }),
        catchError(error => {
          console.error('Error deleting user:', error);
          return of(false);
        })
      );
  }

  // Get user counts for dashboard
  getUserCounts(): Observable<{ admin: number; student: number; teacher: number }> {
    const counts = { admin: 0, student: 0, teacher: 0 };
    
    return new Observable(observer => {
      let completed = 0;
      
      ['admin', 'student', 'teacher'].forEach(role => {
        this.getUsersByRole(role as any).subscribe(users => {
          counts[role as keyof typeof counts] = users.length;
          completed++;
          
          if (completed === 3) {
            observer.next(counts);
            observer.complete();
          }
        });
      });
    });
  }

  // Export users to CSV
  exportUsersToCSV(users: User[], filename: string = 'users.csv'): void {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Phone', 'Created At'];
    const csvContent = [
      headers.join(','),
      ...users.map(user => [
        `"${user.fullName || `${user.firstName} ${user.lastName}`}"`,
        `"${user.email}"`,
        `"${user.role}"`,
        `"${user.status || (user.isActive ? 'Active' : 'Inactive')}"`,
        `"${user.phone || ''}"`,
        `"${user.createdAt.toLocaleDateString()}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // User approval methods
  approveUser(userId: string): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/${userId}/approve`, {}).pipe(
      tap(() => this.refreshUsers()),
      catchError((error) => {
        console.error('Error approving user:', error);
        return of({ success: false, data: {} as User, message: 'Failed to approve user' });
      })
    );
  }

  rejectUser(userId: string): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.baseUrl}/users/${userId}/reject`, {}).pipe(
      tap(() => this.refreshUsers()),
      catchError((error) => {
        console.error('Error rejecting user:', error);
        return of({ success: false, data: {} as User, message: 'Failed to reject user' });
      })
    );
  }

  getPendingUsers(role?: 'student' | 'teacher'): Observable<UsersResponse> {
    let params = new HttpParams();
    if (role) {
      params = params.set('role', role);
    }
    
    return this.http.get<ApiResponse<UsersResponse>>(`${this.baseUrl}/users/pending`, { params }).pipe(
      map(response => response.success ? response.data : { users: [] }),
      catchError((error) => {
        console.error('Error getting pending users:', error);
        return of({ users: [] });
      })
    );
  }

  private refreshUsers(): void {
    // Trigger a refresh of the current users list
    this.getAllUsers().subscribe();
  }
}
