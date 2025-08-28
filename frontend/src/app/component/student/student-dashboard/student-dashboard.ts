import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { StudentLayout } from '../student-layout/student-layout';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule,
    StudentLayout
  ],
  templateUrl: './student-dashboard.html',
  styleUrls: ['./student-dashboard.css']
})
export class StudentDashboard {
  // Sample data for dashboard cards
  dashboardStats = [
    { title: 'Enrolled Courses', value: 6, icon: 'library_books', color: '#4CAF50', growth: '+2 this semester' },
    { title: 'Completed Assignments', value: 24, icon: 'assignment_turned_in', color: '#2196F3', growth: '8 pending' },
    { title: 'Current GPA', value: 3.7, icon: 'grade', color: '#FF9800', growth: '+0.2 this term' },
    { title: 'Study Hours', value: 125, icon: 'schedule', color: '#9C27B0', growth: '25h this week' }
  ];

  recentActivities = [
    { action: 'Assignment submitted', user: 'Web Development', time: '2 hours ago', icon: 'assignment_turned_in' },
    { action: 'Quiz completed', user: 'Database Systems', time: '1 day ago', icon: 'quiz' },
    { action: 'Course material accessed', user: 'Data Structures', time: '2 days ago', icon: 'book' },
    { action: 'Discussion post created', user: 'Software Engineering', time: '3 days ago', icon: 'forum' }
  ];

  upcomingAssignments = [
    { title: 'React Project', course: 'Web Development', dueDate: '2025-09-05', status: 'pending', priority: 'high' },
    { title: 'Database Design', course: 'Database Systems', dueDate: '2025-09-08', status: 'in-progress', priority: 'medium' },
    { title: 'Algorithm Analysis', course: 'Data Structures', dueDate: '2025-09-12', status: 'pending', priority: 'low' },
    { title: 'Unit Testing', course: 'Software Engineering', dueDate: '2025-09-15', status: 'pending', priority: 'medium' }
  ];

  currentCourses = [
    { name: 'Web Development', progress: 75, instructor: 'Dr. Smith', nextClass: 'Today 2:00 PM' },
    { name: 'Database Systems', progress: 85, instructor: 'Prof. Johnson', nextClass: 'Tomorrow 10:00 AM' },
    { name: 'Data Structures', progress: 60, instructor: 'Dr. Brown', nextClass: 'Friday 9:00 AM' },
    { name: 'Software Engineering', progress: 45, instructor: 'Prof. Davis', nextClass: 'Monday 1:00 PM' }
  ];
}
