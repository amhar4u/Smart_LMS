import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StudentSubjectLevel {
  _id: string;
  studentId: string;
  subjectId: string | any;
  averageMarks: number;
  averagePercentage: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  totalAssignments: number;
  completedAssignments: number;
  totalMarksObtained: number;
  totalMaxMarks: number;
  lastAssignmentDate?: Date;
  performanceHistory?: any[];
  levelChanges?: any[];
  createdAt?: Date;
  updatedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class StudentSubjectLevelService {
  private apiUrl = `${environment.apiUrl}/student-subject-levels`;

  constructor(private http: HttpClient) {}

  /**
   * Get student subject level for a specific student and subject
   */
  getStudentSubjectLevel(studentId: string, subjectId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/student/${studentId}/subject/${subjectId}`);
  }

  /**
   * Get all subject levels for a student
   */
  getStudentAllSubjectLevels(studentId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/student/${studentId}`);
  }

  /**
   * Get all students' levels for a subject
   */
  getSubjectStudentLevels(subjectId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/subject/${subjectId}`);
  }

  /**
   * Get performance history for a student-subject combination
   */
  getPerformanceHistory(studentId: string, subjectId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/student/${studentId}/subject/${subjectId}/history`);
  }

  /**
   * Get all student subject levels with optional filters
   */
  getAllStudentSubjectLevels(filters?: {
    studentId?: string;
    subjectId?: string;
    level?: string;
    minPercentage?: number;
    maxPercentage?: number;
  }): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.studentId) params = params.set('studentId', filters.studentId);
      if (filters.subjectId) params = params.set('subjectId', filters.subjectId);
      if (filters.level) params = params.set('level', filters.level);
      if (filters.minPercentage !== undefined) params = params.set('minPercentage', filters.minPercentage.toString());
      if (filters.maxPercentage !== undefined) params = params.set('maxPercentage', filters.maxPercentage.toString());
    }

    return this.http.get<any>(this.apiUrl, { params });
  }

  /**
   * Get statistics overview
   */
  getStatistics(filters?: { subjectId?: string; studentId?: string }): Observable<any> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.subjectId) params = params.set('subjectId', filters.subjectId);
      if (filters.studentId) params = params.set('studentId', filters.studentId);
    }

    return this.http.get<any>(`${this.apiUrl}/statistics/overview`, { params });
  }

  /**
   * Get student subject level by ID
   */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * Convert level to display format (capitalize first letter)
   */
  formatLevel(level: string): string {
    if (!level) return 'Beginner';
    return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  }

  /**
   * Get level badge class for styling
   */
  getLevelBadgeClass(level: string): string {
    const levelMap: any = {
      'beginner': 'level-beginner',
      'intermediate': 'level-intermediate',
      'advanced': 'level-advanced'
    };
    return levelMap[level?.toLowerCase()] || 'level-beginner';
  }

  /**
   * Get level color
   */
  getLevelColor(level: string): string {
    const colorMap: any = {
      'beginner': '#f44336',
      'intermediate': '#ff9800',
      'advanced': '#4caf50'
    };
    return colorMap[level?.toLowerCase()] || '#f44336';
  }
}
