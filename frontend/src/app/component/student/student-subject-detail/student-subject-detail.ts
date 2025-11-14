import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { StudentLayout } from '../student-layout/student-layout';
import { AuthService } from '../../../services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Subject as RxSubject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { PdfViewerComponent } from '../pdf-viewer/pdf-viewer.component';
import { VideoPlayerComponent } from '../video-player/video-player.component';
import { StudentSubjectLevelService } from '../../../services/student-subject-level.service';
import { ExtraModuleService } from '../../../services/extra-module.service';

@Component({
  selector: 'app-student-subject-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTabsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatExpansionModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
    StudentLayout
  ],
  templateUrl: './student-subject-detail.html',
  styleUrls: ['./student-subject-detail.css']
})
export class StudentSubjectDetail implements OnInit, OnDestroy {
  private destroy$ = new RxSubject<void>();
  private apiUrl = `${environment.apiUrl}/students`;

  isLoading = true;
  currentUser: any = null;
  subjectId: string | null = null;
  subject: any = null;
  studentLevel: string = 'beginner'; // Student's level for this subject
  extraModules: any[] = []; // Extra modules based on student level
  loadingExtraModules = false;

  // Make Math available in template
  Math = Math;

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient,
    private authService: AuthService,
    private dialog: MatDialog,
    private studentSubjectLevelService: StudentSubjectLevelService,
    private extraModuleService: ExtraModuleService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.subjectId = this.route.snapshot.paramMap.get('id');

    if (!this.subjectId) {
      console.error('Subject id missing');
      this.isLoading = false;
      return;
    }

    if (!this.currentUser || !this.currentUser._id) {
      console.error('Student not logged in');
      this.isLoading = false;
      return;
    }

    this.loadSubject();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubject(): void {
    this.isLoading = true;
    this.http.get<{ success: boolean; data: any }>(`${this.apiUrl}/${this.currentUser._id}/subjects/${this.subjectId}`)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('Error loading subject detail:', err);
          this.isLoading = false;
          return of({ success: false, data: null });
        })
      )
      .subscribe(res => {
        if (res.success && res.data) {
          this.subject = res.data;
          // Load student level and extra modules after subject is loaded
          this.loadStudentLevel();
        }
        this.isLoading = false;
      });
  }

  loadStudentLevel(): void {
    if (!this.currentUser || !this.subjectId) return;

    this.studentSubjectLevelService.getStudentSubjectLevel(this.currentUser._id, this.subjectId)
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.log('No student level found yet, defaulting to beginner');
          this.studentLevel = 'beginner';
          this.loadExtraModules();
          return of({ success: false, data: null });
        })
      )
      .subscribe(res => {
        if (res.success && res.data) {
          this.studentLevel = res.data.level || 'beginner';
          console.log('Student level for this subject:', this.studentLevel);
        } else {
          this.studentLevel = 'beginner';
        }
        this.loadExtraModules();
      });
  }

  loadExtraModules(): void {
    if (!this.subjectId || !this.studentLevel) return;

    this.loadingExtraModules = true;
    
    // Convert student level to match extra module enum format
    const levelMap: { [key: string]: 'Beginner' | 'Intermediate' | 'Advanced' } = {
      'beginner': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };
    
    const formattedLevel = levelMap[this.studentLevel.toLowerCase()];
    
    // Fetch extra modules for this subject and student level
    // The backend will filter by studentLevel matching the extra module type
    this.extraModuleService.getExtraModules({
      subject: this.subjectId,
      studentLevel: formattedLevel
    })
      .pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          console.error('Error loading extra modules:', err);
          this.loadingExtraModules = false;
          return of({ success: false, data: [] });
        })
      )
      .subscribe(res => {
        if (res.success && res.data) {
          this.extraModules = Array.isArray(res.data) ? res.data : (res.data.extraModules || []);
          console.log(`Found ${this.extraModules.length} extra modules for level: ${this.studentLevel}`);
        } else {
          this.extraModules = [];
        }
        this.loadingExtraModules = false;
      });
  }

  capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  getLevelBadgeClass(level: string): string {
    const levelMap: any = {
      'beginner': 'level-beginner',
      'intermediate': 'level-intermediate',
      'advanced': 'level-advanced',
      'Beginner': 'level-beginner',
      'Intermediate': 'level-intermediate',
      'Advanced': 'level-advanced',
      'All': 'level-all'
    };
    return levelMap[level] || 'level-beginner';
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatDateTime(date: any, time?: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  getDaysRemaining(dueDate: any): number {
    if (!dueDate) return 0;
    const now = new Date();
    const due = new Date(dueDate);
    return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  getDaysRemainingClass(days: number): string {
    if (days < 0) return 'overdue';
    if (days <= 2) return 'urgent';
    if (days <= 5) return 'warning';
    return 'normal';
  }

  openPdfViewer(url: string, title: string): void {
    this.dialog.open(PdfViewerComponent, {
      data: { url, title },
      width: '95vw',
      height: '95vh',
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'pdf-viewer-dialog'
    });
  }

  openVideoPlayer(url: string, title: string): void {
    this.dialog.open(VideoPlayerComponent, {
      data: { url, title },
      maxWidth: '95vw',
      maxHeight: '95vh',
      panelClass: 'video-player-dialog'
    });
  }

  // Meeting Helper Methods
  isMeetingExpired(meeting: any): boolean {
    if (!meeting.startTime) return false;
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    
    // If meeting has an end time, check against that
    if (meeting.endTime) {
      const endTime = new Date(meeting.endTime);
      return now > endTime && meeting.status !== 'completed' && meeting.status !== 'cancelled';
    }
    
    // Otherwise, consider it expired if current time is past start time
    // and status is still 'scheduled' (not updated to ongoing/completed)
    return now > startTime && meeting.status === 'scheduled';
  }

  getMeetingStatusIcon(status: string, isExpired: boolean = false): string {
    if (isExpired) return 'event_busy';
    switch (status) {
      case 'scheduled': return 'event';
      case 'ongoing': return 'video_call';
      case 'completed': return 'check_circle';
      case 'cancelled': return 'cancel';
      default: return 'event';
    }
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

  getMeetingTimeStatus(meeting: any): string {
    if (!meeting.startTime) return 'unknown';
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const endTime = meeting.endTime ? new Date(meeting.endTime) : null;

    if (now < startTime) return 'upcoming';
    if (endTime && now > endTime) return 'past';
    if (now >= startTime && (!endTime || now <= endTime)) return 'ongoing';
    return 'unknown';
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
}