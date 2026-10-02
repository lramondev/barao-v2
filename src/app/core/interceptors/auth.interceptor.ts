import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);

  // Ignora requests específicos (ex: version.json)
  if (req.url.includes('version.json')) {
    return next(req);
  }

  const token = storage.getToken();
  const empresaList = storage.getEmpresaAtiva();
  const empresaHeader = empresaList.map(e => ({ id: e.id }));

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'empresa': JSON.stringify(empresaHeader)
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(req.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const authReq = req.clone({
    setHeaders: headers
  });

  return next(authReq);
};
