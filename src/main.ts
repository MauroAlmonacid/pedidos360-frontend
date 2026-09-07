import 'zone.js'; // Importa el motor de detección de eventos y clics en el navegador
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Arranca el componente raíz con la configuración de MSAL y rutas
bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));