import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { User, UserRole, LoginRequest, AuthResponse, StudentRegistration, TeacherRegistration } from '../models/user.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:5000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Check if user is logged in on service initialization
    const savedUser = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    
    // Only restore user if both user data and token exist
    if (savedUser && token) {
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Error parsing saved user data:', error);
        this.clearAuthData();
      }
    } else {
      // Clear any partial auth data
      this.clearAuthData();
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/auth/login`, {
      email: credentials.email,
      password: credentials.password
    }).pipe(
      map(response => {
        if (response.success && response.data) {
          // Store user data and token
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
          localStorage.setItem('token', response.data.token);
          this.currentUserSubject.next(response.data.user);
          return response.data;
        } else {
          throw new Error(response.message || 'Login failed');
        }
      }),
      catchError((error: HttpErrorResponse) => {
        // For login, we want to preserve the original HTTP error structure
        // so the login component can handle pending/rejected status properly
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  registerStudent(registration: StudentRegistration): Observable<AuthResponse> {
    const payload = {
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      password: registration.password,
      phone: registration.phone,
      studentId: registration.studentId || '',
      course: registration.course || '',
      semester: registration.semester || ''
    };

    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/auth/register/student`, payload).pipe(
      map(response => {
        if (response.success && response.data) {
          // Store user data and token
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
          localStorage.setItem('token', response.data.token);
          this.currentUserSubject.next(response.data.user);
          return response.data;
        } else {
          throw new Error(response.message || 'Registration failed');
        }
      }),
      catchError(this.handleError<AuthResponse>('registerStudent'))
    );
  }

  registerTeacher(registration: TeacherRegistration): Observable<AuthResponse> {
    const payload = {
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      password: registration.password,
      phone: registration.phone,
      employeeId: registration.employeeId || '',
      department: registration.department
    };

    return this.http.post<ApiResponse<AuthResponse>>(`${this.API_URL}/auth/register/teacher`, payload).pipe(
      map(response => {
        if (response.success && response.data) {
          // Store user data and token
          localStorage.setItem('currentUser', JSON.stringify(response.data.user));
          localStorage.setItem('token', response.data.token);
          this.currentUserSubject.next(response.data.user);
          return response.data;
        } else {
          throw new Error(response.message || 'Registration failed');
        }
      }),
      catchError(this.handleError<AuthResponse>('registerTeacher'))
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('pendingUser');
    this.currentUserSubject.next(null);
  }

  checkPendingUserStatus(): Observable<ApiResponse<{ user: User; token?: string }>> {
    const token = localStorage.getItem('token');
    const pendingUser = JSON.parse(localStorage.getItem('pendingUser') || '{}');
    
    if (!token && !pendingUser.email) {
      return throwError(() => new Error('No token or pending user data found'));
    }

    // If we have a token, use it for authenticated status check
    if (token) {
      const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
      return this.http.get<ApiResponse<{ user: User; token?: string }>>(`${this.API_URL}/users/profile`, { headers }).pipe(
        catchError(this.handleError<ApiResponse<{ user: User; token?: string }>>('checkPendingUserStatus'))
      );
    }

    // Otherwise, check status using email (for pending users)
    return this.http.post<ApiResponse<{ user: User; token?: string }>>(`${this.API_URL}/auth/check-status`, {
      email: pendingUser.email
    }).pipe(
      catchError(this.handleError<ApiResponse<{ user: User; token?: string }>>('checkPendingUserStatus'))
    );
  }

  clearAuthData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  // Debug method to check auth state
  debugAuthState(): void {
    console.log('=== Auth Debug State ===');
    console.log('Token:', this.getToken());
    console.log('Current User:', this.getCurrentUser());
    console.log('Is Logged In:', this.isLoggedIn());
    console.log('Is Admin:', this.isAdmin());
    console.log('Is Student:', this.isStudent());
    console.log('Is Teacher:', this.isTeacher());
    console.log('======================');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    // If either token or user is missing, clear auth data and return false
    if (!token || !user) {
      if (token || user) {
        // Partial auth data exists, clear it
        this.clearAuthData();
      }
      return false;
    }
    
    return true;
  }

  isStudent(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.STUDENT;
  }

  isTeacher(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.TEACHER;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === UserRole.ADMIN;
  }

  // Check if user status has changed and redirect if necessary
  checkCurrentUserStatus(): void {
    const user = this.getCurrentUser();
    if (!user || user.role === 'admin') return;

    // Call backend to get current user status
    this.http.get(`${this.API_URL}/auth/status`, { headers: this.getAuthHeaders() })
      .subscribe({
        next: (response: any) => {
          if (response.status === 'pending') {
            // User status changed to pending, logout and redirect to login
            this.logout();
            this.router.navigate(['/auth/login']);
          } else if (response.status === 'rejected') {
            // User was rejected, logout and redirect to login
            this.logout();
            this.router.navigate(['/auth/login']);
          }
        },
        error: (error) => {
          console.error('Status check failed:', error);
          // If token is invalid, logout
          if (error.status === 401) {
            this.logout();
            this.router.navigate(['/auth/login']);
          }
        }
      });
  }

  // Start monitoring user status (call this after login)
  startStatusMonitoring(): void {
    const user = this.getCurrentUser();
    if (!user || user.role === 'admin') return;

    // Check status every 10 seconds
    setInterval(() => {
      this.checkCurrentUserStatus();
    }, 10000);
  }

  // Get authorization headers for API requests
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Error handling
  private handleError<T>(operation = 'operation') {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      let errorMessage = 'An unexpected error occurred';
      
      if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Return a user-friendly error message
      return throwError(() => new Error(errorMessage));
    };
  }
}
