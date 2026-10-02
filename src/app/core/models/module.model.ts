export type ModuleCategory = 'operacional' | 'fiscal_financeiro' | 'comercial_pessoas' | 'sistema_nuvem';

export interface ResourceInterface {
  id: number;
  module_id: number;
  class: number; // 1: Cadastros, 2: Movimentações/Operações, 3: Relatórios
  name: string;
  description: string;
  version: string;
  route: string;
  mode: string;
  visible: boolean;
  avatar?: string | null;
}

export interface ModuleInterface {
  id: number;
  name: string;
  description: string;
  version: string;
  icon: string;
  route: string;
  visible: boolean;
  category: ModuleCategory;
  categoryLabel?: string;
  color?: string; // Classe tailwind ou hex
  bgGradient?: string;
  resources: ResourceInterface[];
}
