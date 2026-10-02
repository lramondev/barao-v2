import { Injectable, inject, signal, NgZone, effect } from '@angular/core';
import { Observable, Subject, filter, map } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '@env/environment';
import { AuthService } from './auth.service';

export type RealtimeConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export interface RealtimeEnvelope<T = any> {
  namespace: string;
  event: string;
  data: T;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class RealtimeService {
  private authService = inject(AuthService);
  private ngZone = inject(NgZone);

  // Status reativos do serviço
  public isConnected = signal<boolean>(false);
  public connectionStatus = signal<RealtimeConnectionStatus>('disconnected');
  public lastError = signal<string | null>(null);

  // Pool de sockets indexado por namespace (ex: '', 'veiculo', 'notification', 'chat')
  private sockets = new Map<string, Socket>();

  // Event bus local para simulações e roteamento interno reativo
  private localEventSubject$ = new Subject<RealtimeEnvelope>();

  constructor() {
    // Reage automaticamente às alterações de login / logout
    effect(() => {
      const user = this.authService.currentUser();
      if (user && user.id > 0) {
        this.reconnectAll();
      } else {
        this.disconnectAll();
      }
    });
  }

  /**
   * Obtém ou inicializa uma conexão com um namespace específico do Socket.IO
   */
  public getSocket(namespace: string = ''): Socket {
    const cleanNs = namespace.replace(/^\/+/, '');
    const key = cleanNs;

    if (this.sockets.has(key)) {
      const existing = this.sockets.get(key)!;
      if (!existing.connected && !existing.active) {
        existing.connect();
      }
      return existing;
    }

    const baseUrl = (environment.socket_url || 'https://dev.praetor.local:3000/').replace(/\/+$/, '');
    const fullUrl = cleanNs ? `${baseUrl}/${cleanNs}` : baseUrl;

    const user = this.authService.currentUser();
    const queryPayload: Record<string, any> = {};
    if (user) {
      queryPayload['user'] = JSON.stringify({
        id: user.id,
        name: user.name,
        email: user.email
      });
    }

    const socket = io(fullUrl, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      timeout: 10000,
      query: queryPayload
    });

    this.connectionStatus.set('connecting');

    socket.on('connect', () => {
      this.ngZone.run(() => {
        this.isConnected.set(true);
        this.connectionStatus.set('connected');
        this.lastError.set(null);
      });
    });

    socket.on('disconnect', (reason) => {
      this.ngZone.run(() => {
        this.isConnected.set(false);
        this.connectionStatus.set('disconnected');
      });
    });

    socket.on('connect_error', (err: any) => {
      this.ngZone.run(() => {
        this.isConnected.set(false);
        this.connectionStatus.set('error');
        this.lastError.set(err?.message || 'Falha na conexão com o servidor de tempo real');
      });
    });

    this.sockets.set(key, socket);
    return socket;
  }

  /**
   * Escuta eventos do socket ou do barramento simulado como Observable RxJS
   */
  public fromEvent<T = any>(namespace: string, eventName: string): Observable<T> {
    const socket = this.getSocket(namespace);

    const socketObservable = new Observable<T>((subscriber) => {
      const handler = (data: any) => {
        this.ngZone.run(() => {
          subscriber.next(data);
        });
      };

      socket.on(eventName, handler);

      return () => {
        socket.off(eventName, handler);
      };
    });

    // Combina eventos reais do socket com eventos injetados no barramento local
    const localObservable = this.localEventSubject$.pipe(
      filter(e => e.namespace === namespace && e.event === eventName),
      map(e => e.data as T)
    );

    return new Observable<T>((subscriber) => {
      const sub1 = socketObservable.subscribe(subscriber);
      const sub2 = localObservable.subscribe(subscriber);

      return () => {
        sub1.unsubscribe();
        sub2.unsubscribe();
      };
    });
  }

  /**
   * Emite um evento para o servidor Socket.IO
   */
  public emit(namespace: string, eventName: string, data: any): void {
    const socket = this.getSocket(namespace);
    socket.emit(eventName, data);
  }

  /**
   * Simula um evento em tempo real no cliente (ótimo para testes, demonstrações ou fallbacks)
   */
  public simulateEvent<T = any>(namespace: string, eventName: string, data: T): void {
    this.localEventSubject$.next({
      namespace,
      event: eventName,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Reconecta todos os sockets registrados com os dados de autenticação atualizados
   */
  public reconnectAll(): void {
    const user = this.authService.currentUser();
    const queryUser = user ? JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email
    }) : '';

    this.sockets.forEach((socket) => {
      if (socket.io && socket.io.opts) {
        socket.io.opts.query = { user: queryUser };
      }
      if (!socket.connected) {
        socket.connect();
      }
    });
  }

  /**
   * Desconecta todos os sockets
   */
  public disconnectAll(): void {
    this.sockets.forEach((socket) => {
      socket.disconnect();
    });
    this.sockets.clear();
    this.isConnected.set(false);
    this.connectionStatus.set('disconnected');
  }
}
