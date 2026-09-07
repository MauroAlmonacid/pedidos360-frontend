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

  // Ámbito propio registrado en Azure:
  const apiScope = 'api://b723576c-f14c-46b7-a4d6-bb1750acbed5/access_as_user';

  // Interceptores para AWS API Gateway
  protectedResourceMap.set('https://c9dnj0qg84.execute-api.us-east-1.amazonaws.com/*', [apiScope]);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}