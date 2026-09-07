import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MsalService, MSAL_INSTANCE } from '@azure/msal-angular';
import { msalConfig } from './auth-config';

// Instancia única del cliente de Azure
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory // Proveedor de la librería de autenticación
    },
    MsalService // Servicio que inyectaremos en app.ts
  ]
};