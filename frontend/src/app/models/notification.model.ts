export interface Notification {
  _id: string;
  recipient: string;
  sender: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
  type: NotificationType;
  title: string;
  message: string;
  relatedEntity?: {
    entityType: string;
    entityId: string;
  };
  actionUrl?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  isRead: boolean;
  metadata?: any;
  createdAt: Date;
  updatedAt?: Date;
}

export type NotificationType =
  | 'subject_assigned'
  | 'assignment_created'
  | 'assignment_submission'
  | 'assignment_evaluated'
  | 'meeting_scheduled'
  | 'meeting_reminder'
  | 'meeting_hosted'
  | 'module_created'
  | 'extra_module_created'
  | 'attendance_marked'
  | 'student_enrolled'
  | 'user_registered'
  | 'account_approved'
  | 'account_rejected'
  | 'general';

export interface NotificationResponse {
  success: boolean;
  data: Notification[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  count: number;
}
