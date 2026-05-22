export type AdPlatformId =
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'x'
  | 'generic';

export type AdLayoutId =
  | 'story_9_16'
  | 'square_1_1'
  | 'portrait_4_5'
  | 'landscape_16_9';

export type AdMediaSource = 'campaign' | 'upload' | 'none';

export interface AdPlatformConfig {
  id: AdPlatformId;
  label: string;
  icon: string;
  layoutIds: AdLayoutId[];
  copyGuidelines?: {
    headlineMaxChars: number;
    captionMaxChars: number;
    captionPreviewChars?: number;
    linkHint?: string;
    tips: string[];
  };
}

export interface AdLayoutConfig {
  id: AdLayoutId;
  label: string;
  width: number;
  height: number;
  aspectLabel: string;
  usageHint: string;
}

export interface AdIndustryConfig {
  id: string;
  label: string;
  icon: string;
  accent: string;
  hashtags: string[];
}

export interface AdBuildPromotionRef {
  id?: string;
  title: string;
  upi?: string;
  promotionUrl?: string;
  campaignMediaUrl?: string;
  campaignThumbnailUrl?: string;
}

export interface AdBuildConfig {
  platformId: AdPlatformId;
  layoutId: AdLayoutId;
  industryId: string | null;
  accentColor: string;
  mediaSource: AdMediaSource;
  headline: string;
  caption: string;
  includeQr: boolean;
}
