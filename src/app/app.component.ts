import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from '@core/services/theme.service';
import { VersionCheckService } from '@core/services/version-check.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet />

    <!-- Modal de Notificação de Nova Versão do Sistema -->
    <div 
      *ngIf="versionCheckService.showUpdateModal()" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      
      <div class="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6">
        
        <div class="flex items-center gap-3.5 mb-4">
          <div class="w-11 h-11 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 border border-brand-200 dark:border-brand-900 flex items-center justify-center shrink-0">
            <svg class="w-6 h-6 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Atualização do Sistema
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Uma nova versão do Barão foi publicada no servidor.
            </p>
          </div>
        </div>

        <div class="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 mb-5 flex items-center justify-between text-xs">
          <div>
            <span class="text-slate-400 dark:text-slate-500 block text-[11px] font-medium">Nova Versão</span>
            <span class="font-bold text-brand-600 dark:text-brand-400 text-sm">
              v{{ versionCheckService.latestVersion()?.version }}
            </span>
          </div>
          <div *ngIf="versionCheckService.latestVersion()?.updated_at" class="text-right">
            <span class="text-slate-400 dark:text-slate-500 block text-[11px] font-medium">Publicado em</span>
            <span class="font-medium text-slate-700 dark:text-slate-300">
              {{ versionCheckService.latestVersion()?.updated_at }}
            </span>
          </div>
        </div>

        <p class="text-xs text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
          Deseja atualizar a página agora para carregar as novas funcionalidades e correções?
        </p>

        <div class="flex items-center justify-end gap-2.5">
          <button 
            type="button" 
            (click)="versionCheckService.dismissUpdate()"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            Agora Não
          </button>
          <button 
            type="button" 
            (click)="versionCheckService.applyUpdate()"
            class="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/20 active:scale-95 transition-all flex items-center gap-1.5">
            <span>Atualizar Agora</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
  private themeService = inject(ThemeService);
  public versionCheckService = inject(VersionCheckService);

  ngOnInit(): void {
    // Inicializa o monitoramento automático de novas versões e sincronização multi-abas
    this.versionCheckService.init();
  }
}
