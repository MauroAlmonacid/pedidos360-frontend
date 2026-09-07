import { LogLevel, Configuration, InteractionType } from '@azure/msal-browser';
import { MsalInterceptorConfiguration } from '@azure/msal-angular';

export const msalConfig: Configuration = {
  auth: {
    clientId: 'b723576c-f14c-46b7-a4d6-bb1750acbed5',
    authority: 'https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200'
  },
  cache: {
    cacheLocation: 'localStorage' // Mantiene la sesión viva al recargar la página
  },
  system: {
    loggerOptions: {
      // Activamos los mensajes de diagnóstico de MSAL en la consola F12
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        if (level === LogLevel.Error || level === LogLevel.Warning || level === LogLevel.Info) {
          console.log('[MSAL]:', message);
        }
      },
      logLevel: LogLevel.Info
    }
  }
};

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();

  // 1. Mapeo exacto para el microservicio de Productos (puerto 8080)
  protectedResourceMap.set('http://localhost:8080/productos', ['User.Read']);
  protectedResourceMap.set('http://localhost:8080', ['User.Read']);

  // 2. Mapeo exacto para el microservicio de Carrito (puerto 8082)
  protectedResourceMap.set('https://c9dnj0qg84.execute-api.us-east-1.amazonaws.com/productos', ['User.Read']);
  protectedResourceMap.set('https://c9dnj0qg84.execute-api.us-east-1.amazonaws.com/carrito', ['User.Read']);
  protectedResourceMap.set('https://c9dnj0qg84.execute-api.us-east-1.amazonaws.com/*', ['User.Read']);
  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}