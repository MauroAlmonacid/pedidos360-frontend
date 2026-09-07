import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';
import { IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { 
  MsalService, 
  MsalGuard, 
  MsalInterceptor, 
  MsalBroadcastService, // Asistente de eventos de MSAL
  MSAL_INSTANCE, 
  MSAL_INTERCEPTOR_CONFIG 
} from '@azure/msal-angular';
import { msalConfig, MSALInterceptorConfigFactory } from './auth-config';

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService // Proveedor obligatorio para el ciclo de vida del interceptor
  ]
};