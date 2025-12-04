import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AnalyticsService, MeetingListItem } from '../../../services/analytics.service';
import { DepartmentService } from '../../../services/department.service';
import { CourseService } from '../../../services/course.service';
import { BatchService } from '../../../services/batch.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';

interface SubjectGroup {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalMeetings: number;
  completedMeetings: number;
  totalStudents: number;
  avgAttendanceRate: number;
  totalEmotionRecords: number;
  aggregatedEmotions: any;
  meetings: MeetingListItem[];
  lecturers: Set<string>;
}

@Component({
  selector: 'app-admin-meeting-analytics',
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
    MatSelectModule,
    MatFormFieldModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatExpansionModule,
    MatDividerModule,
    MatSnackBarModule,
    FormsModule
  ],
  template: `
    <div class="analytics-container">
      <div class="header">
        <h1><mat-icon>analytics</mat-icon> Subject-wise Meeting Analytics Dashboard</h1>
        <p class="subtitle">Comprehensive overview of all meetings grouped by subject with emotion tracking and attendance</p>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Department</mat-label>
              <mat-select [(ngModel)]="filters.departmentId">
                <mat-option value="">All Departments</mat-option>
                <mat-option *ngFor="let dept of departments" [value]="dept._id">
                  {{ dept.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Course</mat-label>
              <mat-select [(ngModel)]="filters.courseId">
                <mat-option value="">All Courses</mat-option>
                <mat-option *ngFor="let course of courses" [value]="course._id">
                  {{ course.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Batch</mat-label>
              <mat-select [(ngModel)]="filters.batchId">
                <mat-option value="">All Batches</mat-option>
                <mat-option *ngFor="let batch of batches" [value]="batch._id">
                  {{ batch.name }} ({{ batch.startYear }}-{{ batch.endYear }})
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" [(ngModel)]="filters.startDate">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" [(ngModel)]="filters.endDate">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select [(ngModel)]="filters.status">
                <mat-option value="">All</mat-option>
                <mat-option value="scheduled">Scheduled</mat-option>
                <mat-option value="ongoing">Ongoing</mat-option>
                <mat-option value="completed">Completed</mat-option>
                <mat-option value="cancelled">Cancelled</mat-option>
              </mat-select>
            </mat-form-field>

            <button mat-raised-button color="primary" (click)="loadMeetings()">
              <mat-icon>search</mat-icon> Apply Filters
            </button>
            <button mat-raised-button (click)="clearFilters()">
              <mat-icon>clear</mat-icon> Clear
            </button>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <mat-spinner></mat-spinner>
        <p>Loading analytics...</p>
      </div>

      <!-- Subject Groups -->
      <div *ngIf="!loading && subjectGroups.length > 0" class="subjects-container">
        <mat-accordion class="subjects-accordion" multi>
          <mat-expansion-panel *ngFor="let subject of subjectGroups" class="subject-panel">
            <mat-expansion-panel-header>
              <mat-panel-title>
                <div class="subject-header">
                  <div class="subject-info">
                    <mat-icon class="subject-icon">book</mat-icon>
                    <div>
                      <h2>{{ subject.subjectName }}</h2>
                      <span class="subject-code">{{ subject.subjectCode }}</span>
                    </div>
                  </div>
                  <div class="subject-stats">
                    <mat-chip class="stat-chip"><mat-icon>video_library</mat-icon> {{ subject.totalMeetings }} Meetings</mat-chip>
                    <mat-chip class="stat-chip"><mat-icon>check_circle</mat-icon> {{ subject.completedMeetings }} Completed</mat-chip>
                    <mat-chip class="stat-chip"><mat-icon>people</mat-icon> {{ subject.totalStudents }} Students</mat-chip>
                    <mat-chip class="stat-chip"><mat-icon>person</mat-icon> {{ subject.lecturers.size }} Lecturers</mat-chip>
                  </div>
                </div>
              </mat-panel-title>
            </mat-expansion-panel-header>

            <!-- Subject Summary -->
            <div class="subject-summary">
              <div class="summary-header">
                <h3><mat-icon>bar_chart</mat-icon> Subject Overview</h3>
                <button mat-raised-button color="accent" (click)="generateSubjectReport(subject); $event.stopPropagation()">
                  <mat-icon>assessment</mat-icon> Generate Subject Report
                </button>
              </div>

              <!-- Subject-level Statistics -->
              <div class="summary-stats">
                <mat-card class="summary-card">
                  <div class="summary-icon attendance">
                    <mat-icon>how_to_reg</mat-icon>
                  </div>
                  <div class="summary-content">
                    <div class="summary-label">Avg Attendance</div>
                    <div class="summary-value">{{ subject.avgAttendanceRate }}%</div>
                  </div>
                </mat-card>

                <mat-card class="summary-card">
                  <div class="summary-icon emotions">
                    <mat-icon>mood</mat-icon>
                  </div>
                  <div class="summary-content">
                    <div class="summary-label">Total Emotion Records</div>
                    <div class="summary-value">{{ subject.totalEmotionRecords }}</div>
                  </div>
                </mat-card>
              </div>

              <!-- Aggregated Emotion Breakdown for Subject -->
              <div class="subject-emotion-breakdown">
                <h4>Overall Emotion Distribution Across All Meetings</h4>
                <div class="emotion-bar">
                  <div class="emotion-segment happy" 
                       [style.width.%]="getEmotionPercentage(subject.aggregatedEmotions, 'happy')"
                       matTooltip="Happy: {{ getEmotionPercentage(subject.aggregatedEmotions, 'happy') }}%"></div>
                  <div class="emotion-segment sad" 
                       [style.width.%]="getEmotionPercentage(subject.aggregatedEmotions, 'sad')"
                       matTooltip="Sad: {{ getEmotionPercentage(subject.aggregatedEmotions, 'sad') }}%"></div>
                  <div class="emotion-segment angry" 
                       [style.width.%]="getEmotionPercentage(subject.aggregatedEmotions, 'angry')"
                       matTooltip="Angry: {{ getEmotionPercentage(subject.aggregatedEmotions, 'angry') }}%"></div>
                  <div class="emotion-segment neutral" 
                       [style.width.%]="getEmotionPercentage(subject.aggregatedEmotions, 'neutral')"
                       matTooltip="Neutral: {{ getEmotionPercentage(subject.aggregatedEmotions, 'neutral') }}%"></div>
                </div>
                <div class="emotion-legend">
                  <span class="legend-item"><span class="dot happy"></span> Happy {{ getEmotionPercentage(subject.aggregatedEmotions, 'happy') }}%</span>
                  <span class="legend-item"><span class="dot sad"></span> Sad {{ getEmotionPercentage(subject.aggregatedEmotions, 'sad') }}%</span>
                  <span class="legend-item"><span class="dot angry"></span> Angry {{ getEmotionPercentage(subject.aggregatedEmotions, 'angry') }}%</span>
                  <span class="legend-item"><span class="dot neutral"></span> Neutral {{ getEmotionPercentage(subject.aggregatedEmotions, 'neutral') }}%</span>
                </div>
              </div>

              <mat-divider></mat-divider>

              <!-- Individual Meetings within Subject -->
              <div class="meetings-section">
                <h3><mat-icon>video_library</mat-icon> Meetings in this Subject</h3>
                <div class="meetings-grid">
                  <mat-card *ngFor="let meeting of subject.meetings" class="meeting-card" (click)="viewDetails(meeting.id)">
                    <mat-card-header>
                      <mat-card-title>{{ meeting.topic }}</mat-card-title>
                      <mat-card-subtitle>
                        <div class="meeting-info">
                          <span><mat-icon>event</mat-icon> {{ meeting.meetingDate | date:'medium' }}</span>
                          <mat-chip [class]="'status-' + meeting.status">{{ meeting.status }}</mat-chip>
                        </div>
                      </mat-card-subtitle>
                    </mat-card-header>
                    
                    <mat-card-content>
                      <div class="meeting-details">
                        <div class="detail-row">
                          <mat-icon>group</mat-icon>
                          <span><strong>Batch:</strong> {{ meeting.batch?.name }}</span>
                        </div>
                        <div class="detail-row">
                          <mat-icon>school</mat-icon>
                          <span><strong>Department:</strong> {{ meeting.department?.name }}</span>
                        </div>
                      </div>

                      <!-- Analytics Summary -->
                      <div class="analytics-summary">
                        <h4><mat-icon>bar_chart</mat-icon> Analytics Overview</h4>
                        
                        <div class="stats-grid">
                          <div class="stat-card">
                            <div class="stat-icon attendance">
                              <mat-icon>how_to_reg</mat-icon>
                            </div>
                            <div class="stat-content">
                              <div class="stat-label">Attendance Rate</div>
                              <div class="stat-value">{{ meeting.analytics.attendanceRate }}%</div>
                              <div class="stat-detail">{{ meeting.analytics.presentCount }}/{{ meeting.analytics.totalStudents }} present</div>
                            </div>
                          </div>

                          <div class="stat-card">
                            <div class="stat-icon emotions">
                              <mat-icon>mood</mat-icon>
                            </div>
                            <div class="stat-content">
                              <div class="stat-label">Emotion Records</div>
                              <div class="stat-value">{{ meeting.analytics.totalEmotionRecords }}</div>
                              <div class="stat-detail">Total tracked</div>
                            </div>
                          </div>
                        </div>

                        <!-- Emotion Breakdown -->
                        <div class="emotion-breakdown" *ngIf="meeting.analytics.totalEmotionRecords > 0">
                          <div class="emotion-bar">
                            <div class="emotion-segment happy" 
                                 [style.width.%]="getEmotionPercentage(meeting.analytics.emotionBreakdown, 'happy')"
                                 matTooltip="Happy: {{ getEmotionPercentage(meeting.analytics.emotionBreakdown, 'happy') }}%"></div>
                            <div class="emotion-segment sad" 
                                 [style.width.%]="getEmotionPercentage(meeting.analytics.emotionBreakdown, 'sad')"
                                 matTooltip="Sad: {{ getEmotionPercentage(meeting.analytics.emotionBreakdown, 'sad') }}%"></div>
                            <div class="emotion-segment angry" 
                                 [style.width.%]="getEmotionPercentage(meeting.analytics.emotionBreakdown, 'angry')"
                                 matTooltip="Angry: {{ getEmotionPercentage(meeting.analytics.emotionBreakdown, 'angry') }}%"></div>
                            <div class="emotion-segment neutral" 
                                 [style.width.%]="getEmotionPercentage(meeting.analytics.emotionBreakdown, 'neutral')"
                                 matTooltip="Neutral: {{ getEmotionPercentage(meeting.analytics.emotionBreakdown, 'neutral') }}%"></div>
                          </div>
                          <div class="emotion-legend">
                            <span class="legend-item"><span class="dot happy"></span> Happy</span>
                            <span class="legend-item"><span class="dot sad"></span> Sad</span>
                            <span class="legend-item"><span class="dot angry"></span> Angry</span>
                            <span class="legend-item"><span class="dot neutral"></span> Neutral</span>
                          </div>
                        </div>
                      </div>
                    </mat-card-content>

                    <mat-card-actions>
                      <button mat-button color="primary" (click)="viewDetails(meeting.id); $event.stopPropagation()">
                        <mat-icon>visibility</mat-icon> View Detailed Analytics
                      </button>
                    </mat-card-actions>
                  </mat-card>
                </div>
              </div>
            </div>
          </mat-expansion-panel>
        </mat-accordion>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && subjectGroups.length === 0" class="empty-state">
        <mat-icon>event_busy</mat-icon>
        <h2>No Meetings Found</h2>
        <p>You haven't conducted any meetings yet, or try adjusting your filters.</p>
      </div>
    </div>
  `,
  styles: [`
    .analytics-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 24px;
    }

    .header h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 600;
      color: #1976d2;
    }

    .subtitle {
      color: #666;
      margin: 0;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: center;
    }

    .filters mat-form-field {
      min-width: 200px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 20px;
    }

    .subjects-accordion {
      display: block;
    }

    .subject-panel {
      margin-bottom: 20px;
      border-radius: 8px !important;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    }

    .subject-panel ::ng-deep .mat-expansion-panel-header {
      padding: 20px 24px;
      height: auto !important;
    }

    .subject-header {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
    }

    .subject-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .subject-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #1976d2;
    }

    .subject-info h2 {
      margin: 0;
      font-size: 24px;
      color: #333;
      font-weight: 600;
    }

    .subject-code {
      font-size: 14px;
      color: #666;
      background: #e3f2fd;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 500;
    }

    .subject-stats {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .stat-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white !important;
      font-weight: 500;
    }

    .stat-chip mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .subject-summary {
      padding: 24px;
    }

    .summary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .summary-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 20px;
      color: #333;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e8ebf0 100%);
    }

    .summary-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .summary-icon.attendance {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .summary-icon.emotions {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .summary-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .summary-content {
      flex: 1;
    }

    .summary-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .summary-value {
      font-size: 32px;
      font-weight: 700;
      color: #333;
    }

    .subject-emotion-breakdown {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .subject-emotion-breakdown h4 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #333;
      font-weight: 600;
    }

    .meetings-section {
      margin-top: 24px;
    }

    .meetings-section h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 18px;
      color: #333;
    }

    .meetings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(450px, 1fr));
      gap: 20px;
    }

    .meeting-card {
      cursor: pointer;
      transition: all 0.3s ease;
      height: 100%;
    }

    .meeting-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .meeting-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    .meeting-info span {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 14px;
    }

    mat-chip {
      font-size: 12px;
      min-height: 24px;
      padding: 4px 12px;
    }

    .status-scheduled {
      background-color: #2196f3;
      color: white;
    }

    .status-ongoing {
      background-color: #4caf50;
      color: white;
    }

    .status-completed {
      background-color: #9e9e9e;
      color: white;
    }

    .status-cancelled {
      background-color: #f44336;
      color: white;
    }

    .meeting-details {
      margin: 16px 0;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      font-size: 14px;
    }

    .analytics-summary {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
    }

    .analytics-summary h4 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #333;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    .stat-card {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.attendance {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-icon.emotions {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .stat-content {
      flex: 1;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }

    .stat-detail {
      font-size: 12px;
      color: #999;
    }

    .emotion-breakdown {
      margin-top: 16px;
    }

    .emotion-bar {
      height: 24px;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      background: #e0e0e0;
    }

    .emotion-segment {
      height: 100%;
      transition: width 0.3s ease;
    }

    .emotion-segment.happy {
      background: #4caf50;
    }

    .emotion-segment.sad {
      background: #2196f3;
    }

    .emotion-segment.angry {
      background: #f44336;
    }

    .emotion-segment.neutral {
      background: #9e9e9e;
    }

    .emotion-legend {
      display: flex;
      gap: 16px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
    }

    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
    }

    .dot.happy {
      background: #4caf50;
    }

    .dot.sad {
      background: #2196f3;
    }

    .dot.angry {
      background: #f44336;
    }

    .dot.neutral {
      background: #9e9e9e;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .empty-state mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #ccc;
      margin-bottom: 16px;
    }

    @media (max-width: 1200px) {
      .meetings-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .subject-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminMeetingAnalyticsComponent implements OnInit {
  private analyticsService = inject(AnalyticsService);
  private departmentService = inject(DepartmentService);
  private courseService = inject(CourseService);
  private batchService = inject(BatchService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  meetings: MeetingListItem[] = [];
  subjectGroups: SubjectGroup[] = [];
  departments: any[] = [];
  courses: any[] = [];
  batches: any[] = [];
  loading = false;
  
  filters = {
    departmentId: '',
    courseId: '',
    batchId: '',
    startDate: null as Date | null,
    endDate: null as Date | null,
    status: ''
  };

  ngOnInit() {
    this.loadFilterData();
    this.loadMeetings();
  }

  loadFilterData() {
    forkJoin({
      departments: this.departmentService.getDepartments(),
      courses: this.courseService.getCourses(),
      batches: this.batchService.getBatches()
    }).subscribe({
      next: (result) => {
        this.departments = result.departments.data || [];
        this.courses = result.courses.data || [];
        this.batches = result.batches.data || [];
      },
      error: (error) => {
        console.error('Error loading filter data:', error);
      }
    });
  }

  loadMeetings() {
    this.loading = true;
    const filters: any = {};

    if (this.filters.departmentId) filters.departmentId = this.filters.departmentId;
    if (this.filters.startDate) filters.startDate = this.filters.startDate.toISOString();
    if (this.filters.endDate) filters.endDate = this.filters.endDate.toISOString();
    if (this.filters.status) filters.status = this.filters.status;

    this.analyticsService.getAdminMeetingsAnalytics(filters).subscribe({
      next: (response) => {
        this.meetings = response.data.meetings;
        this.filterMeetingsByAdditionalCriteria();
        this.groupMeetingsBySubject();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading analytics:', error);
        this.snackBar.open('Failed to load analytics', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  filterMeetingsByAdditionalCriteria() {
    let filteredMeetings = [...this.meetings];

    // Filter by course
    if (this.filters.courseId) {
      filteredMeetings = filteredMeetings.filter(meeting => {
        const batchCourseId = meeting.batch?.courseId?._id || meeting.batch?.courseId;
        return batchCourseId === this.filters.courseId;
      });
    }

    // Filter by batch
    if (this.filters.batchId) {
      filteredMeetings = filteredMeetings.filter(meeting => {
        const meetingBatchId = meeting.batch?._id || meeting.batch?.id;
        return meetingBatchId === this.filters.batchId;
      });
    }

    this.meetings = filteredMeetings;
  }

  groupMeetingsBySubject() {
    const subjectMap = new Map<string, SubjectGroup>();

    this.meetings.forEach(meeting => {
      const subjectId = meeting.subject?._id || meeting.subject?.id || 'unknown';
      const subjectName = meeting.subject?.name || 'Unknown Subject';
      const subjectCode = meeting.subject?.code || 'N/A';

      if (!subjectMap.has(subjectId)) {
        subjectMap.set(subjectId, {
          subjectId,
          subjectName,
          subjectCode,
          totalMeetings: 0,
          completedMeetings: 0,
          totalStudents: 0,
          avgAttendanceRate: 0,
          totalEmotionRecords: 0,
          aggregatedEmotions: { happy: 0, sad: 0, angry: 0, neutral: 0, unknown: 0 },
          meetings: [],
          lecturers: new Set<string>()
        });
      }

      const subjectGroup = subjectMap.get(subjectId)!;
      subjectGroup.meetings.push(meeting);
      subjectGroup.totalMeetings++;
      
      if (meeting.status === 'completed') {
        subjectGroup.completedMeetings++;
      }

      // Track unique lecturers
      if (meeting.lecturer) {
        const lecturerName = `${meeting.lecturer.firstName} ${meeting.lecturer.lastName}`;
        subjectGroup.lecturers.add(lecturerName);
      }

      // Aggregate analytics
      if (meeting.analytics) {
        subjectGroup.totalStudents = Math.max(subjectGroup.totalStudents, meeting.analytics.totalStudents || 0);
        subjectGroup.totalEmotionRecords += meeting.analytics.totalEmotionRecords || 0;
        
        // Aggregate emotion breakdown
        if (meeting.analytics.emotionBreakdown) {
          Object.keys(meeting.analytics.emotionBreakdown).forEach(emotion => {
            subjectGroup.aggregatedEmotions[emotion] = 
              (subjectGroup.aggregatedEmotions[emotion] || 0) + (meeting.analytics.emotionBreakdown[emotion] || 0);
          });
        }
      }
    });

    // Calculate averages
    subjectMap.forEach(subject => {
      const completedMeetings = subject.meetings.filter(m => m.status === 'completed');
      if (completedMeetings.length > 0) {
        const totalAttendance = completedMeetings.reduce((sum, m) => sum + (m.analytics?.attendanceRate || 0), 0);
        subject.avgAttendanceRate = Math.round(totalAttendance / completedMeetings.length);
      }
    });

    this.subjectGroups = Array.from(subjectMap.values())
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  }

  clearFilters() {
    this.filters = {
      departmentId: '',
      courseId: '',
      batchId: '',
      startDate: null,
      endDate: null,
      status: ''
    };
    this.loadMeetings();
  }

  viewDetails(meetingId: string) {
    this.router.navigate(['/admin/meeting-analytics', meetingId]);
  }

  generateSubjectReport(subject: SubjectGroup) {
    this.snackBar.open(`Generating report for ${subject.subjectName}...`, 'Close', { duration: 2000 });
    
    // Navigate to a detailed subject report page (to be created)
    // For now, we'll show a message
    console.log('Generate report for subject:', subject);
    
    // You can implement PDF generation or navigation to detailed report page here
    // Example: this.router.navigate(['/lecturer/subject-report', subject.subjectId]);
  }

  getEmotionPercentage(emotionBreakdown: any, emotion: string): number {
    if (!emotionBreakdown) return 0;
    const total = Object.values(emotionBreakdown).reduce((sum: number, val) => sum + (val as number), 0) as number;
    return total > 0 ? Math.round((emotionBreakdown[emotion] || 0) / total * 100) : 0;
  }
}
