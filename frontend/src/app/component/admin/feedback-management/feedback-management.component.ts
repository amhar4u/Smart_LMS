import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AdminLayout } from '../admin-layout/admin-layout';
import { FeedbackService, Feedback } from '../../../services/feedback.service';

@Component({
  selector: 'app-feedback-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSnackBarModule,
    AdminLayout
  ],
  templateUrl: './feedback-management.component.html',
  styleUrls: ['./feedback-management.component.css']
})
export class FeedbackManagementComponent implements OnInit {
  pendingFeedback: Feedback[] = [];
  approvedFeedback: Feedback[] = [];
  rejectedFeedback: Feedback[] = [];
  loading = false;
  displayedColumns = ['user', 'role', 'rating', 'comment', 'date', 'actions'];

  constructor(
    private feedbackService: FeedbackService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadAllFeedback();
  }

  loadAllFeedback(): void {
    this.loading = true;
    this.feedbackService.getAllFeedbacks('', 1, 100).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.pendingFeedback = response.data.feedbacks.filter((f: any) => f.status === 'pending');
          this.approvedFeedback = response.data.feedbacks.filter((f: any) => f.status === 'approved');
          this.rejectedFeedback = response.data.feedbacks.filter((f: any) => f.status === 'rejected');
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading feedback:', error);
        this.snackBar.open('Failed to load feedback', 'Close', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  approveFeedback(id: string): void {
    this.feedbackService.approveFeedback(id).subscribe({
      next: (response) => {
        this.snackBar.open('Feedback approved successfully', 'Close', { duration: 3000 });
        this.loadAllFeedback();
      },
      error: (error) => {
        this.snackBar.open('Failed to approve feedback', 'Close', { duration: 3000 });
      }
    });
  }

  rejectFeedback(id: string): void {
    if (confirm('Are you sure you want to reject this feedback?')) {
      this.feedbackService.rejectFeedback(id, 'Rejected by admin').subscribe({
        next: (response: any) => {
          this.snackBar.open('Feedback rejected successfully', 'Close', { duration: 3000 });
          this.loadAllFeedback();
        },
        error: (error: any) => {
          this.snackBar.open('Failed to reject feedback', 'Close', { duration: 3000 });
        }
      });
    }
  }

  deleteFeedback(id: string): void {
    if (confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
      this.feedbackService.deleteFeedback(id).subscribe({
        next: (response) => {
          this.snackBar.open('Feedback deleted successfully', 'Close', { duration: 3000 });
          this.loadAllFeedback();
        },
        error: (error) => {
          this.snackBar.open('Failed to delete feedback', 'Close', { duration: 3000 });
        }
      });
    }
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  // Rating statistics for approved feedback
  get ratingStats() {
    const total = this.approvedFeedback.length;
    if (total === 0) return { avg: 0, avgDisplay: '0.0', ratings: [0, 0, 0, 0, 0], total: 0 };

    const ratings = [0, 0, 0, 0, 0]; // 5 star, 4 star, 3 star, 2 star, 1 star
    let sum = 0;

    this.approvedFeedback.forEach(f => {
      ratings[5 - f.rating]++;
      sum += f.rating;
    });

    const avgValue = sum / total;

    return {
      avg: avgValue,
      avgDisplay: avgValue.toFixed(1),
      ratings: ratings,
      total: total
    };
  }

  getRatingPercentage(count: number): number {
    const total = this.approvedFeedback.length;
    return total > 0 ? (count / total) * 100 : 0;
  }
}
