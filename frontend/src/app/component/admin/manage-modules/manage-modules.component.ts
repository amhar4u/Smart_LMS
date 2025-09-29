import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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

import { ModuleService } from '../../../services/module.service';
import { SubjectService, Subject } from '../../../services/subject.service';
import { LoadingService } from '../../../services/loading.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { Module, CreateModuleRequest, UpdateModuleRequest } from '../../../models/module.model';
import { ModuleDialogComponent } from './module-dialog/module-dialog.component';
import { AdminLayout } from '../admin-layout/admin-layout';

@Component({
  selector: 'app-manage-modules',
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
    AdminLayout
  ],
  templateUrl: './manage-modules.component.html',
  styleUrls: ['./manage-modules.component.css']
})
export class ManageModulesComponent implements OnInit {
  modules: Module[] = [];
  subjects: Subject[] = [];
  displayedColumns: string[] = ['code', 'name', 'subject', 'documents', 'video', 'order', 'status', 'actions'];
  
  // Pagination
  currentPage = 1;
  totalPages = 0;
  totalItems = 0;
  itemsPerPage = 10;
  
  // Filters
  filterForm!: FormGroup;
  searchTerm = '';
  selectedSubject = '';
  
  loading = false;

  constructor(
    private moduleService: ModuleService,
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
    this.loadModules();
  }

  initializeFilters(): void {
    this.filterForm = this.fb.group({
      search: [''],
      subject: ['']
    });

    // Subscribe to filter changes
    this.filterForm.valueChanges.subscribe(filters => {
      this.searchTerm = filters.search || '';
      this.selectedSubject = filters.subject || '';
      this.currentPage = 1;
      this.loadModules();
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

  loadModules(): void {
    this.loading = true;
    
    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      ...(this.searchTerm && { search: this.searchTerm }),
      ...(this.selectedSubject && { subject: this.selectedSubject })
    };

    this.moduleService.getModules(params).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success && response.data) {
          this.modules = response.data.modules;
          this.totalPages = response.data.pagination.totalPages;
          this.totalItems = response.data.pagination.totalItems;
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading modules:', error);
        this.snackBar.open('Failed to load modules', 'Close', { duration: 3000 });
      }
    });
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(ModuleDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { mode: 'create' },
      disableClose: true,
      autoFocus: true,
      restoreFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadModules();
        this.snackBar.open('Module created successfully', 'Close', { duration: 3000 });
      }
    });
  }

  openEditDialog(module: Module): void {
    const dialogRef = this.dialog.open(ModuleDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { mode: 'edit', module },
      disableClose: true,
      autoFocus: true,
      restoreFocus: true
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadModules();
        this.snackBar.open('Module updated successfully', 'Close', { duration: 3000 });
      }
    });
  }

  openDetailsDialog(module: Module): void {
    // TODO: Implement module details dialog
    console.log('View details for module:', module);
  }

  createModule(moduleData: CreateModuleRequest): void {
    this.loadingService.show();
    
    this.moduleService.createModule(moduleData).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.snackBar.open('Module created successfully!', 'Close', { duration: 3000 });
          this.loadModules();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Error creating module:', error);
        const message = error.error?.message || 'Failed to create module';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  updateModule(id: string, moduleData: UpdateModuleRequest): void {
    this.loadingService.show();
    
    this.moduleService.updateModule(id, moduleData).subscribe({
      next: (response) => {
        this.loadingService.hide();
        if (response.success) {
          this.snackBar.open('Module updated successfully!', 'Close', { duration: 3000 });
          this.loadModules();
        }
      },
      error: (error) => {
        this.loadingService.hide();
        console.error('Error updating module:', error);
        const message = error.error?.message || 'Failed to update module';
        this.snackBar.open(message, 'Close', { duration: 5000 });
      }
    });
  }

  deleteModule(module: Module): void {
    this.confirmationService.confirm({
      title: 'Delete Module',
      message: `Are you sure you want to delete the module "${module.name}"? This will also delete all associated documents and videos.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'delete'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.loadingService.show();
        
        this.moduleService.deleteModule(module._id).subscribe({
          next: (response) => {
            this.loadingService.hide();
            if (response.success) {
              this.snackBar.open('Module deleted successfully!', 'Close', { duration: 3000 });
              this.loadModules();
            }
          },
          error: (error) => {
            this.loadingService.hide();
            console.error('Error deleting module:', error);
            const message = error.error?.message || 'Failed to delete module';
            this.snackBar.open(message, 'Close', { duration: 5000 });
          }
        });
      }
    });
  }

  toggleModuleStatus(module: Module): void {
    const newStatus = !module.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    
    this.confirmationService.confirm({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} Module`,
      message: `Are you sure you want to ${action} the module "${module.name}"?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      cancelText: 'Cancel',
      type: 'warning'
    }).subscribe((confirmed) => {
      if (confirmed) {
        this.updateModule(module._id, { isActive: newStatus });
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadModules();
  }

  clearFilters(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadModules();
  }

  getFileIcon(fileType: string): string {
    return this.moduleService.getFileIcon(fileType);
  }

  formatFileSize(bytes: number): string {
    return this.moduleService.formatFileSize(bytes);
  }

  getDocumentCount(module: Module): number {
    return module.documents ? module.documents.length : 0;
  }

  hasVideo(module: Module): boolean {
    return !!(module.video && module.video.driveFileId);
  }

  getSubjectName(subjectId: string): string {
    const subject = this.subjects.find(s => s._id === subjectId);
    return subject ? subject.name : 'Unknown';
  }
}
