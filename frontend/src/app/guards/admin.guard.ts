import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is logged in and is admin
  if (authService.isLoggedIn() && authService.isAdmin()) {
    return true;
  }
  
  // Check if user is logged in but not admin
  if (authService.isLoggedIn()) {
    const user = authService.getCurrentUser();
    
    // Redirect based on user role
    switch (user?.role) {
      case UserRole.STUDENT:
        router.navigate(['/student/dashboard']);
        break;
      case UserRole.TEACHER:
        router.navigate(['/lecturer/dashboard']);
        break;
      default:
        router.navigate(['/']);
    }
    return false;
  }
  
  // User is not logged in
  router.navigate(['/auth/login']);
  return false;
};
