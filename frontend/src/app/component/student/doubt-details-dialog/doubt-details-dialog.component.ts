import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DoubtService, Doubt } from '../../../services/doubt.service';

@Component({
  selector: 'app-doubt-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="doubt-details-dialog">
      <div class="dialog-header">
        <div class="header-content">
          <mat-icon>help_outline</mat-icon>
          <h2>Doubt Details</h2>
        </div>
        <button mat-icon-button (click)="closeDialog()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content" *ngIf="doubt; else loading">
        <!-- Subject Info -->
        <div class="subject-card">
          <mat-icon>book</mat-icon>
          <div class="subject-info">
            <strong>{{doubt.subject.name}}</strong>
            <span>{{doubt.subject.code}}</span>
          </div>
        </div>

        <!-- Status and Meta -->
        <div class="meta-section">
          <mat-chip [style.background-color]="getStatusColor(doubt.status)">
            <mat-icon>{{doubt.status === 'pending' ? 'pending' : doubt.status === 'answered' ? 'question_answer' : 'check_circle'}}</mat-icon>
            {{doubt.status | uppercase}}
          </mat-chip>
          <mat-chip [style.background-color]="getPriorityColor(doubt.priority)">
            <mat-icon>{{doubt.priority === 'high' ? 'priority_high' : 'flag'}}</mat-icon>
            {{doubt.priority | uppercase}}
          </mat-chip>
          <mat-chip *ngIf="doubt.visibility === 'public'" class="visibility-chip">
            <mat-icon>public</mat-icon>
            PUBLIC
          </mat-chip>
        </div>

        <mat-divider></mat-divider>

        <!-- Question -->
        <div class="question-section">
          <div class="section-header">
            <mat-icon>help_outline</mat-icon>
            <h3>Your Question</h3>
          </div>
          <p class="question-text">{{doubt.question}}</p>
          <div class="timestamp">
            <mat-icon>schedule</mat-icon>
            <span>Asked on {{doubt.createdAt | date:'medium'}}</span>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Answer -->
        <div class="answer-section" *ngIf="doubt.answer">
          <div class="section-header">
            <mat-icon>check_circle</mat-icon>
            <h3>Lecturer's Answer</h3>
          </div>
          <p class="answer-text">{{doubt.answer}}</p>
          <div class="timestamp">
            <mat-icon>schedule</mat-icon>
            <span>Answered on {{doubt.answeredAt | date:'medium'}}</span>
            <mat-chip class="response-chip" *ngIf="doubt.responseTime">
              <mat-icon>flash_on</mat-icon>
              {{formatResponseTime(doubt.responseTime)}}
            </mat-chip>
          </div>
        </div>

        <!-- Pending State -->
        <div class="pending-section" *ngIf="!doubt.answer">
          <mat-icon class="pending-icon">hourglass_empty</mat-icon>
          <div>
            <strong>Awaiting Response</strong>
            <p>Your lecturer will answer soon</p>
          </div>
        </div>

        <!-- Conversation Thread -->
        <div class="conversation-section" *ngIf="doubt.answer && doubt.replies && doubt.replies.length > 0">
          <mat-divider></mat-divider>
          <div class="section-header">
            <mat-icon>forum</mat-icon>
            <h3>Follow-up Discussion</h3>
          </div>
          
          <div class="replies-list">
            <div *ngFor="let reply of doubt.replies" class="reply-item" [class.my-reply]="reply.authorRole === 'student'">
              <div class="reply-header">
                <mat-icon>{{reply.authorRole === 'student' ? 'person' : 'school'}}</mat-icon>
                <strong>{{reply.author.name}}</strong>
                <span class="reply-role">({{reply.authorRole === 'student' ? 'You' : 'Lecturer'}})</span>
                <span class="reply-time">{{reply.createdAt | date:'short'}}</span>
              </div>
              <p class="reply-message">{{reply.message}}</p>
            </div>
          </div>
        </div>

        <!-- Follow-up Reply Form -->
        <div class="follow-up-section" *ngIf="doubt.answer && !showFollowUpForm">
          <mat-divider></mat-divider>
          <button mat-raised-button color="primary" (click)="showFollowUpForm = true">
            <mat-icon>reply</mat-icon>
            Ask Follow-up Question
          </button>
        </div>

        <div class="follow-up-form" *ngIf="showFollowUpForm">
          <mat-divider></mat-divider>
          <div class="section-header">
            <mat-icon>reply</mat-icon>
            <h3>Ask a Follow-up Question</h3>
          </div>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Your follow-up question</mat-label>
            <textarea 
              matInput 
              [(ngModel)]="followUpMessage" 
              rows="4" 
              placeholder="Ask for clarification or additional help..."
              maxlength="2000"></textarea>
            <mat-hint align="end">{{followUpMessage.length}} / 2000</mat-hint>
          </mat-form-field>
          <div class="form-actions">
            <button 
              mat-raised-button 
              color="accent" 
              (click)="submitFollowUp()"
              [disabled]="!followUpMessage.trim() || submittingFollowUp">
              <mat-icon>send</mat-icon>
              {{ submittingFollowUp ? 'Sending...' : 'Send' }}
            </button>
            <button mat-stroked-button (click)="cancelFollowUp()">
              <mat-icon>close</mat-icon>
              Cancel
            </button>
          </div>
        </div>
      </div>

      <ng-template #loading>
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading details...</p>
        </div>
      </ng-template>

      <div class="dialog-actions" *ngIf="doubt">
        <button 
          mat-raised-button 
          color="accent" 
          *ngIf="doubt.status === 'answered' && !doubt.resolvedAt"
          (click)="markAsResolved()">
          <mat-icon>check_circle</mat-icon>
          Mark as Resolved
        </button>
        <button mat-button (click)="closeDialog()">Close</button>
      </div>
    </div>
  `,
  styles: [`
    .doubt-details-dialog {
      width: 700px;
      max-width: 90vw;
      max-height: 90vh;
      display: flex;
      flex-direction: column;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-content mat-icon {
      font-size: 28px;
      width: 28px;
      height: 28px;
    }

    .header-content h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
    }

    .dialog-header button {
      color: white;
    }

    .dialog-content {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .subject-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 12px;
      border: 2px solid #e3f2fd;
      margin-bottom: 20px;
    }

    .subject-card mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #1976d2;
    }

    .subject-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .subject-info strong {
      font-size: 18px;
      color: #333;
    }

    .subject-info span {
      font-size: 14px;
      color: #666;
    }

    .meta-section {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-bottom: 20px;
    }

    .meta-section mat-chip {
      color: white;
      font-weight: 600;
      font-size: 11px;
      height: 32px;
      border-radius: 16px;
      padding: 0 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .meta-section mat-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .visibility-chip {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
    }

    mat-divider {
      margin: 20px 0;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .section-header mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
      color: #1976d2;
    }

    .section-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 700;
      color: #333;
    }

    .question-section,
    .answer-section {
      margin-bottom: 20px;
    }

    .question-text,
    .answer-text {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #1976d2;
      line-height: 1.7;
      color: #333;
      margin: 0 0 12px 0;
      white-space: pre-wrap;
    }

    .answer-text {
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
      border-left-color: #4caf50;
      color: #1b5e20;
    }

    .timestamp {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #666;
      flex-wrap: wrap;
    }

    .timestamp mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .response-chip {
      background: #c8e6c9 !important;
      color: #2e7d32 !important;
      font-size: 11px;
      height: 24px;
    }

    .response-chip mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .pending-section {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: linear-gradient(135deg, #fff8e1 0%, #fffbf0 100%);
      border-radius: 12px;
      border: 2px dashed #ffb74d;
      margin-bottom: 20px;
    }

    .pending-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f57c00;
      animation: rotate 2s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .pending-section strong {
      font-size: 16px;
      color: #f57c00;
      display: block;
      margin-bottom: 4px;
    }

    .pending-section p {
      margin: 0;
      color: #ff9800;
      font-size: 14px;
    }

    .conversation-section {
      margin-top: 20px;
    }

    .replies-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }

    .reply-item {
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border-left: 4px solid #2196f3;
    }

    .reply-item.my-reply {
      background: #e3f2fd;
      border-left-color: #1976d2;
    }

    .reply-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      font-size: 13px;
    }

    .reply-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #1976d2;
    }

    .reply-header strong {
      color: #333;
    }

    .reply-role {
      color: #666;
      font-size: 12px;
    }

    .reply-time {
      margin-left: auto;
      color: #999;
      font-size: 12px;
    }

    .reply-message {
      margin: 0;
      line-height: 1.6;
      color: #333;
      white-space: pre-wrap;
    }

    .follow-up-section {
      margin-top: 20px;
      text-align: center;
    }

    .follow-up-form {
      margin-top: 20px;
    }

    .full-width {
      width: 100%;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }

    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      gap: 20px;
    }
  `]
})
export class DoubtDetailsDialogComponent implements OnInit {
  private doubtService = inject(DoubtService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<DoubtDetailsDialogComponent>);

  doubt: Doubt | null = null;
  showFollowUpForm = false;
  followUpMessage = '';
  submittingFollowUp = false;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { doubtId: string }) {}

  ngOnInit(): void {
    this.loadDoubtDetails();
  }

  loadDoubtDetails(): void {
    this.doubtService.getDoubtDetails(this.data.doubtId).subscribe({
      next: (doubt) => {
        this.doubt = doubt;
      },
      error: (error) => {
        console.error('Error loading doubt details:', error);
        this.snackBar.open('Error loading doubt details', 'Close', { duration: 3000 });
        this.closeDialog();
      }
    });
  }

  submitFollowUp(): void {
    if (!this.followUpMessage.trim() || !this.doubt) return;

    this.submittingFollowUp = true;
    this.doubtService.addFollowUpReply(this.doubt._id, this.followUpMessage).subscribe({
      next: (updatedDoubt) => {
        this.doubt = updatedDoubt;
        this.followUpMessage = '';
        this.showFollowUpForm = false;
        this.submittingFollowUp = false;
        this.snackBar.open('Follow-up question sent successfully', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error sending follow-up:', error);
        this.snackBar.open('Error sending follow-up question', 'Close', { duration: 3000 });
        this.submittingFollowUp = false;
      }
    });
  }

  cancelFollowUp(): void {
    this.showFollowUpForm = false;
    this.followUpMessage = '';
  }

  markAsResolved(): void {
    if (!this.doubt) return;

    this.doubtService.updateDoubtStatus(this.doubt._id, 'resolved').subscribe({
      next: (updatedDoubt) => {
        this.doubt = updatedDoubt;
        this.snackBar.open('Doubt marked as resolved', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Error marking as resolved:', error);
        this.snackBar.open('Error updating doubt status', 'Close', { duration: 3000 });
      }
    });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'pending': return '#ff9800';
      case 'answered': return '#2196f3';
      case 'resolved': return '#4caf50';
      default: return '#666';
    }
  }

  getPriorityColor(priority: string): string {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  }

  formatResponseTime(hours: number): string {
    if (hours < 1) return 'Less than 1 hour';
    if (hours === 1) return '1 hour';
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return days === 1 ? '1 day' : `${days} days`;
  }

  closeDialog(): void {
    this.dialogRef.close(this.doubt);
  }
}
