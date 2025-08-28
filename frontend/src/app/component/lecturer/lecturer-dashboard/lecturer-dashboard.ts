import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { LecturerLayout } from '../lecturer-layout/lecturer-layout';

@Component({
  selector: 'app-lecturer-dashboard',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    LecturerLayout
  ],
  templateUrl: './lecturer-dashboard.html',
  styleUrl: './lecturer-dashboard.css'
})
export class LecturerDashboard {
  // Sample data for dashboard cards
  dashboardStats = [
    { title: 'Total Students', value: 156, icon: 'people', color: '#9C27B0', growth: '+8 this semester' },
    { title: 'Active Courses', value: 8, icon: 'library_books', color: '#2196F3', growth: '2 new courses' },
    { title: 'Pending Grades', value: 24, icon: 'grade', color: '#FF9800', growth: '12 urgent' },
    { title: 'Course Rating', value: 4.8, icon: 'star', color: '#4CAF50', growth: '+0.3 this term' }
  ];

  recentActivities = [
    { action: 'Assignment graded', user: 'Web Development Course', time: '1 hour ago', icon: 'grade' },
    { action: 'New student enrolled', user: 'Database Systems', time: '3 hours ago', icon: 'person_add' },
    { action: 'Course material updated', user: 'Data Structures', time: '1 day ago', icon: 'edit' },
    { action: 'Discussion replied', user: 'Software Engineering', time: '2 days ago', icon: 'forum' }
  ];

  myCourses = [
    { name: 'Web Development', students: 45, progress: 75, nextClass: 'Today 2:00 PM', status: 'active' },
    { name: 'Database Systems', students: 38, progress: 85, nextClass: 'Tomorrow 10:00 AM', status: 'active' },
    { name: 'Data Structures', students: 42, progress: 60, nextClass: 'Friday 9:00 AM', status: 'active' },
    { name: 'Software Engineering', students: 31, progress: 45, nextClass: 'Monday 1:00 PM', status: 'active' }
  ];

  pendingTasks = [
    { title: 'Grade Web Dev Assignments', count: 12, priority: 'high', dueDate: '2025-09-01' },
    { title: 'Update Course Materials', count: 3, priority: 'medium', dueDate: '2025-09-05' },
    { title: 'Review Student Projects', count: 8, priority: 'medium', dueDate: '2025-09-08' },
    { title: 'Prepare Quiz Questions', count: 5, priority: 'low', dueDate: '2025-09-12' }
  ];

  studentPerformance = [
    { course: 'Web Development', avgGrade: 85, improvement: '+5%', status: 'good' },
    { course: 'Database Systems', avgGrade: 92, improvement: '+8%', status: 'excellent' },
    { course: 'Data Structures', avgGrade: 78, improvement: '-2%', status: 'needs-attention' },
    { course: 'Software Engineering', avgGrade: 88, improvement: '+3%', status: 'good' }
  ];
}
