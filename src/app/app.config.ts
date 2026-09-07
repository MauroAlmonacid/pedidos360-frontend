import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
// 1. Herramientas HTTP con soporte para interceptores clásicos de DI
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
// 2. Componentes de MSAL Angular
import { 
  MsalService, 
  MsalGuard, 
  MsalInterceptor, 
  MSAL_INSTANCE, 
  MSAL_INTERCEPTOR_CONFIG 
} from '@azure/msal-angular';
import { msalConfig, MSALInterceptorConfigFactory } from './auth-config';

// Instancia única del cliente MSAL
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Habilita HttpClient permitiendo que los interceptores capturen las llamadas
    provideHttpClient(withInterceptorsFromDi()),
    // Registra el interceptor de MSAL como guardia de todas las peticiones
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    // Provee la configuración de autenticación
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    // Provee el mapa de URLs que definimos en auth-config.ts
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    MsalService,
    MsalGuard
  ]
};