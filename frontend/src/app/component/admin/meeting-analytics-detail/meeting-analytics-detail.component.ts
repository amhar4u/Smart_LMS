import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AnalyticsService, MeetingAnalytics } from '../../../services/analytics.service';
import { AuthService } from '../../../services/auth.service';
import { AdminLayout } from '../admin-layout/admin-layout';
import { LecturerLayout } from '../../lecturer/lecturer-layout/lecturer-layout';

@Component({
  selector: 'app-meeting-analytics-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatTooltipModule,
    MatTabsModule,
    MatSnackBarModule,
    AdminLayout,
    LecturerLayout
  ],
  template: `
    <ng-container *ngIf="isAdmin; else lecturerLayout">
      <app-admin-layout>
        <div class="analytics-detail-content">
          <ng-container *ngTemplateOutlet="analyticsContent"></ng-container>
        </div>
      </app-admin-layout>
    </ng-container>
    
    <ng-template #lecturerLayout>
      <app-lecturer-layout>
        <div class="analytics-detail-content">
          <ng-container *ngTemplateOutlet="analyticsContent"></ng-container>
        </div>
      </app-lecturer-layout>
    </ng-template>

    <ng-template #analyticsContent>
      <div class="analytics-detail-container">
        <!-- Back Button -->
        <button mat-raised-button color="primary" (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
          Back to Analytics
        </button>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading detailed analytics...</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading && analytics">
        <!-- Header -->
        <div class="header">
          <div class="header-content">
            <h1>{{ analytics.meeting.topic }}</h1>
            <p class="description">{{ analytics.meeting.description }}</p>
            <div class="meeting-meta">
              <mat-chip class="meta-chip">
                <mat-icon>event</mat-icon>
                {{ analytics.meeting.meetingDate | date:'fullDate' }}
              </mat-chip>
              <mat-chip class="meta-chip">
                <mat-icon>schedule</mat-icon>
                {{ analytics.meeting.startTime | date:'shortTime' }} - {{ analytics.meeting.endTime | date:'shortTime' }}
              </mat-chip>
              <mat-chip [class]="'status-' + analytics.meeting.status">
                {{ analytics.meeting.status }}
              </mat-chip>
            </div>
          </div>
        </div>

        <!-- Overview Cards -->
        <div class="overview-cards">
          <mat-card class="overview-card">
            <mat-card-content>
              <div class="card-icon attendance">
                <mat-icon>how_to_reg</mat-icon>
              </div>
              <div class="card-info">
                <h3>Attendance Rate</h3>
                <div class="big-number">{{ analytics.attendanceAnalytics.attendancePercentage }}%</div>
                <p>{{ analytics.attendanceAnalytics.presentCount }}/{{ analytics.attendanceAnalytics.totalStudents }} students present</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="overview-card">
            <mat-card-content>
              <div class="card-icon emotion">
                <mat-icon>mood</mat-icon>
              </div>
              <div class="card-info">
                <h3>Emotion Tracking</h3>
                <div class="big-number">{{ analytics.emotionAnalytics.totalEmotionRecords }}</div>
                <p>{{ analytics.emotionAnalytics.studentsTracked }} students tracked</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="overview-card">
            <mat-card-content>
              <div class="card-icon duration">
                <mat-icon>timer</mat-icon>
              </div>
              <div class="card-info">
                <h3>Duration</h3>
                <div class="big-number">{{ formatDuration(analytics.meeting.duration) }}</div>
                <p>Total meeting time</p>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="overview-card">
            <mat-card-content>
              <div class="card-icon late">
                <mat-icon>schedule</mat-icon>
              </div>
              <div class="card-info">
                <h3>Late Arrivals</h3>
                <div class="big-number">{{ analytics.attendanceAnalytics.lateCount }}</div>
                <p>Students arrived late</p>
              </div>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Tabs -->
        <mat-tab-group class="analytics-tabs">
          <!-- Overall Emotion Analytics Tab -->
          <mat-tab label="Emotion Analytics">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Overall Emotion Distribution</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <div class="emotion-chart">
                    <div *ngFor="let emotion of getEmotionEntries()" class="emotion-row">
                      <div class="emotion-label">
                        <mat-icon [class]="'emotion-icon ' + emotion.key">{{ getEmotionIcon(emotion.key) }}</mat-icon>
                        <span>{{ emotion.key | titlecase }}</span>
                      </div>
                      <div class="emotion-bar-container">
                        <div class="emotion-bar" [class]="emotion.key" [style.width.%]="emotion.value"></div>
                        <span class="emotion-percentage">{{ emotion.value }}%</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>

              <!-- Student-wise Emotion Summary -->
              <mat-card class="student-emotions-card">
                <mat-card-header>
                  <mat-card-title>Participant Emotion Analysis</mat-card-title>
                  <mat-card-subtitle>Individual emotion breakdown for each participant</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <div class="student-emotion-grid">
                    <mat-card *ngFor="let student of analytics.emotionAnalytics.studentSummaries" class="student-card">
                      <mat-card-header>
                        <div class="student-header">
                          <div class="student-avatar">
                            <mat-icon>{{ student.role === 'lecturer' ? 'school' : 'person' }}</mat-icon>
                          </div>
                          <div class="student-info">
                            <h4>
                              {{ student.studentName }}
                              <mat-chip *ngIf="student.role === 'lecturer'" class="role-chip-small">Lecturer</mat-chip>
                            </h4>
                            <p>{{ student.rollNumber }}</p>
                          </div>
                        </div>
                      </mat-card-header>
                      <mat-card-content>
                        <div class="dominant-emotion">
                          <mat-icon [class]="'emotion-icon ' + student.dominantEmotion">
                            {{ getEmotionIcon(student.dominantEmotion) }}
                          </mat-icon>
                          <span>{{ student.dominantEmotion | titlecase }}</span>
                        </div>
                        
                        <div class="student-stats">
                          <div class="stat">
                            <span class="stat-label">Avg Attentiveness</span>
                            <span class="stat-value">{{ student.avgAttentiveness }}%</span>
                          </div>
                          <div class="stat">
                            <span class="stat-label">Records</span>
                            <span class="stat-value">{{ student.totalRecords }}</span>
                          </div>
                        </div>

                        <div class="mini-emotion-chart">
                          <div *ngFor="let emotion of getStudentEmotionEntries(student.emotionPercentages)" 
                               class="mini-emotion-bar"
                               [class]="emotion.key"
                               [style.height.%]="emotion.value"
                               matTooltip="{{ emotion.key | titlecase }}: {{ emotion.value }}%"></div>
                        </div>
                      </mat-card-content>
                    </mat-card>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>

          <!-- Attendance Tab -->
          <mat-tab label="Attendance">
            <div class="tab-content">
              <mat-card>
                <mat-card-header>
                  <mat-card-title>Attendance Details</mat-card-title>
                </mat-card-header>
                <mat-card-content>
                  <table mat-table [dataSource]="analytics.attendanceAnalytics.attendanceSummaries" class="attendance-table">
                    <!-- Student Name Column -->
                    <ng-container matColumnDef="student">
                      <th mat-header-cell *matHeaderCellDef>Participant</th>
                      <td mat-cell *matCellDef="let element">
                        <div class="student-cell">
                          <mat-icon>{{ element.role === 'lecturer' ? 'school' : 'person' }}</mat-icon>
                          <div>
                            <div class="student-name">
                              {{ element.studentName }}
                              <mat-chip *ngIf="element.role === 'lecturer'" class="role-chip">Lecturer</mat-chip>
                            </div>
                            <div class="student-roll">{{ element.rollNumber }}</div>
                          </div>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Status Column -->
                    <ng-container matColumnDef="status">
                      <th mat-header-cell *matHeaderCellDef>Status</th>
                      <td mat-cell *matCellDef="let element">
                        <mat-chip [class]="'status-' + element.status">
                          {{ element.status }}
                        </mat-chip>
                      </td>
                    </ng-container>

                    <!-- Join Time Column -->
                    <ng-container matColumnDef="joinTime">
                      <th mat-header-cell *matHeaderCellDef>First Join</th>
                      <td mat-cell *matCellDef="let element">
                        {{ element.firstJoinTime | date:'short' }}
                      </td>
                    </ng-container>

                    <!-- Duration Column -->
                    <ng-container matColumnDef="duration">
                      <th mat-header-cell *matHeaderCellDef>Duration</th>
                      <td mat-cell *matCellDef="let element">
                        {{ formatDuration(element.totalDuration) }}
                      </td>
                    </ng-container>

                    <!-- Attendance % Column -->
                    <ng-container matColumnDef="percentage">
                      <th mat-header-cell *matHeaderCellDef>Attendance %</th>
                      <td mat-cell *matCellDef="let element">
                        <div class="percentage-cell">
                          <div class="percentage-bar">
                            <div class="percentage-fill" 
                                 [style.width.%]="element.attendancePercentage"
                                 [class.good]="element.attendancePercentage >= 80"
                                 [class.medium]="element.attendancePercentage >= 60 && element.attendancePercentage < 80"
                                 [class.poor]="element.attendancePercentage < 60"></div>
                          </div>
                          <span class="percentage-text">{{ element.attendancePercentage }}%</span>
                        </div>
                      </td>
                    </ng-container>

                    <!-- Rejoins Column -->
                    <ng-container matColumnDef="rejoins">
                      <th mat-header-cell *matHeaderCellDef>Rejoins</th>
                      <td mat-cell *matCellDef="let element">
                        <mat-chip *ngIf="element.rejoinCount > 0" class="rejoin-chip">
                          {{ element.rejoinCount }}
                        </mat-chip>
                        <span *ngIf="element.rejoinCount === 0">-</span>
                      </td>
                    </ng-container>

                    <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                    <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                  </table>
                </mat-card-content>
              </mat-card>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .analytics-detail-content {
      min-height: 100vh;
      background: #f5f5f5;
    }

    .analytics-detail-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .back-button {
      margin-bottom: 24px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .back-button mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 20px;
    }

    .header {
      margin-bottom: 32px;
    }

    .header h1 {
      font-size: 32px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .description {
      color: #666;
      margin: 0 0 16px 0;
    }

    .meeting-meta {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .meta-chip {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .status-scheduled { background: #2196f3; color: white; }
    .status-ongoing { background: #4caf50; color: white; }
    .status-completed { background: #9e9e9e; color: white; }
    .status-cancelled { background: #f44336; color: white; }
    .status-present { background: #4caf50; color: white; }
    .status-late { background: #ff9800; color: white; }
    .status-absent { background: #f44336; color: white; }

    .overview-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }

    .overview-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px !important;
    }

    .card-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .card-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .card-icon.attendance {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .card-icon.emotion {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .card-icon.duration {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .card-icon.late {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }

    .card-info {
      flex: 1;
    }

    .card-info h3 {
      margin: 0 0 8px 0;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      text-transform: uppercase;
    }

    .big-number {
      font-size: 36px;
      font-weight: 700;
      color: #333;
      line-height: 1;
      margin-bottom: 4px;
    }

    .card-info p {
      margin: 0;
      font-size: 14px;
      color: #999;
    }

    .analytics-tabs {
      margin-top: 32px;
    }

    .tab-content {
      padding: 24px 0;
    }

    .emotion-chart {
      padding: 16px 0;
    }

    .emotion-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }

    .emotion-label {
      min-width: 120px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }

    .emotion-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .emotion-icon.happy { color: #4caf50; }
    .emotion-icon.sad { color: #2196f3; }
    .emotion-icon.angry { color: #f44336; }
    .emotion-icon.surprised { color: #ff9800; }
    .emotion-icon.fearful { color: #9c27b0; }
    .emotion-icon.disgusted { color: #795548; }
    .emotion-icon.neutral { color: #9e9e9e; }
    .emotion-icon.unknown { color: #607d8b; }

    .emotion-bar-container {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .emotion-bar {
      height: 32px;
      border-radius: 16px;
      transition: width 0.3s ease;
    }

    .emotion-bar.happy { background: #4caf50; }
    .emotion-bar.sad { background: #2196f3; }
    .emotion-bar.angry { background: #f44336; }
    .emotion-bar.surprised { background: #ff9800; }
    .emotion-bar.fearful { background: #9c27b0; }
    .emotion-bar.disgusted { background: #795548; }
    .emotion-bar.neutral { background: #9e9e9e; }
    .emotion-bar.unknown { background: #607d8b; }

    .emotion-percentage {
      min-width: 45px;
      font-weight: 600;
      color: #333;
    }

    .student-emotions-card {
      margin-top: 24px;
    }

    .student-emotion-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
      margin-top: 16px;
    }

    .student-card {
      border: 1px solid #e0e0e0;
    }

    .student-header {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .student-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .student-info h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
    }

    .student-info p {
      margin: 0;
      font-size: 12px;
      color: #666;
    }

    .dominant-emotion {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      margin: 12px 0;
      font-weight: 600;
    }

    .student-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin: 12px 0;
    }

    .stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 11px;
      color: #666;
      text-transform: uppercase;
    }

    .stat-value {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .mini-emotion-chart {
      display: flex;
      gap: 4px;
      height: 80px;
      align-items: flex-end;
      padding: 8px;
      background: #fafafa;
      border-radius: 8px;
    }

    .mini-emotion-bar {
      flex: 1;
      border-radius: 4px 4px 0 0;
      min-height: 2px;
      transition: height 0.3s ease;
    }

    .attendance-table {
      width: 100%;
      margin-top: 16px;
    }

    .student-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .student-name {
      font-weight: 500;
      color: #333;
    }

    .student-roll {
      font-size: 12px;
      color: #666;
    }

    .percentage-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .percentage-bar {
      flex: 1;
      height: 20px;
      background: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
    }

    .percentage-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .percentage-fill.good { background: #4caf50; }
    .percentage-fill.medium { background: #ff9800; }
    .percentage-fill.poor { background: #f44336; }

    .percentage-text {
      min-width: 45px;
      font-weight: 600;
    }

    .rejoin-chip {
      background: #ff9800;
      color: white;
      font-size: 12px;
      min-height: 24px;
    }

    .role-chip {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 11px;
      min-height: 22px;
      margin-left: 8px;
      font-weight: 600;
    }

    .role-chip-small {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-size: 10px;
      min-height: 20px;
      margin-left: 6px;
      padding: 2px 8px;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .overview-cards {
        grid-template-columns: 1fr;
      }

      .student-emotion-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MeetingAnalyticsDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private analyticsService = inject(AnalyticsService);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  analytics: MeetingAnalytics | null = null;
  loading = false;
  displayedColumns = ['student', 'status', 'joinTime', 'duration', 'percentage', 'rejoins'];
  isAdmin = false;

  ngOnInit() {
    // Determine if user is admin or lecturer
    this.isAdmin = this.authService.isAdmin();
    
    const meetingId = this.route.snapshot.paramMap.get('id');
    if (meetingId) {
      this.loadAnalytics(meetingId);
    }
  }

  loadAnalytics(meetingId: string) {
    this.loading = true;
    this.analyticsService.getMeetingAnalytics(meetingId).subscribe({
      next: (response) => {
        console.log('📊 Analytics Response:', response);
        console.log('📊 Attendance Data:', response.data.attendanceAnalytics);
        console.log('📊 Attendance Summaries:', response.data.attendanceAnalytics.attendanceSummaries);
        console.log('📊 Attendance Summaries Length:', response.data.attendanceAnalytics.attendanceSummaries?.length);
        this.analytics = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.snackBar.open('Failed to load analytics', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  goBack() {
    // Navigate based on user role
    if (this.isAdmin) {
      this.router.navigate(['/admin/meeting-analytics']);
    } else {
      this.router.navigate(['/lecturer/meeting-analytics']);
    }
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  getEmotionEntries() {
    if (!this.analytics) return [];
    return Object.entries(this.analytics.emotionAnalytics.overallEmotionPercentages)
      .map(([key, value]) => ({ key, value }))
      .filter(entry => entry.value > 0)
      .sort((a, b) => b.value - a.value);
  }

  getStudentEmotionEntries(emotionPercentages: any) {
    return Object.entries(emotionPercentages)
      .map(([key, value]) => ({ key, value: value as number }))
      .filter(entry => entry.value > 0);
  }

  getEmotionIcon(emotion: string): string {
    const icons: any = {
      happy: 'sentiment_very_satisfied',
      sad: 'sentiment_very_dissatisfied',
      angry: 'sentiment_very_dissatisfied',
      surprised: 'sentiment_satisfied',
      fearful: 'sentiment_dissatisfied',
      disgusted: 'sentiment_very_dissatisfied',
      neutral: 'sentiment_neutral',
      unknown: 'help_outline'
    };
    return icons[emotion] || 'mood';
  }
}
