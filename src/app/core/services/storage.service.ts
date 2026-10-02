import { Injectable } from '@angular/core';
import { User } from '../models/user.model';
import { Empresa } from '../models/empresa.model';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly APP_KEY = 'app';
  private readonly EMPRESA_ATIVA_KEY = 'empresa_ativa';
  private readonly LAST_USER_KEY = 'praetor_last_user';

  getApp(): any {
    try {
      const data = localStorage.getItem(this.APP_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setApp(appData: any): void {
    try {
      localStorage.setItem(this.APP_KEY, JSON.stringify(appData));
    } catch (e) {
      console.error('Falha ao salvar app no storage', e);
    }
  }

  getToken(): string {
    const app = this.getApp();
    return app?.user?.token || '';
  }

  getCurrentUser(): User | null {
    const app = this.getApp();
    return app?.user || null;
  }

  getEmpresaAtiva(): Empresa[] {
    try {
      const session = sessionStorage.getItem(this.EMPRESA_ATIVA_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        return Array.isArray(parsed) ? parsed : [parsed];
      }
      const app = this.getApp();
      if (app?.user?.empresa) {
        return Array.isArray(app.user.empresa) ? app.user.empresa : [app.user.empresa];
      }
    } catch {
      // fallback
    }
    return [];
  }

  setEmpresaAtiva(empresa: Empresa | Empresa[]): void {
    const list = Array.isArray(empresa) ? empresa : [empresa];
    sessionStorage.setItem(this.EMPRESA_ATIVA_KEY, JSON.stringify(list));
  }

  getLastKnownUser(): { name: string; email: string; avatar_url?: string; admin?: boolean } | null {
    try {
      const data = localStorage.getItem(this.LAST_USER_KEY);
      if (data) return JSON.parse(data);

      // Fallback para usuário salvo no app da V1
      const app = this.getApp();
      if (app?.user?.email) {
        return {
          name: app.user.name || 'Usuário',
          email: app.user.email,
          avatar_url: app.user.avatar_url,
          admin: app.user.admin
        };
      }
    } catch {
      return null;
    }
    return null;
  }

  setLastKnownUser(user: Partial<User>): void {
    if (!user || !user.email) return;
    try {
      localStorage.setItem(this.LAST_USER_KEY, JSON.stringify({
        name: user.name || '',
        email: user.email,
        avatar_url: user.avatar_url || '',
        admin: !!user.admin
      }));
    } catch (e) {
      console.error('Falha ao salvar último usuário', e);
    }
  }

  clearSession(): void {
    const app = this.getApp() || {};
    if (app.user) {
      app.user.id = 0;
      app.user.token = '';
      this.setApp(app);
    }
    sessionStorage.removeItem(this.EMPRESA_ATIVA_KEY);
    sessionStorage.removeItem('tab_active');
  }
}
