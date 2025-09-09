import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Batch {
  _id: string;
  name: string;
  code: string;
  course: {
    _id: string;
    name: string;
    code: string;
  };
  department: {
    _id: string;
    name: string;
    code: string;
  };
  startYear: number;
  endYear: number;
  semesters: Array<{
    _id: string;
    name: string;
    code: string;
    year: number;
    type: string;
  }>;
  currentSemester?: {
    _id: string;
    name: string;
    code: string;
    year: number;
    type: string;
    startDate: string;
    endDate: string;
  };
  maxStudents: number;
  currentEnrollment: number;
  enrollmentPercentage: number;
  remainingSlots: number;
  description?: string;
  status: 'active' | 'inactive' | 'completed';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BatchCreate {
  name: string;
  code: string;
  course: string;
  department: string;
  startYear: number;
  endYear: number;
  maxStudents?: number;
  description?: string;
}

export interface BatchUpdate {
  name?: string;
  description?: string;
  maxStudents?: number;
  status?: 'active' | 'inactive' | 'completed';
}

export interface BatchFilter {
  page?: number;
  limit?: number;
  course?: string;
  department?: string;
  status?: string;
  startYear?: number;
}

export interface BatchResponse {
  success: boolean;
  data: Batch[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
  message?: string;
}

export interface SingleBatchResponse {
  success: boolean;
  data: Batch;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BatchService {
  private apiUrl = `${environment.apiUrl}/batches`;

  constructor(private http: HttpClient) {}

  /**
   * Get all batches with optional filtering and pagination
   */
  getBatches(filter: BatchFilter = {}): Observable<BatchResponse> {
    let params = new HttpParams();
    
    if (filter.page) params = params.set('page', filter.page.toString());
    if (filter.limit) params = params.set('limit', filter.limit.toString());
    if (filter.course) params = params.set('course', filter.course);
    if (filter.department) params = params.set('department', filter.department);
    if (filter.status) params = params.set('status', filter.status);
    if (filter.startYear) params = params.set('startYear', filter.startYear.toString());

    return this.http.get<BatchResponse>(this.apiUrl, { params });
  }

  /**
   * Get all active batches
   */
  getActiveBatches(): Observable<BatchResponse> {
    return this.http.get<BatchResponse>(`${this.apiUrl}/active`);
  }

  /**
   * Get batches by course ID
   */
  getBatchesByCourse(courseId: string): Observable<BatchResponse> {
    return this.http.get<BatchResponse>(`${this.apiUrl}/course/${courseId}`);
  }

  /**
   * Get batches by department ID
   */
  getBatchesByDepartment(departmentId: string): Observable<BatchResponse> {
    return this.http.get<BatchResponse>(`${this.apiUrl}/department/${departmentId}`);
  }

  /**
   * Get batch by ID
   */
  getBatchById(id: string): Observable<SingleBatchResponse> {
    return this.http.get<SingleBatchResponse>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new batch
   */
  createBatch(batch: BatchCreate): Observable<SingleBatchResponse> {
    return this.http.post<SingleBatchResponse>(this.apiUrl, batch);
  }

  /**
   * Update batch
   */
  updateBatch(id: string, batch: BatchUpdate): Observable<SingleBatchResponse> {
    return this.http.put<SingleBatchResponse>(`${this.apiUrl}/${id}`, batch);
  }

  /**
   * Add semester to batch
   */
  addSemesterToBatch(batchId: string, semesterId: string): Observable<SingleBatchResponse> {
    return this.http.post<SingleBatchResponse>(`${this.apiUrl}/${batchId}/semesters`, {
      semesterId
    });
  }

  /**
   * Set current semester for batch
   */
  setCurrentSemester(batchId: string, semesterId: string): Observable<SingleBatchResponse> {
    return this.http.put<SingleBatchResponse>(`${this.apiUrl}/${batchId}/current-semester`, {
      semesterId
    });
  }

  /**
   * Delete batch (soft delete)
   */
  deleteBatch(id: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Check if batch has available slots
   */
  hasAvailableSlots(batch: Batch): boolean {
    return batch.currentEnrollment < batch.maxStudents;
  }

  /**
   * Get enrollment percentage
   */
  getEnrollmentPercentage(batch: Batch): number {
    if (batch.maxStudents === 0) return 0;
    return Math.round((batch.currentEnrollment / batch.maxStudents) * 100);
  }

  /**
   * Get remaining slots
   */
  getRemainingSlots(batch: Batch): number {
    return Math.max(0, batch.maxStudents - batch.currentEnrollment);
  }

  /**
   * Format batch display name
   */
  formatBatchDisplayName(batch: Batch): string {
    return `${batch.name} (${batch.code}) - ${batch.startYear}-${batch.endYear}`;
  }

  /**
   * Get batch status color
   */
  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'primary';
      case 'inactive':
        return 'warn';
      case 'completed':
        return 'accent';
      default:
        return 'basic';
    }
  }

  /**
   * Get enrollment status color
   */
  getEnrollmentStatusColor(batch: Batch): string {
    const percentage = this.getEnrollmentPercentage(batch);
    if (percentage >= 90) return 'warn';
    if (percentage >= 70) return 'accent';
    return 'primary';
  }
}
