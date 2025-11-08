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
import { ExtraModuleService } from '../../../services/extra-module.service';
import { SubjectService } from '../../../services/subject.service';
import { AuthService } from '../../../services/auth.service';
import { ConfirmationService } from '../../../services/confirmation.service';
import { LecturerLayout } from '../lecturer-layout/lecturer-layout';
import { ExtraModuleDialogComponent } from '../../admin/manage-extra-modules/extra-module-dialog/extra-module-dialog.component';
import { ExtraModuleViewDialogComponent } from '../extra-module-view-dialog/extra-module-view-dialog.component';
import { ExtraModule } from '../../../models/extra-module.model';

@Component({
  selector: 'app-lecturer-manage-extra-modules',
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
  templateUrl: './manage-extra-modules.component.html',
  styleUrls: ['./manage-extra-modules.component.css']
})
export class LecturerManageExtraModulesComponent implements OnInit {
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private extraModuleService = inject(ExtraModuleService);
  private subjectService = inject(SubjectService);
  private confirmationService = inject(ConfirmationService);
  private authService = inject(AuthService);

  extraModules: ExtraModule[] = [];
  lecturerSubjects: any[] = [];
  loading = false;
  currentUser: any = null;
  
  filters = {
    subjectId: '',
    level: '',
    search: ''
  };

  displayedColumns: string[] = ['code', 'name', 'subject', 'level', 'documents', 'video', 'order', 'status', 'actions'];

  ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();
    this.loadLecturerSubjects();
    this.loadExtraModules();
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

  loadExtraModules() {
    this.loading = true;
    const params: any = {};
    
    if (this.filters.subjectId) params.subject = this.filters.subjectId;
    if (this.filters.level) params.studentLevel = this.filters.level;
    if (this.filters.search) params.search = this.filters.search;

    this.extraModuleService.getExtraModules(params).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const allModules = response.data.extraModules || [];
          // Filter to show only extra modules for lecturer's subjects
          const lecturerSubjectIds = this.lecturerSubjects.map(s => s._id);
          this.extraModules = allModules.filter((module: ExtraModule) => {
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
        this.snackBar.open('Failed to load extra modules', 'Close', { duration: 3000 });
      }
    });
  }

  onFilterChange() {
    this.loadExtraModules();
  }

  clearFilters() {
    this.filters = {
      subjectId: '',
      level: '',
      search: ''
    };
    this.loadExtraModules();
  }

  openCreateExtraModuleDialog() {
    const dialogRef = this.dialog.open(ExtraModuleDialogComponent, {
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
        this.loadExtraModules();
      }
    });
  }

  editExtraModule(module: ExtraModule) {
    const dialogRef = this.dialog.open(ExtraModuleDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
      data: { 
        mode: 'edit', 
        extraModule: module,
        lecturerId: this.currentUser._id,
        lecturerSubjects: this.lecturerSubjects
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExtraModules();
      }
    });
  }

  toggleModuleStatus(module: ExtraModule, event: any) {
    const newStatus = event.checked;
    const moduleId = module._id;

    if (!moduleId) return;

    const formData = new FormData();
    formData.append('isActive', newStatus.toString());
    formData.append('title', module.title);
    formData.append('name', module.name);
    formData.append('code', module.code);
    formData.append('description', module.description);
    formData.append('subject', typeof module.subject === 'string' ? module.subject : (module.subject as any)._id);
    formData.append('studentLevel', module.studentLevel);
    formData.append('order', module.order.toString());

    this.extraModuleService.updateExtraModuleWithFiles(moduleId, formData).subscribe({
      next: (response: any) => {
        this.snackBar.open(
          `Extra module ${newStatus ? 'activated' : 'deactivated'} successfully`,
          'Close',
          { duration: 3000 }
        );
        this.loadExtraModules();
      },
      error: (error: any) => {
        event.source.checked = !newStatus; // Revert toggle
        this.snackBar.open(
          error.error?.message || 'Failed to update extra module status',
          'Close',
          { duration: 3000 }
        );
      }
    });
  }

  getSubjectName(module: ExtraModule): string {
    if (typeof module.subject === 'string') {
      const subject = this.lecturerSubjects.find(s => s._id === module.subject);
      return subject?.name || module.subject;
    }
    return (module.subject as any)?.name || 'N/A';
  }

  getDocumentCount(module: ExtraModule): number {
    return module.documents?.length || 0;
  }

  hasVideo(module: ExtraModule): boolean {
    return !!(module.video && module.video.cloudinaryURL);
  }

  getLevelBadgeClass(level: string): string {
    const levelMap: any = {
      'Beginner': 'level-beginner',
      'Intermediate': 'level-intermediate',
      'Advanced': 'level-advanced',
      'All': 'level-all'
    };
    return levelMap[level] || 'level-all';
  }

  viewModuleDetails(module: ExtraModule) {
    const dialogRef = this.dialog.open(ExtraModuleViewDialogComponent, {
      width: '800px',
      maxHeight: '90vh',
      data: module
    });
  }
}
