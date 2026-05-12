// models/settings.model.ts
export interface WhatsAppConnection {
  id: string;
  phoneNumber: string;
  isConnected?: boolean;
  aiEnabled: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceNaira: number;
  priceDisplay: string;
  features: string[];
  isPopular?: boolean;
}

export interface NotificationPreferences {
  newMessage: boolean;
  escalation: boolean;
  paymentConfirmation: boolean;
}

export interface AvailableStore {
  id: string;
  name: string;
}

export interface BusinessInfo {
  businessId: string;
  businessName: string;
  availableStores: AvailableStore[];
}
