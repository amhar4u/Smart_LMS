import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DependencyResponse, DependencyService } from '../../../services/dependency.service';

export interface DependencyDialogData {
  entityName: string;
  entityType: string;
  dependencies: DependencyResponse;
}

@Component({
  selector: 'app-dependency-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatExpansionModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './dependency-dialog.component.html',
  styleUrls: ['./dependency-dialog.component.css']
})
export class DependencyDialogComponent {
  deleteConfirmation = '';
  showDeleteInput = false;
  showDependencyView = true; // Start with dependency view
  step: 'dependencies' | 'confirmation' = 'dependencies';

  constructor(
    public dialogRef: MatDialogRef<DependencyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DependencyDialogData,
    public dependencyService: DependencyService
  ) {}

  get canProceedWithDelete(): boolean {
    return this.deleteConfirmation.toLowerCase() === this.data.entityName.toLowerCase();
  }

  get hasDependencies(): boolean {
    return this.getTotalDependencyCount() > 0;
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onProceedToConfirmation(): void {
    // Move to confirmation step
    this.step = 'confirmation';
    this.showDependencyView = false;
    this.showDeleteInput = true;
  }

  onDelete(): void {
    if (this.canProceedWithDelete) {
      this.dialogRef.close(true);
    }
  }

  onBackToDependencies(): void {
    // Go back to dependency view
    this.step = 'dependencies';
    this.showDependencyView = true;
    this.showDeleteInput = false;
    this.deleteConfirmation = '';
  }

  getDependencyKeys(): string[] {
    return Object.keys(this.data.dependencies.dependencies).filter(
      key => this.data.dependencies.dependencies[key].count > 0
    );
  }

  getTotalDependencyCount(): number {
    return Object.values(this.data.dependencies.dependencies)
      .reduce((sum, dep: any) => sum + dep.count, 0);
  }

  formatDependencyLabel(key: string): string {
    const labels: { [key: string]: string } = {
      courses: 'Courses',
      batches: 'Batches',
      semesters: 'Semesters',
      subjects: 'Subjects',
      students: 'Students',
      lecturers: 'Lecturers',
      modules: 'Modules',
      extraModules: 'Extra Modules',
      assignments: 'Assignments',
      meetings: 'Meetings',
      submissions: 'Submissions',
      attendance: 'Attendance Records',
      studentLevels: 'Student Level Records'
    };
    return labels[key] || key;
  }

  getDependencyIcon(key: string): string {
    const icons: { [key: string]: string } = {
      courses: 'school',
      batches: 'groups',
      semesters: 'calendar_month',
      subjects: 'book',
      students: 'person',
      lecturers: 'person_outline',
      modules: 'folder',
      extraModules: 'folder_special',
      assignments: 'assignment',
      meetings: 'event',
      submissions: 'upload_file',
      attendance: 'how_to_reg',
      studentLevels: 'analytics'
    };
    return icons[key] || 'info';
  }

  getItemIcon(key: string): string {
    const icons: { [key: string]: string } = {
      courses: 'school',
      batches: 'group',
      semesters: 'event',
      subjects: 'menu_book',
      students: 'account_circle',
      lecturers: 'badge',
      modules: 'folder_open',
      extraModules: 'library_books',
      assignments: 'task',
      meetings: 'video_call',
      submissions: 'description',
      attendance: 'check_circle',
      studentLevels: 'bar_chart'
    };
    return icons[key] || 'label';
  }
}
