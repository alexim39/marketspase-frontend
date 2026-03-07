export type CommunityPostType =
  | 'earnings'
  | 'campaign'
  | 'storefront'
  | 'tip'
  | 'growth';

export interface CommunityPost {
  id: string;
  author: string;
  avatar?: string;
  role: 'promoter' | 'marketer';

  type: CommunityPostType;

  content: string;
  createdAt: Date;

  badge?: 'top' | 'verified' | 'featured';

  // Engagement
  likes: number;
  comments: number;
  saved?: boolean;

  // Optional structured data
  earnings?: number;
  campaignName?: string;
  budget?: number;

  storefrontName?: string;
  productName?: string;
}