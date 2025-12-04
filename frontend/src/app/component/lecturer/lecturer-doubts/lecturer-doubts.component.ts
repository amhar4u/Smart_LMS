import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DoubtService, Doubt, DoubtStatistics } from '../../../services/doubt.service';
import { LecturerLayout } from '../lecturer-layout/lecturer-layout';
import { DoubtDetailsDialogComponent } from '../../student/doubt-details-dialog/doubt-details-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lecturer-doubts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatExpansionModule,
    MatDialogModule,
    LecturerLayout
  ],
  template: `
    <app-lecturer-layout>
    <div class="doubts-container">
      <div class="header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>question_answer</mat-icon>
          </div>
          <div class="header-text">
            <h1>Student Doubts & Questions</h1>
            <p class="subtitle">Answer your students' questions and help them learn</p>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid" *ngIf="statistics">
        <mat-card class="stat-card pending">
          <mat-icon>pending_actions</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{statistics.pending}}</div>
            <div class="stat-label">Pending</div>
          </div>
        </mat-card>
        
        <mat-card class="stat-card answered">
          <mat-icon>done_all</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{statistics.answered}}</div>
            <div class="stat-label">Answered</div>
          </div>
        </mat-card>
        
        <mat-card class="stat-card resolved">
          <mat-icon>verified</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{statistics.resolved}}</div>
            <div class="stat-label">Resolved</div>
          </div>
        </mat-card>
        
        <mat-card class="stat-card response-time">
          <mat-icon>speed</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{statistics.averageResponseTime}}h</div>
            <div class="stat-label">Avg Response Time</div>
          </div>
        </mat-card>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Filter by Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilters()">
              <mat-option [value]="null">All Status</mat-option>
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="answered">Answered</mat-option>
              <mat-option value="resolved">Resolved</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Filter by Priority</mat-label>
            <mat-select [(ngModel)]="priorityFilter" (selectionChange)="applyFilters()">
              <mat-option [value]="null">All Priorities</mat-option>
              <mat-option value="high">High Priority</mat-option>
              <mat-option value="medium">Medium Priority</mat-option>
              <mat-option value="low">Low Priority</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Filter by Visibility</mat-label>
            <mat-select [(ngModel)]="visibilityFilter" (selectionChange)="applyFilters()">
              <mat-option [value]="null">All Types</mat-option>
              <mat-option value="private">Private</mat-option>
              <mat-option value="public">Public</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </mat-card>

      <!-- Doubts List -->
      <div class="doubts-list" *ngIf="!loading; else loadingSpinner">
        <div *ngIf="filteredDoubts.length === 0" class="empty-state">
          <mat-icon>inbox</mat-icon>
          <p>No doubts to show</p>
        </div>

        <mat-card *ngFor="let doubt of filteredDoubts" class="doubt-card" [class]="'status-' + doubt.status">
          <mat-card-header>
            <div class="doubt-subject-title">
              <mat-icon>book</mat-icon>
              <span class="subject-name">{{doubt.subject.name}}</span>
              <span class="subject-code">({{doubt.subject.code}})</span>
            </div>
          </mat-card-header>

          <mat-card-content>
            <div class="doubt-header-content">
              <div class="doubt-meta">
                <mat-chip class="status-chip" [style.background-color]="getStatusColor(doubt.status)">
                  <mat-icon>{{doubt.status === 'pending' ? 'pending' : doubt.status === 'answered' ? 'question_answer' : 'check_circle'}}</mat-icon>
                  {{doubt.status | uppercase}}
                </mat-chip>
                <mat-chip class="priority-chip" [style.background-color]="getPriorityColor(doubt.priority)">
                  <mat-icon>{{doubt.priority === 'high' ? 'priority_high' : 'flag'}}</mat-icon>
                  {{doubt.priority | uppercase}}
                </mat-chip>
                <mat-chip class="visibility-chip" *ngIf="doubt.visibility === 'public'">
                  <mat-icon>public</mat-icon>
                  PUBLIC
                </mat-chip>
                <span class="doubt-date">
                  <mat-icon>schedule</mat-icon>
                  {{doubt.createdAt | date:'short'}}
                </span>
              </div>
            </div>

            <div class="student-info">
              <mat-icon>account_circle</mat-icon>
              <div class="student-details">
                <strong>{{doubt.student.name}}</strong>
                <span>{{doubt.student.email}}</span>
              </div>
            </div>

            <div class="doubt-question">
              <div class="question-header">
                <mat-icon>help_outline</mat-icon>
                <strong>Student's Question</strong>
              </div>
              <p class="question-text">{{doubt.question}}</p>
            </div>

            <div *ngIf="doubt.answer" class="doubt-answer">
              <div class="answer-header">
                <mat-icon>check_circle</mat-icon>
                <strong>Your Answer</strong>
              </div>
              <p class="answer-text">{{doubt.answer}}</p>
              <div class="answer-meta">
                <mat-icon>schedule</mat-icon>
                <span>Answered {{doubt.answeredAt | date:'short'}}</span>
                <mat-chip class="response-chip" *ngIf="doubt.responseTime">
                  <mat-icon>flash_on</mat-icon>
                  Response: {{formatResponseTime(doubt.responseTime)}}
                </mat-chip>
              </div>
            </div>

            <div *ngIf="!doubt.answer" class="doubt-pending">
              <div class="pending-content">
                <mat-icon>hourglass_empty</mat-icon>
                <div class="pending-text">
                  <strong>Awaiting Your Response</strong>
                  <span>Student is waiting for your answer</span>
                </div>
              </div>
            </div>

            <div class="reply-section" *ngIf="!doubt.answer && selectedDoubtId === doubt._id">
              <div class="reply-header">
                <mat-icon>edit</mat-icon>
                <strong>Write Your Answer</strong>
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Your Answer</mat-label>
                <textarea 
                  matInput 
                  [(ngModel)]="replyText" 
                  rows="5" 
                  placeholder="Type your answer here..."></textarea>
                <mat-icon matPrefix>lightbulb</mat-icon>
              </mat-form-field>
            </div>
          </mat-card-content>

          <mat-card-actions>
            <button 
              mat-raised-button 
              color="primary"
              (click)="viewDetails(doubt._id)">
              <mat-icon>visibility</mat-icon>
              View Details
            </button>

            <button 
              mat-raised-button 
              color="accent" 
              *ngIf="!doubt.answer && selectedDoubtId !== doubt._id"
              (click)="startReply(doubt._id)">
              <mat-icon>reply</mat-icon>
              Reply to Student
            </button>

            <button 
              mat-raised-button 
              color="accent" 
              *ngIf="selectedDoubtId === doubt._id && !doubt.answer"
              (click)="submitReply(doubt._id)"
              [disabled]="!replyText || submitting">
              <mat-icon>send</mat-icon>
              {{ submitting ? 'Sending...' : 'Send Answer' }}
            </button>

            <button 
              mat-stroked-button
              *ngIf="selectedDoubtId === doubt._id && !doubt.answer"
              (click)="cancelReply()">
              <mat-icon>close</mat-icon>
              Cancel
            </button>

            <button 
              mat-raised-button 
              color="warn"
              *ngIf="doubt.status === 'answered'"
              (click)="markAsResolved(doubt._id)">
              <mat-icon>check_circle</mat-icon>
              Mark as Resolved
            </button>
          </mat-card-actions>
        </mat-card>
      </div>

      <!-- Loading Spinner -->
      <ng-template #loadingSpinner>
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Loading doubts...</p>
        </div>
      </ng-template>
    </div>
    </app-lecturer-layout>
  `,
  styles: [`
    .doubts-container {
      padding: 0;
      max-width: 100%;
      margin: 0;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 32px;
      margin-bottom: 32px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-icon {
      background: rgba(255,255,255,0.2);
      border-radius: 16px;
      padding: 16px;
      backdrop-filter: blur(10px);
    }

    .header-icon mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: white;
    }

    .header-text h1 {
      margin: 0 0 8px 0;
      font-size: 32px;
      font-weight: 600;
      color: white;
    }

    .subtitle {
      margin: 0;
      color: rgba(255,255,255,0.9);
      font-size: 16px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 24px;
      margin: -20px 24px 32px 24px;
      position: relative;
      z-index: 1;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 24px;
      cursor: default;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      transition: all 0.3s ease;
      border-left: 4px solid transparent;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.12);
    }

    .stat-card mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .stat-card.pending { border-left-color: #ff9800; }
    .stat-card.pending mat-icon { color: #ff9800; }
    .stat-card.pending .stat-value { color: #ff9800; }

    .stat-card.answered { border-left-color: #2196f3; }
    .stat-card.answered mat-icon { color: #2196f3; }
    .stat-card.answered .stat-value { color: #2196f3; }

    .stat-card.resolved { border-left-color: #4caf50; }
    .stat-card.resolved mat-icon { color: #4caf50; }
    .stat-card.resolved .stat-value { color: #4caf50; }

    .stat-card.response-time { border-left-color: #9c27b0; }
    .stat-card.response-time mat-icon { color: #9c27b0; }
    .stat-card.response-time .stat-value { color: #9c27b0; }

    .stat-content {
      flex: 1;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
      margin-top: 6px;
      font-weight: 500;
    }

    .filters-card {
      margin: 0 24px 24px 24px;
      border-radius: 12px;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .filters {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      padding: 8px;
    }

    .filters mat-form-field {
      min-width: 220px;
      flex: 1;
    }

    .doubts-list {
      display: grid;
      gap: 24px;
      padding: 0 24px 24px 24px;
    }

    .doubt-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 16px;
      overflow: hidden;
      background: white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border: 1px solid #f0f0f0;
    }

    .doubt-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }

    .doubt-card.status-pending {
      border-top: 4px solid #ff9800;
      background: linear-gradient(to bottom, #fff8e1 0%, white 80px);
    }

    .doubt-card.status-answered {
      border-top: 4px solid #2196f3;
      background: linear-gradient(to bottom, #e3f2fd 0%, white 80px);
    }

    .doubt-card.status-resolved {
      border-top: 4px solid #4caf50;
      background: linear-gradient(to bottom, #e8f5e9 0%, white 80px);
    }

    .doubt-subject-title {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      width: 100%;
      background: rgba(25, 118, 210, 0.04);
      border-radius: 8px;
      margin: -8px -8px 0 -8px;
    }

    .doubt-subject-title mat-icon {
      color: #1976d2;
      font-size: 28px;
      width: 28px;
      height: 28px;
      background: rgba(25, 118, 210, 0.1);
      border-radius: 8px;
      padding: 6px;
    }

    .subject-name {
      font-size: 19px;
      font-weight: 700;
      color: #1976d2;
      letter-spacing: 0.3px;
    }

    .subject-code {
      font-size: 14px;
      color: #666;
      font-weight: 500;
      background: rgba(0,0,0,0.05);
      padding: 2px 8px;
      border-radius: 4px;
    }

    .doubt-header-content {
      width: 100%;
      margin-bottom: 16px;
    }

    .doubt-meta {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }

    .doubt-meta mat-chip {
      color: white;
      font-weight: 600;
      font-size: 11px;
      height: 32px;
      border-radius: 16px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.5px;
    }

    .doubt-meta mat-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin: 0;
    }

    .status-chip {
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    .priority-chip {
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    .visibility-chip {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      box-shadow: 0 2px 4px rgba(102, 126, 234, 0.4);
    }

    .doubt-date {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #666;
      margin-left: auto;
      white-space: nowrap;
      font-weight: 500;
    }

    .doubt-date mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #999;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 12px;
      margin-bottom: 20px;
      border: 2px solid #e3f2fd;
    }

    .student-info mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #1976d2;
    }

    .student-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .student-details strong {
      font-size: 16px;
      color: #333;
    }

    .student-details span {
      font-size: 13px;
      color: #666;
    }

    .doubt-question {
      margin: 20px 0;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 12px;
      border: 2px solid #e3f2fd;
    }

    .question-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .question-header mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #1976d2;
      background: #e3f2fd;
      border-radius: 50%;
      padding: 6px;
    }

    .question-header strong {
      font-size: 15px;
      color: #1976d2;
      font-weight: 700;
    }

    .question-text {
      margin: 0;
      line-height: 1.7;
      color: #333;
      font-size: 15px;
      padding-left: 38px;
      white-space: pre-wrap;
    }

    .doubt-answer {
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
      border: 2px solid #c8e6c9;
    }

    .answer-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .answer-header mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #2e7d32;
      background: #c8e6c9;
      border-radius: 50%;
      padding: 6px;
    }

    .answer-header strong {
      font-size: 15px;
      color: #2e7d32;
      font-weight: 700;
    }

    .answer-text {
      color: #1b5e20;
      line-height: 1.7;
      margin: 0 0 12px 0;
      font-size: 15px;
      padding-left: 38px;
      white-space: pre-wrap;
    }

    .answer-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: #558b2f;
      flex-wrap: wrap;
      padding-left: 38px;
    }

    .answer-meta mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .response-chip {
      background: #c8e6c9 !important;
      color: #2e7d32 !important;
      font-size: 11px;
      height: 24px;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .response-chip mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .doubt-pending {
      margin: 20px 0;
      padding: 20px;
      background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%);
      border-radius: 12px;
      border: 2px dashed #ffb74d;
    }

    .pending-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .pending-content mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #f57c00;
      animation: rotate 2s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .pending-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pending-text strong {
      font-size: 16px;
      color: #f57c00;
      font-weight: 700;
    }

    .pending-text span {
      font-size: 13px;
      color: #ff9800;
    }

    .reply-section {
      margin: 20px 0;
      padding: 20px;
      background: linear-gradient(135deg, #fff9e6 0%, #ffffff 100%);
      border-radius: 12px;
      border: 2px solid #ffe0b2;
    }

    .reply-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
    }

    .reply-header mat-icon {
      font-size: 22px;
      width: 22px;
      height: 22px;
      color: #ff6f00;
      background: #ffe0b2;
      border-radius: 50%;
      padding: 6px;
    }

    .reply-header strong {
      font-size: 15px;
      color: #ff6f00;
      font-weight: 700;
    }

    .full-width {
      width: 100%;
    }

    mat-card-actions {
      padding: 16px !important;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    mat-card-actions button {
      border-radius: 8px;
      font-weight: 600;
      padding: 0 20px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      margin-bottom: 16px;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 20px;
    }

    mat-divider {
      margin: 16px 0;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .filters {
        flex-direction: column;
      }

      .filters mat-form-field {
        width: 100%;
      }
    }
  `]
})
export class LecturerDoubtsComponent implements OnInit, OnDestroy {
  private doubtService = inject(DoubtService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  doubts: Doubt[] = [];
  filteredDoubts: Doubt[] = [];
  statistics: DoubtStatistics | null = null;

  loading = false;
  submitting = false;

  statusFilter: string | null = null;
  priorityFilter: string | null = null;
  visibilityFilter: string | null = null;

  selectedDoubtId: string | null = null;
  replyText = '';

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.loadDoubts();
    this.loadStatistics();
    this.subscribeToDoubtUpdates();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadDoubts(): void {
    this.loading = true;
    this.doubtService.getDoubts().subscribe({
      next: (doubts: any) => {
        this.doubts = doubts;
        this.applyFilters();
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading doubts:', error);
        this.snackBar.open('Error loading doubts', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadStatistics(): void {
    this.doubtService.getStatistics().subscribe({
      next: (stats: any) => {
        this.statistics = stats;
      },
      error: (error: any) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  applyFilters(): void {
    this.filteredDoubts = this.doubts.filter(doubt => {
      if (this.statusFilter && doubt.status !== this.statusFilter) return false;
      if (this.priorityFilter && doubt.priority !== this.priorityFilter) return false;
      if (this.visibilityFilter && doubt.visibility !== this.visibilityFilter) return false;
      return true;
    });
  }

  startReply(doubtId: string): void {
    this.selectedDoubtId = doubtId;
    this.replyText = '';
  }

  viewDetails(doubtId: string): void {
    const dialogRef = this.dialog.open(DoubtDetailsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { doubtId }
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadDoubts();
      this.loadStatistics();
    });
  }

  cancelReply(): void {
    this.selectedDoubtId = null;
    this.replyText = '';
  }

  submitReply(doubtId: string): void {
    if (!this.replyText.trim()) return;

    this.submitting = true;
    this.doubtService.replyToDoubt(doubtId, this.replyText).subscribe({
      next: () => {
        this.snackBar.open('Answer sent successfully!', 'Close', { duration: 3000 });
        this.cancelReply();
        this.loadStatistics();
        this.submitting = false;
      },
      error: (error: any) => {
        console.error('Error sending reply:', error);
        this.snackBar.open('Error sending answer. Please try again.', 'Close', { duration: 3000 });
        this.submitting = false;
      }
    });
  }

  markAsResolved(doubtId: string): void {
    this.doubtService.updateDoubtStatus(doubtId, 'resolved').subscribe({
      next: () => {
        this.snackBar.open('Doubt marked as resolved', 'Close', { duration: 2000 });
        this.loadStatistics();
      },
      error: (error: any) => {
        console.error('Error updating doubt:', error);
        this.snackBar.open('Error updating doubt', 'Close', { duration: 3000 });
      }
    });
  }

  subscribeToDoubtUpdates(): void {
    const sub = this.doubtService.doubts$.subscribe(doubts => {
      this.doubts = doubts;
      this.applyFilters();
    });
    this.subscriptions.push(sub);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'answered': return '#2196f3';
      case 'resolved': return '#4caf50';
      default: return '#757575';
    }
  }

  getPriorityColor(priority: string): string {
    return this.doubtService.getPriorityColor(priority);
  }

  formatResponseTime(hours: number): string {
    return this.doubtService.formatResponseTime(hours);
  }
}
