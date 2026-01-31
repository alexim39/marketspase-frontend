// shared/services/analytics.service.ts
import { Injectable, inject } from '@angular/core';
//import { environment } from '../../../environments/environment';

export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  //apiUrl: 'https://api.yourdomain.com',
  apiKey: 'dev-key-123',
  googleAnalyticsId: 'G-XXXXXXXXXX'
};


declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: (...args: any[]) => void;
  }
}

export interface AnalyticsEvent {
  name: string;
  params?: {
    [key: string]: any;
  };
}

export interface PageViewEvent {
  page_title: string;
  page_location: string;
  page_path: string;
}

export interface ProductViewEvent {
  product_id: string;
  product_name: string;
  product_category: string;
  product_price: number;
  product_commission: number;
  user_type: 'promoter' | 'customer' | 'store_owner';
}

export interface PromotionClickEvent {
  product_id: string;
  tracking_code: string;
  source: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
}

@Injectable()
export class AnalyticsService {
  private isProduction = environment.production;
  private userId: string | null = null;
  private sessionId = this.generateSessionId();

  /**
   * Initialize analytics services
   */
  initialize(userId?: string): void {
    this.userId = userId || null;
    
    // Initialize Google Analytics if available
    if (window.gtag) {
      window.gtag('config', environment.googleAnalyticsId, {
        user_id: this.userId,
        session_id: this.sessionId,
        custom_map: {
          dimension1: 'user_type',
          dimension2: 'promoter_id',
          dimension3: 'store_id'
        }
      });
    }
  }

  /**
   * Track page view
   */
  trackPageView(event: PageViewEvent): void {
    if (!this.isProduction) {
      console.log('[Analytics] Page View:', event);
      return;
    }

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', 'page_view', event);
    }

    // Facebook Pixel
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }

    // Custom data layer
    this.pushToDataLayer({
      event: 'page_view',
      ...event,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track product view
   */
  trackProductView(productId: string, userType: 'promoter' | 'customer' | 'store_owner' = 'promoter'): void {
    const event: ProductViewEvent = {
      product_id: productId,
      product_name: '', // Will be populated by backend
      product_category: '',
      product_price: 0,
      product_commission: 0,
      user_type: userType
    };

    this.trackEvent('view_product', event);
  }

  /**
   * Track promotion link click
   */
  trackPromotionClick(eventData: PromotionClickEvent): void {
    this.trackEvent('promotion_click', eventData);
  }

  /**
   * Track commission earned
   */
  trackCommissionEarned(productId: string, amount: number, orderId: string): void {
    this.trackEvent('commission_earned', {
      product_id: productId,
      amount,
      order_id: orderId,
      currency: 'USD'
    });
  }

  /**
   * Track share action
   */
  trackShare(productId: string, platform: string, method: string): void {
    this.trackEvent('share_product', {
      product_id: productId,
      platform,
      method,
      user_id: this.userId
    });
  }

  /**
   * Track user engagement
   */
  trackEngagement(action: string, duration?: number, metadata?: any): void {
    this.trackEvent('user_engagement', {
      action,
      duration,
      metadata,
      user_id: this.userId,
      session_id: this.sessionId
    });
  }

  /**
   * Track error
   */
  trackError(error: Error, context?: string): void {
    this.trackEvent('error', {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
      context,
      user_id: this.userId,
      session_id: this.sessionId,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Generic event tracking
   */
  trackEvent(eventName: string, params?: { [key: string]: any }): void {
    if (!this.isProduction) {
      console.log(`[Analytics] Event: ${eventName}`, params);
      return;
    }

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', eventName, {
        ...params,
        user_id: this.userId,
        session_id: this.sessionId
      });
    }

    // Facebook Pixel for conversion events
    if (window.fbq && ['purchase', 'lead', 'complete_registration'].includes(eventName)) {
      window.fbq('track', eventName, params);
    }

    // Custom data layer
    this.pushToDataLayer({
      event: eventName,
      ...params,
      user_id: this.userId,
      session_id: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Set user properties
   */
  setUserProperties(properties: { [key: string]: any }): void {
    if (!this.isProduction) {
      console.log('[Analytics] User Properties:', properties);
      return;
    }

    if (window.gtag) {
      window.gtag('set', 'user_properties', properties);
    }

    this.pushToDataLayer({
      event: 'set_user_properties',
      ...properties
    });
  }

  /**
   * Set user ID for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
    
    if (window.gtag) {
      window.gtag('set', 'user_id', userId);
    }

    this.pushToDataLayer({
      event: 'set_user_id',
      user_id: userId
    });
  }

  /**
   * Clear user ID (logout)
   */
  clearUserId(): void {
    this.userId = null;
    
    if (window.gtag) {
      window.gtag('set', 'user_id', null);
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Generate a new session ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Push event to data layer
   */
  private pushToDataLayer(data: any): void {
    if (!window.dataLayer) {
      window.dataLayer = [];
    }
    window.dataLayer.push(data);
  }

  /**
   * Get analytics consent status
   */
  getConsentStatus(): boolean {
    const consent = localStorage.getItem('analytics_consent');
    return consent === 'granted';
  }

  /**
   * Set analytics consent
   */
  setConsent(granted: boolean): void {
    localStorage.setItem('analytics_consent', granted ? 'granted' : 'denied');
    
    if (window.gtag) {
      window.gtag('consent', granted ? 'grant' : 'deny', {
        ad_storage: granted ? 'granted' : 'denied',
        analytics_storage: granted ? 'granted' : 'denied'
      });
    }

    this.trackEvent('analytics_consent', {
      granted,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track time spent on page
   */
  trackTimeOnPage(page: string, duration: number): void {
    this.trackEvent('time_on_page', {
      page,
      duration_seconds: Math.round(duration / 1000),
      user_id: this.userId,
      session_id: this.sessionId
    });
  }

  /**
   * Track scroll depth
   */
  trackScrollDepth(page: string, depth: 25 | 50 | 75 | 100): void {
    this.trackEvent('scroll_depth', {
      page,
      depth_percentage: depth,
      user_id: this.userId,
      session_id: this.sessionId
    });
  }
}