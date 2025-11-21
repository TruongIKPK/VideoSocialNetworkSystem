export interface User {
  _id: string;
  name: string;
  avatar: string;
}

export interface VideoPost {
  _id: string;
  url: string;
  thumbnail: string;
  title: string;
  description?: string;
  user: User;
  likes?: number;
  likesCount?: number;
  likedBy: string[];
  comments?: number;
  commentsCount?: number;
  shares?: number;
  saves?: number;
  savesCount?: number;
  views?: number;
  viewedBy?: string[];
  savedBy?: string[];
  hashtags?: string[];
  createdAt: string;
  updatedAt?: string;
  __v?: number;
  isFollowing?: boolean;
}

