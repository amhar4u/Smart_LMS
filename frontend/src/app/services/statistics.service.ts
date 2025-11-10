import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OverallStatistics {
  activeStudents: number;
  expertTeachers: number;
  coursesAvailable: number;
  successRate: number;
  totalDepartments: number;
  totalUsers: number;
  admins: number;
  approvedUsers: number;
  pendingUsers: number;
  pendingStudents: number;
  pendingTeachers: number;
  rejectedUsers: number;
}

export interface DepartmentStatistics {
  _id: string;
  name: string;
  code: string;
  description?: string;
  totalUsers: number;
  activeUsers: number;
  studentCount: number;
  teacherCount: number;
  courseCount: number;
  batchCount: number;
  successRate: number;
}

export interface AdminDashboardStats {
  subjects: {
    total: number;
    active: number;
    inactive: number;
  };
  assignments: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    submissions: number;
  };
  meetings: {
    total: number;
    scheduled: number;
    ongoing: number;
    completed: number;
    cancelled: number;
  };
  recentAssignments: any[];
  recentMeetings: any[];
}

export interface StudentDashboardStats {
  student?: {
    name: string;
    email: string;
    department: string;
    course: string;
    batch: string;
    semester: string;
  };
  subjects: {
    total: number;
    active: number;
  };
  assignments: {
    total: number;
    pending: number;
    completed: number;
    submissionRate: number;
  };
  meetings: {
    total: number;
    scheduled: number;
    upcoming: number;
    completed: number;
  };
  nextAssignments: any[];
  recentMeetings: any[];
}

export interface StatisticsResponse {
  overall: OverallStatistics;
  departments: DepartmentStatistics[];
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = `${environment.apiUrl}/statistics`;

  constructor(private http: HttpClient) { }

  /**
   * Get comprehensive admin dashboard statistics
   */
  getAdminDashboardStats(): Observable<{ success: boolean; data: AdminDashboardStats }> {
    return this.http.get<{ success: boolean; data: AdminDashboardStats }>(`${this.apiUrl}/admin-dashboard`);
  }

  /**
   * Get comprehensive student dashboard statistics
   */
  getStudentDashboardStats(studentId: string): Observable<{ success: boolean; data: StudentDashboardStats }> {
    return this.http.get<{ success: boolean; data: StudentDashboardStats }>(`${this.apiUrl}/student-dashboard/${studentId}`);
  }

  /**
   * Get overall platform statistics
   */
  getOverallStatistics(): Observable<{ success: boolean; data: StatisticsResponse }> {
    return this.http.get<{ success: boolean; data: StatisticsResponse }>(`${this.apiUrl}`);
  }

  /**
   * Get detailed department-wise statistics
   */
  getDepartmentStatistics(): Observable<{ success: boolean; data: DepartmentStatistics[] }> {
    return this.http.get<{ success: boolean; data: DepartmentStatistics[] }>(`${this.apiUrl}/departments`);
  }
}
