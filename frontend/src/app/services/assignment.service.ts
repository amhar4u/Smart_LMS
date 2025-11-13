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
  startDate?: Date; // When students can start the assignment
  dueDate: Date; // Due date for submission
  endDate?: Date; // When assignment closes
  passingMarks?: number; // Minimum marks to pass
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
  explanation?: string; // Explanation for MCQ or additional context
  maxWords?: number;
  minLength?: number; // Minimum length for essays
  maxLength?: number; // Maximum length for short answers and essays
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

  // Get submissions for an assignment
  getAssignmentSubmissions(
    assignmentId: string,
    filters: {
      page?: number;
      limit?: number;
      evaluationStatus?: string;
      level?: string;
      minPercentage?: number;
      maxPercentage?: number;
      search?: string;
    } = {}
  ): Observable<any> {
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key as keyof typeof filters];
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const queryString = params.toString();
    const url = queryString 
      ? `${this.apiUrl}/${assignmentId}/submissions?${queryString}` 
      : `${this.apiUrl}/${assignmentId}/submissions`;
    
    return this.http.get<any>(url);
  }

  // Get single submission details
  getSubmissionDetails(assignmentId: string, submissionId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${assignmentId}/submissions/${submissionId}`);
  }

  // Evaluate single submission
  evaluateSubmission(assignmentId: string, submissionId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${assignmentId}/submissions/${submissionId}/evaluate`, {});
  }

  // Evaluate all pending submissions
  evaluateAllSubmissions(assignmentId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${assignmentId}/submissions/evaluate-all`, {});
  }

  // Publish single evaluation
  publishEvaluation(assignmentId: string, submissionId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${assignmentId}/submissions/${submissionId}/publish`, {});
  }

  // Publish all evaluated submissions
  publishAllEvaluations(assignmentId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${assignmentId}/submissions/publish-all`, {});
  }
}
