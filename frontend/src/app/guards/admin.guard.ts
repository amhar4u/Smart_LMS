import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Debug current auth state
  console.log('Admin Guard - Auth State Check:');
  console.log('- Logged in:', authService.isLoggedIn());
  console.log('- Current user:', authService.getCurrentUser());
  console.log('- Is admin:', authService.isAdmin());

  // Check if user is logged in and is admin
  if (authService.isLoggedIn() && authService.isAdmin()) {
    console.log('✅ Admin access granted');
    return true;
  }
  
  // Check if user is logged in but not admin
  if (authService.isLoggedIn()) {
    const user = authService.getCurrentUser();
    console.log('❌ User logged in but not admin. Role:', user?.role);
    
    // Redirect based on user role
    switch (user?.role) {
      case UserRole.STUDENT:
        console.log('🔄 Redirecting to student dashboard');
        router.navigate(['/student/dashboard']);
        break;
      case UserRole.TEACHER:
        console.log('🔄 Redirecting to lecturer dashboard');
        router.navigate(['/lecturer/dashboard']);
        break;
      default:
        console.log('🔄 Redirecting to home');
        router.navigate(['/']);
    }
    return false;
  }
  
  // User is not logged in
  console.log('❌ User not authenticated, redirecting to login');
  router.navigate(['/auth/login']);
  return false;
};
