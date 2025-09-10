import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StatisticsService, OverallStatistics, DepartmentStatistics } from '../../services/statistics.service';

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

  constructor(private statisticsService: StatisticsService) {}

  ngOnInit() {
    this.loadStatistics();
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

  testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Computer Science Student',
      message: 'The Smart LMS platform has transformed my learning experience. The interactive content and progress tracking keep me motivated.',
      avatar: 'SJ'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Mathematics Professor',
      message: 'As an educator, I find the platform intuitive and powerful. It helps me deliver engaging content to my students effectively.',
      avatar: 'MC'
    },
    {
      name: 'Emily Rodriguez',
      role: 'Business Student',
      message: 'The flexibility of learning on any device has been a game-changer for my busy schedule. Highly recommend!',
      avatar: 'ER'
    }
  ];
}
