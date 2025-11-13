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

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient,
    private authService: AuthService,
    private dialog: MatDialog
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
        }
        this.isLoading = false;
      });
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
}