import { PromotionInterface } from "../public-api";
import { CampaignInterface } from "./campaign.interface";

export interface UserInterface {
  _id: string;
  uid: string;
  status: boolean;
  displayName: string;
  email: string;
  username: string;
  biography?: string;
  role: string;
  avatar?: string;
  createdAt?: Date;
  preferences?: {
    notification?: boolean;
    locationBasedAds?: boolean;
    categoryBasedAds?: boolean;
    adCategories?: string[];
  };
  darkMode?: boolean;
  testimonial?: {
    message?: string;
  };
  dob?: Date;
  isActive?: boolean;
  verified?: boolean;
  isDeleted?: boolean;
  rating: number;
  ratingCount: number;
  authenticationMethod: string;
  updatedAt?: Date;
  personalInfo: {
    address: {
      street: string;
      city: string;
      state: string;
      country: string;
    }
    email: string;
    phone: string;
    dob: Date;
    biography: string;
    gender: string;
  };
  professionalInfo?: {
    skills?: string[];
    jobTitle: string;
    experience: {
      company: string;
      startDate: Date;
      endDate: Date;
      description: string;
      current: boolean;
    };
    education?: {
      institution: string;
      certificate: string;
      fieldOfStudy: string;
      startDate: Date;
      endDate: Date;
      description: string;
    };
  };
  interests?: {
    hobbies?: string[];
    favoriteTopics?: string[];
  };
  savedAccounts?: {
    _id: string;
    bank: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
  }[];
  wallets?: {
    marketer: {
      balance: number;
      reserved: number;
      transactions: {
        amount: number;
        category: string;
        createdAt: Date;
        description: string;
        status: string;
        type: string;
      }[];
    };
    promoter: {
      balance: number;
      reserved: number;
      transactions: {
        amount: number;
        category: string;
        createdAt: Date;
        description: string;
        status: string;
        type: string;
      }[];
    };

    //ratingCount: number;
   
  };
  campaigns?: [CampaignInterface];
  promotion?: [PromotionInterface];
}