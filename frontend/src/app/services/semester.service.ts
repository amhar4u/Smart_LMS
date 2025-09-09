import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Semester {
  _id?: string;
  name: string;
  code: string;
  year: number;
  type: 'fall' | 'spring' | 'summer';
  batch: {
    _id: string;
    name: string;
    code: string;
  } | string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isCurrent: boolean;
  registrationStartDate?: Date;
  registrationEndDate?: Date;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SemesterResponse {
  success: boolean;
  data: Semester[];
  count: number;
  message?: string;
}

export interface SingleSemesterResponse {
  success: boolean;
  data: Semester;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SemesterService {
  private apiUrl = `${environment.apiUrl}/semesters`;

  constructor(private http: HttpClient) { }

  /**
   * Get all active semesters
   */
  getSemesters(): Observable<SemesterResponse> {
    return this.http.get<SemesterResponse>(this.apiUrl);
  }

  /**
   * Get semester by ID
   */
  getSemesterById(id: string): Observable<SingleSemesterResponse> {
    return this.http.get<SingleSemesterResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get current semester
   */
  getCurrentSemester(): Observable<SingleSemesterResponse> {
    return this.http.get<SingleSemesterResponse>(`${this.apiUrl}/current`);
  }

  /**
   * Set current semester (Admin only)
   */
  setCurrentSemester(id: string): Observable<SingleSemesterResponse> {
    return this.http.put<SingleSemesterResponse>(`${this.apiUrl}/${id}/current`, {});
  }

  /**
   * Get semesters by year
   */
  getSemestersByYear(year: number): Observable<SemesterResponse> {
    return this.http.get<SemesterResponse>(`${this.apiUrl}/year/${year}`);
  }

  /**
   * Create new semester (Admin only)
   */
  createSemester(semester: Partial<Semester>): Observable<SingleSemesterResponse> {
    return this.http.post<SingleSemesterResponse>(this.apiUrl, semester);
  }

  /**
   * Update semester (Admin only)
   */
  updateSemester(id: string, semester: Partial<Semester>): Observable<SingleSemesterResponse> {
    return this.http.put<SingleSemesterResponse>(`${this.apiUrl}/${id}`, semester);
  }

  /**
   * Delete semester (Admin only)
   */
  deleteSemester(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get students in a semester
   */
  getSemesterStudents(semesterId: string): Observable<{ success: boolean; data: any[]; count: number }> {
    return this.http.get<{ success: boolean; data: any[]; count: number }>(`${this.apiUrl}/${semesterId}/students`);
  }
}
