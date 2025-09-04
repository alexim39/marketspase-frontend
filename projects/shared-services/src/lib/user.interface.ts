export interface UserInterface {
  _id: string;
  uid: string;
  username: string;
  displayName: string;
  email: string;
  role: 'advertiser' | 'promoter';
  avatar: string;
  rating: number;
  ratingCount: number;
  isActive: boolean;
  isVerified: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  wallets: {
    advertiser: {
      balance: number;
      reserved: number;
    };
    promoter: {
      balance: number;
      reserved: number;
    };
  };
}