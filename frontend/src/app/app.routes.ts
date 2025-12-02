import { Routes } from '@angular/router';
import { adminGuard, studentGuard, teacherGuard, preventAuthGuard } from './guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./component/landing/landing.component').then(m => m.LandingComponent)
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
    path: 'student/subjects',
    loadComponent: () => import('./component/student/student-subjects/student-subjects').then(m => m.StudentSubjects),
    canActivate: [studentGuard]
  },
  {
    path: 'student/subjects/:id',
    loadComponent: () => import('./component/student/student-subject-detail/student-subject-detail').then(m => m.StudentSubjectDetail),
    canActivate: [studentGuard]
  },
  {
    path: 'student/assignments',
    loadComponent: () => import('./component/student/view-assignments/view-assignments.component').then(m => m.ViewAssignmentsComponent),
    canActivate: [studentGuard]
  },
  {
    path: 'student/take-assignment/:id',
    loadComponent: () => import('./component/student/take-assignment/take-assignment.component').then(m => m.TakeAssignmentComponent),
    canActivate: [studentGuard]
  },
  {
    path: 'student/assignment-result/:id',
    loadComponent: () => import('./component/student/assignment-result/assignment-result.component').then(m => m.AssignmentResultComponent),
    canActivate: [studentGuard]
  },
  {
    path: 'lecturer/dashboard',
    loadComponent: () => import('./component/lecturer/lecturer-dashboard/lecturer-dashboard').then(m => m.LecturerDashboard),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/subjects',
    loadComponent: () => import('./component/lecturer/lecturer-subjects/lecturer-subjects').then(m => m.LecturerSubjects),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/meetings',
    loadComponent: () => import('./component/lecturer/meeting-list/meeting-list.component').then(m => m.MeetingListComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/meetings/create',
    loadComponent: () => import('./component/lecturer/create-meeting/create-meeting.component').then(m => m.CreateMeetingComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/meetings/room/:id',
    loadComponent: () => import('./component/lecturer/meeting-room/meeting-room.component').then(m => m.MeetingRoomComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/assignments',
    loadComponent: () => import('./component/lecturer/manage-assignments/manage-assignments.component').then(m => m.LecturerManageAssignmentsComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/assignment-submissions',
    loadComponent: () => import('./component/lecturer/assignment-submissions/assignment-submissions.component').then(m => m.LecturerAssignmentSubmissionsComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/assignments/:id/submissions',
    loadComponent: () => import('./component/lecturer/assignment-submissions/assignment-submissions.component').then(m => m.LecturerAssignmentSubmissionsComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/modules',
    loadComponent: () => import('./component/lecturer/manage-modules/manage-modules.component').then(m => m.LecturerManageModulesComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/extra-modules',
    loadComponent: () => import('./component/lecturer/manage-extra-modules/manage-extra-modules.component').then(m => m.LecturerManageExtraModulesComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/meeting-analytics',
    loadComponent: () => import('./component/lecturer/lecturer-meeting-analytics/lecturer-meeting-analytics.component').then(m => m.LecturerMeetingAnalyticsComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/meeting-analytics/:id',
    loadComponent: () => import('./component/admin/meeting-analytics-detail/meeting-analytics-detail.component').then(m => m.MeetingAnalyticsDetailComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'lecturer/notifications',
    loadComponent: () => import('./component/shared/notifications-page/notifications-page.component').then(m => m.NotificationsPageComponent),
    canActivate: [teacherGuard]
  },
  {
    path: 'student/meetings',
    loadComponent: () => import('./component/student/student-meetings/student-meetings.component').then(m => m.StudentMeetingsComponent),
    canActivate: [studentGuard]
  },
  {
    path: 'student/meetings/room/:id',
    loadComponent: () => import('./component/student/student-meeting-room/student-meeting-room.component').then(m => m.StudentMeetingRoomComponent),
    canActivate: [studentGuard]
  },
  {
    path: 'student/notifications',
    loadComponent: () => import('./component/shared/notifications-page/notifications-page.component').then(m => m.NotificationsPageComponent),
    canActivate: [studentGuard]
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
    path: 'admin/manage-departments',
    loadComponent: () => import('./component/admin/manage-departments/manage-departments').then(m => m.ManageDepartments),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-courses',
    loadComponent: () => import('./component/admin/manage-courses/manage-courses.component').then(m => m.ManageCoursesComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-subjects',
    loadComponent: () => import('./component/admin/manage-subjects/manage-subjects.component').then(m => m.ManageSubjectsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-batches',
    loadComponent: () => import('./component/admin/manage-batches/manage-batches.component').then(m => m.ManageBatchesComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-semesters',
    loadComponent: () => import('./component/admin/manage-semesters/manage-semesters.component').then(m => m.ManageSemestersComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-modules',
    loadComponent: () => import('./component/admin/manage-modules/manage-modules.component').then(m => m.ManageModulesComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-extra-modules',
    loadComponent: () => import('./component/admin/manage-extra-modules/manage-extra-modules.component').then(m => m.ManageExtraModulesComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-assignments',
    loadComponent: () => import('./component/admin/manage-assignments/manage-assignments.component').then(m => m.ManageAssignmentsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/assignment-submissions',
    loadComponent: () => import('./component/admin/assignment-submissions/assignment-submissions.component').then(m => m.AssignmentSubmissionsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/assignments/:id/submissions',
    loadComponent: () => import('./component/admin/assignment-submissions/assignment-submissions.component').then(m => m.AssignmentSubmissionsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/manage-meetings',
    loadComponent: () => import('./component/admin/manage-meetings/manage-meetings.component').then(m => m.ManageMeetingsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/meeting-analytics',
    loadComponent: () => import('./component/admin/admin-meeting-analytics/admin-meeting-analytics.component').then(m => m.AdminMeetingAnalyticsComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/meeting-analytics/:id',
    loadComponent: () => import('./component/admin/meeting-analytics-detail/meeting-analytics-detail.component').then(m => m.MeetingAnalyticsDetailComponent),
    canActivate: [adminGuard]
  },
  {
    path: 'admin/notifications',
    loadComponent: () => import('./component/shared/notifications-page/notifications-page.component').then(m => m.NotificationsPageComponent),
    canActivate: [adminGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
