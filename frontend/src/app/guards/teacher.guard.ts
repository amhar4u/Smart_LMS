import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const teacherGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isTeacher()) {
    return true;
  } else if (authService.isLoggedIn()) {
    // User is logged in but not teacher, redirect to their appropriate dashboard
    const user = authService.getCurrentUser();
    if (user?.role === UserRole.ADMIN) {
      router.navigate(['/admin/dashboard']);
    } else if (user?.role === UserRole.STUDENT) {
      router.navigate(['/student/dashboard']);
    } else {
      router.navigate(['/']);
    }
    return false;
  } else {
    // User is not logged in, redirect to login
    router.navigate(['/auth/login']);
    return false;
  }
};
