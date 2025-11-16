import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../services/auth.service';
import { LoadingService } from '../../../services/loading.service';
import { LoadingSpinnerComponent } from '../../../shared/loading-spinner/loading-spinner.component';
import { ValidationService } from '../../../services/validation.service';
import { LoginRequest, UserRole } from '../../../models/user.model';

@Component({
  selector: 'app-login',
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
    // LoadingSpinnerComponent
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loadingService: LoadingService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, ValidationService.emailValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (field?.hasError('invalidEmail')) {
      return 'Please enter a valid email address';
    }
    if (field?.hasError('minlength')) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.loadingService.show();
      
      const loginData: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(loginData).subscribe({
        next: (response) => {
          this.loadingService.hide();
          this.snackBar.open('Login successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });

          // Start status monitoring for non-admin users
          if (response.user.role !== 'admin') {
            this.authService.startStatusMonitoring();
          }

          // Navigate based on user role
          this.navigateBasedOnRole(response.user.role);
        },
        error: (error) => {
          this.loadingService.hide();
          
          // Check if the error is due to pending approval
          if (error.status === 403 && 
              (error.error?.status === 'pending' || 
               error.error?.message?.includes('pending approval'))) {
            
            // Show pending approval message instead of redirecting
            this.snackBar.open(
              '⏳ Your registration is still pending approval. Please wait for admin approval before accessing the system.', 
              'Understood', 
              {
                duration: 8000,
                panelClass: ['warning-snackbar'],
                horizontalPosition: 'center',
                verticalPosition: 'top'
              }
            );
            return;
          }
          
          // Check if account is rejected
          if (error.status === 403 && error.error?.status === 'rejected') {
            this.snackBar.open(
              '❌ Your registration has been rejected. Please contact administrator for more information.', 
              'Close', 
              {
                duration: 8000,
                panelClass: ['error-snackbar'],
                horizontalPosition: 'center',
                verticalPosition: 'top'
              }
            );
            return;
          }
          
          // Default error message for other cases
          this.snackBar.open('Invalid credentials. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  navigateBasedOnRole(role: UserRole): void {
    switch (role) {
      case UserRole.ADMIN:
        this.router.navigate(['/admin/dashboard']);
        break;
      case UserRole.TEACHER:
        this.router.navigate(['/lecturer/dashboard']);
        break;
      case UserRole.STUDENT:
        this.router.navigate(['/student/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }
}
