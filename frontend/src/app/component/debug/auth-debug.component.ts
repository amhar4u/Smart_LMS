import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth-debug',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule],
  template: `
    <div style="padding: 20px; max-width: 600px; margin: 0 auto;">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Authentication Debug Panel</mat-card-title>
        </mat-card-header>
        <mat-card-content style="padding: 20px;">
          <div style="margin-bottom: 20px;">
            <h3>Current Auth State:</h3>
            <p><strong>Logged In:</strong> {{ authService.isLoggedIn() }}</p>
            <p><strong>Current User:</strong> {{ (authService.getCurrentUser() | json) || 'None' }}</p>
            <p><strong>Token Exists:</strong> {{ !!authService.getToken() }}</p>
            <p><strong>Is Admin:</strong> {{ authService.isAdmin() }}</p>
            <p><strong>Is Student:</strong> {{ authService.isStudent() }}</p>
            <p><strong>Is Teacher:</strong> {{ authService.isTeacher() }}</p>
          </div>
          
          <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button mat-raised-button color="warn" (click)="clearAuth()">
              Clear All Auth Data
            </button>
            <button mat-raised-button color="primary" (click)="goToLogin()">
              Go to Login
            </button>
            <button mat-raised-button (click)="goToAdmin()">
              Try Admin Dashboard
            </button>
            <button mat-raised-button (click)="debugState()">
              Debug to Console
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `
})
export class AuthDebugComponent {
  authService = inject(AuthService);
  router = inject(Router);

  clearAuth() {
    this.authService.clearAuthData();
    console.log('🧹 Authentication data cleared');
    window.location.reload();
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  goToAdmin() {
    this.router.navigate(['/admin/dashboard']);
  }

  debugState() {
    this.authService.debugAuthState();
  }
}
