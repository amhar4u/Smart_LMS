import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { ModuleService } from '../../../services/module.service';
import { SubjectService } from '../../../services/subject.service';
import { AuthService } from '../../../services/auth.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { LecturerLayout } from '../lecturer-layout/lecturer-layout';
import { ModuleDialogComponent } from '../../admin/manage-modules/module-dialog/module-dialog.component';
import { ModuleViewDialogComponent } from '../module-view-dialog/module-view-dialog.component';
import { Module } from '../../../models/module.model';

@Component({
  selector: 'app-lecturer-manage-modules',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatPaginatorModule,
    MatSlideToggleModule,
    MatMenuModule,
    LecturerLayout
  ],
  templateUrl: './manage-modules.component.html',
  styleUrls: ['./manage-modules.component.css']
})
export class LecturerManageModulesComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private moduleService = inject(ModuleService);
  private subjectService = inject(SubjectService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);

  modules: Module[] = [];
  lecturerSubjects: any[] = [];
  loading = false;
  currentUser: any = null;
  
  filters = {
    subjectId: '',
    search: ''
  };

  displayedColumns: string[] = ['code', 'name', 'subject', 'documents', 'video', 'order', 'status', 'actions'];

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadLecturerSubjects();
    this.loadModules();
  }

  async loadLecturerSubjects() {
    if (!this.currentUser || !this.currentUser._id) {
      return;
    }

    try {
      const response = await this.subjectService.getSubjects({
        lecturer: this.currentUser._id
      }).toPromise();

      if (response && response.success) {
        this.lecturerSubjects = Array.isArray(response.data) ? response.data : [response.data];
      }
    } catch (error) {
      console.error('Failed to load lecturer subjects', error);
    }
  }

  loadModules() {
    this.loading = true;
    const params: any = {};
    
    if (this.filters.subjectId) params.subject = this.filters.subjectId;
    if (this.filters.search) params.search = this.filters.search;

    this.moduleService.getModules(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const allModules = response.data.modules || [];
          // Filter to show only modules for lecturer's subjects
          const lecturerSubjectIds = this.lecturerSubjects.map(s => s._id);
          this.modules = allModules.filter((module: Module) => {
            const subjectId = typeof module.subject === 'string' 
              ? module.subject 
              : (module.subject as any)?._id;
            return lecturerSubjectIds.includes(subjectId);
          });
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.snackBar.open('Failed to load modules', 'Close', { duration: 3000 });
      }
    });
  }

  onFilterChange() {
    this.loadModules();
  }

  clearFilters() {
    this.filters = {
      subjectId: '',
      search: ''
    };
    this.loadModules();
  }

  openCreateModuleDialog() {
    const dialogRef = this.dialog.open(ModuleDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
      data: { 
        mode: 'create',
        lecturerId: this.currentUser._id,
        lecturerSubjects: this.lecturerSubjects
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadModules();
      }
    });
  }

  editModule(module: Module) {
    const dialogRef = this.dialog.open(ModuleDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
      data: { 
        mode: 'edit', 
        module: module,
        lecturerId: this.currentUser._id,
        lecturerSubjects: this.lecturerSubjects
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadModules();
      }
    });
  }

  toggleModuleStatus(module: Module, event: any) {
    const newStatus = event.checked;
    const moduleId = module._id;

    if (!moduleId) return;

    this.moduleService.updateModule(moduleId, { isActive: newStatus } as any).subscribe({
      next: (response) => {
        this.snackBar.open(
          `Module ${newStatus ? 'activated' : 'deactivated'} successfully`,
          'Close',
          { duration: 3000 }
        );
        this.loadModules();
      },
      error: (error) => {
        event.source.checked = !newStatus; // Revert toggle
        this.snackBar.open(
          error.error?.message || 'Failed to update module status',
          'Close',
          { duration: 3000 }
        );
      }
    });
  }

  getSubjectName(module: Module): string {
    if (typeof module.subject === 'string') {
      const subject = this.lecturerSubjects.find(s => s._id === module.subject);
      return subject?.name || module.subject;
    }
    return (module.subject as any)?.name || 'N/A';
  }

  getDocumentCount(module: Module): number {
    return module.documents?.length || 0;
  }

  hasVideo(module: Module): boolean {
    return !!(module.video && module.video.cloudinaryURL);
  }

  viewModuleDetails(module: Module) {
    const dialogRef = this.dialog.open(ModuleViewDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: module
    });
  }
}
