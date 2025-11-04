import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Meeting {
  _id?: string;
  topic: string;
  description: string;
  departmentId: string;
  courseId: string;
  batchId: string;
  semesterId: string;
  subjectId: string;
  lecturerId: string;
  moduleIds: string[];
  meetingDate: Date;
  startTime: Date;
  endTime?: Date;
  dailyRoomName: string;
  dailyRoomUrl: string;
  dailyRoomConfig?: any;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  studentCount: number;
  startedAt?: Date;
  endedAt?: Date;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateMeetingRequest {
  topic: string;
  description: string;
  departmentId: string;
  courseId: string;
  batchId: string;
  semesterId: string;
  subjectId: string;
  moduleIds: string[];
  meetingDate: string;
  startTime: string;
  endTime?: string;
  duration?: number;
}

export interface MeetingResponse {
  success: boolean;
  message?: string;
  meeting?: Meeting;
  meetings?: Meeting[];
  count?: number;
}

export interface CanStartResponse {
  success: boolean;
  canStart: boolean;
  currentTime: Date;
  scheduledTime: Date;
  status: string;
}

export interface StartMeetingResponse {
  success: boolean;
  message: string;
  meeting: Meeting;
  token: string;
  roomUrl: string;
}

export interface JoinMeetingResponse {
  success: boolean;
  message: string;
  token: string;
  roomUrl: string;
  meeting: {
    topic: string;
    description: string;
    startTime: Date;
  };
}

@Injectable({
  providedIn: 'root'
})
export class MeetingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/meetings`;

  /**
   * Get authorization headers
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Create a new meeting
   */
  createMeeting(meetingData: CreateMeetingRequest): Observable<MeetingResponse> {
    return this.http.post<MeetingResponse>(
      this.apiUrl,
      meetingData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get all meetings with optional filters
   */
  getMeetings(filters?: {
    departmentId?: string;
    courseId?: string;
    batchId?: string;
    semesterId?: string;
    subjectId?: string;
    status?: string;
  }): Observable<MeetingResponse> {
    let url = this.apiUrl;
    
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }

    return this.http.get<MeetingResponse>(url, { headers: this.getHeaders() });
  }

  /**
   * Get meeting by ID
   */
  getMeetingById(meetingId: string): Observable<MeetingResponse> {
    return this.http.get<MeetingResponse>(
      `${this.apiUrl}/${meetingId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Check if meeting can start now
   */
  canStartMeeting(meetingId: string): Observable<CanStartResponse> {
    return this.http.get<CanStartResponse>(
      `${this.apiUrl}/${meetingId}/can-start`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Start a meeting
   */
  startMeeting(meetingId: string): Observable<StartMeetingResponse> {
    return this.http.post<StartMeetingResponse>(
      `${this.apiUrl}/${meetingId}/start`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * End a meeting and update student count
   */
  endMeeting(meetingId: string, studentCount: number): Observable<MeetingResponse> {
    return this.http.post<MeetingResponse>(
      `${this.apiUrl}/${meetingId}/end`,
      { studentCount },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Join a meeting (for students)
   */
  joinMeeting(meetingId: string): Observable<JoinMeetingResponse> {
    return this.http.post<JoinMeetingResponse>(
      `${this.apiUrl}/${meetingId}/join`,
      {},
      { headers: this.getHeaders() }
    );
  }

  /**
   * Update meeting details
   */
  updateMeeting(meetingId: string, updateData: Partial<CreateMeetingRequest>): Observable<MeetingResponse> {
    return this.http.put<MeetingResponse>(
      `${this.apiUrl}/${meetingId}`,
      updateData,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Cancel/delete a meeting
   */
  deleteMeeting(meetingId: string): Observable<MeetingResponse> {
    return this.http.delete<MeetingResponse>(
      `${this.apiUrl}/${meetingId}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Get modules for a subject
   */
  getModulesBySubject(subjectId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/subject/${subjectId}/modules`,
      { headers: this.getHeaders() }
    );
  }
}
