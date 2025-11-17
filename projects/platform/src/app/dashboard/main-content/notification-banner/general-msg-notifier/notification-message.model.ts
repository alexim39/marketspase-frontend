// Create a new file: notification-message.model.ts
export interface NotificationMessage {
  _id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'MAINTENANCE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  targetAudience: 'ALL' | 'NEW_USERS' | 'EXISTING_USERS' | 'SPECIFIC_GROUP';
  startDate: string;
  endDate: string;
  isActive: boolean;
  showBanner: boolean;
  bannerColor?: string;
  textColor?: string;
  icon?: string;
  actionLink?: string;
  actionText?: string;
  dismissible: boolean;
}

export interface NotificationResponse {
  success: boolean;
  data: NotificationMessage[];
  message?: string;
}

export interface DismissalResponse {
  success: boolean;
  data: string[];
  message?: string;
}