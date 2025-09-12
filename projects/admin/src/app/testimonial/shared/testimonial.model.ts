export interface Testimonial {
  _id: string;
  user: {
    _id: string;
    name: string;
    username: string;
    avatar: string;
  };
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  likes: number;
  dislikes: number;
  rating: number;
  isFeatured: boolean;
  reactions: {
    userId: string;
    reaction: 'like' | 'dislike';
    createdAt: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}