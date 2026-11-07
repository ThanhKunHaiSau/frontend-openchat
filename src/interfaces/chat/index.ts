export interface IChatUser {
  _id: string;
  username: string;
  fullName?: string;
  avatar?: string;
  gender?: string;
  phone?: string;
  address?: string;
  isOnline?: boolean;
}

export interface IChatLastMessage {
  messageId?: string;
  senderId?: IChatUser | string;
  content: string;
  type?: 'text' | 'image' | 'file' | 'sticker';
  createdAt: string;
}

export interface IChatConversation {
  _id: string;
  name?: string;
  avatar?: string;
  type: 'direct' | 'group';
  theme?: string | null;
  background?: {
    url?: string | null;
    gradient?: string | null;
  };
  participants: IChatUser[];
  creatorId?: string;
  lastMessage?: IChatLastMessage;
  unreadCounts?: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface IChatMessageFile {
  url: string;
  fileName?: string;
  fileSize?: number;
  contentType?: string;
}

export interface IChatReadBy {
  userId: string | IChatUser;
  readAt: string;
}

export interface IChatMessage {
  _id: string;
  conversationId: string;
  senderId: IChatUser;
  receiverId?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'sticker';
  file?: IChatMessageFile;
  status: 'sent' | 'delivered' | 'read';
  readBy?: IChatReadBy[];
  replyTo?: IChatMessage | null;
  createdAt: string;
  updatedAt: string;
}

export interface IGetMessagesResponse {
  messages: IChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPage: number;
}

