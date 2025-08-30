import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { User } from '../../services/user-management.service';

export interface UserDialogData {
  user?: User;
  mode: 'create' | 'edit' | 'view';
  role: 'admin' | 'student' | 'teacher';
}

@Component({
  selector: 'app-user-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCheckboxModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>
      <mat-icon>{{ getIcon() }}</mat-icon>
      {{ getTitle() }}
    </h2>

    <mat-dialog-content>
      <form [formGroup]="userForm" class="user-form">
        <!-- Basic Information -->
        <div class="form-section">
          <h3>Basic Information</h3>
          
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="firstName" [readonly]="data.mode === 'view'">
              <mat-error *ngIf="userForm.get('firstName')?.hasError('required')">
                First name is required
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="lastName" [readonly]="data.mode === 'view'">
              <mat-error *ngIf="userForm.get('lastName')?.hasError('required')">
                Last name is required
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" [readonly]="data.mode === 'view'">
              <mat-error *ngIf="userForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="userForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone</mat-label>
              <input matInput formControlName="phone" [readonly]="data.mode === 'view'">
            </mat-form-field>
          </div>

          <div class="form-row" *ngIf="data.mode === 'create'">
            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="password">
              <mat-error *ngIf="userForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Role</mat-label>
              <mat-select formControlName="role" [disabled]="data.mode !== 'create'">
                <mat-option value="admin">Admin</mat-option>
                <mat-option value="student">Student</mat-option>
                <mat-option value="teacher">Teacher</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="checkbox-field">
              <mat-checkbox formControlName="isActive" [disabled]="data.mode === 'view'">
                Active
              </mat-checkbox>
            </div>
          </div>
        </div>

        <!-- Role-specific fields -->
        <div class="form-section" *ngIf="userForm.get('role')?.value === 'student'">
          <h3>Student Information</h3>
          
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Student ID</mat-label>
              <input matInput formControlName="studentId" [readonly]="data.mode === 'view'">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Course</mat-label>
              <input matInput formControlName="course" [readonly]="data.mode === 'view'">
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Semester</mat-label>
              <input matInput formControlName="semester" [readonly]="data.mode === 'view'">
            </mat-form-field>
          </div>
        </div>

        <div class="form-section" *ngIf="userForm.get('role')?.value === 'teacher'">
          <h3>Teacher Information</h3>
          
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Teacher ID</mat-label>
              <input matInput formControlName="teacherId" [readonly]="data.mode === 'view'">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Employee ID</mat-label>
              <input matInput formControlName="employeeId" [readonly]="data.mode === 'view'">
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Department</mat-label>
              <input matInput formControlName="department" [readonly]="data.mode === 'view'">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Qualification</mat-label>
              <input matInput formControlName="qualification" [readonly]="data.mode === 'view'">
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Experience (years)</mat-label>
              <input matInput type="number" formControlName="experience" [readonly]="data.mode === 'view'">
            </mat-form-field>
          </div>
        </div>

        <div class="form-section" *ngIf="userForm.get('role')?.value === 'admin'">
          <h3>Admin Information</h3>
          
          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Permissions (comma-separated)</mat-label>
              <input matInput formControlName="permissionsString" [readonly]="data.mode === 'view'"
                     placeholder="e.g., user_management, content_management">
            </mat-form-field>
          </div>
        </div>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" 
              (click)="onSave()" 
              [disabled]="data.mode === 'view' || userForm.invalid">
        {{ data.mode === 'create' ? 'Create' : 'Update' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .user-form {
      min-width: 600px;
      max-width: 800px;
    }

    .form-section {
      margin-bottom: 24px;
    }

    .form-section h3 {
      margin: 0 0 16px 0;
      color: #1976d2;
      font-size: 16px;
      font-weight: 500;
    }

    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-row mat-form-field {
      flex: 1;
    }

    .checkbox-field {
      display: flex;
      align-items: center;
      height: 56px;
    }

    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-dialog-content {
      padding: 20px 24px;
    }

    .mat-mdc-dialog-actions {
      padding: 8px 24px 20px 24px;
    }
  `]
})
export class UserDialogComponent implements OnInit {
  userForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.data.user && this.data.mode !== 'create') {
      this.populateForm(this.data.user);
    }
  }

  private createForm(): FormGroup {
    const formControls: any = {
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      role: [this.data.role, Validators.required],
      isActive: [true],
      
      // Student fields
      studentId: [''],
      course: [''],
      semester: [''],
      
      // Teacher fields
      teacherId: [''],
      employeeId: [''],
      department: [''],
      qualification: [''],
      experience: [''],
      
      // Admin fields
      permissionsString: ['']
    };

    // Add password field only for create mode
    if (this.data.mode === 'create') {
      formControls.password = ['', [Validators.required, Validators.minLength(6)]];
    }

    return this.fb.group(formControls);
  }

  private populateForm(user: User): void {
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      
      // Student fields
      studentId: user.studentId,
      course: user.course,
      semester: user.semester,
      
      // Teacher fields
      teacherId: user.teacherId,
      employeeId: user.employeeId,
      department: user.department,
      qualification: user.qualification,
      experience: user.experience,
      
      // Admin fields
      permissionsString: user.permissions?.join(', ')
    });
  }

  getTitle(): string {
    const roleTitle = this.data.role.charAt(0).toUpperCase() + this.data.role.slice(1);
    switch (this.data.mode) {
      case 'create': return `Add New ${roleTitle}`;
      case 'edit': return `Edit ${roleTitle}`;
      case 'view': return `View ${roleTitle}`;
      default: return `${roleTitle} Details`;
    }
  }

  getIcon(): string {
    switch (this.data.mode) {
      case 'create': return 'person_add';
      case 'edit': return 'edit';
      case 'view': return 'visibility';
      default: return 'person';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.userForm.valid) {
      const formData = this.userForm.value;
      
      // Convert permissions string to array
      if (formData.permissionsString) {
        formData.permissions = formData.permissionsString
          .split(',')
          .map((p: string) => p.trim())
          .filter((p: string) => p.length > 0);
        delete formData.permissionsString;
      }

      // Remove empty fields
      Object.keys(formData).forEach(key => {
        if (formData[key] === '' || formData[key] === null || formData[key] === undefined) {
          delete formData[key];
        }
      });

      this.dialogRef.close(formData);
    }
  }
}
