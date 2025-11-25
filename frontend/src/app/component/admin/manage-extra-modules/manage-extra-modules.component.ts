import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';

import { ExtraModuleService } from '../../../services/extra-module.service';
import { SubjectService, Subject } from '../../../services/subject.service';
import { LoadingService } from '../../../services/loading.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { ExtraModule, StudentLevel, STUDENT_LEVELS } from '../../../models/extra-module.model';
import { AdminLayout } from '../admin-layout/admin-layout';
import { ExtraModuleDialogComponent } from './extra-module-dialog/extra-module-dialog.component';
import { ExtraModuleViewDialogComponent } from '../extra-module-view-dialog/extra-module-view-dialog.component';

@Component({
  selector: 'app-manage-extra-modules',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatChipsModule,
    MatMenuModule,
    MatDividerModule,
    MatBadgeModule,
    AdminLayout
  ],
  templateUrl: './manage-extra-modules.component.html',
  styleUrls: ['./manage-extra-modules.component.css']
})
export class ManageExtraModulesComponent implements OnInit {
  extraModules: ExtraModule[] = [];
  subjects: Subject[] = [];
  studentLevels = STUDENT_LEVELS;
  displayedColumns: string[] = ['code', 'name', 'subject', 'level', 'documents', 'video', 'order', 'status', 'actions'];
  
  // Pagination
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  itemsPerPage = 10;
  
  // Filters
  filterForm!: FormGroup;
  searchTerm = '';
  selectedSubject = '';
  selectedLevel: StudentLevel | '' = '';
  
  loading = false;

  constructor(
    private extraModuleService: ExtraModuleService,
    private subjectService: SubjectService,
    private loadingService: LoadingService,
    private confirmationService: ConfirmationService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.initializeFilters();
    this.loadSubjects();
    this.loadExtraModules();
  }

  initializeFilters(): void {
    this.filterForm = this.fb.group({
      search: [''],
      subject: [''],
      studentLevel: ['']
    });

    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(filters => {
      this.searchTerm = filters.search || '';
      this.selectedSubject = filters.subject || '';
      this.selectedLevel = filters.studentLevel || '';
      this.currentPage = 1;
      this.loadExtraModules();
    });
  }

  loadSubjects(): void {
    this.subjectService.getSubjects().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subjects = Array.isArray(response.data) ? response.data : [response.data];
        }
      },
      error: (error) => {
        console.error('Error loading subjects:', error);
        this.snackBar.open('Failed to load subjects', 'Close', { duration: 3000 });
      }
    });
  }

  loadExtraModules(): void {
    this.loading = true;
    
    const params: any = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.selectedSubject && { subject: this.selectedSubject }),
      ...(this.selectedLevel && { studentLevel: this.selectedLevel })
    };

    this.extraModuleService.getExtraModules(params).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.extraModules = response.data.extraModules;
          this.totalPages = response.data.pagination.totalPages;
          this.totalItems = response.data.pagination.totalItems;
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading extra modules:', error);
        this.snackBar.open('Failed to load extra modules', 'Close', { duration: 3000 });
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ExtraModuleDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { mode: 'create' },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExtraModules();
        this.snackBar.open('Extra module created successfully', 'Close', { duration: 3000 });
      }
    });
  }

  openEditDialog(extraModule: ExtraModule): void {
    const dialogRef = this.dialog.open(ExtraModuleDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      data: { 
        mode: 'edit',
        extraModule: extraModule
      },
      disableClose: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExtraModules();
        this.snackBar.open('Extra module updated successfully', 'Close', { duration: 3000 });
      }
    });
  }

  openDetailsDialog(extraModule: ExtraModule): void {
    this.dialog.open(ExtraModuleViewDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: extraModule,
      autoFocus: false
    });
  }

  deleteExtraModule(extraModule: ExtraModule): void {
    // Check dependencies before deletion
    this.confirmationService.confirmDeleteWithDependencyCheck(
      extraModule._id,
      extraModule.name,
      'module'
    ).subscribe((confirmed) => {
      if (confirmed) {
        this.loadingService.show();
        
        this.extraModuleService.deleteExtraModule(extraModule._id).subscribe({
          next: (response) => {
            this.loadingService.hide();
            if (response.success) {
              this.snackBar.open('Extra module deleted successfully!', 'Close', { duration: 3000 });
              this.loadExtraModules();
            }
          },
          error: (error) => {
            this.loadingService.hide();
            console.error('Error deleting extra module:', error);
            const message = error.error?.message || 'Failed to delete extra module';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  toggleExtraModuleStatus(extraModule: ExtraModule): void {
    this.loadingService.show();
    
    this.extraModuleService.toggleStatus(extraModule._id).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          const status = response.data.isActive ? 'activated' : 'deactivated';
          this.snackBar.open(`Extra module ${status} successfully!`, 'Close', { duration: 3000 });
          this.loadExtraModules();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Error toggling extra module status:', error);
        const message = error.error?.message || 'Failed to toggle status';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadExtraModules();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadExtraModules();
  }

  getDocumentCount(extraModule: ExtraModule): number {
    return extraModule.documents ? extraModule.documents.length : 0;
  }

  hasVideo(extraModule: ExtraModule): boolean {
    return !!(extraModule.video && extraModule.video.name);
  }

  getLevelColor(level: StudentLevel): string {
    return this.extraModuleService.getStudentLevelColor(level);
  }

  getLevelIcon(level: StudentLevel): string {
    return this.extraModuleService.getStudentLevelIcon(level);
  }

  formatFileSize(bytes: number): string {
    return this.extraModuleService.formatFileSize(bytes);
  }
}
