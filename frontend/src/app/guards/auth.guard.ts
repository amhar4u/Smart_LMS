import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    const user = authService.getCurrentUser();
    
    // Check if user status is pending (for non-admin users)
    if (user && user.role !== 'admin' && user.status === 'pending') {
      // Show alert for pending approval
      const userName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : 'User';
      
      alert(`⏳ Account Pending Approval\n\nHello ${userName},\n\nYour account is still pending administrator approval.\n\nYou cannot access the system until your account has been approved.\n\nYou will receive an email notification once approved.`);
      
      // Logout pending user and redirect to login
      authService.logout();
      router.navigate(['/auth/login']);
      return false;
    }
    
    // Check if user status is rejected
    if (user && user.role !== 'admin' && user.status === 'rejected') {
      // Show alert for rejected account
      const userName = user.firstName && user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : 'User';
      
      alert(`❌ Account Registration Rejected\n\nHello ${userName},\n\nYour account registration has been rejected by the administrator.\n\nPlease contact the administrator for more information.\n\nEmail: admin@smartlms.com`);
      
      // Logout rejected user and redirect to login
      authService.logout();
      router.navigate(['/auth/login']);
      return false;
    }
    
    return true;
  } else {
    router.navigate(['/auth/login']);
    return false;
  }
};
