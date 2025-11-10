import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StudentLayout } from '../student-layout/student-layout';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface Module {
  _id: string;
  name: string;
  description: string;
  moduleNumber: number;
  duration: number;
  pdfUrl?: string;
  videoUrl?: string;
  assignments: Assignment[];
  meetings: Meeting[];
}

interface Assignment {
  _id: string;
  title: string;
  dueDate: Date;
  totalMarks: number;
  type: string;
  level: string;
}

interface Meeting {
  _id: string;
  topic: string;
  meetingDate: Date;
  startTime: Date;
  duration: number;
  status: string;
}

interface SubjectDetail {
  _id: string;
  name: string;
  code: string;
  description: string;
  creditHours: number;
  department: any;
  course: any;
  batch: any;
  semester: any;
  lecturer: any;
  modules: Module[];
  statistics: {
    moduleCount: number;
    assignmentCount: number;
    pendingAssignments: number;
    completedAssignments: number;
    meetingCount: number;
    scheduledMeetings: number;
    completedMeetings: number;
    upcomingMeetings: number;
  };
  allAssignments: any[];
  allMeetings: any[];
}

@Component({
  selector: 'app-student-subjects',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule,
    MatProgressBarModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    StudentLayout
  ],
  templateUrl: './student-subjects.html',
  styleUrls: ['./student-subjects.css']
})
export class StudentSubjects implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private apiUrl = `${environment.apiUrl}/students`;
  
  isLoading = true;
  currentUser: any = null;
  subjects: SubjectDetail[] = [];

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser && this.currentUser._id) {
      this.loadSubjects();
    } else {
      console.error('No user found');
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubjects(): void {
    this.isLoading = true;
    
    this.http.get<{ success: boolean; data: SubjectDetail[] }>(
      `${this.apiUrl}/${this.currentUser._id}/subjects`
    )
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading subjects:', error);
          this.isLoading = false;
          return of({ success: false, data: [] });
        })
      )
      .subscribe(response => {
        if (response.success && response.data) {
          this.subjects = response.data;
          console.log('Loaded subjects:', this.subjects);
        }
        this.isLoading = false;
      });
  }

  // Get unique departments from subjects
  getDepartmentNames(): string {
    const departments = this.subjects
      .map((s: SubjectDetail) => s.department?.name)
      .filter((name: string, index: number, self: string[]) => name && self.indexOf(name) === index);
    return departments.length > 0 ? departments.join(', ') : 'All Departments';
  }

  // Get unique courses from subjects
  getCourseNames(): string {
    const courses = this.subjects
      .map((s: SubjectDetail) => s.course?.name)
      .filter((name: string, index: number, self: string[]) => name && self.indexOf(name) === index);
    return courses.length > 0 ? courses.join(', ') : 'All Courses';
  }

  // Helper methods
  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatDateTime(date: any, time: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    const dateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    if (time) {
      const t = new Date(time);
      const timeStr = t.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `${dateStr}, ${timeStr}`;
    }
    return dateStr;
  }

  getDaysRemaining(dueDate: any): number {
    if (!dueDate) return 0;
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDaysRemainingText(days: number): string {
    if (days < 0) return 'Overdue';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day';
    return `${days} days`;
  }

  getDaysRemainingClass(days: number): string {
    if (days < 0) return 'overdue';
    if (days <= 2) return 'urgent';
    if (days <= 5) return 'warning';
    return 'normal';
  }

  getAssignmentLevelClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'easy':
        return 'level-easy';
      case 'medium':
        return 'level-medium';
      case 'hard':
        return 'level-hard';
      default:
        return 'level-default';
    }
  }

  getMeetingStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'status-scheduled';
      case 'ongoing':
        return 'status-ongoing';
      case 'completed':
        return 'status-completed';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return 'status-default';
    }
  }

  getProgressPercentage(subject: SubjectDetail): number {
    const total = subject.statistics.assignmentCount + subject.statistics.meetingCount;
    const completed = subject.statistics.completedAssignments + subject.statistics.completedMeetings;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }
}
