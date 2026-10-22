export interface IAuthLogin {
  email: string;
  password: string;
}

export interface IAuthRegister {
  username: string;
  password: string;
  email?: string;
  phoneNumber?: string;
  gender: string;
}

export interface IUser {
  _id?: string;
  userId?: string;
  username: string;
  email?: string;
  fullName?: string;
  avatar?: string;
  gender?: string;
  role?: string;
  createdAt?: string;
}

export interface IAuthResponse {
  message?: string;
  statusCode?: number;
  success?: boolean;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    user?: IUser;
  };
}

