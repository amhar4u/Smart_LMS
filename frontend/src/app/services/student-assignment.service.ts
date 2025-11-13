import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface StudentAssignment {
  _id: string;
  title: string;
  description: string;
  subject: {
    _id: string;
    name: string;
    code: string;
  };
  course: {
    _id: string;
    name: string;
  };
  batch?: {
    _id: string;
    name: string;
  };
  semester?: {
    _id: string;
    name: string;
  };
  modules?: Array<{
    _id: string;
    title?: string;
    name?: string;
  }>;
  startDate: Date;
  endDate: Date;
  dueDate: Date;
  timeLimit: number; // in minutes
  maxMarks: number;
  totalMarks: number;
  passingMarks: number;
  numberOfQuestions: number;
  assignmentType: 'MCQ' | 'short_answer' | 'essay';
  assignmentLevel: 'easy' | 'medium' | 'hard';
  instructions: string;
  questions?: Question[];
  createdBy: {
    firstName: string;
    lastName: string;
  };
  hasSubmitted: boolean;
  submissionStatus?: {
    submittedAt: Date;
    marks: number;
    percentage: number;
    level: string;
    evaluationStatus: string;
  };
  isStarted: boolean;
  canStart: boolean;
}

export interface Question {
  _id: string;
  question: string;
  type: 'MCQ' | 'short_answer' | 'essay';
  options?: {
    option: string;
    isCorrect: boolean;
  }[];
  correctAnswer?: string;
  maxWords?: number;
  marks: number;
}

export interface AssignmentStartResponse {
  success: boolean;
  message: string;
  data: {
    submissionId: string;
    startTime: Date;
    endTime: Date;
    timeLimit: number;
    serverTime: Date;
  };
}

export interface AssignmentSubmitResponse {
  success: boolean;
  message: string;
  data: {
    submissionId: string;
    submittedAt: Date;
    timeTaken: number;
    evaluationStatus: string;
  };
}

export interface AssignmentResult {
  success: boolean;
  data: {
    submission: {
      submittedAt: Date;
      timeTaken: number;
      marks: number;
      percentage: number;
      level: string;
      feedback: string;
      evaluationStatus: string;
      submittedAnswers: any[];
    };
    assignment: {
      title: string;
      maxMarks: number;
      passingMarks: number;
      subject: any;
      questions: Question[];
    };
    subjectPerformance: {
      averageMarks: number;
      averagePercentage: number;
      level: string;
      totalAssignments: number;
    } | null;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StudentAssignmentService {
  private apiUrl = `${environment.apiUrl}/students`;

  constructor(private http: HttpClient) {}

  // Get all active assignments for the student
  getActiveAssignments(): Observable<{ success: boolean; count: number; data: StudentAssignment[] }> {
    return this.http.get<{ success: boolean; count: number; data: StudentAssignment[] }>(
      `${this.apiUrl}/assignments/active`
    );
  }

  // Get a specific assignment
  getAssignment(id: string): Observable<{ success: boolean; data: StudentAssignment }> {
    return this.http.get<{ success: boolean; data: StudentAssignment }>(
      `${this.apiUrl}/assignments/${id}`
    );
  }

  // Start an assignment
  startAssignment(id: string): Observable<AssignmentStartResponse> {
    return this.http.post<AssignmentStartResponse>(
      `${this.apiUrl}/assignments/${id}/start`,
      {}
    );
  }

  // Submit assignment answers
  submitAssignment(id: string, answers: any[]): Observable<AssignmentSubmitResponse> {
    return this.http.post<AssignmentSubmitResponse>(
      `${this.apiUrl}/assignments/${id}/submit`,
      { answers }
    );
  }

  // Get assignment result
  getAssignmentResult(id: string): Observable<AssignmentResult> {
    return this.http.get<AssignmentResult>(
      `${this.apiUrl}/assignments/${id}/result`
    );
  }

  // Get performance overview
  getPerformanceOverview(): Observable<any> {
    return this.http.get(`${this.apiUrl}/performance/overview`);
  }

  // Get subject performance
  getSubjectPerformance(subjectId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/subjects/${subjectId}/performance`);
  }
}
