import { Observable } from 'rxjs';

export type ColumnAlign = 'left' | 'center' | 'right';

export type ColumnType = 
  | 'text' 
  | 'number' 
  | 'currency' 
  | 'date' 
  | 'datetime' 
  | 'badge' 
  | 'boolean'
  | 'custom';

export type BadgeColor = 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'slate' | 'emerald' | 'amber' | 'indigo';

export interface ColumnBadgeConfig<T = any> {
  label: string;
  color?: BadgeColor;
}

export interface ColumnDef<T = any> {
  field: string;
  header: string;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: ColumnAlign;
  type?: ColumnType;
  visible?: boolean;
  formatter?: (value: any, row: T) => string;
  badgeConfig?: (value: any, row: T) => ColumnBadgeConfig<T>;
}

export type ActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';

export interface DatatableAction<T = any> {
  id: string | number;
  label: string;
  icon?: string;
  variant?: ActionVariant;
  single?: boolean; // Habilitado apenas com exatamente 1 item selecionado
  multi?: boolean;  // Habilitado com 1 ou mais itens selecionados
  fixed?: boolean;  // Sempre visível na barra de ferramentas
  disabled?: (selected: T[]) => boolean;
  execute?: (selected: T[]) => void;
}

export interface DatatableSort {
  field: string;
  direction: 'asc' | 'desc' | '';
}

export interface DatatablePageEvent {
  pageIndex: number;
  pageSize: number;
}

export interface DatatableApiParams {
  page: number;
  pageSize: number;
  search?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc' | '';
  [key: string]: any;
}

export interface DatatableApiResponse<T = any> {
  data: T[];
  total: number;
}

export interface DatatableApiConfig<T = any> {
  endpoint?: string;
  dataPath?: string; // Padrão: 'data' ou se a resposta for um array direto
  totalPath?: string; // Padrão: 'total' ou 'count'
  extraParams?: Record<string, any>;
  loadFn?: (params: DatatableApiParams) => Observable<DatatableApiResponse<T> | T[]>;
}

export type RealtimeMode = 'merge' | 'notify' | 'reload';

export interface DatatableRealtimeEvent<T = any> {
  action?: 'insert' | 'update' | 'delete' | 'upsert';
  data: T | T[];
  timestamp?: string;
}

export interface DatatableRealtimeConfig<T = any> {
  channel: string; // Ex: 'veiculo', 'cargas', 'notificacao'
  event?: string; // Ex: 'veiculo', 'status_changed', etc. Se omitido, usa o próprio channel
  mode?: RealtimeMode; // 'merge' (padrão), 'notify' ou 'reload'
  trackByKey?: string; // Campo identificador da linha (padrão usa o trackByKey da tabela)
  highlightOnUpdate?: boolean; // Se true, pisca a linha atualizada (padrão: true)
  stream$?: Observable<any>; // Stream RxJS opcional direto
  customHandler?: (eventData: any, currentRows: T[]) => T[];
}

