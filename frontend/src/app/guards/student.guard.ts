import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const studentGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn() && authService.isStudent()) {
    const user = authService.getCurrentUser();
    
    // Check if student status is pending
    if (user && user.status === 'pending') {
      const userName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : 'User';
      
      alert(`⏳ Account Pending Approval\n\nHello ${userName},\n\nYour account is still pending administrator approval.\n\nYou cannot access the system until your account has been approved.\n\nYou will receive an email notification once approved.`);
      
      authService.logout();
      router.navigate(['/auth/login']);
      return false;
    }
    
    // Check if student status is rejected
    if (user && user.status === 'rejected') {
      const userName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : 'User';
      
      alert(`❌ Account Registration Rejected\n\nHello ${userName},\n\nYour account registration has been rejected by the administrator.\n\nPlease contact the administrator for more information.\n\nEmail: admin@smartlms.com`);
      
      authService.logout();
      router.navigate(['/auth/login']);
      return false;
    }
    
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
