import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';

import { AuthService } from '../../../services/auth.service';
import { LoadingService } from '../../../services/loading.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { ValidationService } from '../../../services/validation.service';
import { StudentRegistration } from '../../../models/user.model';
import { CourseService, Course } from '../../../services/course.service';
import { DepartmentService, Department } from '../../../services/department.service';
import { SemesterService, Semester } from '../../../services/semester.service';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatStepperModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './student-register.component.html',
  styleUrls: ['./student-register.component.css']
})
export class StudentRegisterComponent implements OnInit {
  personalInfoForm!: FormGroup;
  accountInfoForm!: FormGroup;
  academicInfoForm!: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;

  courses: Course[] = [];
  departments: Department[] = [];
  semesters: Semester[] = [];
  isLoadingCourses = false;
  isLoadingDepartments = false;
  isLoadingSemesters = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router,
    private snackBar: MatSnackBar,
    private courseService: CourseService,
    private departmentService: DepartmentService,
    private semesterService: SemesterService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadDepartments();
    this.loadSemesters();
    
    // Watch for department changes to load relevant courses
    this.academicInfoForm.get('department')?.valueChanges.subscribe(departmentId => {
      if (departmentId) {
        this.loadCoursesByDepartment(departmentId);
      } else {
        this.courses = [];
      }
      // Reset course selection when department changes
      this.academicInfoForm.get('course')?.setValue('');
    });
  }

  loadCourses(): void {
    this.isLoadingCourses = true;
    this.courseService.getCourses().subscribe({
      next: (response) => {
        this.isLoadingCourses = false;
        if (response.success) {
          this.courses = response.data;
        }
      },
      error: (error) => {
        this.isLoadingCourses = false;
        console.error('Error loading courses:', error);
        this.snackBar.open('Error loading courses. Please refresh the page.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadCoursesByDepartment(departmentId: string): void {
    this.isLoadingCourses = true;
    this.courseService.getCoursesByDepartment(departmentId).subscribe({
      next: (response) => {
        this.isLoadingCourses = false;
        if (response.success) {
          this.courses = response.data;
        }
      },
      error: (error) => {
        this.isLoadingCourses = false;
        console.error('Error loading courses by department:', error);
        this.snackBar.open('Error loading courses for selected department.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadDepartments(): void {
    this.isLoadingDepartments = true;
    this.departmentService.getDepartments().subscribe({
      next: (response) => {
        this.isLoadingDepartments = false;
        if (response.success) {
          this.departments = response.data;
        }
      },
      error: (error) => {
        this.isLoadingDepartments = false;
        console.error('Error loading departments:', error);
        this.snackBar.open('Error loading departments. Please refresh the page.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  loadSemesters(): void {
    this.isLoadingSemesters = true;
    this.semesterService.getSemesters().subscribe({
      next: (response) => {
        this.isLoadingSemesters = false;
        if (response.success) {
          this.semesters = response.data;
        }
      },
      error: (error) => {
        this.isLoadingSemesters = false;
        console.error('Error loading semesters:', error);
        this.snackBar.open('Error loading semesters. Please refresh the page.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  initializeForms(): void {
    this.personalInfoForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [ValidationService.phoneValidator]]
    });

    this.accountInfoForm = this.fb.group({
      email: ['', [Validators.required, ValidationService.emailValidator]],
      password: ['', [Validators.required, ValidationService.passwordValidator]],
      confirmPassword: ['', [Validators.required, ValidationService.confirmPasswordValidator('password')]]
    });

    this.academicInfoForm = this.fb.group({
      studentId: [''],
      department: ['', Validators.required],
      course: ['', Validators.required],
      semester: ['', Validators.required]
    });
  }

  getErrorMessage(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field || !field.touched) return '';

    if (field.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field.hasError('minlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${field.errors?.['minlength']?.requiredLength} characters`;
    }
    if (field.hasError('invalidEmail')) {
      return 'Please enter a valid email address';
    }
    if (field.hasError('invalidPhone')) {
      return 'Please enter a valid phone number';
    }
    if (field.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    
    // Handle password validation errors
    if (fieldName === 'password' && field.errors) {
      return ValidationService.getPasswordErrorMessage(field.errors);
    }

    return '';
  }

  onSubmit(): void {
    if (this.personalInfoForm.valid && this.accountInfoForm.valid && this.academicInfoForm.valid) {
      this.loadingService.show();
      
      const registrationData: StudentRegistration = {
        ...this.personalInfoForm.value,
        ...this.accountInfoForm.value,
        ...this.academicInfoForm.value
      };

      this.authService.registerStudent(registrationData).subscribe({
        next: (response) => {
          this.loadingService.hide();
          
          // Store pending user data
          localStorage.setItem('pendingUser', JSON.stringify({
            email: registrationData.email,
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            role: 'student'
          }));
          
          this.snackBar.open('Registration successful! Your account is pending approval.', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          
          this.router.navigate(['/auth/pending-approval']);
        },
        error: (error) => {
          this.loadingService.hide();
          this.snackBar.open('Registration failed. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markAllFormsTouched();
    }
  }

  private markAllFormsTouched(): void {
    this.markFormGroupTouched(this.personalInfoForm);
    this.markFormGroupTouched(this.accountInfoForm);
    this.markFormGroupTouched(this.academicInfoForm);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }
}
