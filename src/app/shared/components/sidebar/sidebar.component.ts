import { Component, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ModuleService } from '@core/services/module.service';
import { AuthService } from '@core/services/auth.service';
import { StorageService } from '@core/services/storage.service';
import { ThemeService } from '@core/services/theme.service';
import { VersionCheckService } from '@core/services/version-check.service';
import { ModuleInterface, ResourceInterface } from '@core/models/module.model';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  public moduleService = inject(ModuleService);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  public themeService = inject(ThemeService);
  public versionCheckService = inject(VersionCheckService);
  private router = inject(Router);

  public filterText = signal<string>('');
  public expandedModules = signal<Set<number>>(new Set());

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

  // Lista de módulos filtrados no menu lateral
  public menuModules = computed(() => {
    const list = this.moduleService.modules();
    const query = this.filterText().trim().toLowerCase();
    if (!query) {
      return list;
    }
    return list.filter(m => 
      m.name.toLowerCase().includes(query) || 
      m.description.toLowerCase().includes(query) ||
      m.resources.some(r => r.name.toLowerCase().includes(query))
    );
  });

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.moduleService.isDrawerOpen()) {
      this.moduleService.closeDrawer();
    }
  }

  toggleExpand(moduleId: number, event: Event): void {
    event.stopPropagation();
    const set = new Set(this.expandedModules());
    if (set.has(moduleId)) {
      set.delete(moduleId);
    } else {
      set.add(moduleId);
    }
    this.expandedModules.set(set);
  }

  isExpanded(moduleId: number): boolean {
    return this.expandedModules().has(moduleId);
  }

  selectModule(module: ModuleInterface): void {
    this.moduleService.selectModule(module);
    this.moduleService.closeDrawer();
  }

  openResource(module: ModuleInterface, resource: ResourceInterface): void {
    this.moduleService.selectModule(module);
    this.moduleService.closeDrawer();
  }

  logout(): void {
    this.moduleService.closeDrawer();
    this.authService.logout();
  }
}
