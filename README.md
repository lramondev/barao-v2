# Barão v2 - Frontend Moderno

Nova geração do sistema de gestão integrada **Barão (Praetor)** da **Transoeste**.

---

## 🚀 Arquitetura & Stack Tecnológica

* **Framework:** Angular 19 (Standalone Components, Signals, esbuild/Vite)
* **Estilização:** Tailwind CSS v3 (eliminando `@angular/flex-layout`)
* **Ícones:** Lucide Icons & SVGs otimizados
* **Autenticação:** JWT Bearer Token compatível com a V1 e API REST Laravel
* **Temas:** Suporte nativo a Dark Mode e Light Mode persistentes

---

## 🛠️ Como Executar

### Pré-requisitos
* Node.js v18+ ou v20+
* NPM ou PNPM

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Executar em Desenvolvimento
```bash
npm start
```
Acesse: `http://localhost:4200` (ou através do IP de desenvolvimento).

O proxy reverso para `/api/` já está configurado em `proxy.conf.json`.

### 3. Build para Produção
```bash
npm run build
```
Os arquivos gerados estarão em `dist/barao-v2`.

---

## 📁 Estrutura de Diretórios

```
src/
├── app/
│   ├── core/                  # Serviços globais, interceptors, guards e models
│   │   ├── guards/            # authGuard, guestGuard
│   │   ├── interceptors/      # authInterceptor (JWT + empresa header)
│   │   ├── models/            # User, Empresa, Auth interfaces
│   │   └── services/          # AuthService, ApiService, StorageService, ThemeService
│   ├── features/              # Módulos funcionais modernos
│   │   ├── auth/              # Tela de Login V2
│   │   └── dashboard/         # Dashboard / Visão inicial pós-login
│   ├── app.component.ts       # Root Component
│   ├── app.config.ts          # Configuração de bootstrap e providers
│   └── app.routes.ts          # Roteamento central com lazy loading
├── assets/                    # Identidade visual (logos, ícones, fundos)
└── environments/              # Ambientes (dev, prod)
```
