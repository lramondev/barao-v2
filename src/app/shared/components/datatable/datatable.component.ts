import { 
  Component, 
  OnInit, 
  OnChanges,
  SimpleChanges, 
  input, 
  output, 
  signal, 
  computed, 
  inject, 
  effect,
  TemplateRef,
  ContentChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@core/services/api.service';
import { 
  ColumnDef, 
  DatatableAction, 
  DatatableApiConfig, 
  DatatableSort, 
  DatatablePageEvent,
  DatatableApiParams,
  BadgeColor
} from './datatable.types';

@Component({
  selector: 'app-datatable',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './datatable.component.html',
  styleUrls: ['./datatable.component.scss']
})
export class DatatableComponent<T extends Record<string, any> = any> implements OnInit, OnChanges {
  private apiService = inject(ApiService);

  // Inputs
  public data = input<T[]>([]);
  public columns = input.required<ColumnDef<T>[]>();
  public actions = input<DatatableAction<T>[]>([]);
  public apiConfig = input<DatatableApiConfig<T>>();
  public selectable = input<boolean>(true);
  public multiSelect = input<boolean>(true);
  public searchable = input<boolean>(true);
  public searchPlaceholder = input<string>('Pesquisar...');
  public pageSize = input<number>(20);
  public pageSizeOptions = input<number[]>([10, 20, 50, 100]);
  public emptyMessage = input<string>('Nenhum registro encontrado.');
  public title = input<string>('');
  public subtitle = input<string>('');
  public exportable = input<boolean>(true);
  public trackByKey = input<string>('id');

  // Custom template child if parent wants completely custom column rendering
  @ContentChild('customCell') customCellTemplate?: TemplateRef<any>;

  // Outputs
  public rowClick = output<T>();
  public rowDblClick = output<T>();
  public selectionChange = output<T[]>();
  public actionClick = output<{ action: DatatableAction<T>; selected: T[] }>();
  public sortChange = output<DatatableSort>();
  public pageChange = output<DatatablePageEvent>();

  // State Signals
  public searchQuery = signal<string>('');
  public currentPage = signal<number>(1);
  public currentPageSize = signal<number>(20);
  public currentSort = signal<DatatableSort>({ field: '', direction: '' });
  public selectedMap = signal<Map<any, T>>(new Map());
  public isLoading = signal<boolean>(false);
  public columnVisibility = signal<Record<string, boolean>>({});
  public columnMenuOpen = signal<boolean>(false);
  public actionsMenuOpen = signal<boolean>(false);

  // API State
  public apiRows = signal<T[]>([]);
  public apiTotal = signal<number>(0);

  // Computed: Columns currently visible
  public activeColumns = computed(() => {
    const cols = this.columns();
    const vis = this.columnVisibility();
    return cols.filter(c => vis[c.field] !== false);
  });

  // Computed: Selected array
  public selectedRows = computed(() => {
    return Array.from(this.selectedMap().values());
  });

  // Computed: Static processed rows (filter + sort + paginate)
  public processedStaticRows = computed(() => {
    let rows = [...(this.data() || [])];
    const query = this.searchQuery().trim().toLowerCase();
    const sort = this.currentSort();

    // 1. Filtro de pesquisa
    if (query) {
      rows = rows.filter(row => {
        return Object.values(row).some(val => {
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(query);
        });
      });
    }

    // 2. Ordenação
    if (sort.field && sort.direction) {
      const field = sort.field;
      const dir = sort.direction === 'asc' ? 1 : -1;

      rows.sort((a, b) => {
        const valA = a[field];
        const valB = b[field];

        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (typeof valA === 'number' && typeof valB === 'number') {
          return (valA - valB) * dir;
        }

        return String(valA).localeCompare(String(valB), 'pt-BR', { numeric: true, sensitivity: 'base' }) * dir;
      });
    }

    return rows;
  });

  // Computed: Displayed rows on the current page
  public displayedRows = computed(() => {
    if (this.apiConfig()) {
      return this.apiRows();
    }

    const staticRows = this.processedStaticRows();
    const page = this.currentPage();
    const size = this.currentPageSize();
    const startIndex = (page - 1) * size;
    return staticRows.slice(startIndex, startIndex + size);
  });

  // Computed: Total rows count
  public totalRecords = computed(() => {
    if (this.apiConfig()) {
      return this.apiTotal();
    }
    return this.processedStaticRows().length;
  });

  // Computed: Total pages count
  public totalPages = computed(() => {
    const total = this.totalRecords();
    const size = this.currentPageSize();
    return Math.max(1, Math.ceil(total / size));
  });

  // Computed: Checkbox header status
  public isAllSelected = computed(() => {
    const currentRows = this.displayedRows();
    if (currentRows.length === 0) return false;
    const map = this.selectedMap();
    return currentRows.every(r => map.has(this.getRowKey(r)));
  });

  public isSomeSelected = computed(() => {
    const currentRows = this.displayedRows();
    const map = this.selectedMap();
    const selectedCount = currentRows.filter(r => map.has(this.getRowKey(r))).length;
    return selectedCount > 0 && selectedCount < currentRows.length;
  });

  ngOnInit(): void {
    this.currentPageSize.set(this.pageSize());
    this.initColumnVisibility();

    if (this.apiConfig()) {
      this.loadApiData();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['columns'] && !changes['columns'].firstChange) {
      this.initColumnVisibility();
    }
    if (changes['pageSize'] && !changes['pageSize'].firstChange) {
      this.currentPageSize.set(this.pageSize());
    }
  }

  private initColumnVisibility(): void {
    const map: Record<string, boolean> = {};
    for (const col of this.columns()) {
      map[col.field] = col.visible !== false;
    }
    this.columnVisibility.set(map);
  }

  public getRowKey(row: T): any {
    const key = this.trackByKey();
    return row[key] !== undefined ? row[key] : row;
  }

  // --- API Fetching ---
  public loadApiData(): void {
    const config = this.apiConfig();
    if (!config) return;

    this.isLoading.set(true);

    const params: DatatableApiParams = {
      page: this.currentPage(),
      pageSize: this.currentPageSize(),
      search: this.searchQuery() || undefined,
      sortField: this.currentSort().field || undefined,
      sortOrder: this.currentSort().direction || undefined,
      ...(config.extraParams || {})
    };

    if (config.loadFn) {
      config.loadFn(params).subscribe({
        next: (res) => {
          this.handleApiResponse(res, config);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar dados do Datatable via loadFn:', err);
          this.isLoading.set(false);
        }
      });
    } else if (config.endpoint) {
      this.apiService.get<any>(config.endpoint, params).subscribe({
        next: (res) => {
          this.handleApiResponse(res, config);
          this.isLoading.set(false);
        },
        error: (err) => {
          console.error('Erro ao carregar dados do Datatable via endpoint:', err);
          this.isLoading.set(false);
        }
      });
    }
  }

  private handleApiResponse(res: any, config: DatatableApiConfig<T>): void {
    if (Array.isArray(res)) {
      this.apiRows.set(res);
      this.apiTotal.set(res.length);
      return;
    }

    const dataKey = config.dataPath || 'data';
    const totalKey = config.totalPath || 'total';

    const rows = Array.isArray(res[dataKey]) ? res[dataKey] : (Array.isArray(res) ? res : []);
    const total = typeof res[totalKey] === 'number' ? res[totalKey] : rows.length;

    this.apiRows.set(rows);
    this.apiTotal.set(total);
  }

  // --- Search & Refresh ---
  public onSearchInput(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    if (this.apiConfig()) {
      this.loadApiData();
    }
  }

  public clearSearch(): void {
    this.searchQuery.set('');
    this.currentPage.set(1);
    if (this.apiConfig()) {
      this.loadApiData();
    }
  }

  public refresh(): void {
    if (this.apiConfig()) {
      this.loadApiData();
    }
  }

  // --- Sorting ---
  public onSort(field: string): void {
    const col = this.columns().find(c => c.field === field);
    if (col && col.sortable === false) return;

    const current = this.currentSort();
    let nextDir: 'asc' | 'desc' | '' = 'asc';

    if (current.field === field) {
      if (current.direction === 'asc') nextDir = 'desc';
      else if (current.direction === 'desc') nextDir = '';
      else nextDir = 'asc';
    }

    const nextSort: DatatableSort = {
      field: nextDir ? field : '',
      direction: nextDir
    };

    this.currentSort.set(nextSort);
    this.sortChange.emit(nextSort);

    if (this.apiConfig()) {
      this.loadApiData();
    }
  }

  // --- Pagination ---
  public goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.pageChange.emit({ pageIndex: page, pageSize: this.currentPageSize() });
    if (this.apiConfig()) {
      this.loadApiData();
    }
  }

  public onPageSizeChange(newSize: number): void {
    this.currentPageSize.set(newSize);
    this.currentPage.set(1);
    this.pageChange.emit({ pageIndex: 1, pageSize: newSize });
    if (this.apiConfig()) {
      this.loadApiData();
    }
  }

  // --- Selection ---
  public toggleSelectAll(): void {
    const currentRows = this.displayedRows();
    const map = new Map(this.selectedMap());

    if (this.isAllSelected()) {
      // Remove todos os registros da página atual da seleção
      currentRows.forEach(r => map.delete(this.getRowKey(r)));
    } else {
      // Adiciona todos os registros da página atual
      currentRows.forEach(r => map.set(this.getRowKey(r), r));
    }

    this.selectedMap.set(map);
    this.selectionChange.emit(this.selectedRows());
  }

  public toggleSelectRow(row: T, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!this.selectable()) return;

    const key = this.getRowKey(row);
    const map = new Map(this.selectedMap());

    if (!this.multiSelect()) {
      // Single select
      map.clear();
      map.set(key, row);
    } else {
      if (map.has(key)) {
        map.delete(key);
      } else {
        map.set(key, row);
      }
    }

    this.selectedMap.set(map);
    this.selectionChange.emit(this.selectedRows());
  }

  public isRowSelected(row: T): boolean {
    return this.selectedMap().has(this.getRowKey(row));
  }

  public clearSelection(): void {
    this.selectedMap.set(new Map());
    this.selectionChange.emit([]);
  }

  // --- Row Clicks ---
  public onRowClick(row: T): void {
    this.rowClick.emit(row);
  }

  public onRowDblClick(row: T): void {
    this.rowDblClick.emit(row);
  }

  // --- Actions ---
  public executeAction(act: DatatableAction<T>): void {
    const selected = this.selectedRows();
    if (this.isActionDisabled(act)) return;

    if (act.execute) {
      act.execute(selected);
    }
    this.actionClick.emit({ action: act, selected });
    this.actionsMenuOpen.set(false);
  }

  public isActionDisabled(act: DatatableAction<T>): boolean {
    const selected = this.selectedRows();
    const count = selected.length;

    if (act.disabled && act.disabled(selected)) return true;
    if (act.single && count !== 1) return true;
    if (act.multi && count === 0) return true;
    if (!act.single && !act.multi && !act.fixed && count === 0) return true;

    return false;
  }

  // --- Column Toggles ---
  public toggleColumnMenu(): void {
    this.columnMenuOpen.update(v => !v);
  }

  public toggleActionsMenu(): void {
    this.actionsMenuOpen.update(v => !v);
  }

  public toggleColumnVisibility(field: string): void {
    const map = { ...this.columnVisibility() };
    map[field] = !map[field];
    this.columnVisibility.set(map);
  }

  // --- Export to CSV ---
  public exportToCsv(): void {
    const cols = this.activeColumns();
    const rows = this.apiConfig() ? this.apiRows() : this.processedStaticRows();

    if (rows.length === 0) return;

    // Headers
    const headerRow = cols.map(c => `"${c.header.replace(/"/g, '""')}"`).join(';');

    // Data rows
    const bodyRows = rows.map(row => {
      return cols.map(c => {
        const val = this.formatCellValue(c, row);
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(';');
    });

    const csvContent = '\uFEFF' + [headerRow, ...bodyRows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // --- Value Formatters ---
  public formatCellValue(col: ColumnDef<T>, row: T): string {
    const val = row[col.field];

    if (col.formatter) {
      return col.formatter(val, row);
    }

    if (val === null || val === undefined) {
      return '-';
    }

    switch (col.type) {
      case 'currency':
        return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
      case 'number':
        return Number(val).toLocaleString('pt-BR');
      case 'date':
        return this.formatDate(val, false);
      case 'datetime':
        return this.formatDate(val, true);
      case 'boolean':
        return val ? 'Sim' : 'Não';
      default:
        return String(val);
    }
  }

  public getBadge(col: ColumnDef<T>, row: T): { label: string; color: BadgeColor } {
    if (col.badgeConfig) {
      const cfg = col.badgeConfig(row[col.field], row);
      return {
        label: cfg.label,
        color: cfg.color || 'blue'
      };
    }
    return {
      label: String(row[col.field]),
      color: 'slate'
    };
  }

  private formatDate(dateVal: any, withTime: boolean): string {
    if (!dateVal) return '-';
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return String(dateVal);

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (!withTime) {
      return `${day}/${month}/${year}`;
    }

    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
}
