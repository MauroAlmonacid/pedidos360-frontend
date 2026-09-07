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
    cacheLocation: 'localStorage' // Mantiene el token activo en el navegador
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
      },
      logLevel: LogLevel.Warning
    }
  }
};

// Fábrica que mapea qué URLs recibirán automáticamente el token Bearer
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();

  // Cualquier petición dirigida a estos puertos llevará el token adjunto
  protectedResourceMap.set('http://localhost:8080/', ['User.Read']);
  protectedResourceMap.set('http://localhost:8082/', ['User.Read']);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}