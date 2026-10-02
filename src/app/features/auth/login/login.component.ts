import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { StorageService } from '@core/services/storage.service';
import { ThemeService } from '@core/services/theme.service';
import { 
  LucideAngularModule, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  Sun, 
  Moon, 
  ShieldCheck, 
  AlertCircle,
  Truck,
  RotateCcw
} from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideAngularModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private storageService = inject(StorageService);
  private router = inject(Router);
  public themeService = inject(ThemeService);

  // Ícones Lucide
  readonly LockIcon = Lock;
  readonly MailIcon = Mail;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly ArrowRightIcon = ArrowRight;
  readonly LoaderIcon = Loader2;
  readonly SunIcon = Sun;
  readonly MoonIcon = Moon;
  readonly ShieldIcon = ShieldCheck;
  readonly AlertIcon = AlertCircle;
  readonly TruckIcon = Truck;
  readonly SwitchIcon = RotateCcw;

  public currentYear = new Date().getFullYear();
  public version = '2.0';

  public loginForm!: FormGroup;
  public isLoading = signal<boolean>(false);
  public showPassword = signal<boolean>(false);
  public errorMessage = signal<string | null>(null);

  // Usuário anterior salvo
  public lastUser = signal<{ name: string; email: string; avatar_url?: string; admin?: boolean } | null>(null);
  public isKnownUserMode = signal<boolean>(false);

  ngOnInit(): void {
    const known = this.storageService.getLastKnownUser();
    if (known && known.email) {
      this.lastUser.set(known);
      this.isKnownUserMode.set(true);
    }

    this.loginForm = this.fb.group({
      email: [known?.email || '', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
  }

  switchAccount(): void {
    this.isKnownUserMode.set(false);
    this.loginForm.patchValue({ email: '', password: '' });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.isLoading()) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { email, password } = this.loginForm.getRawValue();

    this.authService.login({ email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loginForm.get('password')?.reset();
        
        let msg = 'Falha ao autenticar. Verifique suas credenciais.';
        if (err?.error?.message) {
          msg = err.error.message;
        } else if (typeof err?.error === 'string') {
          msg = err.error;
        } else if (err?.message) {
          msg = err.message;
        }
        this.errorMessage.set(msg);
      }
    });
  }
}
