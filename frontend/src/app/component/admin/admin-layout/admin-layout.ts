import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule, Router } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { UserManagementService } from '../../../services/user-management.service';

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
  private userManagementService = inject(UserManagementService);

  // Navigation state
  userManagementExpanded = false;
  
  // Counters for dashboard
  studentCount = 0;
  lecturerCount = 0;
  adminCount = 0;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  ngOnInit() {
    this.loadUserCounts();
  }

  toggleUserManagement() {
    this.userManagementExpanded = !this.userManagementExpanded;
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  logout() {
    // TODO: Implement logout functionality
    console.log('Logout clicked');
    this.router.navigate(['/login']);
  }

  private loadUserCounts() {
    // Load student count
    this.userManagementService.getUsersByRole('student').subscribe(students => {
      this.studentCount = students.length;
    });

    // Load lecturer count  
    this.userManagementService.getUsersByRole('teacher').subscribe(lecturers => {
      this.lecturerCount = lecturers.length;
    });

    // Load admin count
    this.userManagementService.getUsersByRole('admin').subscribe(admins => {
      this.adminCount = admins.length;
    });
  }
}
