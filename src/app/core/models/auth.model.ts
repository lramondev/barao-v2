import { User } from './user.model';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiResponse<T = any> {
  status: string | boolean;
  message?: string;
  data: T;
}
