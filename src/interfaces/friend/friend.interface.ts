export type RelationshipStatus = 'none' | 'friend' | 'pending_sent' | 'pending_received';

export interface IFriendUser {
  _id: string;
  userId?: string;
  username: string;
  fullName?: string;
  avatar?: string;
  email?: string;
  phone?: string | number | null;
  gender?: string;
  address?: string;
  isOnline?: boolean;
  relationshipStatus?: RelationshipStatus;
  bio?: string;
}

export interface IFriendRequest {
  _id: string;
  fromUser: IFriendUser;
  toUser: IFriendUser;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt?: string;
}

export interface ISendFriendRequestPayload {
  targetUserId: string;
  message?: string;
}

export interface IFriendActionResponse {
  success: boolean;
  message?: string;
  data?: any;
}
