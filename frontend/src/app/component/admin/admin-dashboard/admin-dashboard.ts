import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AdminLayout } from '../admin-layout/admin-layout';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    AdminLayout
  ],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard {
  // Sample data for dashboard cards
  dashboardStats = [
    { title: 'Total Students', value: 1248, icon: 'school', color: '#4CAF50', growth: '+12%' },
    { title: 'Total Lecturers', value: 84, icon: 'person', color: '#2196F3', growth: '+8%' },
    { title: 'Total Admins', value: 12, icon: 'admin_panel_settings', color: '#FF9800', growth: '+3%' },
    { title: 'Active Courses', value: 156, icon: 'book', color: '#9C27B0', growth: '+15%' }
  ];

  recentActivities = [
    { action: 'New student registered', user: 'John Doe', time: '2 minutes ago', icon: 'person_add' },
    { action: 'Course updated', user: 'Dr. Smith', time: '15 minutes ago', icon: 'edit' },
    { action: 'Lecturer approved', user: 'Prof. Johnson', time: '1 hour ago', icon: 'check_circle' },
    { action: 'System backup completed', user: 'System', time: '2 hours ago', icon: 'backup' }
  ];
}
