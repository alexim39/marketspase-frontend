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
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    icon: 'chat',
    layoutIds: ['story_9_16', 'square_1_1'],
    copyGuidelines: {
      headlineMaxChars: 80,
      captionMaxChars: 700,
      captionPreviewChars: 140,
      linkHint: 'Links are clickable. Put the link on its own line for clarity.',
      tips: [
        'Keep the first line short and specific.',
        'Use Status (9:16) for reach, and Chat (1:1) for direct conversion.',
        'Ask for a reply: "Reply YES to order" or "Send a DM for details".',
      ],
    },
  },
  {
    id: 'instagram',
    label: 'Instagram',
    icon: 'photo_camera',
    layoutIds: ['story_9_16', 'square_1_1', 'portrait_4_5'],
    copyGuidelines: {
      headlineMaxChars: 80,
      captionMaxChars: 2200,
      captionPreviewChars: 125,
      linkHint: 'Most accounts cannot open links directly from captions. Consider Story link sticker or bio.',
      tips: [
        'Make the first 125 characters a strong hook (this is what people see first).',
        'Use 3-8 relevant hashtags (avoid stuffing).',
        'Add a clear call-to-action: "Save this", "Share", or "DM to order".',
      ],
    },
  },
  {
    id: 'facebook',
    label: 'Facebook',
    icon: 'public',
    layoutIds: ['square_1_1', 'landscape_16_9', 'story_9_16'],
    copyGuidelines: {
      headlineMaxChars: 90,
      captionMaxChars: 5000,
      captionPreviewChars: 180,
      linkHint: 'Links are clickable. Put the link after the value/offer.',
      tips: [
        'Lead with the offer/benefit, then the proof (price, delivery, reviews).',
        'Short paragraphs perform better than one large block.',
        'Avoid too many hashtags; 0-3 is usually enough on Facebook.',
      ],
    },
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    icon: 'movie',
    layoutIds: ['story_9_16'],
    copyGuidelines: {
      headlineMaxChars: 70,
      captionMaxChars: 4000,
      captionPreviewChars: 120,
      linkHint: 'Keep the caption short and benefit-driven. Use the link where your account supports it.',
      tips: [
        'Use 9:16 for best framing (avoid important text near the edges).',
        'Keep the first line direct: product + benefit.',
        'Use 3-5 hashtags mixing broad + niche.',
      ],
    },
  },
  {
    id: 'x',
    label: 'X',
    icon: 'share',
    layoutIds: ['landscape_16_9', 'square_1_1'],
    copyGuidelines: {
      headlineMaxChars: 70,
      captionMaxChars: 280,
      captionPreviewChars: 140,
      linkHint: 'Keep under 280 characters for standard posts. Place the link at the end.',
      tips: [
        'Start with a punchy first line; avoid long intros.',
        'Use 0-2 hashtags; too many reduces readability.',
        'If you need more context, do a short thread (2-4 posts).',
      ],
    },
  },
  {
    id: 'generic',
    label: 'Generic',
    icon: 'campaign',
    layoutIds: ['square_1_1', 'story_9_16', 'portrait_4_5', 'landscape_16_9'],
    copyGuidelines: {
      headlineMaxChars: 90,
      captionMaxChars: 1000,
      captionPreviewChars: 140,
      linkHint: 'Place the link on a new line.',
      tips: [
        'Keep the copy simple: offer, benefit, then link.',
        'Use short sentences and spacing.',
        'Always include a clear call-to-action.',
      ],
    },
  },
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
