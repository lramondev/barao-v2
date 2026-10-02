import { Empresa } from './empresa.model';

export interface UserSettings {
  theme?: string;
  dark?: boolean;
  task_layout?: 'chat' | 'tabulation';
  [key: string]: any;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;
  admin?: boolean;
  token?: string;
  empresa?: Empresa[] | Empresa;
  empresas?: Empresa[];
  settings?: UserSettings;
  last_password_change?: string | null;
}
