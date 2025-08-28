import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationGuardService {
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Redirects user to appropriate dashboard based on their role
   */
  redirectToDashboard(): void {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    switch (user.role) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'teacher':
        this.router.navigate(['/lecturer/dashboard']);
        break;
      case 'student':
        this.router.navigate(['/student/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  /**
   * Checks if user can access a specific role-based route
   */
  canAccessRoute(requiredRole: string): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === requiredRole && this.authService.isLoggedIn();
  }

  /**
   * Prevents access to auth routes if user is already logged in
   */
  preventAuthAccess(): boolean {
    if (this.authService.isLoggedIn()) {
      this.redirectToDashboard();
      return false;
    }
    return true;
  }
}
