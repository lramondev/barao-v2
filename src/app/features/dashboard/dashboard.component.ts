import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of, delay } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { StorageService } from '@core/services/storage.service';
import { RealtimeService } from '@core/services/realtime.service';
import { 
  DatatableComponent, 
  ColumnDef, 
  DatatableAction, 
  DatatableApiConfig,
  DatatableRealtimeConfig
} from '@shared/components/datatable';

interface Veiculo {
  id: number;
  placa: string;
  modelo: string;
  tipo: string;
  motorista: string;
  capacidade_kg: number;
  km_atual: number;
  status: 'disponivel' | 'em_viagem' | 'manutencao' | 'inativo';
  ativo: boolean;
  atualizado_em: string;
}

interface CargaFrete {
  id: number;
  numero_cte: string;
  cliente: string;
  origem: string;
  destino: string;
  valor_frete: number;
  peso_kg: number;
  status: 'emitido' | 'em_transito' | 'entregue' | 'cancelado';
  criado_em: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatatableComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  public themeService = inject(ThemeService);
  public realtimeService = inject(RealtimeService);

  public activeTab = signal<'estatico' | 'http'>('estatico');
  public actionMessage = signal<string | null>(null);

  // Configuração Realtime para a tabela de Veículos (Modo Merge com destaque visual)
  public veiculosRealtimeConfig: DatatableRealtimeConfig<Veiculo> = {
    channel: 'veiculo',
    event: 'veiculo',
    mode: 'merge',
    trackByKey: 'id',
    highlightOnUpdate: true
  };

  // Configuração Realtime para a tabela de Cargas/CT-e (Modo Notify com banner de aviso)
  public fretesRealtimeConfig: DatatableRealtimeConfig<CargaFrete> = {
    channel: 'cargas',
    event: 'cte_update',
    mode: 'notify',
    trackByKey: 'id',
    highlightOnUpdate: true
  };

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

  // ==========================================
  // TABELA 1: DADOS ESTÁTICOS (FROTA / VEÍCULOS)
  // ==========================================
  public veiculosColumns: ColumnDef<Veiculo>[] = [
    { field: 'placa', header: 'Placa', width: '110px', sortable: true },
    { field: 'modelo', header: 'Modelo / Veículo', sortable: true },
    { field: 'tipo', header: 'Tipo', width: '130px', sortable: true },
    { field: 'motorista', header: 'Motorista Principal', sortable: true },
    { 
      field: 'capacidade_kg', 
      header: 'Capacidade', 
      type: 'number', 
      width: '120px', 
      align: 'right', 
      sortable: true,
      formatter: (val) => `${Number(val).toLocaleString('pt-BR')} kg`
    },
    { 
      field: 'km_atual', 
      header: 'KM Atual', 
      type: 'number', 
      width: '120px', 
      align: 'right', 
      sortable: true,
      formatter: (val) => `${Number(val).toLocaleString('pt-BR')} km`
    },
    {
      field: 'status',
      header: 'Status',
      type: 'badge',
      width: '140px',
      align: 'center',
      sortable: true,
      badgeConfig: (val) => {
        switch (val) {
          case 'disponivel':
            return { label: 'Disponível', color: 'green' };
          case 'em_viagem':
            return { label: 'Em Viagem', color: 'blue' };
          case 'manutencao':
            return { label: 'Manutenção', color: 'yellow' };
          default:
            return { label: 'Inativo', color: 'red' };
        }
      }
    },
    { field: 'ativo', header: 'Ativo', type: 'boolean', width: '90px', align: 'center', sortable: true }
  ];

  public veiculosActions: DatatableAction<Veiculo>[] = [
    {
      id: 'novo',
      label: 'Novo Veículo',
      fixed: true,
      variant: 'primary',
      execute: () => this.showMessage('Ação: Abrir formulário de cadastro de novo veículo.')
    },
    {
      id: 'editar',
      label: 'Editar',
      single: true,
      variant: 'secondary',
      execute: (sel) => this.showMessage(`Ação: Editando veículo ${sel[0]?.placa} (${sel[0]?.modelo}).`)
    },
    {
      id: 'viagem',
      label: 'Alocar Viagem',
      single: true,
      variant: 'success',
      execute: (sel) => this.showMessage(`Ação: Alocar viagem para o veículo ${sel[0]?.placa}.`)
    },
    {
      id: 'manutencao',
      label: 'Enviar Manutenção',
      multi: true,
      variant: 'danger',
      execute: (sel) => this.showMessage(`Ação: ${sel.length} veículos enviados para ordem de serviço.`)
    }
  ];

  public veiculosData: Veiculo[] = [
    { id: 1, placa: 'BRA2E19', modelo: 'Scania R450 6x2', tipo: 'Cavalo Mecânico', motorista: 'Carlos Eduardo', capacidade_kg: 45000, km_atual: 184500, status: 'disponivel', ativo: true, atualizado_em: '2026-10-02' },
    { id: 2, placa: 'QWE4R56', modelo: 'Volvo FH 540 Globetrotter', tipo: 'Cavalo Mecânico', motorista: 'Marcos Vinicius', capacidade_kg: 50000, km_atual: 98200, status: 'em_viagem', ativo: true, atualizado_em: '2026-10-02' },
    { id: 3, placa: 'PLK8J22', modelo: 'Mercedes-Benz Actros 2651', tipo: 'Cavalo Mecânico', motorista: 'José Roberto', capacidade_kg: 48000, km_atual: 245100, status: 'manutencao', ativo: true, atualizado_em: '2026-10-01' },
    { id: 4, placa: 'FGT9H34', modelo: 'DAF XF 530 Super Space', tipo: 'Cavalo Mecânico', motorista: 'Rafael Antunes', capacidade_kg: 45000, km_atual: 67300, status: 'disponivel', ativo: true, atualizado_em: '2026-10-02' },
    { id: 5, placa: 'TRP1A88', modelo: 'Carreta Graneleiro Randon 3 Eixos', tipo: 'Implemento', motorista: 'Carlos Eduardo', capacidade_kg: 38000, km_atual: 154000, status: 'disponivel', ativo: true, atualizado_em: '2026-10-01' },
    { id: 6, placa: 'RTS4B99', modelo: 'Carreta Baú Frigorífico Noma', tipo: 'Implemento', motorista: 'Marcos Vinicius', capacidade_kg: 32000, km_atual: 89000, status: 'em_viagem', ativo: true, atualizado_em: '2026-10-02' },
    { id: 7, placa: 'ZXW3C44', modelo: 'Volvo VM 330 8x2', tipo: 'Truck / Rígido', motorista: 'Antônio Ferreira', capacidade_kg: 29000, km_atual: 312000, status: 'manutencao', ativo: true, atualizado_em: '2026-09-30' },
    { id: 8, placa: 'MNB7V11', modelo: 'Scania P360 Bitruck', tipo: 'Truck / Rígido', motorista: 'Lucas Silva', capacidade_kg: 28000, km_atual: 142000, status: 'disponivel', ativo: true, atualizado_em: '2026-10-02' },
    { id: 9, placa: 'KJH5G88', modelo: 'Iveco S-Way 480', tipo: 'Cavalo Mecânico', motorista: 'Fernando Rocha', capacidade_kg: 46000, km_atual: 43000, status: 'em_viagem', ativo: true, atualizado_em: '2026-10-02' },
    { id: 10, placa: 'VBN2M33', modelo: 'Carreta Sider Guerra', tipo: 'Implemento', motorista: 'Fernando Rocha', capacidade_kg: 35000, km_atual: 43000, status: 'em_viagem', ativo: true, atualizado_em: '2026-10-02' },
    { id: 11, placa: 'ASD9F00', modelo: 'Volkswagen Meteor 29.520', tipo: 'Cavalo Mecânico', motorista: 'Paulo Henrique', capacidade_kg: 48000, km_atual: 112000, status: 'disponivel', ativo: true, atualizado_em: '2026-10-02' },
    { id: 12, placa: 'HJK6L55', modelo: 'Mercedes-Benz Atego 2430', tipo: 'Truck / Rígido', motorista: 'Rodrigo Lima', capacidade_kg: 24000, km_atual: 420000, status: 'inativo', ativo: false, atualizado_em: '2026-08-15' }
  ];

  // ==========================================
  // TABELA 2: MODO HTTP API (CARGAS & CT-E)
  // ==========================================
  public fretesColumns: ColumnDef<CargaFrete>[] = [
    { field: 'numero_cte', header: 'CT-e / Documento', width: '150px', sortable: true },
    { field: 'cliente', header: 'Cliente / Tomador', sortable: true },
    { field: 'origem', header: 'Origem', sortable: true },
    { field: 'destino', header: 'Destino', sortable: true },
    { field: 'peso_kg', header: 'Peso', type: 'number', width: '110px', align: 'right', sortable: true, formatter: (val) => `${Number(val).toLocaleString('pt-BR')} kg` },
    { field: 'valor_frete', header: 'Valor Frete', type: 'currency', width: '140px', align: 'right', sortable: true },
    {
      field: 'status',
      header: 'Status Fiscal',
      type: 'badge',
      width: '130px',
      align: 'center',
      sortable: true,
      badgeConfig: (val) => {
        switch (val) {
          case 'emitido': return { label: 'Autorizado', color: 'blue' };
          case 'em_transito': return { label: 'Em Trânsito', color: 'purple' };
          case 'entregue': return { label: 'Entregue', color: 'green' };
          default: return { label: 'Cancelado', color: 'red' };
        }
      }
    },
    { field: 'criado_em', header: 'Data Emissão', type: 'datetime', width: '160px', align: 'center', sortable: true }
  ];

  // Configuração HTTP API (com paginação e busca assíncronas reais)
  public fretesApiConfig: DatatableApiConfig<CargaFrete> = {
    loadFn: (params) => {
      // Simula o backend do Barão respondendo a paginação e busca via API HTTP
      const mockDatabase: CargaFrete[] = [
        { id: 101, numero_cte: 'CTE-0028491', cliente: 'Bunge Alimentos S.A.', origem: 'Rondonópolis - MT', destino: 'Santos - SP', valor_frete: 14850.00, peso_kg: 37500, status: 'em_transito', criado_em: '2026-10-02 08:30:00' },
        { id: 102, numero_cte: 'CTE-0028492', cliente: 'Cargill Agrícola Ltda', origem: 'Rio Verde - GO', destino: 'Paranaguá - PR', valor_frete: 16200.50, peso_kg: 39000, status: 'entregue', criado_em: '2026-10-02 09:15:00' },
        { id: 103, numero_cte: 'CTE-0028493', cliente: 'Amaggi Exportação e Importação', origem: 'Sorriso - MT', destino: 'Itaqui - MA', valor_frete: 22400.00, peso_kg: 42000, status: 'emitido', criado_em: '2026-10-02 10:45:00' },
        { id: 104, numero_cte: 'CTE-0028494', cliente: 'JBS S.A. - Divisão Carnes', origem: 'Campo Grande - MS', destino: 'Itajaí - SC', valor_frete: 18900.00, peso_kg: 28000, status: 'em_transito', criado_em: '2026-10-02 11:20:00' },
        { id: 105, numero_cte: 'CTE-0028495', cliente: 'BRF S.A. Alimentos', origem: 'Chapecó - SC', destino: 'São Paulo - SP', valor_frete: 9800.00, peso_kg: 24500, status: 'entregue', criado_em: '2026-10-01 14:10:00' },
        { id: 106, numero_cte: 'CTE-0028496', cliente: 'Suzano Papel e Celulose', origem: 'Mucuri - BA', destino: 'Vitória - ES', valor_frete: 8400.00, peso_kg: 36000, status: 'emitido', criado_em: '2026-10-01 16:40:00' },
        { id: 107, numero_cte: 'CTE-0028497', cliente: 'Klabin S.A.', origem: 'Telêmaco Borba - PR', destino: 'Santos - SP', valor_frete: 11200.00, peso_kg: 31000, status: 'em_transito', criado_em: '2026-09-30 07:50:00' },
        { id: 108, numero_cte: 'CTE-0028498', cliente: 'Gerdau Aços Longos', origem: 'Ouro Branco - MG', destino: 'Curitiba - PR', valor_frete: 13750.00, peso_kg: 40000, status: 'cancelado', criado_em: '2026-09-29 11:00:00' }
      ];

      let filtered = mockDatabase;
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(f => 
          f.numero_cte.toLowerCase().includes(q) || 
          f.cliente.toLowerCase().includes(q) ||
          f.origem.toLowerCase().includes(q) ||
          f.destino.toLowerCase().includes(q)
        );
      }

      const total = filtered.length;
      const start = (params.page - 1) * params.pageSize;
      const paginated = filtered.slice(start, start + params.pageSize);

      // Simula latência de rede de 300ms
      return of({
        data: paginated,
        total: total
      }).pipe(delay(350));
    }
  };

  public fretesActions: DatatableAction<CargaFrete>[] = [
    {
      id: 'emitir_cte',
      label: 'Emitir Novo CT-e',
      fixed: true,
      variant: 'primary',
      execute: () => this.showMessage('Ação: Abrir emissor de Conhecimento de Transporte Eletrônico.')
    },
    {
      id: 'dacte',
      label: 'Imprimir DACTE',
      single: true,
      variant: 'secondary',
      execute: (sel) => this.showMessage(`Ação: Gerando PDF do DACTE para o ${sel[0]?.numero_cte}.`)
    },
    {
      id: 'rastrear',
      label: 'Rastrear Carga',
      single: true,
      variant: 'success',
      execute: (sel) => this.showMessage(`Ação: Abrir telemetria em tempo real para ${sel[0]?.cliente}.`)
    }
  ];

  public onRowSelect(rows: any[]): void {
    console.log('Linhas selecionadas:', rows);
  }

  public showMessage(msg: string): void {
    this.actionMessage.set(msg);
    setTimeout(() => {
      this.actionMessage.set(null);
    }, 4000);
  }

  // --- Ações de Simulação de Tempo Real (Demo) ---
  public simulateVeiculoStatusChange(): void {
    const statuses: ('disponivel' | 'em_viagem' | 'manutencao' | 'inativo')[] = [
      'disponivel', 'em_viagem', 'manutencao', 'inativo'
    ];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const randomId = Math.floor(Math.random() * 12) + 1;

    const simulatedUpdate: Partial<Veiculo> = {
      id: randomId,
      status: randomStatus,
      km_atual: Math.floor(Math.random() * 50000) + 100000,
      atualizado_em: new Date().toISOString().slice(0, 10)
    };

    this.realtimeService.simulateEvent('veiculo', 'veiculo', simulatedUpdate);
    this.showMessage(`⚡ Realtime Simulado: Veículo #${randomId} atualizado para status "${randomStatus}".`);
  }

  public simulateNewVeiculo(): void {
    const newId = Date.now();
    const plates = ['BRA2E19', 'QWE4R56', 'PLK8J22', 'FGT9H34', 'ZETA99', 'LOG2026'];
    const plate = 'RT' + Math.floor(Math.random() * 90 + 10) + 'X' + Math.floor(Math.random() * 90 + 10);

    const newVeiculo: Veiculo = {
      id: newId,
      placa: plate,
      modelo: 'Scania 540 S V8 Novo',
      tipo: 'Cavalo Mecânico',
      motorista: 'Piloto Realtime',
      capacidade_kg: 52000,
      km_atual: 120,
      status: 'disponivel',
      ativo: true,
      atualizado_em: new Date().toISOString().slice(0, 10)
    };

    this.realtimeService.simulateEvent('veiculo', 'veiculo', {
      action: 'insert',
      data: newVeiculo
    });
    this.showMessage(`⚡ Realtime Simulado: Novo veículo ${plate} inserido no topo da frota!`);
  }

  public simulateNewCte(): void {
    const cteNumber = 'CTE-00' + Math.floor(Math.random() * 90000 + 10000);
    const newCte: CargaFrete = {
      id: Date.now(),
      numero_cte: cteNumber,
      cliente: 'AgroBrasil Logística S.A.',
      origem: 'Cuiabá - MT',
      destino: 'Paranaguá - PR',
      valor_frete: Math.floor(Math.random() * 15000) + 10000,
      peso_kg: 38000,
      status: 'emitido',
      criado_em: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    this.realtimeService.simulateEvent('cargas', 'cte_update', newCte);
    this.showMessage(`⚡ Realtime Simulado: Novo ${cteNumber} emitido (Modo Notify).`);
  }

  logout(): void {
    this.authService.logout();
  }
}
