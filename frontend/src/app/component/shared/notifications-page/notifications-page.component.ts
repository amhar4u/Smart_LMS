import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../../services/notification.service';
import { AuthService } from '../../../services/auth.service';
import { type Notification } from '../../../models/notification.model';
import { StudentLayout } from '../../student/student-layout/student-layout';
import { LecturerLayout } from '../../lecturer/lecturer-layout/lecturer-layout';
import { AdminLayout } from '../../admin/admin-layout/admin-layout';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, StudentLayout, LecturerLayout, AdminLayout],
  templateUrl: './notifications-page.component.html',
  styleUrls: ['./notifications-page.component.css']
})
export class NotificationsPageComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  filteredNotifications: Notification[] = [];
  isLoading = false;
  activeFilter: 'all' | 'unread' | 'read' = 'all';
  userRole: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get user role
    const currentUser = this.authService.getCurrentUser();
    this.userRole = currentUser?.role || '';
    
    this.loadNotifications();
    
    // Subscribe to notification updates
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
        this.applyFilter();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadNotifications(): void {
    this.isLoading = true;
    this.notificationService.loadNotifications().subscribe({
      next: () => {
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
  }

  applyFilter(): void {
    switch (this.activeFilter) {
      case 'unread':
        this.filteredNotifications = this.notifications.filter(n => !n.isRead);
        break;
      case 'read':
        this.filteredNotifications = this.notifications.filter(n => n.isRead);
        break;
      default:
        this.filteredNotifications = this.notifications;
    }
  }

  setFilter(filter: 'all' | 'unread' | 'read'): void {
    this.activeFilter = filter;
    this.applyFilter();
  }

  onNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe();
    }

    // Navigate based on notification type and user role
    const route = this.getNavigationRoute(notification);
    if (route) {
      this.router.navigate([route]);
    }
  }

  /**
   * Get navigation route based on notification type and user role
   */
  private getNavigationRoute(notification: Notification): string | null {
    const { type, relatedEntity, metadata } = notification;
    const rolePrefix = this.userRole === 'admin' ? '/admin' : 
                       this.userRole === 'teacher' ? '/lecturer' : '/student';

    switch (type) {
      case 'module_created':
      case 'extra_module_created':
        if (this.userRole === 'teacher') {
          // Lecturer goes to modules page
          return type === 'extra_module_created' ? '/lecturer/extra-modules' : '/lecturer/modules';
        } else if (this.userRole === 'student') {
          // Student goes to subject detail page
          const subjectId = metadata?.subjectId || relatedEntity?.entityId;
          return subjectId ? `/student/subjects/${subjectId}` : '/student/subjects';
        }
        return `${rolePrefix}/manage-modules`;

      case 'assignment_created':
        return `${rolePrefix}/assignments`;

      case 'assignment_evaluated':
      case 'assignment_submission':
        if (this.userRole === 'student') {
          return '/student/assignments';
        }
        return `${rolePrefix}/assignment-submissions`;

      case 'meeting_scheduled':
      case 'meeting_reminder':
        return `${rolePrefix}/meetings`;

      case 'subject_assigned':
        if (this.userRole === 'teacher') {
          return '/lecturer/subjects';
        } else if (this.userRole === 'student') {
          const subjectId = relatedEntity?.entityId;
          return subjectId ? `/student/subjects/${subjectId}` : '/student/subjects';
        }
        return '/admin/manage-subjects';

      case 'attendance_marked':
        return this.userRole === 'student' ? '/student/subjects' : `${rolePrefix}/attendance`;

      default:
        // Use actionUrl if available
        return notification.actionUrl || null;
    }
  }

  markAsRead(event: Event, notification: Notification): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification._id).subscribe();
  }

  deleteNotification(event: Event, notificationId: string): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notificationId).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  deleteAllRead(): void {
    if (confirm('Are you sure you want to delete all read notifications?')) {
      this.notificationService.deleteAllRead().subscribe();
    }
  }

  getTimeAgo(date: Date): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationDate.toLocaleDateString();
  }

  getIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  getColor(priority: string): string {
    return this.notificationService.getNotificationColor(priority);
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  getReadCount(): number {
    return this.notifications.filter(n => n.isRead).length;
  }

  hasUnreadNotifications(): boolean {
    return this.notifications.some(n => !n.isRead);
  }

  hasReadNotifications(): boolean {
    return this.notifications.some(n => n.isRead);
  }

  goBack(): void {
    window.history.back();
  }
}
