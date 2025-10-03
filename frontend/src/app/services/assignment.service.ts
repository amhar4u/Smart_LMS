import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Assignment {
  _id?: string;
  title: string;
  description: string;
  department: { _id: string; name: string } | string;
  course: { _id: string; name: string } | string;
  batch: { _id: string; name: string } | string;
  semester: { _id: string; name: string } | string;
  subject: { _id: string; name: string } | string;
  modules: Array<{ _id: string; title: string }> | string[];
  dueDate: Date;
  assignmentLevel: 'easy' | 'medium' | 'hard';
  assignmentType: 'MCQ' | 'short_answer' | 'essay';
  numberOfQuestions: number;
  questions?: Question[];
  maxMarks: number;
  instructions?: string;
  submissionType?: 'online' | 'file' | 'both';
  allowLateSubmission?: boolean;
  lateSubmissionPenalty?: number;
  timeLimit?: number;
  isActive?: boolean;
  createdBy?: string;
  generatedFromContent?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Question {
  _id?: string;
  question: string;
  type: 'MCQ' | 'short_answer' | 'essay';
  options?: Option[];
  correctAnswer?: string;
  maxWords?: number;
  marks: number;
}

export interface Option {
  option: string;
  isCorrect: boolean;
}

export interface AssignmentFilters {
  page?: number;
  limit?: number;
  department?: string;
  course?: string;
  batch?: string;
  semester?: string;
  subject?: string;
  assignmentLevel?: string;
  assignmentType?: string;
  isActive?: boolean;
}

export interface AssignmentResponse {
  success: boolean;
  data: Assignment[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  message?: string;
}

export interface SingleAssignmentResponse {
  success: boolean;
  data: Assignment;
  message?: string;
}

export interface PreviewQuestionsRequest {
  modules?: string[];
  assignmentType: 'MCQ' | 'short_answer' | 'essay';
  numberOfQuestions: number;
  assignmentLevel: 'easy' | 'medium' | 'hard';
  subject?: string;
  contentSource?: 'module_name' | 'module_content';
  moduleContent?: string;
}

export interface PreviewQuestionsResponse {
  success: boolean;
  data: {
    questions: Question[];
    totalMarks: number;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssignmentService {
  private apiUrl = `${environment.apiUrl}/assignments`;

  constructor(private http: HttpClient) {}

  // Get all assignments with filters
  getAssignments(filters: AssignmentFilters = {}): Observable<AssignmentResponse> {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof AssignmentFilters];
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString ? `${this.apiUrl}?${queryString}` : this.apiUrl;
    
    return this.http.get<AssignmentResponse>(url);
  }

  // Get single assignment by ID
  getAssignment(id: string): Observable<SingleAssignmentResponse> {
    return this.http.get<SingleAssignmentResponse>(`${this.apiUrl}/${id}`);
  }

  // Create new assignment
  createAssignment(assignment: Assignment): Observable<SingleAssignmentResponse> {
    return this.http.post<SingleAssignmentResponse>(this.apiUrl, assignment);
  }

  // Update assignment
  updateAssignment(id: string, assignment: Partial<Assignment>): Observable<SingleAssignmentResponse> {
    return this.http.put<SingleAssignmentResponse>(`${this.apiUrl}/${id}`, assignment);
  }

  // Delete assignment
  deleteAssignment(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  // Toggle assignment status
  toggleAssignmentStatus(id: string): Observable<{ success: boolean; message: string; data: { isActive: boolean } }> {
    return this.http.post<{ success: boolean; message: string; data: { isActive: boolean } }>(`${this.apiUrl}/${id}/toggle-status`, {});
  }

  // Preview questions before creating assignment
  previewQuestions(request: PreviewQuestionsRequest): Observable<PreviewQuestionsResponse> {
    return this.http.post<PreviewQuestionsResponse>(`${this.apiUrl}/preview-questions`, request);
  }

  // Get assignments statistics
  getAssignmentsStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }
}
