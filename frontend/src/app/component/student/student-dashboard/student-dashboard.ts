import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatToolbarModule
  ],
  templateUrl: './student-dashboard.html',
  styleUrls: ['./student-dashboard.css']
})
export class StudentDashboard {
  student = {
    name: 'John Doe',
    id: 'STU001',
    course: 'Computer Science',
    semester: 'Semester 5'
  };

  courses = [
    { name: 'Data Structures', progress: 75, instructor: 'Dr. Smith' },
    { name: 'Web Development', progress: 60, instructor: 'Prof. Johnson' },
    { name: 'Database Systems', progress: 85, instructor: 'Dr. Brown' }
  ];

  assignments = [
    { title: 'Array Implementation', dueDate: '2024-01-15', status: 'pending' },
    { title: 'HTML/CSS Project', dueDate: '2024-01-20', status: 'submitted' },
    { title: 'SQL Queries', dueDate: '2024-01-25', status: 'pending' }
  ];

  logout() {
    // Implement logout logic
  }
}
