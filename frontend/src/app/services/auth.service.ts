import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { User, UserRole, LoginRequest, AuthResponse, StudentRegistration, TeacherRegistration } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Check if user is logged in on service initialization
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // Simulate API call - replace with actual HTTP request
    const mockUser: User = {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: credentials.email,
      role: credentials.role || UserRole.STUDENT,
      isActive: true
    };

    const response: AuthResponse = {
      user: mockUser,
      token: 'mock-jwt-token'
    };

    // Store user data
    localStorage.setItem('currentUser', JSON.stringify(mockUser));
    localStorage.setItem('token', response.token);
    this.currentUserSubject.next(mockUser);

    return of(response);
  }

  registerStudent(registration: StudentRegistration): Observable<AuthResponse> {
    // Simulate API call - replace with actual HTTP request
    const newUser: User = {
      id: Date.now().toString(),
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone,
      role: UserRole.STUDENT,
      isActive: true,
      createdAt: new Date()
    };

    const response: AuthResponse = {
      user: newUser,
      token: 'mock-jwt-token'
    };

    return of(response);
  }

  registerTeacher(registration: TeacherRegistration): Observable<AuthResponse> {
    // Simulate API call - replace with actual HTTP request
    const newUser: User = {
      id: Date.now().toString(),
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone,
      role: UserRole.TEACHER,
      isActive: true,
      createdAt: new Date()
    };

    const response: AuthResponse = {
      user: newUser,
      token: 'mock-jwt-token'
    };

    return of(response);
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return this.getCurrentUser() !== null;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }
}
