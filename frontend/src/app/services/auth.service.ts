import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
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

  constructor(private http: HttpClient) {
    // Check if user is logged in on service initialization
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
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
      catchError(this.handleError<AuthResponse>('login'))
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
      department: registration.department,
      specialization: registration.specialization,
      experience: registration.experience || 0
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
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.getCurrentUser();
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
