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
