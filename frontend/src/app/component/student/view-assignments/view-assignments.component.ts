import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { Assignment, AssignmentService, Question } from '../../../services/assignment.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-view-assignments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  templateUrl: './view-assignments.component.html',
  styleUrls: ['./view-assignments.component.css']
})
export class ViewAssignmentsComponent implements OnInit {
  assignments: Assignment[] = [];
  upcomingAssignments: Assignment[] = [];
  activeAssignments: Assignment[] = [];
  pastAssignments: Assignment[] = [];
  selectedAssignment: Assignment | null = null;
  isLoading = false;
  currentUser: any;

  constructor(
    private assignmentService: AssignmentService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadCurrentUser();
    this.loadAssignments();
  }

  loadCurrentUser() {
    this.currentUser = this.authService.getCurrentUser();
    if (!this.currentUser) {
      this.snackBar.open('Please log in to view assignments', 'Close', { duration: 3000 });
    }
  }

  loadAssignments() {
    if (!this.currentUser?.batch) {
      return;
    }

    this.isLoading = true;
    
    this.assignmentService.getAssignments({
      batch: this.currentUser.batch,
      isActive: true
    }).subscribe({
      next: (response) => {
        this.assignments = response.data;
        this.categorizeAssignments();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading assignments:', error);
        this.snackBar.open('Error loading assignments', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  categorizeAssignments() {
    const now = new Date();
    
    this.upcomingAssignments = this.assignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      return daysDiff > 0 && daysDiff <= 7; // Due within next 7 days
    });

    this.activeAssignments = this.assignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      return dueDate > now;
    });

    this.pastAssignments = this.assignments.filter(assignment => {
      const dueDate = new Date(assignment.dueDate);
      return dueDate <= now;
    });
  }

  viewAssignmentDetails(assignment: Assignment) {
    this.selectedAssignment = assignment;
  }

  closeAssignmentDetails() {
    this.selectedAssignment = null;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTimeRemaining(dueDate: Date): string {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    
    if (diffTime <= 0) {
      return 'Past due';
    }
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return '1 day remaining';
    } else if (diffDays > 1) {
      return `${diffDays} days remaining`;
    } else {
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      if (diffHours === 1) {
        return '1 hour remaining';
      } else {
        return `${diffHours} hours remaining`;
      }
    }
  }

  getUrgencyClass(dueDate: Date): string {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffTime <= 0) return 'past-due';
    if (diffDays <= 1) return 'urgent';
    if (diffDays <= 3) return 'soon';
    return 'normal';
  }

  getLevelBadgeClass(level: string): string {
    const classes = {
      'easy': 'level-easy',
      'medium': 'level-medium',
      'hard': 'level-hard'
    };
    return classes[level as keyof typeof classes] || 'level-normal';
  }

  getTypeBadgeClass(type: string): string {
    const classes = {
      'MCQ': 'type-mcq',
      'short_answer': 'type-short',
      'essay': 'type-essay'
    };
    return classes[type as keyof typeof classes] || 'type-normal';
  }

  startAssignment(assignment: Assignment) {
    // This would typically navigate to an assignment taking interface
    this.snackBar.open('Assignment taking interface would open here', 'Close', { duration: 3000 });
  }

  // Helper methods for type safety
  getSubjectName(assignment: Assignment): string {
    if (typeof assignment.subject === 'object' && assignment.subject) {
      return assignment.subject.name;
    }
    return '';
  }

  getCourseName(assignment: Assignment): string {
    if (typeof assignment.course === 'object' && assignment.course) {
      return assignment.course.name;
    }
    return '';
  }

  getDepartmentName(assignment: Assignment): string {
    if (typeof assignment.department === 'object' && assignment.department) {
      return assignment.department.name;
    }
    return '';
  }

  getBatchName(assignment: Assignment): string {
    if (typeof assignment.batch === 'object' && assignment.batch) {
      return assignment.batch.name;
    }
    return '';
  }

  getSemesterName(assignment: Assignment): string {
    if (typeof assignment.semester === 'object' && assignment.semester) {
      return assignment.semester.name;
    }
    return '';
  }

  getModuleTitles(assignment: Assignment): string[] {
    if (Array.isArray(assignment.modules)) {
      return assignment.modules.map(module => {
        if (typeof module === 'object' && module) {
          return module.title;
        }
        return '';
      }).filter(title => title);
    }
    return [];
  }

  getDescriptionLength(description: string | undefined): number {
    return description ? description.length : 0;
  }
}
