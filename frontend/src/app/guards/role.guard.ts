import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const expectedRoles = route.data['expectedRoles'];
  let currentUser: any = null;
  authService.currentUser$.subscribe(user => currentUser = user).unsubscribe();

  if (currentUser && currentUser.rol && expectedRoles.includes(currentUser.rol)) {
    return true;
  }

  // Si no tiene el rol adecuado, redirigir
  // Dependiendo del rol podemos redirigirlo a su respectivo home
  if (currentUser?.rol === 'ADMINISTRADOR') {
    router.navigate(['/admin']);
  } else if (currentUser?.rol === 'DISENADOR') {
    router.navigate(['/diseno']);
  } else {
    router.navigate(['/login']);
  }
  return false;
};
