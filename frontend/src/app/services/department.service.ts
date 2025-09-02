import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Department {
  _id: string;
  name: string;
  code: string;
  description?: string;
  head?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  establishedYear?: number;
  faculty?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    office?: string;
  };
  isActive: boolean;
  teacherCount?: number;
  studentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DepartmentResponse {
  success: boolean;
  data: Department[];
  count: number;
  message?: string;
}

export interface SingleDepartmentResponse {
  success: boolean;
  data: Department;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/departments`;

  constructor(private http: HttpClient) { }

  /**
   * Get all active departments
   */
  getDepartments(): Observable<DepartmentResponse> {
    return this.http.get<DepartmentResponse>(this.apiUrl);
  }

  /**
   * Get department by ID
   */
  getDepartmentById(id: string): Observable<SingleDepartmentResponse> {
    return this.http.get<SingleDepartmentResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create new department (Admin only)
   */
  createDepartment(department: Partial<Department>): Observable<SingleDepartmentResponse> {
    return this.http.post<SingleDepartmentResponse>(this.apiUrl, department);
  }

  /**
   * Update department (Admin only)
   */
  updateDepartment(id: string, department: Partial<Department>): Observable<SingleDepartmentResponse> {
    return this.http.put<SingleDepartmentResponse>(`${this.apiUrl}/${id}`, department);
  }

  /**
   * Delete department (Admin only)
   */
  deleteDepartment(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get teachers in a department
   */
  getDepartmentTeachers(departmentId: string): Observable<{ success: boolean; data: any[]; count: number }> {
    return this.http.get<{ success: boolean; data: any[]; count: number }>(`${this.apiUrl}/${departmentId}/teachers`);
  }

  /**
   * Get students in a department
   */
  getDepartmentStudents(departmentId: string): Observable<{ success: boolean; data: any[]; count: number }> {
    return this.http.get<{ success: boolean; data: any[]; count: number }>(`${this.apiUrl}/${departmentId}/students`);
  }
}
