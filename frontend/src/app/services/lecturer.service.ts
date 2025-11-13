import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface DashboardStats {
  subjectCount: number;
  batchCount: number;
  courseCount: number;
  assignmentStats: {
    total: number;
    pending: number;
    completed: number;
  };
  meetingStats: {
    total: number;
    scheduled: number;
    ongoing: number;
    completed: number;
  };
  subjects: Array<{
    _id: string;
    name: string;
    code: string;
    department: string;
    course: string;
    batch: string;
    semester: string;
  }>;
}

export interface SubjectDetail {
  _id: string;
  name: string;
  code: string;
  description: string;
  department: {
    _id: string;
    name: string;
    code: string;
  };
  course: {
    _id: string;
    name: string;
    code: string;
  };
  batch: {
    _id: string;
    name: string;
    code: string;
    startYear: number;
    endYear: number;
  };
  semester: {
    _id: string;
    name: string;
  };
  creditHours: number;
  statistics: {
    moduleCount: number;
    assignmentCount: number;
    meetingCount: number;
    studentCount: number;
    assignmentBreakdown: {
      total: number;
      pending: number;
      completed: number;
    };
    meetingBreakdown: {
      total: number;
      scheduled: number;
      ongoing: number;
      completed: number;
    };
  };
}

export interface SingleSubjectDetail extends SubjectDetail {
  lecturer: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  modules: Array<{
    _id: string;
    name: string;
    code: string;
    title: string;
    description: string;
    order: number;
    documentCount: number;
    hasVideo: boolean;
  }>;
  assignments: Array<{
    _id: string;
    title: string;
    dueDate: Date;
    assignmentType: string;
    assignmentLevel: string;
    maxMarks: number;
    numberOfQuestions: number;
  }>;
  meetings: Array<{
    _id: string;
    topic: string;
    meetingDate: Date;
    startTime: Date;
    endTime?: Date;
    status: string;
    studentCount: number;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  statistics?: {
    totalSubmissions: number;
    evaluated: number;
    pending: number;
    avgPercentage: number;
    beginners: number;
    intermediates: number;
    advanced: number;
  };
}

export interface LecturerAssignment {
  _id: string;
  title: string;
  description: string;
  department: { _id: string; name: string };
  course: { _id: string; name: string };
  batch: { _id: string; name: string };
  semester: { _id: string; name: string };
  subject: { _id: string; name: string; code: string };
  modules: Array<{ _id: string; title: string }>;
  dueDate: Date;
  startDate: Date;
  endDate: Date;
  passingMarks: number;
  assignmentLevel: string;
  assignmentType: string;
  numberOfQuestions: number;
  maxMarks: number;
  isActive: boolean;
  createdBy: { _id: string; firstName: string; lastName: string; email: string };
  createdAt: Date;
}

export interface LecturerSubmission {
  _id: string;
  assignmentId: {
    _id: string;
    title: string;
    maxMarks: number;
    dueDate: Date;
    assignmentType: string;
    assignmentLevel: string;
    subject: {
      _id: string;
      name: string;
      code: string;
    };
  };
  studentId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    studentId: string;
  };
  submittedAt: Date;
  marks: number | null;
  percentage: number | null;
  level: string | null;
  evaluationStatus: string;
  status: string;
  isLateSubmission: boolean;
  isPublished: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LecturerService {
  private baseUrl = `${environment.apiUrl}/lecturer`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders() {
    return this.authService.getAuthHeaders();
  }

  /**
   * Get dashboard statistics for a lecturer
   * @param lecturerId - The ID of the lecturer
   * @returns Observable with dashboard statistics
   */
  getDashboardStats(lecturerId: string): Observable<ApiResponse<DashboardStats>> {
    return this.http.get<ApiResponse<DashboardStats>>(
      `${this.baseUrl}/dashboard-stats/${lecturerId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get detailed information for all subjects taught by a lecturer
   * @param lecturerId - The ID of the lecturer
   * @returns Observable with array of subject details
   */
  getSubjectDetails(lecturerId: string): Observable<ApiResponse<SubjectDetail[]>> {
    return this.http.get<ApiResponse<SubjectDetail[]>>(
      `${this.baseUrl}/subject-details/${lecturerId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get detailed information for a single subject
   * @param subjectId - The ID of the subject
   * @returns Observable with subject details
   */
  getSingleSubjectDetail(subjectId: string): Observable<ApiResponse<SingleSubjectDetail>> {
    return this.http.get<ApiResponse<SingleSubjectDetail>>(
      `${this.baseUrl}/subject/${subjectId}/details`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all assignments for lecturer's subjects
   * @param lecturerId - The ID of the lecturer
   * @param filters - Optional filters for assignments
   * @returns Observable with array of assignments
   */
  getAssignments(lecturerId: string, filters?: any): Observable<ApiResponse<LecturerAssignment[]>> {
    let params: any = { ...filters };
    
    return this.http.get<ApiResponse<LecturerAssignment[]>>(
      `${this.baseUrl}/${lecturerId}/assignments`,
      { 
        headers: this.getHeaders(),
        params 
      }
    );
  }

  /**
   * Get all submissions for lecturer's assignments
   * @param lecturerId - The ID of the lecturer
   * @param filters - Optional filters for submissions
   * @returns Observable with array of submissions
   */
  getSubmissions(lecturerId: string, filters?: any): Observable<ApiResponse<LecturerSubmission[]>> {
    let params: any = { ...filters };
    
    return this.http.get<ApiResponse<LecturerSubmission[]>>(
      `${this.baseUrl}/${lecturerId}/submissions`,
      { 
        headers: this.getHeaders(),
        params 
      }
    );
  }
}
