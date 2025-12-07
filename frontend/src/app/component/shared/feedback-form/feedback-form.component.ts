import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { FeedbackService, Feedback } from '../../../services/feedback.service';

@Component({
  selector: 'app-feedback-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="feedback-container">
      <mat-card class="feedback-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>feedback</mat-icon>
            Share Your Experience
          </mat-card-title>
          <mat-card-subtitle>Help us improve by sharing your feedback about Smart LMS</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Already Submitted Message -->
          <div *ngIf="existingFeedback" class="feedback-status">
            <mat-icon class="status-icon" [class.approved]="existingFeedback.status === 'approved'"
                      [class.pending]="existingFeedback.status === 'pending'"
                      [class.rejected]="existingFeedback.status === 'rejected'">
              {{ getStatusIcon(existingFeedback.status) }}
            </mat-icon>
            <div class="status-message">
              <h3>Feedback {{ existingFeedback.status | titlecase }}</h3>
              <p *ngIf="existingFeedback.status === 'pending'">
                Your feedback is under review by administrators.
              </p>
              <p *ngIf="existingFeedback.status === 'approved'">
                Thank you! Your feedback has been approved and is now visible on our home page.
              </p>
              <p *ngIf="existingFeedback.status === 'rejected'">
                Your feedback was not approved. Please contact support for more information.
              </p>
              
              <div class="existing-feedback">
                <div class="rating-display">
                  <mat-icon *ngFor="let star of getStars(existingFeedback.rating)" class="star-icon">star</mat-icon>
                </div>
                <p class="comment">"{{ existingFeedback.comment }}"</p>
                <p class="submitted-date">Submitted on {{ existingFeedback.createdAt | date:'medium' }}</p>
              </div>
            </div>
          </div>

          <!-- Feedback Form -->
          <form [formGroup]="feedbackForm" (ngSubmit)="onSubmit()" *ngIf="!existingFeedback">
            <!-- Rating -->
            <div class="rating-section">
              <label>How would you rate your experience? *</label>
              <div class="star-rating">
                <mat-icon *ngFor="let star of [1,2,3,4,5]" 
                          class="star" 
                          [class.filled]="star <= selectedRating"
                          (click)="setRating(star)"
                          (mouseenter)="hoverRating = star"
                          (mouseleave)="hoverRating = 0">
                  {{ star <= (hoverRating || selectedRating) ? 'star' : 'star_border' }}
                </mat-icon>
              </div>
              <div class="rating-label">{{ getRatingLabel() }}</div>
              <mat-error *ngIf="feedbackForm.get('rating')?.touched && feedbackForm.get('rating')?.hasError('required')">
                Please select a rating
              </mat-error>
            </div>

            <!-- Comment -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Your Feedback</mat-label>
              <textarea matInput 
                        formControlName="comment" 
                        placeholder="Tell us about your experience with Smart LMS..."
                        rows="6"
                        maxlength="500"></textarea>
              <mat-hint align="end">{{ feedbackForm.get('comment')?.value?.length || 0 }}/500</mat-hint>
              <mat-error *ngIf="feedbackForm.get('comment')?.hasError('required')">
                Feedback comment is required
              </mat-error>
              <mat-error *ngIf="feedbackForm.get('comment')?.hasError('minlength')">
                Feedback must be at least 10 characters
              </mat-error>
            </mat-form-field>

            <!-- Guidelines -->
            <div class="guidelines">
              <mat-icon>info</mat-icon>
              <div>
                <strong>Guidelines:</strong>
                <ul>
                  <li>Be honest and constructive</li>
                  <li>Focus on your experience with the platform</li>
                  <li>Avoid personal or offensive language</li>
                  <li>Your feedback will be reviewed before being published</li>
                </ul>
              </div>
            </div>

            <!-- Actions -->
            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="saving || feedbackForm.invalid">
                <mat-spinner *ngIf="saving" diameter="20" class="button-spinner"></mat-spinner>
                <mat-icon *ngIf="!saving">send</mat-icon>
                {{ saving ? 'Submitting...' : 'Submit Feedback' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .feedback-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 1rem;
    }

    .feedback-card {
      mat-card-header {
        margin-bottom: 1.5rem;
      }

      mat-card-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 24px;
      }
    }

    .feedback-status {
      display: flex;
      gap: 1.5rem;
      padding: 2rem;
      background: #f8f9fa;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .status-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
    }

    .status-icon.approved {
      color: #4caf50;
    }

    .status-icon.pending {
      color: #ff9800;
    }

    .status-icon.rejected {
      color: #f44336;
    }

    .status-message h3 {
      margin: 0 0 0.5rem 0;
    }

    .existing-feedback {
      margin-top: 1rem;
      padding: 1rem;
      background: white;
      border-radius: 8px;
    }

    .rating-section {
      margin-bottom: 2rem;
    }

    .rating-section label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .star-rating {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .star {
      font-size: 40px;
      width: 40px;
      height: 40px;
      cursor: pointer;
      color: #d1d5db;
      transition: all 0.2s ease;
    }

    .star.filled {
      color: #fbbf24;
    }

    .star:hover {
      transform: scale(1.1);
    }

    .rating-label {
      font-size: 14px;
      color: #666;
      min-height: 20px;
    }

    .rating-display {
      display: flex;
      gap: 4px;
      margin-bottom: 1rem;
    }

    .star-icon {
      color: #fbbf24;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .comment {
      font-style: italic;
      color: #555;
      margin: 1rem 0;
    }

    .submitted-date {
      font-size: 12px;
      color: #999;
      margin: 0;
    }

    .full-width {
      width: 100%;
    }

    .guidelines {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .guidelines mat-icon {
      color: #2196f3;
      flex-shrink: 0;
    }

    .guidelines ul {
      margin: 0.5rem 0 0 0;
      padding-left: 1.5rem;
    }

    .guidelines li {
      margin: 0.25rem 0;
      font-size: 14px;
      color: #555;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
    }

    .button-spinner {
      display: inline-block;
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .feedback-container {
        margin: 1rem;
        padding: 0.5rem;
      }
    }
  `]
})
export class FeedbackFormComponent implements OnInit {
  feedbackForm: FormGroup;
  saving = false;
  selectedRating = 0;
  hoverRating = 0;
  existingFeedback: Feedback | null = null;

  constructor(
    private fb: FormBuilder,
    private feedbackService: FeedbackService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.feedbackForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.loadExistingFeedback();
  }

  loadExistingFeedback(): void {
    this.feedbackService.getMyFeedback().subscribe({
      next: (response) => {
        if (response.success && response.data.feedback) {
          this.existingFeedback = response.data.feedback;
        }
      },
      error: (error) => {
        console.error('Error loading feedback:', error);
      }
    });
  }

  setRating(rating: number): void {
    this.selectedRating = rating;
    this.feedbackForm.patchValue({ rating });
  }

  getRatingLabel(): string {
    const labels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    return this.hoverRating > 0 ? labels[this.hoverRating] : labels[this.selectedRating];
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  getStatusIcon(status: string): string {
    const icons: any = {
      pending: 'schedule',
      approved: 'check_circle',
      rejected: 'cancel'
    };
    return icons[status] || 'help';
  }

  onSubmit(): void {
    if (this.feedbackForm.invalid) {
      Object.keys(this.feedbackForm.controls).forEach(key => {
        this.feedbackForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving = true;
    const { rating, comment } = this.feedbackForm.value;

    this.feedbackService.submitFeedback(rating, comment).subscribe({
      next: (response) => {
        this.snackBar.open('Feedback submitted successfully! It will be reviewed by admin.', 'Close', {
          duration: 5000
        });
        this.existingFeedback = response.data.feedback;
        this.feedbackForm.reset();
        this.selectedRating = 0;
        this.saving = false;
      },
      error: (error) => {
        console.error('Error submitting feedback:', error);
        this.snackBar.open(
          error.error?.message || 'Failed to submit feedback',
          'Close',
          { duration: 3000 }
        );
        this.saving = false;
      }
    });
  }
}
