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
import { CourseService, Course } from '../../services/course.service';
import { DepartmentService, Department } from '../../services/department.service';
import { BatchService, Batch } from '../../services/batch.service';

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
              <mat-label>Status</mat-label>
              <mat-select formControlName="status" [disabled]="data.mode === 'view'">
                <mat-option value="pending">Pending</mat-option>
                <mat-option value="approved">Approved</mat-option>
                <mat-option value="rejected">Rejected</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Department</mat-label>
              <mat-select formControlName="department" [disabled]="data.mode === 'view'" (selectionChange)="onDepartmentChange($event.value)">
                <mat-option *ngFor="let dept of departments" [value]="dept._id">
                  {{ dept.name }} ({{ dept.code }})
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Course</mat-label>
              <mat-select formControlName="course" [disabled]="data.mode === 'view' || !userForm.get('department')?.value" (selectionChange)="onCourseChange($event.value)">
                <mat-option *ngFor="let course of filteredCourses" [value]="course._id">
                  {{ course.name }} ({{ course.code }})
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Batch</mat-label>
              <mat-select formControlName="batch" [disabled]="data.mode === 'view' || !userForm.get('course')?.value">
                <mat-option *ngFor="let batch of filteredBatches" [value]="batch._id">
                  {{ batch.name }} ({{ batch.code }})
                </mat-option>
              </mat-select>
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
              <mat-label>Department</mat-label>
              <mat-select formControlName="department" [disabled]="data.mode === 'view'">
                <mat-option *ngFor="let dept of departments" [value]="dept._id">
                  {{ dept.name }} ({{ dept.code }})
                </mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="form-row">
            <mat-form-field appearance="outline">
              <mat-label>Status</mat-label>
              <mat-select formControlName="status" [disabled]="data.mode === 'view'">
                <mat-option value="pending">Pending</mat-option>
                <mat-option value="approved">Approved</mat-option>
                <mat-option value="rejected">Rejected</mat-option>
              </mat-select>
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
  departments: Department[] = [];
  courses: Course[] = [];
  batches: Batch[] = [];
  filteredCourses: Course[] = [];
  filteredBatches: Batch[] = [];

  semesters = [
    'Semester 1',
    'Semester 2',
    'Semester 3',
    'Semester 4',
    'Semester 5',
    'Semester 6',
    'Semester 7',
    'Semester 8'
  ];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDialogData,
    private courseService: CourseService,
    private departmentService: DepartmentService,
    private batchService: BatchService
  ) {
    this.userForm = this.createForm();
  }

  ngOnInit(): void {
    console.log('UserDialogComponent initialized');
    
    // Initialize filtered arrays
    this.filteredCourses = [];
    this.filteredBatches = [];
    
    this.loadDropdownData().then(() => {
      if (this.data.user && this.data.mode !== 'create') {
        // console.log('Populating form with user data:', this.data.user);
        this.populateForm(this.data.user);
      }
    });
  }

  private loadDropdownData(): Promise<void> {
    const promises: Promise<any>[] = [];

    // Load departments
    const departmentPromise = new Promise<void>((resolve, reject) => {
      this.departmentService.getDepartments().subscribe({
        next: (response: any) => {
          if (response.success) {
            this.departments = response.data;
            console.log('Loaded departments:', this.departments);
            resolve();
          } else {
            reject('Failed to load departments');
          }
        },
        error: (error: any) => {
          console.error('Error loading departments:', error);
          reject(error);
        }
      });
    });
    promises.push(departmentPromise);

    // Load all courses
    const coursePromise = new Promise<void>((resolve, reject) => {
      this.courseService.getCourses().subscribe({
        next: (response: any) => {
          if (response.success) {
            this.courses = response.data;
            console.log('Loaded courses:', this.courses);
            resolve();
          } else {
            reject('Failed to load courses');
          }
        },
        error: (error: any) => {
          console.error('Error loading courses:', error);
          reject(error);
        }
      });
    });
    promises.push(coursePromise);

    // Load all batches
    const batchPromise = new Promise<void>((resolve, reject) => {
      this.batchService.getBatches().subscribe({
        next: (response: any) => {
          if (response.success) {
            this.batches = response.data;
            console.log('Loaded batches:', this.batches);
            resolve();
          } else {
            reject('Failed to load batches');
          }
        },
        error: (error: any) => {
          console.error('Error loading batches:', error);
          reject(error);
        }
      });
    });
    promises.push(batchPromise);

    return Promise.all(promises).then(() => {
      console.log('All dropdown data loaded successfully');
    }).catch((error) => {
      console.error('Error loading dropdown data:', error);
    });
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
      status: ['pending'],
      department: [''],
      course: [''],
      batch: [''],
      
      // Teacher fields
      teacherId: [''],
      
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
    console.log('Populating form with user:', user);
    
    // Extract IDs for department, course, and batch
    const departmentId = typeof user.department === 'object' ? user.department?._id : user.department;
    const courseId = typeof user.course === 'object' ? user.course?._id : user.course;
    const batchId = typeof user.batch === 'object' ? user.batch?._id : user.batch;
    
    console.log('Extracted IDs - Department:', departmentId, 'Course:', courseId, 'Batch:', batchId);

    // First, set all basic form values
    this.userForm.patchValue({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      
      // Student fields
      studentId: user.studentId,
      status: user.status || 'pending',
      
      // Teacher fields
      teacherId: user.teacherId,
      
      // Admin fields
      permissionsString: user.permissions?.join(', ')
    });

    // Handle student-specific filtering and value setting
    if (user.role === 'student') {
      console.log('Setting up student-specific fields');
      
      // Set department first
      if (departmentId) {
        this.userForm.patchValue({ department: departmentId });
        this.onDepartmentChange(departmentId);
      }
      
      // Use a more robust timing mechanism
      const setRemainingFields = () => {
        if (courseId) {
          this.userForm.patchValue({ course: courseId });
          this.onCourseChange(courseId);
        }
        
        // Set batch after a small delay to ensure course filtering is complete
        setTimeout(() => {
          if (batchId) {
            this.userForm.patchValue({ batch: batchId });
          }
        }, 50);
      };
      
      // If we have courses loaded, set immediately, otherwise wait a bit
      if (this.courses.length > 0) {
        setRemainingFields();
      } else {
        setTimeout(setRemainingFields, 100);
      }
    } else {
      // For non-student roles, set department directly
      if (departmentId) {
        this.userForm.patchValue({ department: departmentId });
      }
    }
  }

  onDepartmentChange(departmentId: string): void {
    console.log('Department changed to:', departmentId);
    console.log('Available courses:', this.courses);
    
    if (!departmentId) {
      this.filteredCourses = [];
      this.filteredBatches = [];
      this.userForm.patchValue({
        course: '',
        batch: ''
      });
      return;
    }
    
    // Filter courses by department
    this.filteredCourses = this.courses.filter(course => {
      const courseDepId = typeof course.department === 'object' 
        ? course.department._id 
        : course.department;
      console.log('Comparing course department:', courseDepId, 'with selected:', departmentId);
      return courseDepId === departmentId;
    });
    
    console.log('Filtered courses:', this.filteredCourses);
    
    // Reset course and batch only if we're changing department (not initializing)
    const currentCourse = this.userForm.get('course')?.value;
    if (currentCourse && !this.filteredCourses.find(c => c._id === currentCourse)) {
      this.userForm.patchValue({
        course: '',
        batch: ''
      });
      this.filteredBatches = [];
    }
  }

  onCourseChange(courseId: string): void {
    console.log('Course changed to:', courseId);
    console.log('Available batches:', this.batches);
    
    if (!courseId) {
      this.filteredBatches = [];
      this.userForm.patchValue({
        batch: ''
      });
      return;
    }
    
    // Filter batches by course
    this.filteredBatches = this.batches.filter(batch => {
      const batchCourseId = typeof batch.course === 'object' 
        ? batch.course._id 
        : batch.course;
      console.log('Comparing batch course:', batchCourseId, 'with selected:', courseId);
      return batchCourseId === courseId;
    });
    
    console.log('Filtered batches:', this.filteredBatches);
    
    // Reset batch only if current batch is not valid for the new course
    const currentBatch = this.userForm.get('batch')?.value;
    if (currentBatch && !this.filteredBatches.find(b => b._id === currentBatch)) {
      this.userForm.patchValue({
        batch: ''
      });
    }
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
