import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of, forkJoin } from 'rxjs';

import { UserManagementService, User, UsersResponse } from '../../../services/user-management.service';
import { DepartmentService, Department } from '../../../services/department.service';
import { CourseService, Course } from '../../../services/course.service';
import { BatchService, Batch } from '../../../services/batch.service';
import { SubjectService, Subject as SubjectModel } from '../../../services/subject.service';
import { AdminLayout } from '../admin-layout/admin-layout';

interface DashboardStat {
  title: string;
  value: number;
  icon: string;
  color: string;
  subtitle: string;
  growth: string;
}

interface UserStatusDistribution {
  students: { [key: string]: number };
  teachers: { [key: string]: number };
  admins: { [key: string]: number };
}

interface Activity {
  action: string;
  user: string;
  time: string;
  icon: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    AdminLayout
  ],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  isLoading = true;
  students: User[] = [];
  teachers: User[] = [];
  admins: User[] = [];
  allUsers: User[] = [];
  
  // New data properties
  departments: Department[] = [];
  courses: Course[] = [];
  batches: Batch[] = [];
  subjects: SubjectModel[] = [];
  
  // Dashboard statistics - organized into two rows
  userStats: DashboardStat[] = [];
  systemStats: DashboardStat[] = [];
  
  // Recent data
  recentStudents: User[] = [];
  recentTeachers: User[] = [];
  recentActivities: Activity[] = [];
  
  // Distributions
  userStatusDistribution: UserStatusDistribution = {
    students: {},
    teachers: {},
    admins: {}
  };
  
  semesterDistribution: { [key: string]: number } = {};

  constructor(
    private userManagementService: UserManagementService,
    private departmentService: DepartmentService,
    private courseService: CourseService,
    private batchService: BatchService,
    private subjectService: SubjectService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    this.initializeRecentActivities();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    // Load all data using forkJoin for parallel requests
    forkJoin({
      users: this.userManagementService.getAllUsers().pipe(
        catchError(error => {
          console.error('Error loading users:', error);
          return of({ users: [], total: 0 });
        })
      ),
      departments: this.departmentService.getDepartments().pipe(
        catchError(error => {
          console.error('Error loading departments:', error);
          return of({ success: false, data: [], count: 0 });
        })
      ),
      courses: this.courseService.getCoursesForAdmin(1, 1000).pipe(
        catchError(error => {
          console.error('Error loading courses:', error);
          return of({ success: false, data: { courses: [], pagination: { totalItems: 0 } } });
        })
      ),
      batches: this.batchService.getBatches().pipe(
        catchError(error => {
          console.error('Error loading batches:', error);
          return of({ success: false, data: [], pagination: { totalItems: 0 } });
        })
      ),
      subjects: this.subjectService.getSubjects().pipe(
        catchError(error => {
          console.error('Error loading subjects:', error);
          return of({ success: false, data: [], count: 0 });
        })
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe(response => {
      // Process user data
      this.allUsers = response.users.users || [];
      this.categorizeUsers();
      
      // Process system data
      this.departments = response.departments.data || [];
      this.courses = response.courses.data?.courses || [];
      this.batches = response.batches.data || [];
      this.subjects = Array.isArray(response.subjects.data) ? response.subjects.data : [];
      
      // Calculate all statistics and distributions
      this.calculateStatistics();
      this.calculateDistributions();
      this.getRecentUsers();
      this.isLoading = false;
    });
  }

  private categorizeUsers(): void {
    this.students = this.allUsers.filter(user => user.role === 'student');
    this.teachers = this.allUsers.filter(user => user.role === 'teacher');
    this.admins = this.allUsers.filter(user => user.role === 'admin');
  }

  private calculateStatistics(): void {
    const totalUsers = this.allUsers.length;
    const activeUsers = this.allUsers.filter(user => user.isActive).length;
    const pendingUsers = this.allUsers.filter(user => !user.isActive).length;
    
    // First row: User-related statistics
    this.userStats = [
      {
        title: 'Total Students',
        value: this.students.length,
        icon: 'school',
        color: '#2196F3',
        subtitle: 'Enrolled students',
        growth: this.getRecentGrowth(this.students)
      },
      {
        title: 'Total Lecturers',
        value: this.teachers.length,
        icon: 'person',
        color: '#4CAF50',
        subtitle: 'Active lecturers',
        growth: this.getRecentGrowth(this.teachers)
      },
      {
        title: 'Pending Approvals',
        value: pendingUsers,
        icon: 'pending',
        color: '#FF9800',
        subtitle: 'Awaiting approval',
        growth: `${pendingUsers} users`
      },
      {
        title: 'Approved Users',
        value: activeUsers,
        icon: 'verified_user',
        color: '#4CAF50',
        subtitle: 'Currently active',
        growth: `${((activeUsers / totalUsers) * 100).toFixed(1)}%`
      }
    ];

    // Second row: System-related statistics
    this.systemStats = [
      {
        title: 'Total Departments',
        value: this.departments.length,
        icon: 'domain',
        color: '#9C27B0',
        subtitle: 'Academic departments',
        growth: this.departments.filter(d => d.isActive).length + ' active'
      },
      {
        title: 'Total Courses',
        value: this.courses.length,
        icon: 'book',
        color: '#FF5722',
        subtitle: 'Available courses',
        growth: this.courses.filter(c => c.isActive).length + ' active'
      },
      {
        title: 'Total Batches',
        value: this.batches.length,
        icon: 'groups',
        color: '#607D8B',
        subtitle: 'Student batches',
        growth: this.batches.filter(b => b.status === 'active').length + ' active'
      },
      {
        title: 'Total Subjects',
        value: this.subjects.length,
        icon: 'subject',
        color: '#3F51B5',
        subtitle: 'Course subjects',
        growth: this.subjects.filter(s => s.isActive).length + ' active'
      }
    ];
  }

  private calculateDistributions(): void {
    // Status distribution
    this.userStatusDistribution = {
      students: this.getStatusDistribution(this.students),
      teachers: this.getStatusDistribution(this.teachers),
      admins: this.getStatusDistribution(this.admins)
    };

    // Semester distribution
    this.semesterDistribution = {};
    this.students.forEach(student => {
      if (student.semester) {
        this.semesterDistribution[student.semester] = 
          (this.semesterDistribution[student.semester] || 0) + 1;
      }
    });
  }

  private getStatusDistribution(users: User[]): { [key: string]: number } {
    const distribution: { [key: string]: number } = {};
    users.forEach(user => {
      const status = this.getUserStatus(user);
      distribution[status] = (distribution[status] || 0) + 1;
    });
    return distribution;
  }

  private getRecentUsers(): void {
    const sortByDate = (a: User, b: User) => 
      new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
    
    this.recentStudents = [...this.students].sort(sortByDate).slice(0, 5);
    this.recentTeachers = [...this.teachers].sort(sortByDate).slice(0, 5);
  }

  private getRecentGrowth(users: User[]): string {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = users.filter(user => 
      new Date(user.createdAt || '') >= lastWeek
    ).length;
    return recentCount > 0 ? `+${recentCount} this week` : 'No recent changes';
  }

  private initializeRecentActivities(): void {
    this.recentActivities = [
      {
        action: 'New student registered',
        user: 'System',
        time: '2 hours ago',
        icon: 'person_add'
      },
      {
        action: 'Teacher account approved',
        user: 'Admin',
        time: '4 hours ago',
        icon: 'check_circle'
      },
      {
        action: 'Course materials updated',
        user: 'System',
        time: '6 hours ago',
        icon: 'update'
      },
      {
        action: 'New admin account created',
        user: 'Super Admin',
        time: '1 day ago',
        icon: 'admin_panel_settings'
      },
      {
        action: 'Database backup completed',
        user: 'System',
        time: '2 days ago',
        icon: 'backup'
      }
    ];
  }

  // Helper methods
  getUserDisplayName(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email;
  }

  getUserStatus(user: User): string {
    if (user.isActive) {
      return 'Active';
    } else if (user.status === 'Pending') {
      return 'Pending Approval';
    } else {
      return 'Inactive';
    }
  }

  getUserStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'status-active';
      case 'pending approval':
        return 'status-pending';
      case 'email unverified':
        return 'status-unverified';
      default:
        return 'status-default';
    }
  }

  getStatusKeys(distribution: { [key: string]: number }): string[] {
    return Object.keys(distribution);
  }

  getSemesterKeys(): string[] {
    return Object.keys(this.semesterDistribution).sort();
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  // Progress percentage calculation based on filtered count / total count * 100
  getProgressPercentage(stat: DashboardStat): number {
    switch (stat.title) {
      case 'Total Students':
        return this.allUsers.length > 0 ? Math.round((this.students.length / this.allUsers.length) * 100) : 0;
      
      case 'Total Lecturers':
        return this.allUsers.length > 0 ? Math.round((this.teachers.length / this.allUsers.length) * 100) : 0;
      
      case 'Pending Approvals':
        const pendingUsers = this.allUsers.filter(user => !user.isActive).length;
        return this.allUsers.length > 0 ? Math.round((pendingUsers / this.allUsers.length) * 100) : 0;
      
      case 'Approved Users':
        const activeUsers = this.allUsers.filter(user => user.isActive).length;
        return this.allUsers.length > 0 ? Math.round((activeUsers / this.allUsers.length) * 100) : 0;
      
      case 'Total Departments':
        const activeDepartments = this.departments.filter(d => d.isActive).length;
        return this.departments.length > 0 ? Math.round((activeDepartments / this.departments.length) * 100) : 0;
      
      case 'Total Courses':
        const activeCourses = this.courses.filter(c => c.isActive).length;
        return this.courses.length > 0 ? Math.round((activeCourses / this.courses.length) * 100) : 0;
      
      case 'Total Batches':
        const activeBatches = this.batches.filter(b => b.status === 'active').length;
        return this.batches.length > 0 ? Math.round((activeBatches / this.batches.length) * 100) : 0;
      
      case 'Total Subjects':
        const activeSubjects = this.subjects.filter(s => s.isActive).length;
        return this.subjects.length > 0 ? Math.round((activeSubjects / this.subjects.length) * 100) : 0;
      
      default:
        return 0;
    }
  }

  getBarHeight(userType: string): number {
    let count = 0;
    switch (userType) {
      case 'students':
        count = this.students.length;
        break;
      case 'teachers':
        count = this.teachers.length;
        break;
      case 'admins':
        count = this.admins.length;
        break;
    }
    
    const maxCount = Math.max(this.students.length, this.teachers.length, this.admins.length);
    if (maxCount === 0) return 0;
    return Math.max((count / maxCount) * 100, 10); // Minimum 10% height for visibility
  }

  getActiveUsersCount(): number {
    return this.allUsers.filter(user => user.isActive && (user.status === 'Active' || !user.status)).length;
  }

  getPendingUsersCount(): number {
    return this.allUsers.filter(user => user.status === 'Pending').length;
  }

  // Donut Chart Methods
  getCircumference(): string {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    return `${circumference} ${circumference}`;
  }

  getStudentsOffset(): number {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return circumference;
    
    const percentage = this.students.length / totalUsers;
    const strokeLength = percentage * circumference;
    return circumference - strokeLength;
  }

  getTeachersOffset(): number {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return circumference;
    
    const studentsPercentage = this.students.length / totalUsers;
    const teachersPercentage = this.teachers.length / totalUsers;
    const strokeLength = teachersPercentage * circumference;
    const previousLength = studentsPercentage * circumference;
    
    return circumference - strokeLength;
  }

  getAdminsOffset(): number {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return circumference;
    
    const studentsPercentage = this.students.length / totalUsers;
    const teachersPercentage = this.teachers.length / totalUsers;
    const adminsPercentage = this.admins.length / totalUsers;
    const strokeLength = adminsPercentage * circumference;
    
    return circumference - strokeLength;
  }

  // Get stroke dash array for each segment
  getStudentsStrokeDashArray(): string {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return `0 ${circumference}`;
    
    const percentage = this.students.length / totalUsers;
    const strokeLength = percentage * circumference;
    const gapLength = circumference - strokeLength;
    
    return `${strokeLength} ${gapLength}`;
  }

  getTeachersStrokeDashArray(): string {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return `0 ${circumference}`;
    
    const teachersPercentage = this.teachers.length / totalUsers;
    const strokeLength = teachersPercentage * circumference;
    const gapLength = circumference - strokeLength;
    
    return `${strokeLength} ${gapLength}`;
  }

  getAdminsStrokeDashArray(): string {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return `0 ${circumference}`;
    
    const adminsPercentage = this.admins.length / totalUsers;
    const strokeLength = adminsPercentage * circumference;
    const gapLength = circumference - strokeLength;
    
    return `${strokeLength} ${gapLength}`;
  }

  // Get rotation for each segment
  getTeachersRotation(): number {
    const totalUsers = this.allUsers.length;
    if (totalUsers === 0) return -90;
    
    const studentsPercentage = this.students.length / totalUsers;
    const rotation = -90 + (studentsPercentage * 360);
    
    return rotation;
  }

  getAdminsRotation(): number {
    const totalUsers = this.allUsers.length;
    if (totalUsers === 0) return -90;
    
    const studentsPercentage = this.students.length / totalUsers;
    const teachersPercentage = this.teachers.length / totalUsers;
    const rotation = -90 + ((studentsPercentage + teachersPercentage) * 360);
    
    return rotation;
  }

  // Percentage calculations for role distribution
  getPercentage(userType: string): number {
    const totalUsers = this.allUsers.length;
    if (totalUsers === 0) return 0;
    
    let count = 0;
    switch (userType) {
      case 'students':
        count = this.students.length;
        break;
      case 'teachers':
        count = this.teachers.length;
        break;
      case 'admins':
        count = this.admins.length;
        break;
    }
    
    return Math.round((count / totalUsers) * 100);
  }

  // Status-based chart methods
  getActiveOffset(): number {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return circumference;
    
    const activePercentage = this.getActiveUsersCount() / totalUsers;
    const strokeLength = activePercentage * circumference;
    return circumference - strokeLength;
  }

  getPendingOffset(): number {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return circumference;
    
    const pendingPercentage = this.getPendingUsersCount() / totalUsers;
    const strokeLength = pendingPercentage * circumference;
    return circumference - strokeLength;
  }

  getRejectedOffset(): number {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return circumference;
    
    const rejectedPercentage = this.getRejectedUsersCount() / totalUsers;
    const strokeLength = rejectedPercentage * circumference;
    return circumference - strokeLength;
  }

  // Status stroke dash arrays
  getActiveStrokeDashArray(): string {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return `0 ${circumference}`;
    
    const percentage = this.getActiveUsersCount() / totalUsers;
    const strokeLength = percentage * circumference;
    const gapLength = circumference - strokeLength;
    
    return `${strokeLength} ${gapLength}`;
  }

  getPendingStrokeDashArray(): string {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return `0 ${circumference}`;
    
    const percentage = this.getPendingUsersCount() / totalUsers;
    const strokeLength = percentage * circumference;
    const gapLength = circumference - strokeLength;
    
    return `${strokeLength} ${gapLength}`;
  }

  getRejectedStrokeDashArray(): string {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    const totalUsers = this.allUsers.length;
    
    if (totalUsers === 0) return `0 ${circumference}`;
    
    const percentage = this.getRejectedUsersCount() / totalUsers;
    const strokeLength = percentage * circumference;
    const gapLength = circumference - strokeLength;
    
    return `${strokeLength} ${gapLength}`;
  }

  // Status rotations
  getPendingRotation(): number {
    const totalUsers = this.allUsers.length;
    if (totalUsers === 0) return -90;
    
    const activePercentage = this.getActiveUsersCount() / totalUsers;
    const rotation = -90 + (activePercentage * 360);
    
    return rotation;
  }

  getRejectedRotation(): number {
    const totalUsers = this.allUsers.length;
    if (totalUsers === 0) return -90;
    
    const activePercentage = this.getActiveUsersCount() / totalUsers;
    const pendingPercentage = this.getPendingUsersCount() / totalUsers;
    const rotation = -90 + ((activePercentage + pendingPercentage) * 360);
    
    return rotation;
  }

  getRejectedUsersCount(): number {
    return this.allUsers.filter(user => user.status === 'Inactive' || (!user.isActive && user.status !== 'Pending')).length;
  }

  getStatusPercentage(status: string): number {
    const totalUsers = this.allUsers.length;
    if (totalUsers === 0) return 0;
    
    let count = 0;
    switch (status) {
      case 'active':
        count = this.getActiveUsersCount();
        break;
      case 'pending':
        count = this.getPendingUsersCount();
        break;
      case 'rejected':
        count = this.getRejectedUsersCount();
        break;
    }
    
    return Math.round((count / totalUsers) * 100);
  }
}
