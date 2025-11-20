import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StudentLayout } from '../student-layout/student-layout';
import { AuthService } from '../../../services/auth.service';
import { StatisticsService, StudentDashboardStats } from '../../../services/statistics.service';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface DashboardStat {
  title: string;
  value: number;
  icon: string;
  color: string;
  subtitle: string;
  growth: string;
  route?: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    MatProgressBarModule,
    MatTableModule,
    MatChipsModule,
    MatTooltipModule,
    StudentLayout
  ],
  templateUrl: './student-dashboard.html',
  styleUrls: ['./student-dashboard.css']
})
export class StudentDashboard implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isLoading = true;
  currentUser: any = null;
  studentDashboardStats: StudentDashboardStats | null = null;
  
  // Dashboard statistics
  dashboardStats: DashboardStat[] = [];
  
  // Table columns
  assignmentColumns: string[] = ['subject', 'title', 'modules', 'totalMarks', 'dueDate', 'daysRemaining'];
  meetingColumns: string[] = ['subject', 'topic', 'meetingDate', 'duration', 'status'];

  constructor(
    private authService: AuthService,
    private statisticsService: StatisticsService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Start status monitoring when dashboard loads
    this.authService.startStatusMonitoring();
    
    // Get current user
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser && this.currentUser._id) {
      this.loadDashboardData();
    } else {
      console.error('No user found');
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    this.statisticsService.getStudentDashboardStats(this.currentUser._id)
      .pipe(
        takeUntil(this.destroy$),
        catchError(error => {
          console.error('Error loading student dashboard:', error);
          this.isLoading = false;
          return of({ success: false, data: null });
        })
      )
      .subscribe(response => {
        if (response.success && response.data) {
          this.studentDashboardStats = response.data;
          this.calculateStatistics();
        }
        this.isLoading = false;
      });
  }

  private calculateStatistics(): void {
    if (!this.studentDashboardStats) return;

    this.dashboardStats = [
      {
        title: 'Enrolled Subjects',
        value: this.studentDashboardStats.subjects.total,
        icon: 'subject',
        color: '#4CAF50',
        subtitle: 'Active subjects',
        growth: `${this.studentDashboardStats.subjects.active} active`,
        route: '/student/subjects'
      },
      {
        title: 'Total Assignments',
        value: this.studentDashboardStats.assignments.total,
        icon: 'assignment',
        color: '#FF9800',
        subtitle: 'All assignments',
        growth: `${this.studentDashboardStats.assignments.pending} pending`,
        route: '/student/assignments'
      },
      {
        title: 'Completed Assignments',
        value: this.studentDashboardStats.assignments.completed,
        icon: 'assignment_turned_in',
        color: '#2196F3',
        subtitle: 'Submitted',
        growth: `${this.studentDashboardStats.assignments.submissionRate}% rate`,
        route: '/student/assignments'
      },
      {
        title: 'Total Meetings',
        value: this.studentDashboardStats.meetings.total,
        icon: 'video_call',
        color: '#9C27B0',
        subtitle: 'All meetings',
        growth: `${this.studentDashboardStats.meetings.upcoming} upcoming`,
        route: '/student/meetings'
      }
    ];
  }

  // Navigation
  navigateToPage(route?: string): void {
    if (route) {
      this.router.navigate([route]);
    }
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  // Helper methods
  getSubjectName(subject: any): string {
    return typeof subject === 'string' ? subject : subject?.name || 'N/A';
  }

  getModuleNames(modules: any[]): string {
    if (!modules || modules.length === 0) return 'None';
    return modules.map(m => typeof m === 'string' ? m : m?.name || '').filter(n => n).join(', ');
  }

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
      day: 'numeric',
      year: 'numeric'
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

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
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

  getMeetingStatusColor(status: string): string {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return '#2196F3';
      case 'ongoing':
        return '#4CAF50';
      case 'completed':
        return '#757575';
      case 'cancelled':
        return '#f44336';
      default:
        return '#9E9E9E';
    }
  }

  getAssignmentLevelBadgeClass(level: string): string {
    switch (level?.toLowerCase()) {
      case 'easy':
        return 'badge-easy';
      case 'medium':
        return 'badge-medium';
      case 'hard':
        return 'badge-hard';
      default:
        return 'badge-default';
    }
  }

  getProgressPercentage(stat: DashboardStat): number {
    if (!this.studentDashboardStats) return 0;

    switch (stat.title) {
      case 'Enrolled Subjects':
        return this.studentDashboardStats.subjects.total > 0 
          ? Math.round((this.studentDashboardStats.subjects.active / this.studentDashboardStats.subjects.total) * 100) 
          : 0;
      
      case 'Total Assignments':
        return this.studentDashboardStats.assignments.total > 0 
          ? Math.round((this.studentDashboardStats.assignments.pending / this.studentDashboardStats.assignments.total) * 100) 
          : 0;
      
      case 'Completed Assignments':
        return this.studentDashboardStats.assignments.submissionRate;
      
      case 'Total Meetings':
        return this.studentDashboardStats.meetings.total > 0 
          ? Math.round((this.studentDashboardStats.meetings.upcoming / this.studentDashboardStats.meetings.total) * 100) 
          : 0;
      
      default:
        return 0;
    }
  }
}
