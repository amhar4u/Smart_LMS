import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Subject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  courseId: {
    _id: string;
    name: string;
    code: string;
  };
  semesterId: {
    _id: string;
    name: string;
    code: string;
  };
  lecturerId?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubjectResponse {
  success: boolean;
  data: Subject[];
  count: number;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubjectService {
  private apiUrl = `${environment.apiUrl}/subjects`;

  constructor(private http: HttpClient) { }

  getAllSubjects(): Observable<SubjectResponse> {
    return this.http.get<SubjectResponse>(this.apiUrl);
  }

  getSubjectById(id: string): Observable<{ success: boolean; data: Subject; message?: string }> {
    return this.http.get<{ success: boolean; data: Subject; message?: string }>(`${this.apiUrl}/${id}`);
  }

  createSubject(subject: Partial<Subject>): Observable<{ success: boolean; data: Subject; message?: string }> {
    return this.http.post<{ success: boolean; data: Subject; message?: string }>(this.apiUrl, subject);
  }

  updateSubject(id: string, subject: Partial<Subject>): Observable<{ success: boolean; data: Subject; message?: string }> {
    return this.http.put<{ success: boolean; data: Subject; message?: string }>(`${this.apiUrl}/${id}`, subject);
  }

  deleteSubject(id: string): Observable<{ success: boolean; message?: string }> {
    return this.http.delete<{ success: boolean; message?: string }>(`${this.apiUrl}/${id}`);
  }
}
