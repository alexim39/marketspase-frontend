export interface NavigationItem {
  icon: string;
  label: string;
  route?: string;
  expanded?: boolean;
  badge?: number;
  badgeColor?: 'primary' | 'accent' | 'warn';
  modalAction?: string;
  children?: NavigationItem[];
}
