import { Configuration, LogLevel } from '@azure/msal-browser';

// Configuración central para el cliente de Microsoft Entra ID
export const msalConfig: Configuration = {
  auth: {
    // Identificador único de tu aplicación registrada en Azure
    clientId: 'b723576c-f14c-46b7-a4d6-bb1750acbed5',
    // URL de la autoridad que valida identidades en tu Tenant
    authority: 'https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f',
    // Dirección local a la que Azure devuelve al usuario autenticado
    redirectUri: 'http://localhost:4200',
    // Dirección a la que se envía al usuario al cerrar sesión
    postLogoutRedirectUri: 'http://localhost:4200'
  },
  cache: {
    // 'localStorage' almacena las credenciales de forma persistente en el navegador
    cacheLocation: 'localStorage'
  },
  system: {
    loggerOptions: {
      // Función para imprimir eventos en la consola del navegador
      loggerCallback: (level, message, containsPii) => {
        if (!containsPii && level === LogLevel.Error) {
          console.error('[MSAL Error]:', message);
        }
      },
      logLevel: LogLevel.Warning
    }
  }
};

// Rutas protegidas y permisos que solicitará el frontend
export const protectedResources = {
  productosApi: {
    endpoint: 'http://localhost:8080/productos',
    scopes: ['api://b723576c-f14c-46b7-a4d6-bb1750acbed5/pedidos.read']
  },
  carritoApi: {
    endpoint: 'http://localhost:8082/carrito',
    scopes: ['api://b723576c-f14c-46b7-a4d6-bb1750acbed5/pedidos.read']
  }
};