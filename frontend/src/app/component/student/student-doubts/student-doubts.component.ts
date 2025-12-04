import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { DoubtService, Doubt, CreateDoubtRequest, DoubtStatistics } from '../../../services/doubt.service';
import { SubjectService } from '../../../services/subject.service';
import { MeetingService } from '../../../services/meeting.service';
import { StudentLayout } from '../student-layout/student-layout';
import { DoubtDetailsDialogComponent } from '../doubt-details-dialog/doubt-details-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-student-doubts',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatDialogModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatRadioModule,
    MatDividerModule,
    StudentLayout
  ],
  template: `
    <app-student-layout>
    <div class="doubts-container">
      <div class="header">
        <div class="header-content">
          <div class="header-icon">
            <mat-icon>help_outline</mat-icon>
          </div>
          <div class="header-text">
            <h1>Doubts & Q&A</h1>
            <p class="subtitle">Ask questions, get expert answers from your lecturers</p>
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
      <div class="stats-grid" *ngIf="statistics">
        <mat-card class="stat-card pending">
          <mat-icon>pending</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{statistics.pending}}</div>
            <div class="stat-label">Pending</div>
          </div>
        </mat-card>
        
        <mat-card class="stat-card answered">
          <mat-icon>question_answer</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{statistics.answered}}</div>
            <div class="stat-label">Answered</div>
          </div>
        </mat-card>
        
        <mat-card class="stat-card resolved">
          <mat-icon>check_circle</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{statistics.resolved}}</div>
            <div class="stat-label">Resolved</div>
          </div>
        </mat-card>
        
        <mat-card class="stat-card response-time">
          <mat-icon>schedule</mat-icon>
          <div class="stat-content">
            <div class="stat-value">{{statistics.averageResponseTime}}h</div>
            <div class="stat-label">Avg Response Time</div>
          </div>
        </mat-card>
      </div>

      <!-- Tabs -->
      <mat-tab-group [(selectedIndex)]="selectedTab" (selectedIndexChange)="onTabChange()">
        
        <!-- My Doubts Tab -->
        <mat-tab label="My Doubts">
          <ng-template mat-tab-label>
            <mat-icon>list_alt</mat-icon>
            <span>My Doubts ({{myDoubts.length}})</span>
          </ng-template>
          
          <div class="doubts-content">
            <!-- Action Button -->
            <div class="action-header">
              <button mat-raised-button color="primary" (click)="selectedTab = 1">
                <mat-icon>add_circle</mat-icon>
                Ask New Doubt
              </button>
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
                  <mat-label>Filter by Subject</mat-label>
                  <mat-select [(ngModel)]="subjectFilter" (selectionChange)="applyFilters()">
                    <mat-option [value]="null">All Subjects</mat-option>
                    <mat-option *ngFor="let subject of subjects" [value]="subject._id">
                      {{subject.name}}
                    </mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </mat-card>

            <!-- Doubts List -->
            <div class="doubts-list" *ngIf="!loading; else loadingSpinner">
              <div *ngIf="filteredDoubts.length === 0" class="empty-state">
                <mat-icon>info</mat-icon>
                <p>No doubts found</p>
                <button mat-raised-button color="primary" (click)="selectedTab = 1">
                  <mat-icon>add</mat-icon> Ask Your First Doubt
                </button>
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

                  <div class="doubt-question">
                    <div class="question-header">
                      <mat-icon>help_outline</mat-icon>
                      <strong>Your Question</strong>
                    </div>
                    <p class="question-text">{{doubt.question}}</p>
                  </div>

                  <div *ngIf="doubt.answer" class="doubt-answer">
                    <div class="answer-header">
                      <mat-icon>check_circle</mat-icon>
                      <strong>Lecturer's Answer</strong>
                    </div>
                    <p class="answer-text">{{doubt.answer}}</p>
                    <div class="answer-meta">
                      <mat-icon>schedule</mat-icon>
                      <span>Answered {{doubt.answeredAt | date:'short'}}</span>
                      <mat-chip class="response-chip" *ngIf="doubt.responseTime">
                        <mat-icon>flash_on</mat-icon>
                        Response time: {{formatResponseTime(doubt.responseTime)}}
                      </mat-chip>
                    </div>
                  </div>

                  <div *ngIf="!doubt.answer" class="doubt-pending">
                    <div class="pending-content">
                      <mat-icon>hourglass_empty</mat-icon>
                      <div class="pending-text">
                        <strong>Awaiting Response</strong>
                        <span>Your lecturer will answer soon</span>
                      </div>
                    </div>
                  </div>
                </mat-card-content>

                <mat-card-actions>
                  <button mat-raised-button color="primary" (click)="viewDetails(doubt._id)">
                    <mat-icon>visibility</mat-icon>
                    View Details
                  </button>
                  <button 
                    mat-raised-button 
                    color="accent" 
                    *ngIf="doubt.status === 'answered'"
                    (click)="markAsResolved(doubt._id)">
                    <mat-icon>check_circle</mat-icon>
                    Mark as Resolved
                  </button>
                  <button 
                    mat-stroked-button 
                    color="warn" 
                    *ngIf="doubt.status === 'pending'"
                    (click)="deleteDoubt(doubt._id)">
                    <mat-icon>delete</mat-icon>
                    Delete
                  </button>
                </mat-card-actions>
              </mat-card>
            </div>

            <ng-template #loadingSpinner>
              <div class="loading-container">
                <mat-spinner></mat-spinner>
                <p>Loading your doubts...</p>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <!-- Ask Doubt Tab -->
        <mat-tab label="Ask a Doubt">
          <ng-template mat-tab-label>
            <mat-icon>add_circle</mat-icon>
            <span>Ask a Doubt</span>
          </ng-template>
          
          <mat-card class="ask-doubt-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>lightbulb</mat-icon> Submit Your Question
              </mat-card-title>
            </mat-card-header>
            
            <mat-card-content>
              <form [formGroup]="doubtForm" (ngSubmit)="submitDoubt()">
                
                <!-- Subject Selection -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Select Subject</mat-label>
                  <mat-select formControlName="subject" (selectionChange)="onSubjectChange($event.value)">
                    <mat-option *ngFor="let subject of subjects" [value]="subject._id">
                      {{subject.name}} ({{subject.code}})
                    </mat-option>
                  </mat-select>
                  <mat-icon matPrefix>subject</mat-icon>
                  <mat-error *ngIf="doubtForm.get('subject')?.hasError('required')">
                    Please select a subject
                  </mat-error>
                </mat-form-field>

                <!-- Meeting Selection (Optional) -->
                <mat-form-field appearance="outline" class="full-width" *ngIf="meetings.length > 0">
                  <mat-label>Related Meeting (Optional)</mat-label>
                  <mat-select formControlName="meeting">
                    <mat-option [value]="null">Not related to any meeting</mat-option>
                    <mat-option *ngFor="let meeting of meetings" [value]="meeting._id">
                      {{meeting.topic}} - {{meeting.meetingDate | date:'short'}}
                    </mat-option>
                  </mat-select>
                  <mat-icon matPrefix>event</mat-icon>
                </mat-form-field>

                <!-- Question -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Your Question</mat-label>
                  <textarea 
                    matInput 
                    formControlName="question" 
                    rows="6" 
                    placeholder="Describe your doubt in detail..."></textarea>
                  <mat-icon matPrefix>help</mat-icon>
                  <mat-hint align="end">{{doubtForm.get('question')?.value?.length || 0}}/2000</mat-hint>
                  <mat-error *ngIf="doubtForm.get('question')?.hasError('required')">
                    Please enter your question
                  </mat-error>
                </mat-form-field>

                <!-- Visibility -->
                <div class="visibility-section">
                  <label class="section-label">
                    <mat-icon>visibility</mat-icon> Visibility
                  </label>
                  <mat-radio-group formControlName="visibility" class="visibility-options">
                    <mat-radio-button value="private" class="visibility-option">
                      <div class="option-content">
                        <div class="option-header">
                          <mat-icon>lock</mat-icon>
                          <strong>Private</strong>
                        </div>
                        <div class="option-desc">Only you and your lecturer can see this</div>
                      </div>
                    </mat-radio-button>
                    
                    <mat-radio-button value="public" class="visibility-option">
                      <div class="option-content">
                        <div class="option-header">
                          <mat-icon>public</mat-icon>
                          <strong>Public</strong>
                        </div>
                        <div class="option-desc">All students in your class can see and learn from this</div>
                      </div>
                    </mat-radio-button>
                  </mat-radio-group>
                </div>

                <!-- Priority -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Priority</mat-label>
                  <mat-select formControlName="priority">
                    <mat-option value="low">
                      <mat-icon style="color: #4caf50; vertical-align: middle;">flag</mat-icon>
                      Low Priority
                    </mat-option>
                    <mat-option value="medium">
                      <mat-icon style="color: #ff9800; vertical-align: middle;">flag</mat-icon>
                      Medium Priority
                    </mat-option>
                    <mat-option value="high">
                      <mat-icon style="color: #f44336; vertical-align: middle;">flag</mat-icon>
                      High Priority
                    </mat-option>
                  </mat-select>
                  <mat-icon matPrefix>flag</mat-icon>
                </mat-form-field>

                <!-- Submit Button -->
                <div class="form-actions">
                  <button 
                    mat-raised-button 
                    color="primary" 
                    type="submit" 
                    [disabled]="!doubtForm.valid || submitting">
                    <mat-icon>send</mat-icon>
                    {{ submitting ? 'Submitting...' : 'Submit Doubt' }}
                  </button>
                  
                  <button 
                    mat-button 
                    type="button" 
                    (click)="resetForm()">
                    <mat-icon>refresh</mat-icon>
                    Reset
                  </button>
                </div>
              </form>
            </mat-card-content>
          </mat-card>
        </mat-tab>

        <!-- Public Q&A Tab -->
        <mat-tab label="Class Q&A">
          <ng-template mat-tab-label>
            <mat-icon>forum</mat-icon>
            <span>Class Q&A</span>
          </ng-template>
          
          <div class="public-qa-content">
            <mat-card class="info-card">
              <mat-icon>info</mat-icon>
              <p>Browse answered questions from your classmates. Learn from their doubts!</p>
            </mat-card>

            <!-- Subject Filter -->
            <mat-form-field appearance="outline" class="subject-filter">
              <mat-label>Select Subject</mat-label>
              <mat-select [(ngModel)]="selectedPublicSubject" (selectionChange)="loadPublicDoubts()">
                <mat-option *ngFor="let subject of subjects" [value]="subject._id">
                  {{subject.name}} ({{subject.code}})
                </mat-option>
              </mat-select>
              <mat-icon matPrefix>subject</mat-icon>
            </mat-form-field>

            <div *ngIf="selectedPublicSubject" class="public-doubts-list">
              <div *ngIf="publicDoubts.length === 0" class="empty-state">
                <mat-icon>forum</mat-icon>
                <p>No public Q&A available for this subject yet</p>
              </div>

              <mat-card *ngFor="let doubt of publicDoubts" class="public-doubt-card">
                <mat-card-header>
                  <mat-icon mat-card-avatar>account_circle</mat-icon>
                  <mat-card-title>{{doubt.student.name}}</mat-card-title>
                  <mat-card-subtitle>{{doubt.createdAt | date:'medium'}}</mat-card-subtitle>
                </mat-card-header>

                <mat-card-content>
                  <div class="public-question">
                    <h3><mat-icon>help</mat-icon> Question:</h3>
                    <p>{{doubt.question}}</p>
                  </div>

                  <mat-divider></mat-divider>

                  <div class="public-answer">
                    <h3><mat-icon>lightbulb</mat-icon> Answer by {{doubt.lecturer.name}}:</h3>
                    <p>{{doubt.answer}}</p>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>

      <!-- Loading Spinner Template -->
      <ng-template #loadingSpinner>
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Loading doubts...</p>
        </div>
      </ng-template>
    </div>
    </app-student-layout>
  `,
  styles: [`
    .doubts-container {
      padding: 0;
      max-width: 100%;
      margin: 0;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .action-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
      padding: 0 4px;
    }

    .action-header button {
      font-weight: 600;
      padding: 0 24px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
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

    ::ng-deep .mat-mdc-tab-group {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
      margin: 0 24px 24px 24px;
    }

    ::ng-deep .mat-mdc-tab-label {
      min-width: 120px;
    }

    .doubts-content {
      padding: 24px;
    }

    .ask-doubt-card {
      margin: 24px;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }

    mat-card-header mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 20px;
    }

    mat-card-actions {
      padding: 16px !important;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }

    mat-card-actions button {
      border-radius: 8px;
      font-weight: 600;
      padding: 0 20px;
      box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .visibility-section {
      margin: 24px 0;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 12px;
      color: #333;
    }

    .visibility-options {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .visibility-option {
      flex: 1;
      min-width: 250px;
      padding: 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .visibility-option:hover {
      border-color: #1976d2;
      background: #f5f5f5;
    }

    ::ng-deep .mat-mdc-radio-button.mat-accent.mat-mdc-radio-checked .visibility-option {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    .option-content {
      margin-left: 8px;
    }

    .option-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .option-desc {
      font-size: 12px;
      color: #666;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .filters-card {
      margin: 0 0 24px 0;
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
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.15);
    }

    .doubt-card.status-pending {
      border-top: 4px solid #ff9800;
      background: linear-gradient(to bottom, #fff8e1 0%, white 60px);
    }

    .doubt-card.status-answered {
      border-top: 4px solid #2196f3;
      background: linear-gradient(to bottom, #e3f2fd 0%, white 60px);
    }

    .doubt-card.status-resolved {
      border-top: 4px solid #4caf50;
      background: linear-gradient(to bottom, #e8f5e9 0%, white 60px);
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

    .doubt-lecturer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #555;
    }

    .doubt-question {
      margin: 20px 0;
      padding: 20px;
      background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
      border-radius: 12px;
      border: 2px solid #e3f2fd;
      position: relative;
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
    }

    .doubt-answer {
      background: linear-gradient(135deg, #e8f5e9 0%, #f1f8f4 100%);
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
      border-left: 4px solid #4caf50;
    }

    .answer-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      color: #2e7d32;
      font-size: 15px;
    }

    .answer-header mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .answer-text {
      color: #1b5e20;
      line-height: 1.6;
      margin: 0 0 12px 0;
      font-size: 15px;
    }

    .answer-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 12px;
      color: #558b2f;
      flex-wrap: wrap;
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

    .new-badge {
      margin-left: 8px;
      font-size: 11px;
    }

    .answer-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 12px;
      font-size: 12px;
      color: #666;
    }

    .response-time {
      margin-left: 8px;
      font-style: italic;
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

    .info-card {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 24px 0;
      background: #e3f2fd;
      padding: 16px;
    }

    .info-card mat-icon {
      color: #1976d2;
    }

    .subject-filter {
      width: 100%;
      max-width: 400px;
      margin-bottom: 24px;
    }

    .public-doubts-list {
      display: grid;
      gap: 16px;
    }

    .public-doubt-card {
      border-left: 4px solid #2196f3;
    }

    .public-question,
    .public-answer {
      margin: 16px 0;
    }

    .public-question h3,
    .public-answer h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
      color: #333;
    }

    mat-divider {
      margin: 16px 0;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }

      .visibility-options {
        flex-direction: column;
      }

      .visibility-option {
        min-width: 100%;
      }
    }
  `]
})
export class StudentDoubtsComponent implements OnInit, OnDestroy {
  private doubtService = inject(DoubtService);
  private subjectService = inject(SubjectService);
  private meetingService = inject(MeetingService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  doubtForm!: FormGroup;
  subjects: any[] = [];
  meetings: any[] = [];
  myDoubts: Doubt[] = [];
  filteredDoubts: Doubt[] = [];
  publicDoubts: Doubt[] = [];
  statistics: DoubtStatistics | null = null;

  selectedTab = 0;
  loading = false;
  submitting = false;

  statusFilter: string | null = null;
  subjectFilter: string | null = null;
  selectedPublicSubject: string | null = null;

  private subscriptions: Subscription[] = [];

  ngOnInit(): void {
    this.initializeForm();
    this.loadSubjects();
    this.loadStatistics();
    this.loadMyDoubts();
    this.subscribeToDoubtUpdates();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initializeForm(): void {
    this.doubtForm = this.fb.group({
      subject: ['', Validators.required],
      meeting: [null],
      question: ['', [Validators.required, Validators.maxLength(2000)]],
      visibility: ['private', Validators.required],
      priority: ['medium', Validators.required],
      lecturer: [''] // Will be set when subject is selected
    });
  }

  loadSubjects(): void {
    this.subjectService.getSubjects().subscribe({
      next: (subjects: any) => {
        this.subjects = subjects.data || subjects;
      },
      error: (error: any) => {
        console.error('Error loading subjects:', error);
        this.snackBar.open('Error loading subjects', 'Close', { duration: 3000 });
      }
    });
  }

  onSubjectChange(subjectId: string): void {
    const subject = this.subjects.find(s => s._id === subjectId);
    if (subject) {
      // Handle both populated and unpopulated lecturer field
      const lecturerId = subject.lecturerId?._id || subject.lecturerId || subject.lecturer?._id || subject.lecturer;
      if (lecturerId) {
        this.doubtForm.patchValue({ lecturer: lecturerId });
      }
      this.loadMeetingsForSubject(subjectId);
    }
  }

  loadMeetingsForSubject(subjectId: string): void {
    this.meetingService.getMeetings({ subjectId: subjectId }).subscribe({
      next: (meetings: any) => {
        this.meetings = meetings.data || meetings;
      },
      error: (error: any) => {
        console.error('Error loading meetings:', error);
      }
    });
  }

  loadStatistics(): void {
    this.doubtService.getStatistics().subscribe({
      next: (stats) => {
        this.statistics = stats;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
      }
    });
  }

  loadMyDoubts(): void {
    this.loading = true;
    this.doubtService.getDoubts().subscribe({
      next: (doubts) => {
        this.myDoubts = doubts.filter(d => d.student);
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading doubts:', error);
        this.snackBar.open('Error loading doubts', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  loadPublicDoubts(): void {
    if (!this.selectedPublicSubject) return;

    this.doubtService.getPublicDoubtsBySubject(this.selectedPublicSubject).subscribe({
      next: (doubts) => {
        this.publicDoubts = doubts;
      },
      error: (error) => {
        console.error('Error loading public doubts:', error);
        this.snackBar.open('Error loading public Q&A', 'Close', { duration: 3000 });
      }
    });
  }

  submitDoubt(): void {
    if (!this.doubtForm.valid) return;

    this.submitting = true;
    const doubtData: CreateDoubtRequest = this.doubtForm.value;

    this.doubtService.createDoubt(doubtData).subscribe({
      next: (doubt) => {
        this.snackBar.open('Doubt submitted successfully!', 'Close', { duration: 3000 });
        this.resetForm();
        this.selectedTab = 1; // Switch to My Doubts tab
        this.loadStatistics();
        this.submitting = false;
      },
      error: (error) => {
        console.error('Error submitting doubt:', error);
        this.snackBar.open('Error submitting doubt. Please try again.', 'Close', { duration: 3000 });
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
      error: (error) => {
        console.error('Error updating doubt:', error);
        this.snackBar.open('Error updating doubt', 'Close', { duration: 3000 });
      }
    });
  }

  deleteDoubt(doubtId: string): void {
    if (confirm('Are you sure you want to delete this doubt?')) {
      this.doubtService.deleteDoubt(doubtId).subscribe({
        next: () => {
          this.snackBar.open('Doubt deleted successfully', 'Close', { duration: 2000 });
          this.loadStatistics();
        },
        error: (error) => {
          console.error('Error deleting doubt:', error);
          this.snackBar.open('Error deleting doubt', 'Close', { duration: 3000 });
        }
      });
    }
  }

  applyFilters(): void {
    this.filteredDoubts = this.myDoubts.filter(doubt => {
      if (this.statusFilter && doubt.status !== this.statusFilter) return false;
      if (this.subjectFilter && doubt.subject._id !== this.subjectFilter) return false;
      return true;
    });
  }

  resetForm(): void {
    this.doubtForm.reset({
      visibility: 'private',
      priority: 'medium'
    });
    this.meetings = [];
  }

  onTabChange(): void {
    if (this.selectedTab === 1) {
      this.loadMyDoubts();
    }
  }

  viewDetails(doubtId: string): void {
    const dialogRef = this.dialog.open(DoubtDetailsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { doubtId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Refresh the list if there were any updates
        this.loadMyDoubts();
        this.loadStatistics();
      }
    });
  }

  subscribeToDoubtUpdates(): void {
    const sub = this.doubtService.doubts$.subscribe(doubts => {
      this.myDoubts = doubts.filter(d => d.student);
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
