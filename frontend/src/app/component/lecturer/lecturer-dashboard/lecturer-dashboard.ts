import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { LecturerLayout } from '../lecturer-layout/lecturer-layout';
import { AuthService } from '../../../services/auth.service';
import { LecturerService, DashboardStats, SubjectDetail } from '../../../services/lecturer.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-lecturer-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatChipsModule,
    LecturerLayout
  ],
  templateUrl: './lecturer-dashboard.html',
  styleUrl: './lecturer-dashboard.css'
})
export class LecturerDashboard implements OnInit {
  loading = true;
  loadingSubjects = true;
  dashboardStats: DashboardStats | null = null;
  subjectDetails: SubjectDetail[] = [];
  lecturerId: string = '';
  displayedColumns: string[] = ['subject', 'course', 'batch', 'modules', 'assignments', 'meetings', 'students'];

  constructor(
    private authService: AuthService,
    private lecturerService: LecturerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Start status monitoring when dashboard loads
    this.authService.startStatusMonitoring();
    
    // Get current user ID
    const currentUser = this.authService.getCurrentUser();
    if (currentUser && currentUser._id) {
      this.lecturerId = currentUser._id;
      this.loadDashboardData();
      this.loadSubjectDetails();
    } else {
      console.error('No user logged in');
      this.loading = false;
      this.loadingSubjects = false;
    }
  }

  loadDashboardData(): void {
    this.loading = true;
    this.lecturerService.getDashboardStats(this.lecturerId).subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardStats = response.data;
          console.log('Dashboard stats loaded:', this.dashboardStats);
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard stats:', error);
        this.loading = false;
      }
    });
  }

  loadSubjectDetails(): void {
    this.loadingSubjects = true;
    this.lecturerService.getSubjectDetails(this.lecturerId).subscribe({
      next: (response) => {
        if (response.success) {
          this.subjectDetails = response.data;
          console.log('Subject details loaded:', this.subjectDetails);
        }
        this.loadingSubjects = false;
      },
      error: (error) => {
        console.error('Error loading subject details:', error);
        this.loadingSubjects = false;
      }
    });
  }
}
