import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { StudentLayout } from '../student-layout/student-layout';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth.service';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-student-meetings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatProgressBarModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule,
    StudentLayout
  ],
  templateUrl: './student-meetings.component.html',
  styleUrls: ['./student-meetings.component.css']
})
export class StudentMeetingsComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/students`;

  meetings: any[] = [];
  filteredMeetings: any[] = [];
  uniqueSubjects: any[] = [];
  loading = false;
  
  // Filters
  searchTerm = '';
  filterStatus = 'all';
  filterSubject = 'all';
  filterDate = 'all';
  
  private refreshSubscription?: Subscription;

  ngOnInit() {
    this.loadMeetings();
    
    // Refresh meeting status every minute
    this.refreshSubscription = interval(60000).subscribe(() => {
      this.loadMeetings();
    });
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadMeetings() {
    this.loading = true;
    const user = this.authService.getCurrentUser();
    if (!user?._id) {
      this.loading = false;
      return;
    }

    // Get all authorized subjects with their meetings
    this.http.get<any>(`${this.apiUrl}/${user._id}/subjects`).subscribe({
      next: (response) => {
        console.log('API Response:', response); // Debug log
        const subjects = response.data || response.subjects || [];
        
        // Extract all meetings from all subjects
        const allMeetings: any[] = [];
        const subjectsMap = new Map();
        
        subjects.forEach((subject: any) => {
          subjectsMap.set(subject._id, subject);
          if (subject.allMeetings && subject.allMeetings.length > 0) {
            subject.allMeetings.forEach((meeting: any) => {
              allMeetings.push({
                ...meeting,
                subjectInfo: {
                  _id: subject._id,
                  name: subject.name,
                  code: subject.code
                }
              });
            });
          }
        });

        console.log('All Meetings:', allMeetings); // Debug log

        // Sort meetings by date (upcoming first)
        this.meetings = allMeetings.sort((a, b) => {
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        });

        // Extract unique subjects for filter
        this.uniqueSubjects = Array.from(subjectsMap.values());
        
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to load meetings', 'Close', { duration: 3000 });
      }
    });
  }

  applyFilters() {
    let filtered = [...this.meetings];

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter(meeting => 
        meeting.topic?.toLowerCase().includes(search) ||
        meeting.description?.toLowerCase().includes(search) ||
        this.getSubjectName(meeting).toLowerCase().includes(search) ||
        this.getLecturerName(meeting).toLowerCase().includes(search)
      );
    }

    // Status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(meeting => 
        this.getMeetingStatus(meeting) === this.filterStatus
      );
    }

    // Subject filter
    if (this.filterSubject !== 'all') {
      filtered = filtered.filter(meeting => 
        meeting.subjectInfo?._id === this.filterSubject ||
        meeting.subjectId === this.filterSubject ||
        meeting.subjectId?._id === this.filterSubject
      );
    }

    // Date filter
    if (this.filterDate !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(meeting => {
        const meetingDate = new Date(meeting.meetingDate);
        const meetingDay = new Date(meetingDate.getFullYear(), meetingDate.getMonth(), meetingDate.getDate());
        
        switch (this.filterDate) {
          case 'today':
            return meetingDay.getTime() === today.getTime();
          
          case 'this_week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return meetingDay >= weekStart && meetingDay <= weekEnd;
          
          case 'this_month':
            return meetingDate.getMonth() === now.getMonth() && 
                   meetingDate.getFullYear() === now.getFullYear();
          
          case 'past':
            return meetingDay < today;
          
          case 'future':
            return meetingDay > today;
          
          default:
            return true;
        }
      });
    }

    this.filteredMeetings = filtered;
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.filterSubject = 'all';
    this.filterDate = 'all';
    this.applyFilters();
  }

  getMeetingStatus(meeting: any): string {
    if (!meeting) return 'unknown';
    
    if (meeting.status === 'cancelled') return 'cancelled';
    if (meeting.status === 'completed') return 'completed';
    if (meeting.status === 'ongoing') return 'ongoing';
    
    // Check if expired
    if (this.isMeetingExpired(meeting)) return 'expired';
    
    // Otherwise it's upcoming
    return 'upcoming';
  }

  isMeetingExpired(meeting: any): boolean {
    if (!meeting.startTime) return false;
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    
    if (meeting.endTime) {
      const endTime = new Date(meeting.endTime);
      return now > endTime && meeting.status !== 'completed' && meeting.status !== 'cancelled';
    }
    
    return now > startTime && meeting.status === 'scheduled';
  }

  canJoinMeeting(meeting: any): boolean {
    const status = this.getMeetingStatus(meeting);
    return (status === 'upcoming' || status === 'ongoing') && meeting.dailyRoomUrl;
  }

  getMeetingIcon(meeting: any): string {
    const status = this.getMeetingStatus(meeting);
    switch (status) {
      case 'upcoming': return 'event';
      case 'ongoing': return 'video_call';
      case 'completed': return 'check_circle';
      case 'cancelled': return 'cancel';
      case 'expired': return 'event_busy';
      default: return 'event';
    }
  }

  getStatusIcon(meeting: any): string {
    const status = this.getMeetingStatus(meeting);
    switch (status) {
      case 'upcoming': return 'event';
      case 'ongoing': return 'live_tv';
      case 'completed': return 'check_circle';
      case 'cancelled': return 'cancel';
      case 'expired': return 'event_busy';
      default: return 'event';
    }
  }

  getStatusLabel(meeting: any): string {
    const status = this.getMeetingStatus(meeting);
    switch (status) {
      case 'upcoming': return 'Upcoming';
      case 'ongoing': return 'Live Now';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  }

  getSubjectName(meeting: any): string {
    if (meeting.subjectInfo) {
      return meeting.subjectInfo.name || 'N/A';
    }
    if (typeof meeting.subjectId === 'object' && meeting.subjectId) {
      return meeting.subjectId.name || 'N/A';
    }
    return 'N/A';
  }

  getLecturerName(meeting: any): string {
    if (typeof meeting.lecturerId === 'object' && meeting.lecturerId) {
      const lecturer = meeting.lecturerId;
      return lecturer.firstName && lecturer.lastName 
        ? `${lecturer.firstName} ${lecturer.lastName}` 
        : lecturer.name || 'N/A';
    }
    return 'N/A';
  }

  formatMeetingDate(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  formatMeetingTime(time: any): string {
    if (!time) return 'N/A';
    const t = new Date(time);
    return t.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  }

  formatDateTime(datetime: any): string {
    if (!datetime) return 'N/A';
    const d = new Date(datetime);
    return d.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  getMeetingDuration(meeting: any): string {
    if (meeting.duration) {
      return `${meeting.duration} minutes`;
    }
    if (meeting.startTime && meeting.endTime) {
      const start = new Date(meeting.startTime);
      const end = new Date(meeting.endTime);
      const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      return `${durationMinutes} minutes`;
    }
    return 'N/A';
  }

  getTimeUntilMeeting(meeting: any): string {
    if (!meeting.startTime) return '';
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const diffMs = startTime.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Meeting time has passed';

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 60) {
      return `Starts in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Starts in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      return `Starts in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }
  }

  getTotalMeetings(): number {
    return this.meetings.length;
  }

  getUpcomingMeetings(): number {
    return this.meetings.filter(m => this.getMeetingStatus(m) === 'upcoming').length;
  }

  getOngoingMeetings(): number {
    return this.meetings.filter(m => this.getMeetingStatus(m) === 'ongoing').length;
  }
}
