import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';
import { Assignment, Question } from '../../../services/assignment.service';

@Component({
  selector: 'app-view-assignment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    MatChipsModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <h2 mat-dialog-title>
          <mat-icon>assignment</mat-icon>
          {{ assignment.title }}
        </h2>
        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <div class="assignment-info">
          <div class="info-row">
            <div class="info-item">
              <strong>Subject:</strong> {{ getEntityName(assignment.subject) }}
            </div>
            <div class="info-item">
              <strong>Type:</strong> 
              <span class="badge" [ngClass]="getTypeBadgeClass(assignment.assignmentType)">
                {{ assignment.assignmentType }}
              </span>
            </div>
            <div class="info-item">
              <strong>Level:</strong> 
              <span class="badge" [ngClass]="getLevelBadgeClass(assignment.assignmentLevel)">
                {{ assignment.assignmentLevel }}
              </span>
            </div>
          </div>
          
          <div class="info-row">
            <div class="info-item">
              <strong>Total Questions:</strong> {{ assignment.numberOfQuestions }}
            </div>
            <div class="info-item">
              <strong>Total Marks:</strong> {{ assignment.maxMarks }}
            </div>
            <div class="info-item">
              <strong>Due Date:</strong> {{ formatDate(assignment.dueDate) }}
            </div>
          </div>

          <div class="description" *ngIf="assignment.description">
            <strong>Description:</strong>
            <p>{{ assignment.description }}</p>
          </div>

          <div class="instructions" *ngIf="assignment.instructions">
            <strong>Instructions:</strong>
            <p>{{ assignment.instructions }}</p>
          </div>
        </div>

        <div class="questions-section">
          <h3>Questions ({{ assignment.questions?.length || 0 }})</h3>
          
          <div *ngIf="!assignment.questions || assignment.questions.length === 0" class="no-questions">
            <mat-icon>help_outline</mat-icon>
            <p>No questions available for this assignment.</p>
          </div>

          <mat-accordion *ngIf="assignment.questions && assignment.questions.length > 0">
            <mat-expansion-panel *ngFor="let question of assignment.questions; let i = index">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <span class="question-number">Q{{ i + 1 }}</span>
                  <span class="question-type" [ngClass]="getTypeBadgeClass(question.type)">
                    {{ question.type }}
                  </span>
                  <span class="question-marks">{{ question.marks }} mark(s)</span>
                </mat-panel-title>
                <mat-panel-description>
                  {{ question.question.substring(0, 80) }}{{ question.question.length > 80 ? '...' : '' }}
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="question-content">
                <div class="question-text">
                  <strong>Question:</strong> {{ question.question }}
                </div>

                <!-- MCQ Options -->
                <div *ngIf="question.type === 'MCQ' && question.options" class="mcq-options">
                  <div *ngFor="let option of question.options; let j = index" 
                       class="option"
                       [ngClass]="{ 'correct-option': option.isCorrect }">
                    <span class="option-label">{{ getOptionLabel(j) }}.</span>
                    <span class="option-text">{{ option.option }}</span>
                    <mat-icon *ngIf="option.isCorrect" class="correct-icon">check_circle</mat-icon>
                  </div>
                </div>

                <!-- Short Answer -->
                <div *ngIf="question.type === 'short_answer' && question.correctAnswer" class="short-answer">
                  <strong>Expected Answer:</strong> {{ question.correctAnswer }}
                </div>

                <!-- Essay -->
                <div *ngIf="question.type === 'essay' && question.maxWords" class="essay-info">
                  <strong>Maximum Words:</strong> {{ question.maxWords }}
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="close()">Close</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      border-bottom: 1px solid #e0e0e0;
    }

    .dialog-header h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 1.5rem;
      color: #333;
    }

    mat-dialog-content {
      padding: 24px;
      overflow-y: auto;
      flex: 1;
    }

    .assignment-info {
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .info-row {
      display: flex;
      gap: 24px;
      margin-bottom: 12px;
    }

    .info-row:last-child {
      margin-bottom: 0;
    }

    .info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
    }

    .info-item strong {
      color: #666;
      font-size: 0.9rem;
    }

    .description, .instructions {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #ddd;
    }

    .description p, .instructions p {
      margin: 8px 0 0 0;
      color: #555;
      line-height: 1.6;
    }

    .questions-section {
      margin-top: 24px;
    }

    .questions-section h3 {
      font-size: 1.2rem;
      color: #333;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .no-questions {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    .no-questions mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 8px;
    }

    mat-expansion-panel {
      margin-bottom: 12px;
      border-radius: 8px !important;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1) !important;
    }

    mat-panel-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .question-number {
      background: #2196F3;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.9rem;
    }

    .question-type {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .question-marks {
      margin-left: auto;
      background: #4CAF50;
      color: white;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .question-content {
      padding: 16px;
    }

    .question-text {
      margin-bottom: 16px;
      font-size: 1rem;
      line-height: 1.6;
    }

    .mcq-options {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: 12px;
    }

    .option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: #f9f9f9;
      border-radius: 8px;
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .option.correct-option {
      background: #e8f5e9;
      border-color: #4CAF50;
    }

    .option-label {
      font-weight: 600;
      color: #2196F3;
      min-width: 24px;
    }

    .option-text {
      flex: 1;
    }

    .correct-icon {
      color: #4CAF50;
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .short-answer, .essay-info {
      margin-top: 12px;
      padding: 12px;
      background: #e3f2fd;
      border-radius: 8px;
      border-left: 4px solid #2196F3;
    }

    .badge {
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.bg-blue-100 { background-color: #e3f2fd; }
    .badge.text-blue-800 { color: #1565c0; }
    .badge.bg-green-100 { background-color: #e8f5e8; }
    .badge.text-green-800 { color: #2e7d32; }
    .badge.bg-purple-100 { background-color: #f3e5f5; }
    .badge.text-purple-800 { color: #6a1b9a; }
    .badge.bg-yellow-100 { background-color: #fff8e1; }
    .badge.text-yellow-800 { color: #f57f17; }

    mat-dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
    }
  `]
})
export class ViewAssignmentDialogComponent {
  assignment: Assignment;

  constructor(
    public dialogRef: MatDialogRef<ViewAssignmentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { assignment: Assignment }
  ) {
    this.assignment = data.assignment;
  }

  close(): void {
    this.dialogRef.close();
  }

  getEntityName(entity: any): string {
    return entity?.name || 'N/A';
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'MCQ':
        return 'bg-blue-100 text-blue-800';
      case 'short_answer':
        return 'bg-green-100 text-green-800';
      case 'essay':
        return 'bg-purple-100 text-purple-800';
      default:
        return '';
    }
  }

  getLevelBadgeClass(level: string): string {
    switch (level) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return '';
    }
  }
}
