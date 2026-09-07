import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { routes } from './app.routes';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MsalService, MSAL_INSTANCE } from '@azure/msal-angular';
import { msalConfig } from './auth-config';

// Función fábrica que inicializa el cliente de Microsoft con tus IDs de Azure
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Habilita el cliente HTTP para conectar luego con los microservicios
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory // Inyecta el motor de MSAL en toda la app
    },
    MsalService // Servicio que gestiona el login, logout y lectura de usuarios
  ]
};