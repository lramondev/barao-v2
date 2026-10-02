import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'barao_theme_dark';
  public isDark = signal<boolean>(false);

  constructor() {
    this.initTheme();
    effect(() => {
      this.applyTheme(this.isDark());
    });
  }

  private initTheme(): void {
    const saved = localStorage.getItem(this.THEME_KEY);
    if (saved !== null) {
      this.isDark.set(saved === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(prefersDark);
    }
  }

  public toggleTheme(): void {
    this.isDark.update(dark => !dark);
    localStorage.setItem(this.THEME_KEY, String(this.isDark()));
  }

  public setDark(dark: boolean): void {
    this.isDark.set(dark);
    localStorage.setItem(this.THEME_KEY, String(dark));
  }

  private applyTheme(dark: boolean): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }
}
