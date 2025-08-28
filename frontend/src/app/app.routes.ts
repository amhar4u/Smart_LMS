import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./component/auth/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'auth/register/student',
    loadComponent: () => import('./component/auth/register/student-register.component').then(m => m.StudentRegisterComponent)
  },
  {
    path: 'auth/register/teacher',
    loadComponent: () => import('./component/auth/register/teacher-register.component').then(m => m.TeacherRegisterComponent)
  },
  {
    path: 'student/dashboard',
    loadComponent: () => import('./component/student/student-dashboard/student-dashboard').then(m => m.StudentDashboard)
  },
  {
    path: 'lecturer/dashboard',
    loadComponent: () => import('./component/lecturer/lecturer-dashboard/lecturer-dashboard').then(m => m.LecturerDashboard)
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./component/admin/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard)
  },
  {
    path: 'admin/manage-admins',
    loadComponent: () => import('./component/admin/manage-admins/manage-admins').then(m => m.ManageAdmins)
  },
  {
    path: 'admin/manage-students',
    loadComponent: () => import('./component/admin/manage-students/manage-students').then(m => m.ManageStudents)
  },
  {
    path: 'admin/manage-lecturers',
    loadComponent: () => import('./component/admin/manage-lecturers/manage-lecturers').then(m => m.ManageLecturers)
  },
  {
    path: 'admin/courses',
    redirectTo: 'admin/dashboard'
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
