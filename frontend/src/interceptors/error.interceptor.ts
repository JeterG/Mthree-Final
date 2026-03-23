import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let userMessage = 'Something went wrong. Please try again.';

      if (error.error && typeof error.error === 'object' && error.error.message) {
        userMessage = error.error.message;
      } else if (typeof error.error === 'string' && error.error.length > 0) {
        userMessage = error.error;
      }

      switch (error.status) {
        case 0:
          userMessage = 'Cannot reach the server. Please check your connection.';
          break;
        case 400:
          // keep backend message
          break;
        case 401:
          if (!req.url.includes('/api/auth/')) {
            localStorage.removeItem('userId');
            localStorage.removeItem('token');
            router.navigate(['/login']);
            userMessage = 'Your session has expired. Please log in again.';
          }
          break;
        case 403:
          userMessage = 'You do not have permission to perform this action.';
          break;
        case 404:
          userMessage = error.error?.message || 'The requested resource was not found.';
          break;
        case 500:
          userMessage = error.error?.message || 'A server error occurred. Please try again later.';
          break;
        default:
          userMessage = error.error?.message || `Unexpected error (${error.status})`;
      }

      // Attach userMessage directly to error.error so components can read:
      // err.error?.userMessage
      if (error.error && typeof error.error === 'object') {
        error.error.userMessage = userMessage;
      }

      return throwError(() => error);
    }),
  );
};
