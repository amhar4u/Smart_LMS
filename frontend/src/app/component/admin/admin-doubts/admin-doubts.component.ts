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
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DoubtService, Doubt, DoubtStatistics } from '../../../services/doubt.service';
import { AdminLayout } from '../admin-layout/admin-layout';
import { DoubtDetailsDialogComponent } from '../../student/doubt-details-dialog/doubt-details-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-doubts',
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
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    AdminLayout
  ],
  template: `
    <app-admin-layout>
    <div class="admin-doubts-container">
      <div class="header">
        <h1><mat-icon>admin_panel_settings</mat-icon> Doubts Management Dashboard</h1>
        <p class="subtitle">Monitor and oversee all student-lecturer interactions</p>
      </div>

      <!-- Statistics Overview -->
      <div class="stats-overview">
        <mat-card class="stat-card total">
          <div class="stat-icon">
            <mat-icon>question_answer</mat-icon>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{statistics?.total || 0}}</div>
            <div class="stat-label">Total Doubts</div>
          </div>
        </mat-card>

        <mat-card class="stat-card pending">
          <div class="stat-icon">
            <mat-icon>hourglass_empty</mat-icon>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{statistics?.pending || 0}}</div>
            <div class="stat-label">Pending</div>
            <div class="stat-percentage">{{getPendingPercentage()}}%</div>
          </div>
        </mat-card>

        <mat-card class="stat-card answered">
          <div class="stat-icon">
            <mat-icon>chat</mat-icon>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{statistics?.answered || 0}}</div>
            <div class="stat-label">Answered</div>
            <div class="stat-percentage">{{getAnsweredPercentage()}}%</div>
          </div>
        </mat-card>

        <mat-card class="stat-card resolved">
          <div class="stat-icon">
            <mat-icon>check_circle</mat-icon>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{statistics?.resolved || 0}}</div>
            <div class="stat-label">Resolved</div>
            <div class="stat-percentage">{{getResolvedPercentage()}}%</div>
          </div>
        </mat-card>

        <mat-card class="stat-card response">
          <div class="stat-icon">
            <mat-icon>timer</mat-icon>
          </div>
          <div class="stat-details">
            <div class="stat-value">{{statistics?.averageResponseTime || 0}}h</div>
            <div class="stat-label">Avg Response</div>
            <div class="stat-info">System-wide</div>
          </div>
        </mat-card>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <div class="filters-header">
          <mat-icon>filter_list</mat-icon>
          <span>Filter Doubts</span>
        </div>
        <div class="filters">
          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="statusFilter" (selectionChange)="applyFilters()">
              <mat-option [value]="null">All Status</mat-option>
              <mat-option value="pending">Pending</mat-option>
              <mat-option value="answered">Answered</mat-option>
              <mat-option value="resolved">Resolved</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select [(ngModel)]="priorityFilter" (selectionChange)="applyFilters()">
              <mat-option [value]="null">All Priorities</mat-option>
              <mat-option value="high">High</mat-option>
              <mat-option value="medium">Medium</mat-option>
              <mat-option value="low">Low</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Visibility</mat-label>
            <mat-select [(ngModel)]="visibilityFilter" (selectionChange)="applyFilters()">
              <mat-option [value]="null">All Types</mat-option>
              <mat-option value="private">Private</mat-option>
              <mat-option value="public">Public</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Search</mat-label>
            <input matInput [(ngModel)]="searchTerm" (ngModelChange)="applyFilters()" placeholder="Search by student, lecturer, or subject...">
            <mat-icon matPrefix>search</mat-icon>
          </mat-form-field>
        </div>
      </mat-card>

      <!-- Doubts Table -->
      <mat-card class="table-card">
        <div class="table-header">
          <h2><mat-icon>list</mat-icon> All Doubts ({{filteredDoubts.length}})</h2>
          <button mat-raised-button color="primary" (click)="loadDoubts()">
            <mat-icon>refresh</mat-icon>
            Refresh
          </button>
        </div>

        <div *ngIf="!loading; else loadingSpinner">
          <div *ngIf="filteredDoubts.length === 0" class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>No doubts found matching your filters</p>
          </div>

          <div class="doubts-grid" *ngIf="filteredDoubts.length > 0">
            <mat-card *ngFor="let doubt of filteredDoubts" class="doubt-item" [class]="'status-' + doubt.status">
              <mat-card-header>
                <div class="doubt-header-content">
                  <div class="doubt-chips">
                    <mat-chip [style.background-color]="getStatusColor(doubt.status)">
                      {{doubt.status | uppercase}}
                    </mat-chip>
                    <mat-chip [style.background-color]="getPriorityColor(doubt.priority)">
                      {{doubt.priority}}
                    </mat-chip>
                    <mat-chip *ngIf="doubt.visibility === 'public'" color="accent">
                      PUBLIC
                    </mat-chip>
                  </div>
                  <span class="doubt-time">{{doubt.createdAt | date:'short'}}</span>
                </div>
              </mat-card-header>

              <mat-card-content>
                <div class="participant-info">
                  <div class="participant">
                    <mat-icon>person</mat-icon>
                    <div>
                      <div class="participant-label">Student</div>
                      <div class="participant-name">{{doubt.student.name}}</div>
                    </div>
                  </div>
                  <mat-icon class="arrow">arrow_forward</mat-icon>
                  <div class="participant">
                    <mat-icon>school</mat-icon>
                    <div>
                      <div class="participant-label">Lecturer</div>
                      <div class="participant-name">{{doubt.lecturer.name}}</div>
                    </div>
                  </div>
                </div>

                <div class="subject-info">
                  <mat-icon>book</mat-icon>
                  <span><strong>{{doubt.subject.name}}</strong> ({{doubt.subject.code}})</span>
                </div>

                <div class="question-preview">
                  <strong>Question:</strong> {{doubt.question.substring(0, 100)}}{{doubt.question.length > 100 ? '...' : ''}}
                </div>

                <div class="answer-status" *ngIf="doubt.answer">
                  <mat-icon>check</mat-icon>
                  <span>Answer provided {{doubt.answeredAt | date:'short'}}</span>
                  <span class="response-time" *ngIf="doubt.responseTime">
                    ({{formatResponseTime(doubt.responseTime)}})
                  </span>
                </div>

                <div class="pending-status" *ngIf="!doubt.answer">
                  <mat-icon>pending</mat-icon>
                  <span>Awaiting lecturer response</span>
                </div>
              </mat-card-content>

              <mat-card-actions>
                <button mat-button (click)="viewDoubtDetails(doubt)">
                  <mat-icon>visibility</mat-icon>
                  View Details
                </button>
                <button mat-button color="warn" *ngIf="doubt.status === 'pending'" (click)="deleteDoubt(doubt._id)">
                  <mat-icon>delete</mat-icon>
                  Delete
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </div>

        <ng-template #loadingSpinner>
          <div class="loading-container">
            <mat-spinner></mat-spinner>
            <p>Loading doubts data...</p>
          </div>
        </ng-template>
      </mat-card>
    </div>
    </app-admin-layout>
  `,
  styles: [`
    .admin-doubts-container {
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

    .stats-overview {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
    }

    .stat-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .stat-card.total .stat-icon {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .stat-card.pending .stat-icon {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
    }

    .stat-card.answered .stat-icon {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      color: white;
    }

    .stat-card.resolved .stat-icon {
      background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
      color: white;
    }

    .stat-card.response .stat-icon {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
      color: white;
    }

    .stat-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .stat-details {
      flex: 1;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 700;
      color: #333;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 4px;
    }

    .stat-percentage {
      font-size: 12px;
      color: #1976d2;
      font-weight: 600;
      margin-top: 4px;
    }

    .stat-info {
      font-size: 11px;
      color: #999;
      margin-top: 2px;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .table-card {
      padding: 24px;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }

    .table-header h2 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 20px;
      color: #333;
    }

    .doubts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: 16px;
    }

    .doubt-item {
      transition: all 0.3s ease;
    }

    .doubt-item:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .doubt-item.status-pending {
      border-left: 4px solid #f5576c;
    }

    .doubt-item.status-answered {
      border-left: 4px solid #4facfe;
    }

    .doubt-item.status-resolved {
      border-left: 4px solid #43e97b;
    }

    .doubt-header-content {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .doubt-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .doubt-chips mat-chip {
      color: white;
      font-weight: 500;
      font-size: 11px;
    }

    .doubt-time {
      font-size: 12px;
      color: #999;
    }

    .participant-info {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 16px 0;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .participant {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .participant-label {
      font-size: 11px;
      color: #999;
      text-transform: uppercase;
    }

    .participant-name {
      font-size: 14px;
      font-weight: 600;
      color: #333;
    }

    .arrow {
      color: #1976d2;
    }

    .subject-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 12px 0;
      color: #555;
    }

    .question-preview {
      margin: 12px 0;
      padding: 12px;
      background: #fff3e0;
      border-radius: 4px;
      font-size: 13px;
      color: #555;
      line-height: 1.5;
    }

    .answer-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px;
      background: #e8f5e9;
      border-radius: 4px;
      color: #2e7d32;
      font-size: 12px;
    }

    .pending-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      padding: 8px;
      background: #fff3e0;
      border-radius: 4px;
      color: #f57c00;
      font-size: 12px;
    }

    .response-time {
      font-style: italic;
      color: #666;
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

    @media (max-width: 1200px) {
      .doubts-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .stats-overview {
        grid-template-columns: 1fr;
      }

      .filters {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminDoubtsComponent implements OnInit, OnDestroy {
  private doubtService = inject(DoubtService);
  private snackBar = inject(MatSnackBar);

  doubts: Doubt[] = [];
  filteredDoubts: Doubt[] = [];
  statistics: DoubtStatistics | null = null;

  loading = false;

  statusFilter: string | null = null;
  priorityFilter: string | null = null;
  visibilityFilter: string | null = null;
  searchTerm = '';

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
      
      if (this.searchTerm) {
        const search = this.searchTerm.toLowerCase();
        return (
          doubt.student.name.toLowerCase().includes(search) ||
          doubt.lecturer.name.toLowerCase().includes(search) ||
          doubt.subject.name.toLowerCase().includes(search) ||
          doubt.subject.code.toLowerCase().includes(search) ||
          doubt.question.toLowerCase().includes(search)
        );
      }
      
      return true;
    });
  }

  viewDoubtDetails(doubt: Doubt): void {
    const dialog = inject(MatDialog);
    const dialogRef = dialog.open(DoubtDetailsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { doubtId: doubt._id }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadDoubts();
        this.loadStatistics();
      }
    });
  }

  deleteDoubt(doubtId: string): void {
    if (confirm('Are you sure you want to delete this doubt? This action cannot be undone.')) {
      this.doubtService.deleteDoubt(doubtId).subscribe({
        next: () => {
          this.snackBar.open('Doubt deleted successfully', 'Close', { duration: 2000 });
          this.loadStatistics();
        },
        error: (error: any) => {
          console.error('Error deleting doubt:', error);
          this.snackBar.open('Error deleting doubt', 'Close', { duration: 3000 });
        }
      });
    }
  }

  subscribeToDoubtUpdates(): void {
    const sub = this.doubtService.doubts$.subscribe(doubts => {
      this.doubts = doubts;
      this.applyFilters();
    });
    this.subscriptions.push(sub);
  }

  getPendingPercentage(): number {
    if (!this.statistics || this.statistics.total === 0) return 0;
    return Math.round((this.statistics.pending / this.statistics.total) * 100);
  }

  getAnsweredPercentage(): number {
    if (!this.statistics || this.statistics.total === 0) return 0;
    return Math.round((this.statistics.answered / this.statistics.total) * 100);
  }

  getResolvedPercentage(): number {
    if (!this.statistics || this.statistics.total === 0) return 0;
    return Math.round((this.statistics.resolved / this.statistics.total) * 100);
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#f5576c';
      case 'answered': return '#4facfe';
      case 'resolved': return '#43e97b';
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
