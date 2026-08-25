import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data?.['roles'] as string[]) || [];
  const user = authService.currentUser();

  if (user && (allowedRoles.length === 0 || allowedRoles.includes(user.role))) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
