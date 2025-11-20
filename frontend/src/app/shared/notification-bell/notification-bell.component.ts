import { Component, OnInit, OnDestroy, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { type Notification } from '../../models/notification.model';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css'],
  animations: [
    trigger('bellShake', [
      state('idle', style({ transform: 'rotate(0deg)' })),
      state('shake', style({ transform: 'rotate(0deg)' })),
      transition('idle => shake', [
        animate('100ms', style({ transform: 'rotate(15deg)' })),
        animate('100ms', style({ transform: 'rotate(-15deg)' })),
        animate('100ms', style({ transform: 'rotate(10deg)' })),
        animate('100ms', style({ transform: 'rotate(-10deg)' })),
        animate('100ms', style({ transform: 'rotate(0deg)' }))
      ])
    ]),
    trigger('slideDown', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' }))
      ])
    ]),
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-in', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  isDropdownOpen: boolean = false;
  bellState: string = 'idle';
  isLoading: boolean = false;
  userRole: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    // Get user role
    const user = this.authService.getCurrentUser();
    this.userRole = user?.role || '';

    // Subscribe to notifications
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications.slice(0, 10); // Show latest 10 in dropdown
      });

    // Subscribe to unread count
    this.notificationService.unreadCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.unreadCount = count;
      });

    // Subscribe to new notifications
    this.notificationService.newNotification$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notification => {
        this.shakeBell();
        this.playNotificationSound();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle notification dropdown
   */
  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
    
    if (this.isDropdownOpen && this.notifications.length === 0) {
      this.loadNotifications();
    }
  }

  /**
   * Load notifications
   */
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

  /**
   * Handle notification click
   */
  onNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe();
    }

    // Close dropdown
    this.isDropdownOpen = false;

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

  /**
   * Mark notification as read
   */
  markAsRead(event: Event, notification: Notification): void {
    event.stopPropagation();
    this.notificationService.markAsRead(notification._id).subscribe();
  }

  /**
   * Delete notification
   */
  deleteNotification(event: Event, notificationId: string): void {
    event.stopPropagation();
    this.notificationService.deleteNotification(notificationId).subscribe();
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        console.log('All notifications marked as read');
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
      }
    });
  }

  /**
   * Delete all read notifications
   */
  deleteAllRead(): void {
    this.notificationService.deleteAllRead().subscribe({
      next: () => {
        console.log('All read notifications deleted');
      },
      error: (error) => {
        console.error('Error deleting read notifications:', error);
      }
    });
  }

  /**
   * Get time ago string
   */
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

  /**
   * Get notification icon
   */
  getIcon(type: string): string {
    return this.notificationService.getNotificationIcon(type);
  }

  /**
   * Get notification color
   */
  getColor(priority: string): string {
    return this.notificationService.getNotificationColor(priority);
  }

  /**
   * Shake bell animation
   */
  shakeBell(): void {
    this.bellState = 'shake';
    setTimeout(() => {
      this.bellState = 'idle';
    }, 500);
  }

  /**
   * Play notification sound
   */
  playNotificationSound(): void {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKjo77RgGwU7k9nyw3csBS18zu/ejUEJEly16+yoVhMNR6Df8bpmHwU0hc3z2YcyBh1rvPDjm0wLDlKp6O+xXhsFPJTZ88FyKgQpeMvv3Y4/Cg9dtevqqFYTDEin3vG5ZBsFN4nM89aFLwYdbL3w45xOCw5TqejwsV4bBT+U2fO/cSkEKHfJ79+OPwoQXrTq66lUFQxKqN7wtWMdBjiKzvPWgy0GHm298OKaSwsPVKno8LBcGgRAmdrzvnEnBCl4yO7diz0KEV+z6uuoUxULTKrf8LRgGgU5jM/z1YIsAx9uvfDhmkoKDlWp5++vWhoEQpvb87xiKQYqeMfu2og9CRJgtOvpp1IWC0ys3u+yXRsFO43P9NSDKgUfb77v4ZlICg9Wq+fvrlgZA0Oc3POxYCYFLHnG79qGOggQYLPr5qZRFwtNrd3vsl4bBj2Rz/TRgCYEIG/A7+GYRwkQWK/n76xWGQJEnt3zsF4mBSx6xu7ahToHD2Cy6+SmUBYHTa3c77JeFQU9k9H0z34lAyFwwO7elEQIDlio5e6qVBgCRaHc8q1cJgQse8Xu2oQ5BxFitOvko00VCEyt2u6yXRUFPpPR9M17JADMAAAQA==');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Could not play notification sound'));
  }

  /**
   * Close dropdown when clicking outside
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isDropdownOpen = false;
    }
  }

  /**
   * View all notifications
   */
  viewAllNotifications(): void {
    // Get user role from auth service or URL
    const currentUrl = this.router.url;
    let basePath = '';
    
    if (currentUrl.includes('/admin/')) {
      basePath = '/admin';
    } else if (currentUrl.includes('/lecturer/')) {
      basePath = '/lecturer';
    } else if (currentUrl.includes('/student/')) {
      basePath = '/student';
    }
    
    this.router.navigate([`${basePath}/notifications`]);
    this.isDropdownOpen = false;
  }
}
