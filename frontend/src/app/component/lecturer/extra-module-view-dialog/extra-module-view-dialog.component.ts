import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ExtraModule } from '../../../models/extra-module.model';

@Component({
  selector: 'app-extra-module-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule
  ],
  template: `
    <div class="extra-module-view-dialog">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <mat-icon class="header-icon">auto_stories</mat-icon>
          <div class="header-text">
            <h2>Extra Module Details</h2>
            <p>View complete extra module information</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-btn">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="dialog-content">
        <!-- Status & Level Badges -->
        <div class="status-section">
          <mat-chip-set>
            <mat-chip [class.active-chip]="module.isActive" [class.inactive-chip]="!module.isActive">
              <mat-icon>{{ module.isActive ? 'check_circle' : 'cancel' }}</mat-icon>
              {{ module.isActive ? 'Active' : 'Inactive' }}
            </mat-chip>
            <mat-chip [ngClass]="getLevelChipClass()">
              <mat-icon>school</mat-icon>
              {{ module.studentLevel }}
            </mat-chip>
          </mat-chip-set>
        </div>

        <!-- Basic Information -->
        <div class="info-section">
          <h3 class="section-title">
            <mat-icon>info</mat-icon>
            Basic Information
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Module Code</label>
              <div class="info-value code-value">{{ module.code }}</div>
            </div>
            <div class="info-item">
              <label>Module Name</label>
              <div class="info-value">{{ module.name }}</div>
            </div>
            <div class="info-item full-width">
              <label>Description</label>
              <div class="info-value description">{{ module.description }}</div>
            </div>
            <div class="info-item">
              <label>Subject</label>
              <div class="info-value">{{ getSubjectName() }}</div>
            </div>
            <div class="info-item">
              <label>Student Level</label>
              <div class="info-value">
                <span class="level-badge" [ngClass]="getLevelBadgeClass()">
                  {{ module.studentLevel }}
                </span>
              </div>
            </div>
            <div class="info-item">
              <label>Display Order</label>
              <div class="info-value">
                <span class="order-badge">{{ module.order }}</span>
              </div>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Documents Section -->
        <div class="info-section">
          <h3 class="section-title">
            <mat-icon>description</mat-icon>
            Documents ({{ module.documents.length || 0 }})
          </h3>
          
          <div *ngIf="!module.documents || module.documents.length === 0" class="empty-state">
            <mat-icon>folder_open</mat-icon>
            <p>No documents uploaded</p>
          </div>

          <div *ngIf="module.documents && module.documents.length > 0" class="documents-list">
            <div *ngFor="let doc of module.documents" class="document-card">
              <div class="doc-icon">
                <mat-icon [ngClass]="getDocIconClass(doc.fileType)">
                  {{ getDocIcon(doc.fileType) }}
                </mat-icon>
              </div>
              <div class="doc-info">
                <div class="doc-name">{{ doc.name }}</div>
                <div class="doc-meta">
                  <span class="doc-type">{{ doc.fileType.toUpperCase() }}</span>
                  <span class="doc-size" *ngIf="doc.size">{{ formatFileSize(doc.size) }}</span>
                  <span class="doc-date">{{ doc.uploadedAt | date:'short' }}</span>
                </div>
              </div>
              <div class="doc-actions">
                <a [href]="doc.cloudinaryURL" target="_blank" mat-icon-button 
                   matTooltip="View Document" color="primary">
                  <mat-icon>visibility</mat-icon>
                </a>
                <a [href]="doc.cloudinaryURL" download mat-icon-button 
                   matTooltip="Download" color="accent">
                  <mat-icon>download</mat-icon>
                </a>
              </div>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Video Section -->
        <div class="info-section">
          <h3 class="section-title">
            <mat-icon>videocam</mat-icon>
            Video Lecture
          </h3>

          <div *ngIf="!module.video || !module.video.cloudinaryURL" class="empty-state">
            <mat-icon>videocam_off</mat-icon>
            <p>No video uploaded</p>
          </div>

          <div *ngIf="module.video && module.video.cloudinaryURL" class="video-card">
            <div class="video-preview">
              <video [src]="module.video.cloudinaryURL" controls class="video-player"></video>
            </div>
            <div class="video-info">
              <div class="video-name">{{ module.video.name }}</div>
              <div class="video-meta">
                <span class="video-type">{{ module.video.fileType.toUpperCase() }}</span>
                <span class="video-duration" *ngIf="module.video.duration">{{ formatDuration(module.video.duration) }}</span>
                <span class="video-date">{{ module.video.uploadedAt | date:'short' }}</span>
              </div>
            </div>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- Metadata Section -->
        <div class="info-section">
          <h3 class="section-title">
            <mat-icon>history</mat-icon>
            Metadata
          </h3>
          <div class="info-grid">
            <div class="info-item">
              <label>Created At</label>
              <div class="info-value">{{ module.createdAt | date:'medium' }}</div>
            </div>
            <div class="info-item">
              <label>Last Updated</label>
              <div class="info-value">{{ module.updatedAt | date:'medium' }}</div>
            </div>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-stroked-button mat-dialog-close>
          <mat-icon>close</mat-icon>
          Close
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .extra-module-view-dialog {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    /* Header */
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
      color: white;
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }

    .header-text h2 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }

    .header-text p {
      margin: 4px 0 0 0;
      opacity: 0.9;
      font-size: 14px;
    }

    .close-btn {
      color: white;
    }

    /* Content */
    .dialog-content {
      padding: 0 !important;
      overflow-y: auto;
    }

    /* Status Section */
    .status-section {
      padding: 20px 24px;
      background: #f5f7fa;
      display: flex;
      justify-content: center;
    }

    mat-chip-set {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .active-chip {
      background: #4caf50 !important;
      color: white !important;
      font-weight: 600;
    }

    .inactive-chip {
      background: #f44336 !important;
      color: white !important;
      font-weight: 600;
    }

    .level-chip-beginner {
      background: #4caf50 !important;
      color: white !important;
      font-weight: 600;
    }

    .level-chip-intermediate {
      background: #ff9800 !important;
      color: white !important;
      font-weight: 600;
    }

    .level-chip-advanced {
      background: #f44336 !important;
      color: white !important;
      font-weight: 600;
    }

    .level-chip-all {
      background: #2196F3 !important;
      color: white !important;
      font-weight: 600;
    }

    mat-chip mat-icon {
      margin-right: 4px;
    }

    /* Info Section */
    .info-section {
      padding: 24px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 0 20px 0;
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }

    .section-title mat-icon {
      color: #9C27B0;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item.full-width {
      grid-column: 1 / -1;
    }

    .info-item label {
      font-size: 12px;
      font-weight: 600;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 16px;
      color: #333;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 3px solid #9C27B0;
    }

    .info-value.code-value {
      font-family: 'Courier New', monospace;
      font-weight: 600;
      background: #f3e5f5;
      color: #7B1FA2;
    }

    .info-value.description {
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .order-badge {
      display: inline-block;
      background: #9C27B0;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }

    .level-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
    }

    .level-beginner {
      background: #e8f5e9;
      color: #388e3c;
    }

    .level-intermediate {
      background: #fff3e0;
      color: #f57c00;
    }

    .level-advanced {
      background: #ffebee;
      color: #c62828;
    }

    .level-all {
      background: #e3f2fd;
      color: #1976d2;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .empty-state mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      opacity: 0.5;
      margin-bottom: 12px;
    }

    .empty-state p {
      margin: 0;
      font-size: 16px;
    }

    /* Documents List */
    .documents-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .document-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #e0e0e0;
      transition: all 0.3s ease;
    }

    .document-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }

    .doc-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      background: white;
    }

    .doc-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .doc-icon mat-icon.pdf-icon {
      color: #d32f2f;
    }

    .doc-icon mat-icon.word-icon {
      color: #1976d2;
    }

    .doc-icon mat-icon.excel-icon {
      color: #388e3c;
    }

    .doc-icon mat-icon.default-icon {
      color: #666;
    }

    .doc-info {
      flex: 1;
    }

    .doc-name {
      font-size: 15px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }

    .doc-meta {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: #666;
    }

    .doc-type {
      font-weight: 600;
      color: #9C27B0;
    }

    .doc-actions {
      display: flex;
      gap: 4px;
    }

    /* Video Card */
    .video-card {
      background: #f8f9fa;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e0e0e0;
    }

    .video-preview {
      background: #000;
    }

    .video-player {
      width: 100%;
      max-height: 400px;
    }

    .video-info {
      padding: 16px;
    }

    .video-name {
      font-size: 16px;
      font-weight: 600;
      color: #333;
      margin-bottom: 8px;
    }

    .video-meta {
      display: flex;
      gap: 12px;
      font-size: 13px;
      color: #666;
      flex-wrap: wrap;
    }

    .video-type {
      font-weight: 600;
      color: #9C27B0;
    }

    /* Actions */
    .dialog-actions {
      padding: 16px 24px;
      border-top: 1px solid #e0e0e0;
      justify-content: flex-end;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .info-grid {
        grid-template-columns: 1fr;
      }

      .document-card {
        flex-direction: column;
        align-items: flex-start;
      }

      .doc-actions {
        width: 100%;
        justify-content: flex-end;
      }
    }
  `]
})
export class ExtraModuleViewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ExtraModuleViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public module: ExtraModule
  ) {}

  getSubjectName(): string {
    if (typeof this.module.subject === 'string') {
      return this.module.subject;
    }
    return (this.module.subject as any)?.name || 'N/A';
  }

  getLevelChipClass(): string {
    const level = this.module.studentLevel.toLowerCase();
    return `level-chip-${level}`;
  }

  getLevelBadgeClass(): string {
    const level = this.module.studentLevel.toLowerCase();
    return `level-${level}`;
  }

  getDocIcon(fileType: string): string {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('word') || type.includes('doc')) return 'description';
    if (type.includes('excel') || type.includes('xls')) return 'table_chart';
    if (type.includes('powerpoint') || type.includes('ppt')) return 'slideshow';
    if (type.includes('image') || type.includes('jpg') || type.includes('png')) return 'image';
    return 'insert_drive_file';
  }

  getDocIconClass(fileType: string): string {
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return 'pdf-icon';
    if (type.includes('word') || type.includes('doc')) return 'word-icon';
    if (type.includes('excel') || type.includes('xls')) return 'excel-icon';
    return 'default-icon';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
