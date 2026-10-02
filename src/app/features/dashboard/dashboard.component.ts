import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ThemeService } from '@core/services/theme.service';
import { StorageService } from '@core/services/storage.service';
import { RealtimeService } from '@core/services/realtime.service';
import { VersionCheckService } from '@core/services/version-check.service';
import { ModuleService } from '@core/services/module.service';
import { ModuleInterface, ResourceInterface, ModuleCategory } from '@core/models/module.model';
import { SidebarComponent } from '@shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, SidebarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  public authService = inject(AuthService);
  public storageService = inject(StorageService);
  public themeService = inject(ThemeService);
  public realtimeService = inject(RealtimeService);
  public versionCheckService = inject(VersionCheckService);
  public moduleService = inject(ModuleService);

  public toastMessage = signal<string | null>(null);
  public activeResourceModal = signal<{ module: ModuleInterface; resource: ResourceInterface } | null>(null);

  // Categorias disponíveis para filtro rápido
  public categories = [
    { id: 'todos', label: 'Todos os Módulos', count: 16 },
    { id: 'operacional', label: 'Operação & Frota', count: 5 },
    { id: 'fiscal_financeiro', label: 'Fiscal & Financeiro', count: 3 },
    { id: 'comercial_pessoas', label: 'Comercial & Pessoas', count: 3 },
    { id: 'sistema_nuvem', label: 'Sistema & Nuvem', count: 5 }
  ];

  get user() {
    return this.authService.currentUser();
  }

  get empresaAtivaNome(): string {
    const empresas = this.storageService.getEmpresaAtiva();
    if (empresas.length > 0) {
      return empresas[0].apelido_fantasia || empresas[0].nome_razao_social || 'Empresa #' + empresas[0].id;
    }
    return 'Transoeste Logística';
  }

  // Total de recursos disponíveis somando todos os módulos
  public totalResourcesCount = computed(() => {
    return this.moduleService.modules().reduce((acc, m) => acc + (m.resources?.length || 0), 0);
  });

  public selectCategory(catId: string): void {
    this.moduleService.selectedCategory.set(catId);
  }

  public openModuleDetails(module: ModuleInterface): void {
    this.moduleService.selectModule(module);
  }

  public closeModuleDetails(): void {
    this.moduleService.selectModule(null);
  }

  public openResource(module: ModuleInterface, resource: ResourceInterface): void {
    this.activeResourceModal.set({ module, resource });
  }

  public closeResourceModal(): void {
    this.activeResourceModal.set(null);
  }

  public showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4000);
  }

  public logout(): void {
    this.authService.logout();
  }
}
