import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay, filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.css'
})
export class AdminLayout implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Navigation state
  userManagementExpanded = false;

  // Current user
  currentUser$ = this.authService.currentUser$;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  ngOnInit() {
    // Check if user is admin
    if (!this.authService.isAdmin()) {
      this.router.navigate(['/auth/login']);
      return;
    }

    // Subscribe to router events to keep user management expanded on relevant pages
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.checkAndExpandUserManagement();
    });

    // Initial check for current route
    this.checkAndExpandUserManagement();
  }

  hasActiveUserManagementChild(): boolean {
    const currentUrl = this.router.url;
    const userManagementRoutes = [
      '/admin/manage-students',
      '/admin/manage-lecturers', 
      '/admin/manage-admins'
    ];
    return userManagementRoutes.includes(currentUrl);
  }

  checkAndExpandUserManagement(): void {
    // Keep user management expanded if on any user management page
    const userManagementRoutes = [
      '/admin/manage-students',
      '/admin/manage-lecturers', 
      '/admin/manage-admins'
    ];
    
    const currentUrl = this.router.url;
    this.userManagementExpanded = userManagementRoutes.some(route => currentUrl.includes(route));
  }

  toggleUserManagement() {
    this.userManagementExpanded = !this.userManagementExpanded;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}
