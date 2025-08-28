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
      // Logout pending user and redirect to login
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
