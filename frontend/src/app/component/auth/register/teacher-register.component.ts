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
import { TeacherRegistration } from '../../../models/user.model';
import { DepartmentService, Department } from '../../../services/department.service';

@Component({
  selector: 'app-teacher-register',
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
  templateUrl: './teacher-register.component.html',
  styleUrls: ['./teacher-register.component.css']
})
export class TeacherRegisterComponent implements OnInit {
  personalInfoForm!: FormGroup;
  accountInfoForm!: FormGroup;
  professionalInfoForm!: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;

  departments: Department[] = [];
  isLoadingDepartments = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router,
    private snackBar: MatSnackBar,
    private departmentService: DepartmentService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadDepartments();
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

    this.professionalInfoForm = this.fb.group({
      employeeId: [''],
      department: ['', Validators.required]
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
    if (this.personalInfoForm.valid && this.accountInfoForm.valid && this.professionalInfoForm.valid) {
      this.loadingService.show();
      
      const registrationData: TeacherRegistration = {
        ...this.personalInfoForm.value,
        ...this.accountInfoForm.value,
        ...this.professionalInfoForm.value
      };

      this.authService.registerTeacher(registrationData).subscribe({
        next: (response) => {
          this.loadingService.hide();
          
          // Store pending user data
          localStorage.setItem('pendingUser', JSON.stringify({
            email: registrationData.email,
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            role: 'teacher'
          }));
          
          this.snackBar.open('Registration successful! Your account is pending approval.', 'Close', {
            duration: 5000,
            panelClass: ['success-snackbar']
          });
          
          this.router.navigate(['/auth/pending-approval']);
        },
        error: (error) => {
          this.loadingService.hide();
          // Extract the actual error message from backend
          let errorMessage = 'Registration failed. Please try again.';
          
          if (error.error?.errors && Array.isArray(error.error.errors) && error.error.errors.length > 0) {
            // Validation errors array
            errorMessage = error.error.errors[0].msg || error.error.errors[0].message || errorMessage;
          } else if (error.error?.message) {
            // Single error message
            errorMessage = error.error.message;
          } else if (error.message) {
            // Fallback to error message
            errorMessage = error.message;
          }
          
          this.snackBar.open(errorMessage, 'Close', {
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
    this.markFormGroupTouched(this.professionalInfoForm);
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
