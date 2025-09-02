import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Course {
  _id?: string;
  name: string;
  code: string;
  description?: string;
  department: {
    _id: string;
    name: string;
    code: string;
  } | string;
  credits?: number;
  duration?: string;
  isActive: boolean;
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CourseResponse {
  success: boolean;
  data: Course[];
  message?: string;
}

export interface CourseDetailResponse {
  success: boolean;
  data: Course;
  message?: string;
}

export interface CoursesAdminResponse {
  success: boolean;
  data: {
    courses: Course[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
  message?: string;
}

export interface CreateCourseRequest {
  name: string;
  code: string;
  description?: string;
  department: string;
  credits?: number;
  duration?: string;
}

export interface UpdateCourseRequest {
  name?: string;
  code?: string;
  description?: string;
  department?: string;
  credits?: number;
  duration?: string;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;
  private coursesSubject = new BehaviorSubject<Course[]>([]);
  public courses$ = this.coursesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  // Get all active courses (for registration forms)
  getCourses(departmentId?: string): Observable<CourseResponse> {
    let params = new HttpParams();
    if (departmentId) {
      params = params.set('department', departmentId);
    }
    return this.http.get<CourseResponse>(this.apiUrl, { params });
  }

  // Get courses by department
  getCoursesByDepartment(departmentId: string): Observable<CourseResponse> {
    return this.getCourses(departmentId);
  }

  // Load courses and update the subject
  loadCourses(departmentId?: string): void {
    this.getCourses(departmentId).subscribe({
      next: (response) => {
        if (response.success) {
          this.coursesSubject.next(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.coursesSubject.next([]);
      }
    });
  }

  // Get current courses from the subject
  getCurrentCourses(): Course[] {
    return this.coursesSubject.value;
  }

  // Get courses for admin with pagination and filters
  getCoursesForAdmin(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    category: string = '',
    departmentId: string = ''
  ): Observable<CoursesAdminResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (category && category !== 'all') {
      params = params.set('category', category);
    }

    if (departmentId && departmentId !== 'all') {
      params = params.set('department', departmentId);
    }

    const headers = this.authService.getAuthHeaders();
    console.log('🔐 CourseService: Making admin request with headers:', headers.get('Authorization') ? 'Bearer token present' : 'No auth token');
    
    return this.http.get<CoursesAdminResponse>(`${this.apiUrl}/admin`, { params, headers });
  }

  // Get single course by ID
  getCourseById(id: string): Observable<CourseDetailResponse> {
    return this.http.get<CourseDetailResponse>(`${this.apiUrl}/${id}`);
  }

  // Create new course
  createCourse(courseData: CreateCourseRequest): Observable<CourseDetailResponse> {
    const headers = this.authService.getAuthHeaders();
    return this.http.post<CourseDetailResponse>(this.apiUrl, courseData, { headers });
  }

  // Update course
  updateCourse(id: string, courseData: UpdateCourseRequest): Observable<CourseDetailResponse> {
    const headers = this.authService.getAuthHeaders();
    return this.http.put<CourseDetailResponse>(`${this.apiUrl}/${id}`, courseData, { headers });
  }

  // Delete course
  deleteCourse(id: string): Observable<{ success: boolean; message: string }> {
    const headers = this.authService.getAuthHeaders();
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`, { headers });
  }

  // Toggle course active status
  toggleCourseStatus(id: string): Observable<CourseDetailResponse> {
    const headers = this.authService.getAuthHeaders();
    return this.http.patch<CourseDetailResponse>(`${this.apiUrl}/${id}/toggle-status`, {}, { headers });
  }

  // Get course categories
  getCourseCategories(): string[] {
    return [
      'Technology',
      'Business',
      'Science', 
      'Engineering',
      'Arts',
      'Medicine',
      'Other'
    ];
  }

  // Helper method to refresh courses after CRUD operations
  refreshCourses(): void {
    this.loadCourses();
  }
}
