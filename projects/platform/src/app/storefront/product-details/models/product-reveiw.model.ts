// product-review.model.ts (or add to your existing store models file)

/**
 * Product Review Model
 * Represents a customer review/rating for a product
 */
export interface ProductReview {
  /** Unique identifier for the review */
  _id?: string;
  
  /** Reference to the product being reviewed */
  productId: string;
  
  /** Reference to the user who wrote the review */
  userId: string;
  
  /** User information (populated when fetching reviews) */
  user?: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
  };
  
  /** Review rating (1-5 stars) */
  rating: number;
  
  /** Review title/subject */
  title?: string;
  
  /** Main review content/comment */
  comment: string;
  
  /** Array of image URLs attached to the review */
  images?: string[];
  
  /** Whether the review is from a verified purchase */
  verifiedPurchase: boolean;
  
  /** Number of users who found this review helpful */
  helpfulCount: number;
  
  /** Number of users who reported this review */
  reportCount: number;
  
  /** IDs of users who marked this review as helpful */
  helpfulBy?: string[];
  
  /** IDs of users who reported this review */
  reportedBy?: string[];
  
  /** Admin response to the review */
  response?: {
    /** Response content */
    content: string;
    /** Date of response */
    createdAt: Date;
    /** Admin/user who responded */
    respondedBy: string;
    /** Name of responder */
    responderName?: string;
  };
  
  /** Review status (for moderation) */
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  
  /** Review metadata */
  metadata?: {
    /** Device used to post review */
    device?: 'mobile' | 'tablet' | 'desktop';
    /** Platform used */
    platform?: 'ios' | 'android' | 'web';
    /** IP address (for moderation) */
    ipAddress?: string;
    /** User agent string */
    userAgent?: string;
  };
  
  /** Timestamps */
  createdAt: Date;
  updatedAt: Date;
  
  /** For sorting/featured reviews */
  isFeatured?: boolean;
  
  /** Purchase details (if verified) */
  purchaseDetails?: {
    orderId: string;
    purchaseDate: Date;
    variantId?: string;
    variantName?: string;
  };
}