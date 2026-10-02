import { Injectable, inject, signal, computed } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ApiService } from './api.service';
import { ModuleInterface, ResourceInterface, ModuleCategory } from '../models/module.model';

const PRAETOR_MODULES_FALLBACK: ModuleInterface[] = [
  {
    id: 11,
    name: 'Tráfego',
    description: 'Viagens, contratos de frete, pedágio, estadias e faturamento operacional',
    version: '0.0.1',
    icon: 'Truck',
    route: 'trafego',
    visible: true,
    category: 'operacional',
    categoryLabel: 'Operação & Frota',
    color: 'from-blue-600 to-indigo-600',
    resources: [
      { id: 1100, module_id: 11, class: 2, name: 'Contrato', description: 'Contratos de prestação de serviços de transporte e frete', version: '0.0.1', route: 'contrato', mode: 'table', visible: true },
      { id: 1101, module_id: 11, class: 2, name: 'Solicitação', description: 'Solicitações e ordens de transporte de cargas', version: '0.0.1', route: 'solicitacao', mode: 'table', visible: true },
      { id: 1102, module_id: 11, class: 2, name: 'Viagem', description: 'Controle de viagens, romaneios, cargas e motoristas', version: '0.0.1', route: 'viagem', mode: 'table', visible: true },
      { id: 1103, module_id: 11, class: 1, name: 'Faturamento Cálculo', description: 'Tabelas e fórmulas para cálculo de faturamento', version: '0.0.1', route: 'faturamento_calculo', mode: 'table', visible: true },
      { id: 1104, module_id: 11, class: 1, name: 'Tag Pedágio', description: 'Controle de tags eletrônicas e operadoras de pedágio', version: '0.0.1', route: 'tag_pedagio', mode: 'table', visible: true },
      { id: 1105, module_id: 11, class: 2, name: 'Pedágio', description: 'Lançamentos, vales e comprovantes de pedágio em rota', version: '0.0.1', route: 'pedagio', mode: 'table', visible: true },
      { id: 1106, module_id: 11, class: 2, name: 'Faturamento', description: 'Faturamento consolidado de fretes e viagens executadas', version: '0.0.1', route: 'faturamento', mode: 'table', visible: true },
      { id: 1107, module_id: 11, class: 2, name: 'Estadia', description: 'Apuração e cobrança de diárias de estadias de veículos', version: '0.0.1', route: 'estadia', mode: 'table', visible: true },
      { id: 1108, module_id: 11, class: 1, name: 'Comissão Cálculo', description: 'Regras de comissionamento de frotistas e motoristas', version: '0.0.1', route: 'comissao_calculo', mode: 'table', visible: true },
      { id: 1190, module_id: 11, class: 1, name: 'Local', description: 'Locais operacionais, pontos de apoio e filiais de tráfego', version: '0.0.1', route: 'local', mode: 'table', visible: true },
      { id: 1199, module_id: 11, class: 3, name: 'Relatórios', description: 'Relatórios gerenciais e operacionais de tráfego', version: '0.0.1', route: 'relatorio', mode: 'table', visible: true }
    ]
  },
  {
    id: 7,
    name: 'Fiscal',
    description: 'Emissão e gestão de CT-e, MDF-e, NF-e, NFS-e e conformidade fiscal',
    version: '0.0.1',
    icon: 'FileText',
    route: 'fiscal',
    visible: true,
    category: 'fiscal_financeiro',
    categoryLabel: 'Fiscal & Financeiro',
    color: 'from-amber-500 to-orange-600',
    resources: [
      { id: 700, module_id: 7, class: 1, name: 'CFOP', description: 'Códigos Fiscais de Operações e Prestações', version: '0.0.1', route: 'cfop', mode: 'table', visible: true },
      { id: 701, module_id: 7, class: 2, name: 'DFe', description: 'Documentos Fiscais Eletrônicos recebidos e manifestados', version: '0.0.1', route: 'dfe', mode: 'table', visible: true },
      { id: 702, module_id: 7, class: 2, name: 'MDe', description: 'Manifestação do Destinatário Eletrônica', version: '0.0.1', route: 'mde', mode: 'table', visible: true },
      { id: 703, module_id: 7, class: 2, name: 'NFe', description: 'Notas Fiscais Eletrônicas de Mercadorias', version: '0.0.1', route: 'nfe', mode: 'table', visible: true },
      { id: 704, module_id: 7, class: 2, name: 'NFSe', description: 'Notas Fiscais de Serviços Eletrônicas', version: '0.0.1', route: 'nfse', mode: 'table', visible: true },
      { id: 705, module_id: 7, class: 2, name: 'CTe', description: 'Conhecimento de Transporte Eletrônico de Cargas', version: '0.0.1', route: 'cte', mode: 'table', visible: true },
      { id: 706, module_id: 7, class: 2, name: 'MDFe', description: 'Manifesto Eletrônico de Documentos Fiscais', version: '0.0.1', route: 'mdfe', mode: 'table', visible: true },
      { id: 707, module_id: 7, class: 2, name: 'Recibo', description: 'Recibos fiscais e comprovantes de prestação', version: '0.0.1', route: 'recibo', mode: 'table', visible: true },
      { id: 708, module_id: 7, class: 1, name: 'Documento Tipo', description: 'Classificação e tipos de documentos fiscais', version: '0.0.1', route: 'documento_tipo', mode: 'table', visible: true },
      { id: 709, module_id: 7, class: 1, name: 'NFSe Serviço', description: 'Códigos de tributação e serviços municipais', version: '0.0.1', route: 'nfse_servico', mode: 'table', visible: true },
      { id: 710, module_id: 7, class: 2, name: 'Auditoria', description: 'Auditoria de integridade tributária e validação SEFAZ', version: '0.0.1', route: 'auditoria', mode: 'table', visible: true }
    ]
  },
  {
    id: 6,
    name: 'Financeiro',
    description: 'Contas a pagar/receber, conciliação bancária, faturas, bancos e PIX',
    version: '0.0.1',
    icon: 'DollarSign',
    route: 'financeiro',
    visible: true,
    category: 'fiscal_financeiro',
    categoryLabel: 'Fiscal & Financeiro',
    color: 'from-emerald-500 to-teal-600',
    resources: [
      { id: 600, module_id: 6, class: 1, name: 'Banco', description: 'Cadastro de instituições bancárias e layouts', version: '0.0.1', route: 'banco', mode: 'table', visible: true },
      { id: 601, module_id: 6, class: 1, name: 'Conta Bancária', description: 'Contas bancárias corporativas e agências', version: '0.0.1', route: 'conta_bancaria', mode: 'table', visible: true },
      { id: 602, module_id: 6, class: 2, name: 'Movimento', description: 'Extrato, lançamentos a débito e crédito', version: '0.0.1', route: 'movimento', mode: 'table', visible: true },
      { id: 603, module_id: 6, class: 2, name: 'Conciliação', description: 'Conciliação bancária automática com arquivos OFX', version: '0.0.1', route: 'conciliacao', mode: 'table', visible: true },
      { id: 604, module_id: 6, class: 1, name: 'Caixa', description: 'Caixas internos e controle de pequenos fundos', version: '0.0.1', route: 'caixa', mode: 'table', visible: true },
      { id: 605, module_id: 6, class: 2, name: 'Fatura', description: 'Faturas de frete, borderôs e liquidações', version: '0.0.1', route: 'fatura', mode: 'table', visible: true },
      { id: 606, module_id: 6, class: 2, name: 'Remessa', description: 'Geração e processamento de remessas e retornos CNAB', version: '0.0.1', route: 'remessa', mode: 'table', visible: true },
      { id: 607, module_id: 6, class: 1, name: 'Chave Pix', description: 'Chaves Pix e QR Codes para cobranças imediatas', version: '0.0.1', route: 'chave_pix', mode: 'table', visible: true },
      { id: 608, module_id: 6, class: 2, name: 'API de Pagamento', description: 'Integrações bancárias diretas via Open Finance e Webhooks', version: '0.0.1', route: 'api_pagamento', mode: 'table', visible: true }
    ]
  },
  {
    id: 8,
    name: 'Contabilidade',
    description: 'Plano de contas, lançamentos, centros de custos, patrimônio e DRE',
    version: '0.0.1',
    icon: 'Calculator',
    route: 'contabil',
    visible: true,
    category: 'fiscal_financeiro',
    categoryLabel: 'Fiscal & Financeiro',
    color: 'from-violet-500 to-purple-600',
    resources: [
      { id: 801, module_id: 8, class: 1, name: 'Conta', description: 'Estrutura do plano de contas contábeis', version: '0.0.1', route: 'conta', mode: 'table', visible: true },
      { id: 802, module_id: 8, class: 2, name: 'Conta Movimento', description: 'Lançamentos contábeis a débito e crédito', version: '0.0.1', route: 'conta_movimento', mode: 'table', visible: true },
      { id: 803, module_id: 8, class: 2, name: 'Centro de Resultado', description: 'Centros de custos, despesas e receitas', version: '0.0.1', route: 'centro_resultado', mode: 'table', visible: true },
      { id: 804, module_id: 8, class: 2, name: 'Conciliação', description: 'Conciliação contábil e auditoria de balancetes', version: '0.0.1', route: 'conciliacao', mode: 'table', visible: true },
      { id: 805, module_id: 8, class: 1, name: 'Patrimônio', description: 'Ativos imobilizados, depreciações e inventário', version: '0.0.1', route: 'patrimonio', mode: 'table', visible: true },
      { id: 899, module_id: 8, class: 3, name: 'Relatórios', description: 'DRE, balancetes e demonstrações contábeis', version: '0.0.1', route: 'relatorio', mode: 'table', visible: true }
    ]
  },
  {
    id: 5,
    name: 'Comercial',
    description: 'Gestão comercial, compras, requisições, produtos e estoques',
    version: '0.0.1',
    icon: 'Briefcase',
    route: 'comercial',
    visible: true,
    category: 'comercial_pessoas',
    categoryLabel: 'Comercial & Pessoas',
    color: 'from-rose-500 to-pink-600',
    resources: [
      { id: 500, module_id: 5, class: 1, name: 'Marca', description: 'Marcas e fabricantes de peças e produtos', version: '0.0.1', route: 'marca', mode: 'table', visible: true },
      { id: 501, module_id: 5, class: 1, name: 'Produto Grupo', description: 'Grupos e categorias de produtos', version: '0.0.1', route: 'produto_grupo', mode: 'table', visible: true },
      { id: 502, module_id: 5, class: 1, name: 'Produto', description: 'Catálogo de materiais, insumos e mercadorias', version: '0.0.1', route: 'produto', mode: 'table', visible: true },
      { id: 503, module_id: 5, class: 1, name: 'Estoque', description: 'Posição atual dos almoxarifados e depósitos', version: '0.0.1', route: 'estoque', mode: 'table', visible: true },
      { id: 504, module_id: 5, class: 2, name: 'Estoque Movimento', description: 'Entradas, saídas e transferências de estoque', version: '0.0.1', route: 'estoque_movimento', mode: 'table', visible: true },
      { id: 505, module_id: 5, class: 1, name: 'Orçamento', description: 'Propostas comerciais e cotações de preços', version: '0.0.1', route: 'orcamento', mode: 'table', visible: true },
      { id: 506, module_id: 5, class: 1, name: 'Contrato', description: 'Contratos de fornecimento e parcerias comerciais', version: '0.0.1', route: 'contrato', mode: 'table', visible: true },
      { id: 507, module_id: 5, class: 2, name: 'Compra', description: 'Pedidos de compra e ordens de fornecimento', version: '0.0.1', route: 'compra', mode: 'table', visible: true },
      { id: 508, module_id: 5, class: 2, name: 'Venda', description: 'Pedidos de venda e faturamento comercial', version: '0.0.1', route: 'venda', mode: 'table', visible: true },
      { id: 509, module_id: 5, class: 2, name: 'Requisição', description: 'Requisições internas de materiais e peças', version: '0.0.1', route: 'requisicao', mode: 'table', visible: true },
      { id: 510, module_id: 5, class: 2, name: 'Diário de Entradas', description: 'Registro cronológico de entradas de mercadorias', version: '0.0.1', route: 'diario_entrada', mode: 'table', visible: true },
      { id: 599, module_id: 5, class: 3, name: 'Relatórios', description: 'Relatórios de vendas, compras e giro de estoque', version: '0.0.1', route: 'relatorio', mode: 'table', visible: true }
    ]
  },
  {
    id: 9,
    name: 'Despachante',
    description: 'Gestão de frota, veículos, chassis, controle de KM, licenciamento e seguros',
    version: '0.0.1',
    icon: 'Car',
    route: 'despachante',
    visible: true,
    category: 'operacional',
    categoryLabel: 'Operação & Frota',
    color: 'from-cyan-500 to-blue-600',
    resources: [
      { id: 900, module_id: 9, class: 1, name: 'Veículo Modelo', description: 'Modelos e marcas de cavalos mecânicos e implementos', version: '0.0.1', route: 'veiculo_modelo', mode: 'table', visible: true },
      { id: 901, module_id: 9, class: 1, name: 'Veículo Chassi', description: 'Especificações técnicas, números de chassi e Renavam', version: '0.0.1', route: 'veiculo_chassi', mode: 'table', visible: true },
      { id: 902, module_id: 9, class: 1, name: 'Veículo', description: 'Cadastro central de veículos, implementos e placas', version: '0.0.1', route: 'veiculo', mode: 'table', visible: true },
      { id: 903, module_id: 9, class: 2, name: 'Frota', description: 'Composição de conjuntos, cavalos e semi-reboques', version: '0.0.1', route: 'frota', mode: 'table', visible: true },
      { id: 906, module_id: 9, class: 2, name: 'Controle KM', description: 'Registro diário de odômetros e consumo médio', version: '0.0.1', route: 'controle_km', mode: 'table', visible: true },
      { id: 907, module_id: 9, class: 1, name: 'Evento', description: 'Multas de trânsito, notificações e vistorias', version: '0.0.1', route: 'evento', mode: 'table', visible: true },
      { id: 908, module_id: 9, class: 1, name: 'Seguro', description: 'Apólices de seguro de casco, RCTR-C e RC-DC', version: '0.0.1', route: 'seguro', mode: 'table', visible: true },
      { id: 909, module_id: 9, class: 2, name: 'Frota Movimento', description: 'Deslocamentos operacionais e movimentação de pátio', version: '0.0.1', route: 'frota_movimento', mode: 'table', visible: true },
      { id: 999, module_id: 9, class: 3, name: 'Relatórios', description: 'Vencimentos de documentos, multas e custos por placa', version: '0.0.1', route: 'relatorio', mode: 'table', visible: true }
    ]
  },
  {
    id: 10,
    name: 'Manutenção',
    description: 'Ordens de serviço, oficinas mecânicas, preventivas e fechamentos',
    version: '0.0.1',
    icon: 'Wrench',
    route: 'manutencao',
    visible: true,
    category: 'operacional',
    categoryLabel: 'Operação & Frota',
    color: 'from-amber-600 to-yellow-600',
    resources: [
      { id: 1000, module_id: 10, class: 1, name: 'Oficina Mecânica', description: 'Cadastro de oficinas internas e parceiras credenciadas', version: '0.0.1', route: 'oficina_mecanica', mode: 'table', visible: true },
      { id: 1010, module_id: 10, class: 2, name: 'Ordem de Serviço', description: 'Abertura, acompanhamento e fechamento de OS', version: '0.0.1', route: 'ordem_servico', mode: 'table', visible: true },
      { id: 1011, module_id: 10, class: 2, name: 'Fechamento', description: 'Fechamento de custos e serviços executados na frota', version: '0.0.1', route: 'fechamento', mode: 'table', visible: true },
      { id: 1099, module_id: 10, class: 3, name: 'Relatórios', description: 'Custos de manutenção por veículo e histórico de revisões', version: '0.0.1', route: 'relatorio', mode: 'table', visible: true }
    ]
  },
  {
    id: 12,
    name: 'Borracharia',
    description: 'Ciclo de vida dos pneus, manutenções, rodízios e sucateamento',
    version: '0.0.1',
    icon: 'Disc',
    route: 'borracharia',
    visible: true,
    category: 'operacional',
    categoryLabel: 'Operação & Frota',
    color: 'from-stone-600 to-slate-700',
    resources: [
      { id: 1200, module_id: 12, class: 1, name: 'Pneu Modelo', description: 'Modelos, medidas, sulcos e marcas de pneus', version: '0.0.1', route: 'pneu_modelo', mode: 'table', visible: true },
      { id: 1201, module_id: 12, class: 1, name: 'Pneu Ocorrência', description: 'Tipos de ocorrências, furos e avarias', version: '0.0.1', route: 'pneu_ocorrencia', mode: 'table', visible: true },
      { id: 1202, module_id: 12, class: 1, name: 'Pneu', description: 'Controle individual de pneus por número de fogo', version: '0.0.1', route: 'pneu', mode: 'table', visible: true },
      { id: 1203, module_id: 12, class: 2, name: 'Pneu Movimento', description: 'Montagens, desmontagens e rodízios entre eixos', version: '0.0.1', route: 'pneu_movimento', mode: 'table', visible: true },
      { id: 1204, module_id: 12, class: 2, name: 'Pneu Manutenção', description: 'Envio para recapagem, consertos e reformas', version: '0.0.1', route: 'pneu_manutencao', mode: 'table', visible: true },
      { id: 1205, module_id: 12, class: 2, name: 'Pneu Sucateamento', description: 'Laudos de descarte e baixa patrimonial definitiva', version: '0.0.1', route: 'pneu_sucateamento', mode: 'table', visible: true },
      { id: 1206, module_id: 12, class: 2, name: 'Pneu Transferência', description: 'Transferência de pneus entre filiais e estoques', version: '0.0.1', route: 'pneu_transferencia', mode: 'table', visible: true },
      { id: 1207, module_id: 12, class: 1, name: 'Pneu Localização', description: 'Mapa de posições no veículo e no estoque', version: '0.0.1', route: 'pneu_localizacao', mode: 'table', visible: true },
      { id: 1299, module_id: 12, class: 3, name: 'Relatórios', description: 'Custo por km rodado (CPK) e rendimento por modelo', version: '0.0.1', route: 'relatorio', mode: 'table', visible: true }
    ]
  },
  {
    id: 3,
    name: 'Pessoa',
    description: 'Cadastro unificado de empresas, clientes, fornecedores e terceirizados',
    version: '0.0.1',
    icon: 'Users',
    route: 'pessoa',
    visible: true,
    category: 'comercial_pessoas',
    categoryLabel: 'Comercial & Pessoas',
    color: 'from-teal-500 to-emerald-600',
    resources: [
      { id: 300, module_id: 3, class: 1, name: 'Geral', description: 'Base consolidada de pessoas físicas e jurídicas', version: '0.0.1', route: 'geral', mode: 'table', visible: true },
      { id: 301, module_id: 3, class: 1, name: 'Empresa', description: 'Filiais, matriz e empresas do grupo econômico', version: '0.0.1', route: 'empresa', mode: 'table', visible: true },
      { id: 302, module_id: 3, class: 1, name: 'Cliente', description: 'Clientes tomadores de serviço e expedidores', version: '0.0.1', route: 'cliente', mode: 'table', visible: true },
      { id: 303, module_id: 3, class: 1, name: 'Fornecedor', description: 'Fornecedores de peças, combustíveis e serviços', version: '0.0.1', route: 'fornecedor', mode: 'table', visible: true },
      { id: 304, module_id: 3, class: 1, name: 'Funcionário', description: 'Colaboradores internos e quadro de pessoal', version: '0.0.1', route: 'funcionario', mode: 'table', visible: true },
      { id: 305, module_id: 3, class: 1, name: 'Terceirizado', description: 'Motoristas agregados, frotistas e autônomos', version: '0.0.1', route: 'tercerizado', mode: 'table', visible: true },
      { id: 306, module_id: 3, class: 1, name: 'Visitante', description: 'Controle de visitantes em instalações da empresa', version: '0.0.1', route: 'visitante', mode: 'table', visible: true },
      { id: 307, module_id: 3, class: 1, name: 'Candidato', description: 'Banco de talentos e candidatos em processo seletivo', version: '0.0.1', route: 'candidato', mode: 'table', visible: true },
      { id: 308, module_id: 3, class: 1, name: 'Dependente', description: 'Dependentes legais para benefícios corporativos', version: '0.0.1', route: 'dependente', mode: 'table', visible: true }
    ]
  },
  {
    id: 4,
    name: 'Recursos Humanos',
    description: 'Folha de pagamento, jornada, ponto, prontuários e benefícios',
    version: '0.0.1',
    icon: 'UserCheck',
    route: 'rh',
    visible: true,
    category: 'comercial_pessoas',
    categoryLabel: 'Comercial & Pessoas',
    color: 'from-indigo-500 to-purple-600',
    resources: [
      { id: 400, module_id: 4, class: 1, name: 'Cargo', description: 'Estrutura de cargos, níveis e faixas salariais', version: '0.0.1', route: 'cargo', mode: 'table', visible: true },
      { id: 401, module_id: 4, class: 2, name: 'Registro', description: 'Ficha de registro de colaboradores e admissões', version: '0.0.1', route: 'registro', mode: 'table', visible: true },
      { id: 404, module_id: 4, class: 1, name: 'Folha', description: 'Processamento e competências da folha de pagamento', version: '0.0.1', route: 'folha', mode: 'table', visible: true },
      { id: 405, module_id: 4, class: 2, name: 'Evento', description: 'Proventos, descontos e encargos trabalhistas', version: '0.0.1', route: 'evento', mode: 'table', visible: true },
      { id: 407, module_id: 4, class: 2, name: 'Jornada', description: 'Controle da Lei do Motorista, tempo de direção e descanso', version: '0.0.1', route: 'jornada', mode: 'table', visible: true },
      { id: 408, module_id: 4, class: 1, name: 'Advertência', description: 'Registros disciplinares, advertências e suspensões', version: '0.0.1', route: 'advertencia', mode: 'table', visible: true },
      { id: 409, module_id: 4, class: 1, name: 'Equipe', description: 'Setores, turnos e lideranças de equipe', version: '0.0.1', route: 'equipe', mode: 'table', visible: true },
      { id: 410, module_id: 4, class: 2, name: 'Prontuário', description: 'Histórico médico ocupacional, exames toxicológicos e ASO', version: '0.0.1', route: 'prontuario', mode: 'table', visible: true },
      { id: 411, module_id: 4, class: 2, name: 'Ponto', description: 'Apuração de espelho de ponto eletrônico', version: '0.0.1', route: 'ponto', mode: 'table', visible: true },
      { id: 412, module_id: 4, class: 1, name: 'Abono', description: 'Justificativas de faltas, atestados e abonos', version: '0.0.1', route: 'abono', mode: 'table', visible: true },
      { id: 413, module_id: 4, class: 1, name: 'Escala', description: 'Planejamento de escalas de trabalho e folgas', version: '0.0.1', route: 'escala', mode: 'table', visible: true },
      { id: 414, module_id: 4, class: 1, name: 'Ocorrência', description: 'Acidentes, incidentes e ocorrências internas', version: '0.0.1', route: 'ocorrencia', mode: 'table', visible: true },
      { id: 415, module_id: 4, class: 2, name: 'Imposto de Renda', description: 'Apuração de IRRF, informes de rendimentos e DIRF', version: '0.0.1', route: 'imposto_renda', mode: 'table', visible: true },
      { id: 416, module_id: 4, class: 2, name: 'Fechamento', description: 'Fechamento mensal de encargos e benefícios', version: '0.0.1', route: 'fechamento', mode: 'table', visible: true },
      { id: 417, module_id: 4, class: 2, name: 'Contratação', description: 'Formalização de contratações e documentação legal', version: '0.0.1', route: 'contratacao', mode: 'table', visible: true }
    ]
  },
  {
    id: 2,
    name: 'Geolocal',
    description: 'Rastreamento em tempo real, rotas, telemetria, cercas e monitoramento',
    version: '0.0.1',
    icon: 'MapPin',
    route: 'geolocal',
    visible: true,
    category: 'operacional',
    categoryLabel: 'Operação & Frota',
    color: 'from-blue-500 to-cyan-600',
    resources: [
      { id: 200, module_id: 2, class: 1, name: 'Região', description: 'Regiões operacionais e zonas de risco mapeadas', version: '0.0.1', route: 'regiao', mode: 'table', visible: true },
      { id: 201, module_id: 2, class: 1, name: 'Local', description: 'Pontos de interesse, clientes e postos parceiros', version: '0.0.1', route: 'local', mode: 'table', visible: true },
      { id: 202, module_id: 2, class: 1, name: 'Cartão Sim', description: 'Linhas e chips M2M de telemetria e operadoras', version: '0.0.1', route: 'cartao_sim', mode: 'table', visible: true },
      { id: 203, module_id: 2, class: 1, name: 'Rastreador', description: 'Módulos de rastreamento instalados na frota', version: '0.0.1', route: 'rastreador', mode: 'table', visible: true },
      { id: 204, module_id: 2, class: 2, name: 'Rastreamento', description: 'Painel em tempo real de posições geográficas', version: '0.0.1', route: 'rastreamento', mode: 'table', visible: true },
      { id: 205, module_id: 2, class: 2, name: 'Monitoramento', description: 'Alertas de velocidade, paradas indevidas e ignição', version: '0.0.1', route: 'monitoramento', mode: 'table', visible: true },
      { id: 206, module_id: 2, class: 2, name: 'Linha do Tempo', description: 'Playback e histórico de trajetos percorridos', version: '0.0.1', route: 'linha_tempo', mode: 'table', visible: true },
      { id: 299, module_id: 2, class: 3, name: 'Relatórios', description: 'Relatórios de tempos em trânsito e permanência', version: '0.0.1', route: 'relatorio', mode: 'table', visible: true }
    ]
  },
  {
    id: 13,
    name: 'Segurança',
    description: 'Controle de acesso patrimonial, dispositivos de segurança e auditoria',
    version: '0.0.1',
    icon: 'Shield',
    route: 'seguranca',
    visible: true,
    category: 'sistema_nuvem',
    categoryLabel: 'Sistema & Nuvem',
    color: 'from-emerald-600 to-green-700',
    resources: [
      { id: 1300, module_id: 13, class: 1, name: 'Dispositivo', description: 'Catracas, biometrias e leitores de identificação', version: '0.0.1', route: 'dispositivo', mode: 'table', visible: true },
      { id: 1301, module_id: 13, class: 2, name: 'Controle de Acesso', description: 'Logs de passagem e controle de portaria', version: '0.0.1', route: 'controle_acesso', mode: 'table', visible: true }
    ]
  },
  {
    id: 14,
    name: 'Nuvem',
    description: 'Gestão eletrônica de documentos (GED) e arquivos na nuvem',
    version: '0.0.1',
    icon: 'Cloud',
    route: 'nuvem',
    visible: true,
    category: 'sistema_nuvem',
    categoryLabel: 'Sistema & Nuvem',
    color: 'from-sky-500 to-indigo-500',
    resources: [
      { id: 1400, module_id: 14, class: 1, name: 'Arquivo Tipo', description: 'Classificação de arquivos, comprovantes e anexos', version: '0.0.1', route: 'arquivo_tipo', mode: 'table', visible: true },
      { id: 1401, module_id: 14, class: 2, name: 'Arquivo', description: 'Repositório central de arquivos com busca e download', version: '0.0.1', route: 'arquivo', mode: 'table', visible: true }
    ]
  },
  {
    id: 1,
    name: 'Sistema',
    description: 'Configurações gerais, gerenciamento de usuários, perfis e permissões',
    version: '0.0.1',
    icon: 'Settings',
    route: 'system',
    visible: true,
    category: 'sistema_nuvem',
    categoryLabel: 'Sistema & Nuvem',
    color: 'from-slate-600 to-slate-800',
    resources: [
      { id: 100, module_id: 1, class: 1, name: 'Recursos', description: 'Dicionário de dados, telas e entidades do sistema', version: '0.0.1', route: 'resource', mode: 'table', visible: true },
      { id: 101, module_id: 1, class: 1, name: 'Acesso', description: 'Perfis de usuários, grupos e controle de permissões', version: '0.0.1', route: 'access', mode: 'table', visible: true },
      { id: 102, module_id: 1, class: 1, name: 'Usuário', description: 'Gestão de contas de operadores e administradores', version: '0.0.1', route: 'user', mode: 'table', visible: true },
      { id: 103, module_id: 1, class: 1, name: 'Notificação', description: 'Central de avisos, alertas automáticos e mensagens', version: '0.0.1', route: 'notification', mode: 'table', visible: true },
      { id: 104, module_id: 1, class: 1, name: 'Calendário', description: 'Calendário operacional, compromissos e tarefas', version: '0.0.1', route: 'calendar', mode: 'table', visible: true },
      { id: 199, module_id: 1, class: 3, name: 'Relatórios', description: 'Auditoria de logs, acessos e ações no sistema', version: '0.0.1', route: 'relatorio', mode: 'table', visible: true }
    ]
  },
  {
    id: 0,
    name: 'Comum',
    description: 'Tabelas auxiliares globais, UF, municípios, DDIs e feriados',
    version: '0.0.1',
    icon: 'Layers',
    route: 'common',
    visible: true,
    category: 'sistema_nuvem',
    categoryLabel: 'Sistema & Nuvem',
    color: 'from-purple-500 to-indigo-600',
    resources: [
      { id: 10, module_id: 0, class: 1, name: 'UF', description: 'Unidades da Federação e alíquotas interestaduais', version: '0.0.1', route: 'uf', mode: 'table', visible: true },
      { id: 11, module_id: 0, class: 1, name: 'Município', description: 'Códigos IBGE e tabela oficial de cidades', version: '0.0.1', route: 'municipio', mode: 'table', visible: true },
      { id: 12, module_id: 0, class: 1, name: 'DDI', description: 'Discagem Direta Internacional dos países', version: '0.0.1', route: 'ddi', mode: 'table', visible: true },
      { id: 13, module_id: 0, class: 1, name: 'DDD', description: 'Códigos de Discagem Direta a Distância', version: '0.0.1', route: 'ddd', mode: 'table', visible: true },
      { id: 14, module_id: 0, class: 1, name: 'Feriado', description: 'Calendário de feriados nacionais, estaduais e municipais', version: '0.0.1', route: 'feriado', mode: 'table', visible: true }
    ]
  },
  {
    id: 15,
    name: 'Mobile',
    description: 'Aplicativo dos motoristas, controle de entrega e sincronização de dados',
    version: '0.0.1',
    icon: 'Smartphone',
    route: 'mobile',
    visible: true,
    category: 'sistema_nuvem',
    categoryLabel: 'Sistema & Nuvem',
    color: 'from-fuchsia-600 to-pink-600',
    resources: [
      { id: 1500, module_id: 15, class: 1, name: 'Usuário', description: 'Contas e permissões dos motoristas no app móvel', version: '0.0.1', route: 'user', mode: 'table', visible: true }
    ]
  }
];

@Injectable({
  providedIn: 'root'
})
export class ModuleService {
  private api = inject(ApiService);

  public modules = signal<ModuleInterface[]>(PRAETOR_MODULES_FALLBACK);
  public loading = signal<boolean>(false);
  public isDrawerOpen = signal<boolean>(false);
  public selectedModule = signal<ModuleInterface | null>(null);
  public searchQuery = signal<string>('');
  public selectedCategory = signal<string>('todos');

  // Módulos filtrados por busca e categoria
  public filteredModules = computed(() => {
    let list = this.modules();
    const query = this.searchQuery().trim().toLowerCase();
    const cat = this.selectedCategory();

    if (cat !== 'todos') {
      list = list.filter(m => m.category === cat);
    }

    if (query) {
      list = list.filter(m => {
        const matchName = m.name.toLowerCase().includes(query);
        const matchDesc = m.description.toLowerCase().includes(query);
        const matchResource = m.resources.some(r => 
          r.name.toLowerCase().includes(query) || 
          (r.description && r.description.toLowerCase().includes(query))
        );
        return matchName || matchDesc || matchResource;
      });
    }

    return list;
  });

  constructor() {
    this.loadModules();
  }

  public loadModules(): void {
    this.loading.set(true);
    this.api.get<any[]>('app').pipe(
      map(apiModules => {
        if (!apiModules || !Array.isArray(apiModules) || apiModules.length === 0) {
          return PRAETOR_MODULES_FALLBACK;
        }

        // Faz o merge dos dados do backend com as definições ricas de categoria, cores e ícones
        return apiModules.map(apiMod => {
          const fallback = PRAETOR_MODULES_FALLBACK.find(f => f.id === apiMod.id || f.route === apiMod.route);
          return {
            id: apiMod.id,
            name: apiMod.name || fallback?.name || 'Módulo',
            description: apiMod.description || fallback?.description || '',
            version: apiMod.version || fallback?.version || '0.0.1',
            icon: fallback?.icon || 'Layers',
            route: apiMod.route || fallback?.route || '',
            visible: apiMod.visible !== false,
            category: (fallback?.category || 'operacional') as ModuleCategory,
            categoryLabel: fallback?.categoryLabel || 'Operacional',
            color: fallback?.color || 'from-brand-600 to-indigo-600',
            resources: (apiMod.resources && apiMod.resources.length > 0) 
              ? apiMod.resources 
              : (fallback?.resources || [])
          } as ModuleInterface;
        });
      }),
      catchError(err => {
        console.warn('API /api/app indisponível, usando fallback dos módulos do Praetor:', err);
        return of(PRAETOR_MODULES_FALLBACK);
      })
    ).subscribe(result => {
      // Ordena alfabeticamente igual ao Praetor
      const sorted = result.sort((a, b) => 
        (a.name || '').trim().localeCompare((b.name || '').trim(), 'pt-BR', { sensitivity: 'base' })
      );
      this.modules.set(sorted);
      this.loading.set(false);
    });
  }

  public toggleDrawer(): void {
    this.isDrawerOpen.update(v => !v);
  }

  public openDrawer(): void {
    this.isDrawerOpen.set(true);
  }

  public closeDrawer(): void {
    this.isDrawerOpen.set(false);
  }

  public selectModule(module: ModuleInterface | null): void {
    this.selectedModule.set(module);
  }
}
