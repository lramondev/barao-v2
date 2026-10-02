const win = typeof window !== 'undefined' ? (window as any) : {};

export const environment = {
  production: false,
  api_url: '/api/', // Via proxy local ou dev server
  socket_url: 'https://dev.praetor.local:3000/',
  system_name: 'Barão',
  version: win.__APP_VERSION__ || '0.1.3',
  updated_at: win.__APP_UPDATED_AT__ || '02/10/2026 19:21'
};

