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
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-lecturer-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatSidenavModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterModule
  ],
  templateUrl: './lecturer-layout.html',
  styleUrl: './lecturer-layout.css'
})
export class LecturerLayout implements OnInit {
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Navigation state
  coursesExpanded = false;
  studentsExpanded = false;
  
  // Counters for dashboard
  totalCourses = 8;
  totalStudents = 156;
  pendingGrades = 24;

  // Current user
  currentUser$ = this.authService.currentUser$;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  ngOnInit() {
    // Initialize any required data
  }

  toggleCourses() {
    this.coursesExpanded = !this.coursesExpanded;
  }

  toggleStudents() {
    this.studentsExpanded = !this.studentsExpanded;
  }

  logout() {
    try {
      this.authService.logout();
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Logout error:', error);
      this.router.navigate(['/auth/login']);
    }
  }
}
