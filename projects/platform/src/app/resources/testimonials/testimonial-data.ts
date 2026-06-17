export type TestimonialAudience = 'all' | 'marketer' | 'promoter' | 'store-owner';

export interface TestimonialCategory {
  label: string;
  value: TestimonialAudience;
  icon: string;
}

export interface PublicTestimonial {
  name: string;
  role: string;
  business: string;
  location: string;
  audience: Exclude<TestimonialAudience, 'all'>;
  quote: string;
  outcome: string;
  metric: string;
  avatarInitials: string;
  rating: number;
  tags: string[];
}

export interface TestimonialStat {
  value: string;
  label: string;
  icon: string;
}

export const TESTIMONIAL_CATEGORIES: TestimonialCategory[] = [
  { label: 'All stories', value: 'all', icon: 'apps' },
  { label: 'Marketers', value: 'marketer', icon: 'campaign' },
  { label: 'Promoters', value: 'promoter', icon: 'groups' },
  { label: 'Store owners', value: 'store-owner', icon: 'storefront' },
];

export const TESTIMONIAL_STATS: TestimonialStat[] = [
  { value: '10K+', label: 'Active promoters', icon: 'groups' },
  { value: '500+', label: 'Businesses onboarded', icon: 'storefront' },
  { value: '50K+', label: 'Campaigns completed', icon: 'campaign' },
  { value: 'NGN 100M+', label: 'Tracked payouts', icon: 'payments' },
];

export const PUBLIC_TESTIMONIALS: PublicTestimonial[] = [
  {
    name: 'Amina Yusuf',
    role: 'Founder',
    business: 'Amina Beauty Hub',
    location: 'Lagos',
    audience: 'marketer',
    quote:
      'MarketSpase helped us stop guessing. We could see which promoters brought real clicks, which products converted, and where to put the next budget.',
    outcome: 'Lower wasted ad spend with clearer PPC tracking.',
    metric: '3.1x campaign reach',
    avatarInitials: 'AY',
    rating: 5,
    tags: ['Campaign tracking', 'Budget control', 'PPC'],
  },
  {
    name: 'Chinedu Okafor',
    role: 'Promoter',
    business: 'Independent creator',
    location: 'Enugu',
    audience: 'promoter',
    quote:
      'The unique link makes the work clear. I share, track my activity, and know exactly when valid activity is counted for earnings.',
    outcome: 'More confidence in promotion earnings and activity records.',
    metric: '42 verified promotions',
    avatarInitials: 'CO',
    rating: 5,
    tags: ['Unique links', 'Earnings', 'Transparency'],
  },
  {
    name: 'Tosin Balogun',
    role: 'Store owner',
    business: 'TeeB Stores',
    location: 'Ibadan',
    audience: 'store-owner',
    quote:
      'Our storefront gave promoters a simple way to push products while we still saw buyers, orders, and referral sources from one place.',
    outcome: 'Connected product promotion, buyer orders, and promoter attribution.',
    metric: '28% more product enquiries',
    avatarInitials: 'TB',
    rating: 5,
    tags: ['Storefront', 'Orders', 'Product links'],
  },
  {
    name: 'Grace Emmanuel',
    role: 'Marketing Lead',
    business: 'GEM Events',
    location: 'Abuja',
    audience: 'marketer',
    quote:
      'Before MarketSpase, we paid for visibility without proof. Now campaign performance, promoter records, and spend are easier to defend.',
    outcome: 'Better reporting for campaign decisions and internal approvals.',
    metric: '64% faster reporting',
    avatarInitials: 'GE',
    rating: 5,
    tags: ['Reporting', 'Promoter records', 'Analytics'],
  },
  {
    name: 'Ifeoma Nwankwo',
    role: 'Promoter',
    business: 'Lifestyle micro-influencer',
    location: 'Port Harcourt',
    audience: 'promoter',
    quote:
      'The platform gives me campaigns that match my audience. It also helps me avoid confusion because the promotion link and content are already organized.',
    outcome: 'Cleaner promotion workflow for social posting.',
    metric: '18 campaigns completed',
    avatarInitials: 'IN',
    rating: 5,
    tags: ['Social posting', 'Campaign match', 'Workflow'],
  },
  {
    name: 'Musa Abdullahi',
    role: 'Operations Manager',
    business: 'Northern Gadgets',
    location: 'Kano',
    audience: 'store-owner',
    quote:
      'We needed a marketplace that understands products, promoters, and buyers together. MarketSpase gave us that structure without making the team technical.',
    outcome: 'Simpler promotion operations for a growing product catalog.',
    metric: '120+ tracked product clicks',
    avatarInitials: 'MA',
    rating: 5,
    tags: ['Product catalog', 'Promoters', 'Buyer insight'],
  },
];
