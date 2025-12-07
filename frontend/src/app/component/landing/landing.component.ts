import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StatisticsService, OverallStatistics, DepartmentStatistics } from '../../services/statistics.service';
import { FeedbackService, Feedback } from '../../services/feedback.service';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule
  ],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  statistics: OverallStatistics = {
    activeStudents: 0,
    expertTeachers: 0,
    coursesAvailable: 0,
    successRate: 0,
    totalDepartments: 0,
    totalUsers: 0,
    admins: 0,
    approvedUsers: 0,
    pendingUsers: 0,
    pendingStudents: 0,
    pendingTeachers: 0,
    rejectedUsers: 0
  };

  departmentStats: DepartmentStatistics[] = [];
  loading = true;

  // Feedback/Testimonials
  feedbacks: Feedback[] = [];
  currentPage = 0;
  itemsPerPage = 2;

  constructor(
    private statisticsService: StatisticsService,
    private feedbackService: FeedbackService
  ) {}

  ngOnInit() {
    this.loadStatistics();
    this.loadFeedback();
  }

  private loadFeedback() {
    this.feedbackService.getApprovedFeedbacks().subscribe({
      next: (response: any) => {
        if (response.success && response.data.feedbacks) {
          this.feedbacks = response.data.feedbacks.slice(0, 6); // Limit to 6 feedbacks
        }
      },
      error: (error: any) => {
        console.error('Error loading feedback:', error);
        this.feedbacks = [];
      }
    });
  }

  private loadStatistics() {
    this.statisticsService.getOverallStatistics().subscribe({
      next: (response) => {
        if (response.success) {
          this.statistics = response.data.overall;
          this.departmentStats = response.data.departments;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading statistics:', error);
        this.loading = false;
        // Keep default values for display
      }
    });
  }

  // Get the highest performing department for success rate display
  getTopDepartmentSuccessRate(): number {
    if (this.departmentStats.length === 0) {
      return this.statistics.successRate;
    }
    
    const topDepartment = this.departmentStats.reduce((prev, current) => 
      (prev.successRate > current.successRate) ? prev : current
    );
    
    return topDepartment.successRate;
  }

  // Get formatted numbers for display
  getFormattedNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K+';
    }
    return num.toString() + '+';
  }

  features = [
    {
      icon: 'school',
      title: 'Interactive Learning',
      description: 'Engage with interactive content and multimedia resources designed to enhance your learning experience.'
    },
    {
      icon: 'people',
      title: 'Collaborative Environment',
      description: 'Connect with peers and instructors in a collaborative online learning environment.'
    },
    {
      icon: 'assessment',
      title: 'Progress Tracking',
      description: 'Monitor your learning progress with detailed analytics and performance insights.'
    },
    {
      icon: 'schedule',
      title: 'Flexible Scheduling',
      description: 'Learn at your own pace with flexible scheduling and 24/7 access to course materials.'
    },
    {
      icon: 'mobile_friendly',
      title: 'Mobile Learning',
      description: 'Access your courses anytime, anywhere with our responsive mobile-friendly platform.'
    },
    {
      icon: 'verified_user',
      title: 'Secure Platform',
      description: 'Your data is protected with industry-standard security measures and privacy controls.'
    }
  ];



  // Carousel methods
  get displayedFeedbacks(): Feedback[] {
    if (this.feedbacks.length === 0) return [];
    const start = this.currentPage * this.itemsPerPage;
    return this.feedbacks.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.feedbacks.length / this.itemsPerPage);
  }

  get hasPrevious(): boolean {
    return this.currentPage > 0;
  }

  get hasNext(): boolean {
    return this.currentPage < this.totalPages - 1;
  }

  previousPage() {
    if (this.hasPrevious) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.hasNext) {
      this.currentPage++;
    }
  }

  getInitials(feedback: Feedback): string {
    const firstName = feedback.user?.firstName || feedback.userName.split(' ')[0] || '';
    const lastName = feedback.user?.lastName || feedback.userName.split(' ')[1] || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  getRoleDisplay(role: string): string {
    return role === 'teacher' ? 'Lecturer' : 'Student';
  }

  getRoleWithInfo(feedback: Feedback): string {
    if (feedback.userRole === 'teacher') {
      const dept = feedback.user?.department?.name;
      return dept ? `Lecturer of ${dept}` : 'Lecturer';
    } else {
      const course = feedback.user?.course?.name;
      return course ? `${course} Student` : 'Student';
    }
  }

  // Rating statistics
  get ratingStats() {
    if (this.feedbacks.length === 0) return { avg: 0, avgDisplay: '0.0', total: 0, ratings: [0, 0, 0, 0, 0] };
    
    const ratings = [0, 0, 0, 0, 0]; // 5 star, 4 star, 3 star, 2 star, 1 star
    let sum = 0;

    this.feedbacks.forEach(f => {
      ratings[5 - f.rating]++;
      sum += f.rating;
    });

    const avgValue = sum / this.feedbacks.length;
    
    return {
      avg: avgValue,
      avgDisplay: avgValue.toFixed(1),
      total: this.feedbacks.length,
      ratings: ratings
    };
  }

  getRatingPercentage(count: number): number {
    return this.feedbacks.length > 0 ? (count / this.feedbacks.length) * 100 : 0;
  }

  getStars(rating: number): string[] {
    return Array(rating).fill('star');
  }
}
