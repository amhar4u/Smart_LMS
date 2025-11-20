import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';
import { type Notification, type NotificationResponse, type UnreadCountResponse } from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private socket: Socket | null = null;
  private connected = false;

  // State management
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);
  private newNotificationSubject = new Subject<Notification>();

  // Public observables
  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();
  public newNotification$ = this.newNotificationSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Initialize Socket.IO connection for real-time notifications
   */
  connectSocket(userId: string, token: string): void {
    if (this.connected) {
      return;
    }

    const socketUrl = environment.apiUrl.replace('/api', '');
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      auth: {
        token: token
      }
    });

    this.socket.on('connect', () => {
      console.log('🔔 Notification socket connected');
      this.connected = true;
      
      // Authenticate with user ID
      this.socket?.emit('authenticate', { userId });
    });

    this.socket.on('authenticated', () => {
      console.log('✅ Notification socket authenticated');
      // Load initial notifications and unread count
      this.loadNotifications();
      this.getUnreadCount().subscribe();
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Notification socket disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket.IO notification error:', error);
    });

    // Listen for new notifications
    this.socket.on('notification', (notification: Notification) => {
      console.log('🔔 New notification received:', notification);
      
      // Add to notifications list
      const currentNotifications = this.notificationsSubject.value;
      this.notificationsSubject.next([notification, ...currentNotifications]);
      
      // Increment unread count
      this.unreadCountSubject.next(this.unreadCountSubject.value + 1);
      
      // Emit new notification event
      this.newNotificationSubject.next(notification);
      
      // Show browser notification if permission granted
      this.showBrowserNotification(notification);
    });

    // Listen for unread count updates
    this.socket.on('unread-count', (data: { count: number }) => {
      console.log('📊 Unread count updated:', data.count);
      this.unreadCountSubject.next(data.count);
    });
  }

  /**
   * Disconnect Socket.IO
   */
  disconnectSocket(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: Notification): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new window.Notification(notification.title, {
        body: notification.message,
        icon: '/assets/logo.png',
        badge: '/assets/badge.png',
        tag: notification._id
      });

      notif.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        notif.close();
      };
    }
  }

  /**
   * Request browser notification permission
   */
  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }
  }

  /**
   * Load notifications from server
   */
  loadNotifications(page: number = 1, limit: number = 20, unreadOnly: boolean = false): Observable<NotificationResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (unreadOnly) {
      params = params.set('isRead', 'false');
    }

    return this.http.get<NotificationResponse>(this.apiUrl, { params }).pipe(
      tap(response => {
        if (response.success && page === 1) {
          this.notificationsSubject.next(response.data);
        }
      })
    );
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<UnreadCountResponse> {
    return this.http.get<UnreadCountResponse>(`${this.apiUrl}/unread-count`).pipe(
      tap(response => {
        if (response.success) {
          this.unreadCountSubject.next(response.count);
        }
      })
    );
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): Observable<any> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(response => {
        if (response.success) {
          // Update local state
          const notifications = this.notificationsSubject.value.map(n =>
            n._id === notificationId ? { ...n, isRead: true } : n
          );
          this.notificationsSubject.next(notifications);
          
          // Decrement unread count
          const currentCount = this.unreadCountSubject.value;
          if (currentCount > 0) {
            this.unreadCountSubject.next(currentCount - 1);
          }

          // Emit to socket for real-time sync
          this.socket?.emit('mark-read', { notificationId });
        }
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<any> {
    return this.http.put<{ success: boolean }>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(response => {
        if (response.success) {
          // Update local state
          const notifications = this.notificationsSubject.value.map(n => ({ ...n, isRead: true }));
          this.notificationsSubject.next(notifications);
          
          // Reset unread count
          this.unreadCountSubject.next(0);

          // Emit to socket for real-time sync
          this.socket?.emit('mark-all-read');
        }
      })
    );
  }

  /**
   * Delete notification
   */
  deleteNotification(notificationId: string): Observable<any> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${notificationId}`).pipe(
      tap(response => {
        if (response.success) {
          // Remove from local state
          const notifications = this.notificationsSubject.value.filter(n => n._id !== notificationId);
          this.notificationsSubject.next(notifications);
        }
      })
    );
  }

  /**
   * Delete all read notifications
   */
  deleteAllRead(): Observable<any> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/clear-all`).pipe(
      tap(response => {
        if (response.success) {
          // Remove read notifications from local state
          const notifications = this.notificationsSubject.value.filter(n => !n.isRead);
          this.notificationsSubject.next(notifications);
        }
      })
    );
  }

  /**
   * Get notification icon based on type
   */
  getNotificationIcon(type: string): string {
    const iconMap: { [key: string]: string } = {
      'subject_assigned': '📚',
      'assignment_created': '📝',
      'assignment_submission': '✅',
      'assignment_evaluated': '✨',
      'meeting_scheduled': '📅',
      'meeting_reminder': '⏰',
      'meeting_hosted': '🎥',
      'module_created': '📖',
      'extra_module_created': '📕',
      'attendance_marked': '✓',
      'student_enrolled': '👨‍🎓',
      'user_registered': '👤',
      'account_approved': '✅',
      'account_rejected': '❌',
      'general': '🔔'
    };
    return iconMap[type] || '🔔';
  }

  /**
   * Get notification color based on priority
   */
  getNotificationColor(priority: string): string {
    const colorMap: { [key: string]: string } = {
      'low': '#95a5a6',
      'normal': '#3498db',
      'high': '#f39c12',
      'urgent': '#e74c3c'
    };
    return colorMap[priority] || '#3498db';
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.connected;
  }
}
