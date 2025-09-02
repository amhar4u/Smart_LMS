import { Routes } from '@angular/router';
import { adminGuard, studentGuard, teacherGuard, preventAuthGuard } from './guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'debug/auth',
    loadComponent: () => import('./component/debug/auth-debug.component').then(m => m.AuthDebugComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./component/auth/login/login').then(m => m.LoginComponent),
    canActivate: [preventAuthGuard]
  },
  {
    path: 'auth/register/student',
    loadComponent: () => import('./component/auth/register/student-register.component').then(m => m.StudentRegisterComponent),
    canActivate: [preventAuthGuard]
  },
  {
    path: 'auth/register/teacher',
    loadComponent: () => import('./component/auth/register/teacher-register.component').then(m => m.TeacherRegisterComponent),
    canActivate: [preventAuthGuard]
  },
  {
    path: 'student/dashboard',
    loadComponent: () => import('./component/student/student-dashboard/student-dashboard').then(m => m.StudentDashboard),
    canActivate: [studentGuard]
  },
  {
    path: 'lecturer/dashboard',
    loadComponent: () => import('./component/lecturer/lecturer-dashboard/lecturer-dashboard').then(m => m.LecturerDashboard),
    canActivate: [teacherGuard]
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./component/admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-admins',
    loadComponent: () => import('./component/admin/manage-admins/manage-admins').then(m => m.ManageAdmins),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-students',
    loadComponent: () => import('./component/admin/manage-students/manage-students').then(m => m.ManageStudents),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-lecturers',
    loadComponent: () => import('./component/admin/manage-lecturers/manage-lecturers').then(m => m.ManageLecturers),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-courses',
    loadComponent: () => import('./component/admin/manage-courses/manage-courses.component').then(m => m.ManageCoursesComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-departments',
    loadComponent: () => import('./component/admin/manage-departments/manage-departments').then(m => m.ManageDepartments),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-semesters',
    loadComponent: () => import('./component/admin/manage-semesters/manage-semesters').then(m => m.ManageSemesters),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/schedules',
    redirectTo: 'admin/dashboard'
  },
  {
    path: 'admin/promote',
    redirectTo: 'admin/dashboard'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
