import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { StorageService } from '@core/services/storage.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors">
      <!-- Navbar Superior -->
      <header class="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between shadow-sm">
        <div class="flex items-center gap-3">
          <img src="assets/system/img/barao.png" alt="Barão" class="h-8 object-contain">
          <div>
            <h1 class="text-lg font-bold leading-tight text-slate-900 dark:text-white">Barão v2</h1>
            <p class="text-xs text-brand-600 dark:text-brand-400 font-medium">Ambiente V2 Conectado</p>
          </div>
        </div>

        <div class="flex items-center gap-4">
          <!-- Botão Modo Noturno -->
          <button 
            (click)="themeService.toggleTheme()" 
            type="button"
            class="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors"
            title="Alternar tema">
            <span *ngIf="!themeService.isDark()">🌙</span>
            <span *ngIf="themeService.isDark()">☀️</span>
          </button>

          <!-- Perfil do Usuário -->
          <div class="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
            <img 
              [src]="user?.avatar_url || 'assets/system/img/no-image.png'" 
              alt="Avatar" 
              class="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700">
            <div class="hidden sm:block text-left">
              <div class="text-sm font-semibold text-slate-900 dark:text-white leading-none mb-1">{{ user?.name }}</div>
              <div class="text-xs text-slate-400 leading-none">{{ user?.email }}</div>
            </div>
            <button 
              (click)="logout()" 
              class="ml-2 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors">
              Sair
            </button>
          </div>
        </div>
      </header>

      <!-- Conteúdo de Boas-Vindas -->
      <main class="max-w-6xl mx-auto p-6 sm:p-8">
        <div class="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 mb-4">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            Autenticado via API REST do Barão
          </div>

          <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Olá, {{ user?.name }}! 👋
          </h2>
          <p class="text-slate-600 dark:text-slate-400 max-w-2xl text-sm leading-relaxed mb-6">
            A autenticação com o backend foi realizada com sucesso! O token JWT foi registrado e a sessão é 100% compatível com a V1 legada.
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Empresa Ativa</span>
              <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ empresaAtivaNome }}</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Perfil</span>
              <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">{{ user?.admin ? 'Administrador' : 'Usuário Padrão' }}</span>
            </div>
            <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Frontend Stack</span>
              <span class="text-sm font-semibold text-slate-800 dark:text-slate-200">Angular 19 + Tailwind</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  `
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  public themeService = inject(ThemeService);

  get user() {
    return this.authService.currentUser();
  }

  get empresaAtivaNome(): string {
    const empresas = this.storageService.getEmpresaAtiva();
    if (empresas.length > 0) {
      return empresas[0].apelido_fantasia || empresas[0].nome_razao_social || 'Empresa #' + empresas[0].id;
    }
    return 'Nenhuma selecionada';
  }

  logout(): void {
    this.authService.logout();
  }
}
