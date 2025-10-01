/**
 * Returns a human-readable "time ago" string for a given date string.
 * Example: "7 years ago", "2 days ago", "Just now"
 */
export function timeAgo(dateStr: string | Date): string {
  const date = new Date(dateStr);
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  const intervals: { [key: string]: number } = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval === 1 ? '' : 's'} ago`;
    }
  }

  return 'Just now';
}


// Utility functions (can be placed here or in a separate file)
export function isDatePast(date: Date): boolean {
  const now = new Date();
  return date.getTime() < now.getTime();
}

export function formatRemainingDays(endDate: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  const timeDifferenceMs = endDate.getTime() - today.getTime();
  const oneDayInMs = 1000 * 60 * 60 * 24;
  const daysDifference = Math.ceil(timeDifferenceMs / oneDayInMs);

  if (daysDifference === 1) {
    return '1 day';
  } else {
    return `${daysDifference} days`;
  }
}

export interface CampaignStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalSpent: number;
  totalViews: number;
  avgCTR: number;
  totalPromoters: number;
}