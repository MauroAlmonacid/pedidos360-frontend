import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  encapsulation: ViewEncapsulation.None
})
export class App implements OnInit {
  titulo = 'Pedidos360';
  usuarioActivo: string | null = null;
  correoUsuario: string | null = null;
  cargando = false;
  errorLogin: string | null = null;

  // Inyectamos el servicio de Microsoft Authentication Library
  constructor(private authService: MsalService) {}

  async ngOnInit(): Promise<void> {
    try {
      // Inicializamos la librería al cargar la ventana
      await this.authService.instance.initialize();
      // Comprobamos si el navegador ya guardaba una sesión previa
      const cuentas = this.authService.instance.getAllAccounts();
      if (cuentas.length > 0) {
        this.usuarioActivo = cuentas[0].name || cuentas[0].username || 'Usuario';
        this.correoUsuario = cuentas[0].username || null;
      }
    } catch {
      this.errorLogin =
        'No fue posible inicializar Microsoft Entra ID. Recarga la página e inténtalo de nuevo.';
    }
  }

  // Despliega la ventana emergente de inicio de sesión con Microsoft
  iniciarSesion(): void {
    this.cargando = true;
    this.errorLogin = null;
    this.authService.loginPopup().subscribe({
      next: (resultado: AuthenticationResult) => {
        const cuenta = resultado?.account;
        this.usuarioActivo = cuenta?.name || cuenta?.username || 'Usuario';
        this.correoUsuario = cuenta?.username || null;
        this.cargando = false;
      },
      error: (error: unknown) => {
        this.cargando = false;
        this.errorLogin = this.obtenerMensajeErrorLogin(error);
      }
    });
  }

  // Cierra la sesión activa y limpia los datos en el navegador
  cerrarSesion(): void {
    this.authService.logoutPopup().subscribe({
      next: () => this.limpiarSesion(),
      error: () => this.limpiarSesion()
    });
  }

  private limpiarSesion(): void {
    this.usuarioActivo = null;
    this.correoUsuario = null;
    this.cargando = false;
    this.errorLogin = null;
  }

  // Traduce los fallos de MSAL a mensajes amigables para el usuario
  private obtenerMensajeErrorLogin(error: unknown): string {
    const e = error as { errorCode?: string; errorMessage?: string; message?: string } | null;
    const detalle = `${e?.errorCode ?? ''} ${e?.errorMessage ?? ''} ${e?.message ?? ''}`.toLowerCase();
    const canceladoPorUsuario =
      detalle.includes('user_cancelled') ||
      detalle.includes('closed the popup') ||
      detalle.includes('popup window and cancelled') ||
      (detalle.includes('popup') && detalle.includes('cancel'));
    return canceladoPorUsuario
      ? 'Inicio de sesión cancelado. Cuando estés listo, vuelve a pulsar el botón.'
      : 'No pudimos autenticarte con Microsoft. Revisa tu conexión e inténtalo de nuevo.';
  }
}