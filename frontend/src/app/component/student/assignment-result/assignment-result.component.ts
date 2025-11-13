import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

import { StudentAssignmentService, AssignmentResult } from '../../../services/student-assignment.service';

@Component({
  selector: 'app-assignment-result',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  templateUrl: './assignment-result.component.html',
  styleUrls: ['./assignment-result.component.css']
})
export class AssignmentResultComponent implements OnInit {
  assignmentId: string = '';
  result: AssignmentResult | null = null;
  isLoading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentAssignmentService: StudentAssignmentService
  ) {}

  ngOnInit() {
    this.assignmentId = this.route.snapshot.paramMap.get('id') || '';
    if (this.assignmentId) {
      this.loadResult();
    }
  }

  loadResult() {
    this.isLoading = true;
    this.studentAssignmentService.getAssignmentResult(this.assignmentId).subscribe({
      next: (response) => {
        this.result = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading result:', error);
        this.isLoading = false;
      }
    });
  }

  getLevelClass(level: string): string {
    const classes: { [key: string]: string } = {
      'beginner': 'level-beginner',
      'intermediate': 'level-intermediate',
      'advanced': 'level-advanced'
    };
    return classes[level] || '';
  }

  getPercentageClass(percentage: number): string {
    if (percentage >= 70) return 'excellent';
    if (percentage >= 50) return 'good';
    if (percentage >= 35) return 'average';
    return 'poor';
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  goBack() {
    this.router.navigate(['/student/assignments']);
  }
}
