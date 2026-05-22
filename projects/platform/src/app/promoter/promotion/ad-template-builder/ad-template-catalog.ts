import { AdIndustryConfig, AdLayoutConfig, AdPlatformConfig } from './ad-template-builder.models';

export const AD_LAYOUTS: AdLayoutConfig[] = [
  {
    id: 'story_9_16',
    label: 'Story / Status',
    width: 1080,
    height: 1920,
    aspectLabel: '9:16',
    usageHint: 'WhatsApp Status, Instagram Story/Reels, TikTok',
  },
  {
    id: 'square_1_1',
    label: 'Square Post',
    width: 1080,
    height: 1080,
    aspectLabel: '1:1',
    usageHint: 'Instagram feed, Facebook feed',
  },
  {
    id: 'portrait_4_5',
    label: 'Portrait Post',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5',
    usageHint: 'Instagram feed (taller)',
  },
  {
    id: 'landscape_16_9',
    label: 'Landscape',
    width: 1600,
    height: 900,
    aspectLabel: '16:9',
    usageHint: 'X (Twitter), Facebook link post',
  },
];

export const AD_PLATFORMS: AdPlatformConfig[] = [
  { id: 'whatsapp', label: 'WhatsApp', icon: 'chat', layoutIds: ['story_9_16', 'square_1_1'] },
  { id: 'instagram', label: 'Instagram', icon: 'photo_camera', layoutIds: ['story_9_16', 'square_1_1', 'portrait_4_5'] },
  { id: 'facebook', label: 'Facebook', icon: 'public', layoutIds: ['square_1_1', 'landscape_16_9', 'story_9_16'] },
  { id: 'tiktok', label: 'TikTok', icon: 'movie', layoutIds: ['story_9_16'] },
  { id: 'x', label: 'X', icon: 'share', layoutIds: ['landscape_16_9', 'square_1_1'] },
  { id: 'generic', label: 'Generic', icon: 'campaign', layoutIds: ['square_1_1', 'story_9_16', 'portrait_4_5', 'landscape_16_9'] },
];

export const AD_INDUSTRIES: AdIndustryConfig[] = [
  { id: 'general', label: 'General', icon: 'category', accent: '#0f172a', hashtags: [] },
  { id: 'fashion', label: 'Fashion', icon: 'checkroom', accent: '#7c3aed', hashtags: ['#fashion', '#style', '#newarrival'] },
  { id: 'beauty', label: 'Beauty', icon: 'spa', accent: '#db2777', hashtags: ['#beauty', '#skincare', '#glow'] },
  { id: 'food', label: 'Food', icon: 'restaurant', accent: '#ea580c', hashtags: ['#food', '#foodie', '#delicious'] },
  { id: 'tech', label: 'Tech', icon: 'devices', accent: '#2563eb', hashtags: ['#tech', '#gadgets', '#innovation'] },
  { id: 'real_estate', label: 'Real Estate', icon: 'home', accent: '#16a34a', hashtags: ['#realestate', '#property', '#rent'] },
  { id: 'services', label: 'Services', icon: 'handyman', accent: '#0ea5e9', hashtags: ['#services', '#nearby', '#booknow'] },
];

export const getLayoutById = (id: string | null | undefined): AdLayoutConfig | null =>
  AD_LAYOUTS.find((l) => l.id === id) ?? null;

export const getPlatformById = (id: string | null | undefined): AdPlatformConfig | null =>
  AD_PLATFORMS.find((p) => p.id === id) ?? null;

export const getIndustryById = (id: string | null | undefined): AdIndustryConfig | null =>
  AD_INDUSTRIES.find((i) => i.id === id) ?? null;

