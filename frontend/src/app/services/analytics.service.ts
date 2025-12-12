import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EmotionPercentages {
  happy: number;
  sad: number;
  angry: number;
  surprised: number;
  fearful: number;
  disgusted: number;
  neutral: number;
  unknown: number;
}

export interface StudentEmotionSummary {
  studentId: string;
  studentName: string;
  email: string;
  rollNumber: string;
  role?: string;
  emotionPercentages: EmotionPercentages;
  dominantEmotion: string;
  totalRecords: number;
  avgAttentiveness: number;
}

export interface AttendanceSummary {
  studentId: string;
  studentName: string;
  email: string;
  rollNumber: string;
  role?: string;
  status: string;
  firstJoinTime: Date;
  lastLeaveTime: Date;
  totalDuration: number;
  attendancePercentage: number;
  isLate: boolean;
  rejoinCount: number;
  sessions: any[];
}

export interface MeetingAnalytics {
  meeting: {
    id: string;
    topic: string;
    description: string;
    meetingDate: Date;
    startTime: Date;
    endTime: Date;
    startedAt: Date;
    endedAt: Date;
    duration: number;
    status: string;
    lecturer: any;
    subject: any;
    batch: any;
    department: any;
  };
  emotionAnalytics: {
    overallEmotionPercentages: EmotionPercentages;
    totalEmotionRecords: number;
    studentsTracked: number;
    studentSummaries: StudentEmotionSummary[];
  };
  attendanceAnalytics: {
    totalStudents: number;
    presentCount: number;
    lateCount: number;
    attendancePercentage: number;
    attendanceSummaries: AttendanceSummary[];
  };
}

export interface MeetingListItem {
  id: string;
  topic: string;
  meetingDate: Date;
  startTime: Date;
  status: string;
  lecturer?: any;
  subject: any;
  batch: any;
  department: any;
  analytics: {
    totalEmotionRecords: number;
    totalStudents: number;
    presentCount: number;
    attendanceRate: number;
    emotionBreakdown: any;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Get comprehensive analytics for a specific meeting
   */
  getMeetingAnalytics(meetingId: string): Observable<{ success: boolean; data: MeetingAnalytics }> {
    return this.http.get<{ success: boolean; data: MeetingAnalytics }>(
      `${this.apiUrl}/analytics/meetings/${meetingId}/analytics`
    );
  }

  /**
   * Get all meetings analytics (Admin only)
   */
  getAdminMeetingsAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    departmentId?: string;
    status?: string;
  }): Observable<{ success: boolean; data: { meetings: MeetingListItem[]; totalMeetings: number } }> {
    let url = `${this.apiUrl}/analytics/admin/meetings/analytics`;
    const params: string[] = [];

    if (filters?.startDate) params.push(`startDate=${filters.startDate}`);
    if (filters?.endDate) params.push(`endDate=${filters.endDate}`);
    if (filters?.departmentId) params.push(`departmentId=${filters.departmentId}`);
    if (filters?.status) params.push(`status=${filters.status}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<{ success: boolean; data: { meetings: MeetingListItem[]; totalMeetings: number } }>(url);
  }

  /**
   * Get lecturer's meetings analytics
   */
  getLecturerMeetingsAnalytics(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
  }): Observable<{ success: boolean; data: { meetings: MeetingListItem[]; totalMeetings: number } }> {
    let url = `${this.apiUrl}/analytics/lecturer/meetings/analytics`;
    const params: string[] = [];

    if (filters?.startDate) params.push(`startDate=${filters.startDate}`);
    if (filters?.endDate) params.push(`endDate=${filters.endDate}`);
    if (filters?.status) params.push(`status=${filters.status}`);

    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }

    return this.http.get<{ success: boolean; data: { meetings: MeetingListItem[]; totalMeetings: number } }>(url);
  }
}
