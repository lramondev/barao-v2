const win = typeof window !== 'undefined' ? (window as any) : {};

export const environment = {
  production: true,
  api_url: '/api/',
  socket_url: 'https://barao.transoeste.com.br:3000/',
  system_name: 'Barão',
  version: win.__APP_VERSION__ || '0.1.4',
  updated_at: win.__APP_UPDATED_AT__ || '02/10/2026 19:25'
};

