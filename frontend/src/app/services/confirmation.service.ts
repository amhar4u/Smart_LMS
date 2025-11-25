import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, from, switchMap, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { DependencyService } from './dependency.service';
import { DependencyDialogComponent } from '../components/common/dependency-dialog/dependency-dialog.component';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'delete' | 'warning' | 'info';
}

export interface ConfirmationData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'delete' | 'warning' | 'info';
}

export type EntityType = 
  | 'department' 
  | 'course' 
  | 'batch' 
  | 'semester' 
  | 'subject' 
  | 'student' 
  | 'lecturer' 
  | 'assignment' 
  | 'module' 
  | 'meeting';

@Injectable({
  providedIn: 'root'
})
export class ConfirmationService {

  constructor(
    private dialog: MatDialog,
    private dependencyService: DependencyService
  ) { }

  private openDialog(data: ConfirmationDialogData): Observable<boolean> {
    // Use a simple approach - we'll manually import when needed
    // For now, return a simple confirmation
    return new Observable(observer => {
      const result = confirm(`${data.title}\n\n${data.message}`);
      observer.next(result);
      observer.complete();
    });
  }

  confirm(data: ConfirmationData): Observable<boolean> {
    const dialogData: ConfirmationDialogData = {
      title: data.title,
      message: data.message,
      confirmText: data.confirmText || 'Confirm',
      cancelText: data.cancelText || 'Cancel',
      type: data.type || 'info'
    };
    
    return this.openDialog(dialogData);
  }

  confirmDelete(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirm Delete',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'delete'
    });
  }

  confirmUpdate(itemName: string): Observable<boolean> {
    return this.confirm({
      title: 'Confirm Update',
      message: `Are you sure you want to update "${itemName}"?`,
      confirmText: 'Update',
      cancelText: 'Cancel',
      type: 'warning'
    });
  }

  /**
   * Check dependencies and show appropriate delete confirmation dialog
   * - If entity has dependencies (parent), block deletion and show what needs to be removed
   * - If entity requires confirmation (leaf with data), show DELETE confirmation input
   * - If entity has no dependencies, show simple confirmation
   */
  confirmDeleteWithDependencyCheck(
    entityId: string,
    entityName: string,
    entityType: EntityType
  ): Observable<boolean> {
    // Map entity type to appropriate dependency check method
    const checkMethod = this.getDependencyCheckMethod(entityType);
    
    return from(checkMethod(entityId).toPromise()).pipe(
      switchMap(response => {
        if (!response?.success) {
          // If dependency check fails, fall back to simple confirmation
          console.warn('Dependency check failed, using simple confirmation');
          return this.confirmDelete(entityName);
        }

        const dependencies = response.data;

        // Open dependency dialog
        const dialogRef = this.dialog.open(DependencyDialogComponent, {
          width: '600px',
          maxWidth: '90vw',
          disableClose: true,
          data: {
            entityName,
            entityType: this.formatEntityType(entityType),
            dependencies
          }
        });

        return dialogRef.afterClosed();
      }),
      catchError(error => {
        console.error('Error checking dependencies:', error);
        // Fall back to simple confirmation on error
        return this.confirmDelete(entityName);
      })
    );
  }

  /**
   * Get the appropriate dependency check method for entity type
   */
  private getDependencyCheckMethod(entityType: EntityType): (id: string) => Observable<any> {
    const methodMap: { [key in EntityType]: (id: string) => Observable<any> } = {
      department: (id) => this.dependencyService.checkDepartmentDependencies(id),
      course: (id) => this.dependencyService.checkCourseDependencies(id),
      batch: (id) => this.dependencyService.checkBatchDependencies(id),
      semester: (id) => this.dependencyService.checkSemesterDependencies(id),
      subject: (id) => this.dependencyService.checkSubjectDependencies(id),
      student: (id) => this.dependencyService.checkStudentDependencies(id),
      lecturer: (id) => this.dependencyService.checkLecturerDependencies(id),
      assignment: (id) => this.dependencyService.checkAssignmentDependencies(id),
      module: (id) => this.dependencyService.checkModuleDependencies(id),
      meeting: (id) => this.dependencyService.checkMeetingDependencies(id)
    };

    return methodMap[entityType];
  }

  /**
   * Format entity type for display
   */
  private formatEntityType(entityType: EntityType): string {
    const typeMap: { [key in EntityType]: string } = {
      department: 'Department',
      course: 'Course',
      batch: 'Batch',
      semester: 'Semester',
      subject: 'Subject',
      student: 'Student',
      lecturer: 'Lecturer',
      assignment: 'Assignment',
      module: 'Module',
      meeting: 'Meeting'
    };

    return typeMap[entityType] || entityType;
  }
}
