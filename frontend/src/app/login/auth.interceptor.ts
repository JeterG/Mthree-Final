import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  // 🔥 SKIP market endpoints
  if (req.url.includes('/api/market')) {
    return next(req);
  }

  const token = localStorage.getItem('token');

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(cloned);
  }

  return next(req);
};