import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DependencyItem {
  _id?: string;
  name?: string;
  code?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  date?: string;
  [key: string]: any;
}

export interface DependencyInfo {
  count: number;
  items: DependencyItem[];
}

export interface DependencyResponse {
  canDelete: boolean;
  requiresConfirmation?: boolean;
  dependencies: {
    [key: string]: DependencyInfo;
  };
}

export interface ApiResponse {
  success: boolean;
  data: DependencyResponse;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DependencyService {
  private baseUrl = `${environment.apiUrl}/dependencies`;

  constructor(private http: HttpClient) {}

  checkDepartmentDependencies(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/department/${id}`);
  }

  checkCourseDependencies(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/course/${id}`);
  }

  checkBatchDependencies(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/batch/${id}`);
  }

  checkSemesterDependencies(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/semester/${id}`);
  }

  checkSubjectDependencies(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/subject/${id}`);
  }

  checkStudentDependencies(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/student/${id}`);
  }

  checkLecturerDependencies(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/lecturer/${id}`);
  }

  checkAssignmentDependencies(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/assignment/${id}`);
  }

  checkModuleDependencies(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/module/${id}`);
  }

  checkMeetingDependencies(id: string): Observable<ApiResponse> {
    return this.http.get<ApiResponse>(`${this.baseUrl}/meeting/${id}`);
  }

  /**
   * Formats dependency information into a human-readable message
   */
  formatDependencyMessage(dependencies: DependencyResponse): string {
    const deps = dependencies.dependencies;
    const messages: string[] = [];

    Object.keys(deps).forEach(key => {
      const dep = deps[key];
      if (dep.count > 0) {
        const label = this.formatLabel(key);
        messages.push(`${dep.count} ${label}`);
      }
    });

    return messages.join(', ');
  }

  /**
   * Formats dependency key into readable label
   */
  private formatLabel(key: string): string {
    const labels: { [key: string]: string } = {
      courses: 'Course(s)',
      batches: 'Batch(es)',
      semesters: 'Semester(s)',
      subjects: 'Subject(s)',
      students: 'Student(s)',
      lecturers: 'Lecturer(s)',
      modules: 'Module(s)',
      extraModules: 'Extra Module(s)',
      assignments: 'Assignment(s)',
      meetings: 'Meeting(s)',
      submissions: 'Submission(s)',
      attendance: 'Attendance Record(s)',
      studentLevels: 'Student Level Record(s)'
    };

    return labels[key] || key;
  }

  /**
   * Gets display name for a dependency item
   */
  getItemDisplayName(item: DependencyItem): string {
    if (item.firstName && item.lastName) {
      return `${item.firstName} ${item.lastName}`;
    }
    if (item.name) {
      return item.name;
    }
    if (item.title) {
      return item.title;
    }
    if (item.code) {
      return item.code;
    }
    return 'Unknown';
  }
}
