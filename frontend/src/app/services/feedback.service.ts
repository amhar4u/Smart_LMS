import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Feedback {
  _id: string;
  user?: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
    department?: {
      _id: string;
      name: string;
    };
    course?: {
      _id: string;
      name: string;
    };
  };
  userName: string;
  userRole: 'student' | 'teacher';
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: any;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class FeedbackService {
  private apiUrl = `${environment.apiUrl}/feedback`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  /**
   * Submit feedback
   */
  submitFeedback(rating: number, comment: string): Observable<ApiResponse<{ feedback: Feedback }>> {
    return this.http.post<ApiResponse<{ feedback: Feedback }>>(
      this.apiUrl,
      { rating, comment },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  /**
   * Get approved feedback (for home page)
   */
  getApprovedFeedbacks(): Observable<ApiResponse<{ feedbacks: Feedback[] }>> {
    return this.http.get<ApiResponse<{ feedbacks: Feedback[] }>>(
      `${this.apiUrl}/approved`
    );
  }

  /**
   * Get current user's feedback
   */
  getMyFeedback(): Observable<ApiResponse<{ feedback: Feedback | null }>> {
    return this.http.get<ApiResponse<{ feedback: Feedback | null }>>(
      `${this.apiUrl}/my-feedback`,
      { headers: this.authService.getAuthHeaders() }
    );
  }

  /**
   * Get all feedback (admin only)
   */
  getAllFeedbacks(status?: string, page: number = 1, limit: number = 10): Observable<ApiResponse<{
    feedbacks: Feedback[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    return this.http.get<any>(url, { headers: this.authService.getAuthHeaders() });
  }

  /**
   * Approve feedback (admin only)
   */
  approveFeedback(id: string): Observable<ApiResponse<{ feedback: Feedback }>> {
    return this.http.put<ApiResponse<{ feedback: Feedback }>>(
      `${this.apiUrl}/${id}/approve`,
      {},
      { headers: this.authService.getAuthHeaders() }
    );
  }

  /**
   * Reject feedback (admin only)
   */
  rejectFeedback(id: string, rejectionReason?: string): Observable<ApiResponse<{ feedback: Feedback }>> {
    return this.http.put<ApiResponse<{ feedback: Feedback }>>(
      `${this.apiUrl}/${id}/reject`,
      { rejectionReason },
      { headers: this.authService.getAuthHeaders() }
    );
  }

  /**
   * Delete feedback (admin only)
   */
  deleteFeedback(id: string): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/${id}`,
      { headers: this.authService.getAuthHeaders() }
    );
  }
}
