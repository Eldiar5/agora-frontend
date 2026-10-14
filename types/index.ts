// TypeScript interfaces based on backend JSON responses

export interface Comment {
  id: number
  text: string
  postId: number
  authorLogin: string
  authorAvatarUrl?: string
  createdAt: string
}

export interface Post {
  postId: number
  authorLogin: string
  authorAvatarUrl?: string

  topic: string
  text: string
  imageUrl?: string
  tags: string[]
  likesCount: number
  isLiked: boolean
  comments: Comment[]
  createdAt: string
}

export interface Notification {
  id: number;
  type: "LIKE" | "COMMENT" | "SYSTEM";
  message: string;
  senderLogin: string;
  senderAvatarUrl?: string;
  targetId: number | null;
  read: boolean;
  timestamp: string; // LocalDateTime приходит как строка
}

export interface User {
  login: string
  token: string
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface LoginResponse {
  token: TokenResponse;
  login: string;
}

export interface CreateCommentDTO {
  text: string
  postId: number
}