import { LogLevel, Configuration } from '@azure/msal-browser';

// Configuración oficial de MSAL para Angular moderno (v3)
export const msalConfig: Configuration = {
  auth: {
    // ID de la aplicación registrada en el portal de Azure Entra ID
    clientId: 'b723576c-f14c-46b7-a4d6-bb1750acbed5',
    // Tenant institucional para autenticar las cuentas Duoc / Microsoft
    authority: 'https://login.microsoftonline.com/e5372bf0-c5e3-4286-887c-79069f209c1f',
    // URL local a la que Microsoft devolverá al usuario
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200'
  },
  cache: {
    // En MSAL v3 se define directamente como 'localStorage' para persistir la sesión
    cacheLocation: 'localStorage'
    // Nota: ya no se incluye storeAuthStateInCookie porque fue removido en v3
  },
  system: {
    loggerOptions: {
      // Filtro para depurar eventos en consola sin exponer datos privados
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
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