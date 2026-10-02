import { Injectable, inject, signal, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '@env/environment';

export interface VersionInfo {
  version: string;
  updated_at?: string;
  timestamp?: number;
}

interface VersionChannelMessage {
  action: 'UPDATE_DETECTED' | 'UPDATE_APPLIED';
  info: VersionInfo;
  senderId: string;
}

@Injectable({
  providedIn: 'root'
})
export class VersionCheckService {
  private router = inject(Router);
  private ngZone = inject(NgZone);

  // Sinais reativos de estado da versão
  public currentVersion = signal<string>('');
  public currentUpdatedAt = signal<string>('');
  public latestVersion = signal<VersionInfo | null>(null);
  public isUpdateAvailable = signal<boolean>(false);
  public showUpdateModal = signal<boolean>(false);

  private isInitialized = false;
  private lastCheckTime = 0;
  private intervalTimer: any = null;
  private checkIntervalMs = 2 * 60 * 1000; // 2 minutos

  // BroadcastChannel para sincronização multi-abas no navegador
  private channel: BroadcastChannel | null = null;
  private tabId = Math.random().toString(36).substring(2, 9);

  constructor() {
    this.currentVersion.set(this.getCurrentVersion());
    this.currentUpdatedAt.set(this.getCurrentUpdatedAt());
  }

  /**
   * Obtém a versão atual em execução considerando index.html e localStorage
   */
  public getCurrentVersion(): string {
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const buildVersion = win.__APP_VERSION__ || environment.version || '0.1.0';

    if (typeof localStorage !== 'undefined') {
      const storedVersion = localStorage.getItem('barao_app_version');
      if (storedVersion && this.isNewerVersion(storedVersion, buildVersion)) {
        return storedVersion;
      }
    }
    return buildVersion;
  }

  /**
   * Obtém a data/hora do build em execução
   */
  public getCurrentUpdatedAt(): string {
    const win = typeof window !== 'undefined' ? (window as any) : {};
    const buildDate = win.__APP_UPDATED_AT__ || (environment as any).updated_at || '';
    if (typeof localStorage !== 'undefined') {
      const storedDate = localStorage.getItem('barao_app_updated_at');
      if (storedDate) return storedDate;
    }
    return buildDate;
  }

  /**
   * Compara semanticamente se remoteVersion é estritamente maior que currentVersion
   */
  public isNewerVersion(remote: string, current: string): boolean {
    if (!remote || !current) return false;
    const cleanRemote = String(remote).replace(/^v/i, '').trim();
    const cleanCurrent = String(current).replace(/^v/i, '').trim();

    if (cleanRemote === cleanCurrent) return false;

    const r = cleanRemote.split('.').map(n => parseInt(n, 10) || 0);
    const c = cleanCurrent.split('.').map(n => parseInt(n, 10) || 0);
    const len = Math.max(r.length, c.length);

    for (let i = 0; i < len; i++) {
      const rv = r[i] || 0;
      const cv = c[i] || 0;
      if (rv > cv) return true;
      if (rv < cv) return false;
    }
    return false;
  }

  /**
   * Verifica se o usuário dispensou o aviso nesta sessão para esta versão
   */
  private isDismissedForSession(version: string): boolean {
    if (typeof sessionStorage === 'undefined') return false;
    const dismissed = sessionStorage.getItem('barao_dismissed_version');
    if (!dismissed) return false;
    return !this.isNewerVersion(version, dismissed);
  }

  /**
   * Inicializa o monitoramento automático de novas versões e o canal multi-abas
   */
  public init(intervalMinutes: number = 2): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    this.checkIntervalMs = Math.max(1, intervalMinutes) * 60 * 1000;

    // Remove cache-busting _v= da URL para manter a URL limpa
    if (typeof window !== 'undefined' && window.location.search.includes('_v=')) {
      try {
        const cleanUrl = window.location.href.replace(/([?&])_v=\d+(&|$)/, '$1').replace(/[?&]$/, '');
        window.history.replaceState({}, document.title, cleanUrl);
      } catch (e) {}
    }

    // 1. Canal BroadcastChannel multi-abas
    this.initBroadcastChannel();

    // 2. Verificação inicial após 8 segundos de carregamento
    setTimeout(() => {
      this.checkVersion();
    }, 8000);

    // 3. Polling periódico fora da zone do Angular
    this.ngZone.runOutsideAngular(() => {
      this.intervalTimer = setInterval(() => {
        this.ngZone.run(() => this.checkVersion());
      }, this.checkIntervalMs);
    });

    // 4. Verificação ao retornar o foco à aba (com throttle de 30s)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        if (Date.now() - this.lastCheckTime > 30000) {
          this.checkVersion();
        }
      });

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible' && Date.now() - this.lastCheckTime > 30000) {
            this.checkVersion();
          }
        });
      }

      // 5. Captura erros de Lazy Loading de chunks quando uma nova versão substitui os hashes
      window.addEventListener('error', (event) => {
        const errorMsg = event?.message || '';
        if (/Loading chunk [\d\w_-]+ failed/i.test(errorMsg) || /Failed to fetch dynamically imported module/i.test(errorMsg)) {
          console.warn('[VersionCheck] Erro de chunk detectado. Nova versão provável:', errorMsg);
          this.checkVersion(true);
        }
      });

      window.addEventListener('unhandledrejection', (event) => {
        const reasonMsg = event?.reason?.message || event?.reason || '';
        if (typeof reasonMsg === 'string' && (/Loading chunk [\d\w_-]+ failed/i.test(reasonMsg) || /Failed to fetch dynamically imported module/i.test(reasonMsg))) {
          console.warn('[VersionCheck] Rejeição de chunk detectada:', reasonMsg);
          this.checkVersion(true);
        }
      });
    }

    // 6. Verificação durante navegação de rotas (com throttle de 60s)
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        if (Date.now() - this.lastCheckTime > 60000) {
          this.checkVersion();
        }
      });
  }

  /**
   * Configura o BroadcastChannel para sincronizar abas do navegador
   */
  private initBroadcastChannel(): void {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    try {
      this.channel = new BroadcastChannel('barao_version_channel');
      this.channel.onmessage = (event: MessageEvent<VersionChannelMessage>) => {
        const data = event.data;
        if (!data || data.senderId === this.tabId) return;

        if (data.action === 'UPDATE_DETECTED' && data.info) {
          const remoteVersion = String(data.info.version).trim();
          const current = this.getCurrentVersion();

          if (this.isNewerVersion(remoteVersion, current)) {
            if (this.isDismissedForSession(remoteVersion)) return;

            this.isUpdateAvailable.set(true);
            this.latestVersion.set(data.info);
            this.showUpdateModal.set(true);
          }
        }

        if (data.action === 'UPDATE_APPLIED' && data.info) {
          const appliedVersion = String(data.info.version).trim();
          const current = this.getCurrentVersion();

          if (this.isNewerVersion(appliedVersion, current)) {
            this.isUpdateAvailable.set(true);
            this.latestVersion.set(data.info);
            this.showUpdateModal.set(true);
          }
        }
      };
    } catch (e) {
      console.warn('[VersionCheck] BroadcastChannel indisponível:', e);
    }
  }

  private broadcast(action: 'UPDATE_DETECTED' | 'UPDATE_APPLIED', info: VersionInfo): void {
    if (!this.channel) return;
    try {
      this.channel.postMessage({
        action,
        info,
        senderId: this.tabId
      });
    } catch (e) {}
  }

  /**
   * Checa se há uma nova versão no servidor consultando version.json
   */
  public async checkVersion(forcePrompt: boolean = false): Promise<boolean> {
    this.lastCheckTime = Date.now();

    try {
      // version.json com cache-busting
      const response = await fetch(`version.json?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });

      if (!response.ok) return false;

      const remoteInfo: VersionInfo = await response.json();
      if (!remoteInfo || !remoteInfo.version) return false;

      const remoteVersion = String(remoteInfo.version).trim();
      const current = this.getCurrentVersion();

      if (this.isNewerVersion(remoteVersion, current)) {
        this.isUpdateAvailable.set(true);
        this.latestVersion.set(remoteInfo);

        this.broadcast('UPDATE_DETECTED', remoteInfo);

        if (!forcePrompt && this.isDismissedForSession(remoteVersion)) {
          return true;
        }

        this.showUpdateModal.set(true);
        return true;
      } else {
        this.currentVersion.set(remoteVersion);
        if (remoteInfo.updated_at) {
          this.currentUpdatedAt.set(remoteInfo.updated_at);
        }
        this.isUpdateAvailable.set(false);

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('barao_app_version', remoteVersion);
          if (remoteInfo.updated_at) {
            localStorage.setItem('barao_app_updated_at', remoteInfo.updated_at);
          }
        }
      }
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Fecha o modal de atualização temporariamente nesta sessão
   */
  public dismissUpdate(): void {
    this.showUpdateModal.set(false);
    const ver = this.latestVersion()?.version;
    if (ver && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('barao_dismissed_version', ver);
    }
  }

  /**
   * Aplica a atualização: limpa caches e recarrega a página
   */
  public applyUpdate(): void {
    const versionToBroadcast = this.latestVersion() || { version: this.currentVersion() };

    if (typeof localStorage !== 'undefined' && versionToBroadcast.version) {
      localStorage.setItem('barao_app_version', versionToBroadcast.version);
      if (versionToBroadcast.updated_at) {
        localStorage.setItem('barao_app_updated_at', versionToBroadcast.updated_at);
      }
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('barao_dismissed_version');
    }

    this.showUpdateModal.set(false);
    this.broadcast('UPDATE_APPLIED', versionToBroadcast);

    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.keys().then((names) => {
          return Promise.all(names.map((name) => caches.delete(name)));
        }).catch(() => {}).finally(() => {
          this.reloadPage();
        });
      } else {
        this.reloadPage();
      }
    } catch (e) {
      this.reloadPage();
    }
  }

  private reloadPage(): void {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('_v', String(Date.now()));
      window.location.href = url.toString();
    } catch (e) {
      window.location.reload();
    }
  }

  public destroy(): void {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.channel) {
      try {
        this.channel.close();
      } catch (e) {}
      this.channel = null;
    }
    this.isInitialized = false;
  }
}
