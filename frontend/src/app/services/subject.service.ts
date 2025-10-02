import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Subject {
  _id?: string;
  name: string;
  code: string;
  departmentId: {
    _id: string;
    name: string;
    code: string;
  } | string;
  courseId: {
    _id: string;
    name: string;
    code: string;
  } | string;
  batchId: {
    _id: string;
    name: string;
    code: string;
    startYear: number;
    endYear: number;
  } | string;
  semesterId: {
    _id: string;
    name: string;
    code: string;
    year: number;
    type: string;
  } | string;
  creditHours: number;
  lecturerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SubjectResponse {
  success: boolean;
  data: Subject | Subject[];
  message?: string;
  error?: string;
}

export interface Department {
  _id: string;
  name: string;
  code: string;
}

export interface Course {
  _id: string;
  name: string;
  code: string;
}

export interface Batch {
  _id: string;
  name: string;
  code: string;
  startYear: number;
  endYear: number;
}

export interface Semester {
  _id?: string;
  name: string;
  code: string;
  year: number;
  type: string;
}

export interface Lecturer {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private baseUrl = `${environment.apiUrl}/subjects`;
  private subjectsSubject = new BehaviorSubject<Subject[]>([]);
  public subjects$ = this.subjectsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders() {
    return this.authService.getAuthHeaders();
  }

  // Get all subjects
  getSubjects(filters?: {
    department?: string;
    course?: string;
    semester?: string;
    lecturer?: string;
  }): Observable<SubjectResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.department) params = params.set('department', filters.department);
      if (filters.course) params = params.set('course', filters.course);
      if (filters.semester) params = params.set('semester', filters.semester);
      if (filters.lecturer) params = params.set('lecturer', filters.lecturer);
    }

    return this.http.get<SubjectResponse>(this.baseUrl, { 
      headers: this.getHeaders(),
      params 
    });
  }

  // Get subject by ID
  getSubject(id: string): Observable<SubjectResponse> {
    return this.http.get<SubjectResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Create new subject
  createSubject(subject: Partial<Subject>): Observable<SubjectResponse> {
    return this.http.post<SubjectResponse>(this.baseUrl, subject, {
      headers: this.getHeaders()
    });
  }

  // Update subject
  updateSubject(id: string, subject: Partial<Subject>): Observable<SubjectResponse> {
    return this.http.put<SubjectResponse>(`${this.baseUrl}/${id}`, subject, {
      headers: this.getHeaders()
    });
  }

  // Delete subject
  deleteSubject(id: string): Observable<SubjectResponse> {
    return this.http.delete<SubjectResponse>(`${this.baseUrl}/${id}`, {
      headers: this.getHeaders()
    });
  }

  // Get courses by department
  getCoursesByDepartment(departmentId: string): Observable<{ success: boolean; data: Course[] }> {
    return this.http.get<{ success: boolean; data: Course[] }>(`${this.baseUrl}/courses/${departmentId}`, {
      headers: this.getHeaders()
    });
  }

  // Get batches by course
  getBatchesByCourse(courseId: string): Observable<{ success: boolean; data: Batch[] }> {
    return this.http.get<{ success: boolean; data: Batch[] }>(`${this.baseUrl}/batches/${courseId}`, {
      headers: this.getHeaders()
    });
  }

  // Get semesters by batch
  getSemestersByBatch(batchId: string): Observable<{ success: boolean; data: Semester[] }> {
    return this.http.get<{ success: boolean; data: Semester[] }>(`${this.baseUrl}/semesters/${batchId}`, {
      headers: this.getHeaders()
    });
  }

  // Get all lecturers
  getLecturers(): Observable<{ success: boolean; data: Lecturer[] }> {
    return this.http.get<{ success: boolean; data: Lecturer[] }>(`${this.baseUrl}/lecturers/all`, {
      headers: this.getHeaders()
    });
  }

  // Update subjects in BehaviorSubject
  updateSubjectsState(subjects: Subject[]) {
    this.subjectsSubject.next(subjects);
  }

  // Get current subjects state
  getCurrentSubjects(): Subject[] {
    return this.subjectsSubject.value;
  }

  // Add subject to state
  addSubjectToState(subject: Subject) {
    const currentSubjects = this.getCurrentSubjects();
    this.subjectsSubject.next([...currentSubjects, subject]);
  }

  // Update subject in state
  updateSubjectInState(updatedSubject: Subject) {
    const currentSubjects = this.getCurrentSubjects();
    const index = currentSubjects.findIndex(s => s._id === updatedSubject._id);
    if (index !== -1) {
      currentSubjects[index] = updatedSubject;
      this.subjectsSubject.next([...currentSubjects]);
    }
  }

  // Remove subject from state
  removeSubjectFromState(subjectId: string) {
    const currentSubjects = this.getCurrentSubjects();
    const filteredSubjects = currentSubjects.filter(s => s._id !== subjectId);
    this.subjectsSubject.next(filteredSubjects);
  }
}
