import { inject } from '@angular/core';
import { NavigationGuardService } from './navigation-guard.service';

export const preventAuthGuard = () => {
  const navigationGuard = inject(NavigationGuardService);
  return navigationGuard.preventAuthAccess();
};
