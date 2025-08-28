import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const studentGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isStudent()) {
    return true;
  } else if (authService.isLoggedIn()) {
    // User is logged in but not student, redirect to their appropriate dashboard
    const user = authService.getCurrentUser();
    if (user?.role === UserRole.ADMIN) {
      router.navigate(['/admin/dashboard']);
    } else if (user?.role === UserRole.TEACHER) {
      router.navigate(['/lecturer/dashboard']);
    } 
    else {
      router.navigate(['/']);
    }
    return false;
  } else {
    // User is not logged in, redirect to login
    router.navigate(['/auth/login']);
    return false;
  }
};
