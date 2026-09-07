import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html', // Plantilla visual con la tarjeta de login
  styleUrl: './app.css'
})
export class App implements OnInit {
  titulo = 'Pedidos360';
  usuarioActivo: string | null = null;
  // Variable requerida por app.html para desplegar el correo de Microsoft
  correoUsuario: string | null = null;
  cargando: boolean = false;
  errorLogin: string | null = null;

  constructor(private authService: MsalService) {}

  async ngOnInit(): Promise<void> {
    try {
      // Inicializamos la instancia de MSAL antes de consultar sesiones
      await this.authService.instance.initialize();
      const cuentas = this.authService.instance.getAllAccounts();
      if (cuentas.length > 0) {
        this.usuarioActivo = cuentas[0].name || cuentas[0].username;
        // Asignamos el correo si ya existía una sesión previa guardada
        this.correoUsuario = cuentas[0].username || null;
      }
    } catch (error) {
      console.warn('[MSAL Advertencia]:', error);
    }
  }

  iniciarSesion(): void {
    this.cargando = true;
    this.errorLogin = null;

    this.authService.loginPopup()
      .subscribe({
        next: (resultado: AuthenticationResult) => {
          this.usuarioActivo = resultado.account?.name || resultado.account?.username || 'Usuario';
          // Capturamos el correo corporativo retornado por Azure
          this.correoUsuario = resultado.account?.username || null;
          this.cargando = false;
        },
        error: (error) => {
          this.cargando = false;
          this.errorLogin = 'No se pudo completar el inicio de sesión con Microsoft.';
          console.error('[Error Login]:', error);
        }
      });
  }

  cerrarSesion(): void {
    this.authService.logoutPopup()
      .subscribe({
        next: () => {
          // Limpiamos los datos locales al cerrar sesión
          this.usuarioActivo = null;
          this.correoUsuario = null;
        }
      });
  }
}