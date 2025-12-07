import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Get the auth token from localStorage
  const token = localStorage.getItem('token');
  
  // Clone the request and add the authorization header if token exists
  const authReq = token
    ? req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      })
    : req;
  
  // Handle the request and catch 401 errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we get a 401 Unauthorized error and user is logged in
      if (error.status === 401 && token) {
        console.warn('🔒 Token expired or invalid. Logging out...');
        
        // Clear all auth data
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        
        // Redirect to login page
        router.navigate(['/login'], {
          queryParams: { 
            returnUrl: router.url,
            reason: 'session_expired' 
          }
        });
      }
      
      return throwError(() => error);
    })
  );
};
