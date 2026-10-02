import { Injectable, computed, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, map, catchError, throwError } from 'rxjs';
import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { User } from '../models/user.model';
import { ApiResponse, LoginCredentials } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public currentUser = signal<User | null>(null);
  public isAuthenticated = computed(() => {
    const user = this.currentUser();
    return !!(user && user.id > 0 && user.token);
  });

  constructor(
    private api: ApiService,
    private storage: StorageService,
    private router: Router
  ) {
    this.initUser();
  }

  private initUser(): void {
    const user = this.storage.getCurrentUser();
    if (user && user.id > 0 && user.token) {
      this.currentUser.set(user);
    }
  }

  login(credentials: LoginCredentials): Observable<User> {
    return this.api.post<ApiResponse<User>[] | ApiResponse<User>>('auth/login', credentials).pipe(
      map(response => {
        // O backend do Barão retorna um array com [{ status, data: User }]
        let user: User;
        if (Array.isArray(response)) {
          user = response[0].data;
        } else {
          user = response.data;
        }

        if (!user || !user.token) {
          throw new Error('Falha ao processar credenciais.');
        }

        // Se empresas estiver configurado, define empresa ativa inicial
        if (user.empresas && user.empresas.length > 0 && (!user.empresa || (Array.isArray(user.empresa) && user.empresa.length === 0))) {
          const savedEmpresa = this.storage.getEmpresaAtiva();
          if (savedEmpresa && savedEmpresa.length > 0) {
            user.empresa = savedEmpresa;
          } else {
            user.empresa = [user.empresas[0]];
          }
        }

        // Salva na estrutura compatível com a V1
        const app = this.storage.getApp() || {};
        app.user = user;
        this.storage.setApp(app);

        // Salva último usuário para tela de boas-vindas
        this.storage.setLastKnownUser(user);

        // Atualiza sinal de estado
        this.currentUser.set(user);

        return user;
      }),
      catchError(err => {
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.storage.clearSession();
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
