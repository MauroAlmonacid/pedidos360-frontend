// Importamos ChangeDetectorRef y NgZone para avisarle a la pantalla que se actualice
import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';
import { Producto } from './models/producto';
import { ProductoService } from './services/producto.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  titulo = 'Pedidos360';
  usuarioActivo: string | null = null;
  correoUsuario: string | null = null;
  cargando: boolean = false;
  errorLogin: string | null = null;

  productos: Producto[] = [];
  cargandoProductos: boolean = false;
  errorProductos: string | null = null;

  constructor(
    private authService: MsalService,
    private productoService: ProductoService,
    // Los dos motores que obligan a la pantalla a redibujarse sin esperar clics:
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // 1. Inicializamos MSAL
      await this.authService.instance.initialize();

      // 2. Procesamos el código de regreso de Microsoft
      const respuesta: AuthenticationResult | null = await this.authService.instance.handleRedirectPromise();

      // Ejecutamos la asignación dentro de NgZone para que Angular despierte de inmediato
      this.zone.run(() => {
        if (respuesta) {
          this.authService.instance.setActiveAccount(respuesta.account);
          this.usuarioActivo = respuesta.account?.name || respuesta.account?.username || 'Usuario';
          this.correoUsuario = respuesta.account?.username || null;
          this.cargarCatalogo();
          this.cdr.detectChanges(); // Forzamos el render inmediato
          return;
        }

        // Si la página se recargó, verificamos las cuentas activas en memoria
        const cuentas = this.authService.instance.getAllAccounts();
        if (cuentas.length > 0) {
          this.authService.instance.setActiveAccount(cuentas[0]);
          this.usuarioActivo = cuentas[0].name || cuentas[0].username;
          this.correoUsuario = cuentas[0].username || null;
          this.cargarCatalogo();
          this.cdr.detectChanges(); // Forzamos el render inmediato
        }
      });
    } catch (error) {
      console.error('[Error de Autenticación]:', error);
    }
  }

  iniciarSesion(): void {
    // Escudo de seguridad: si el usuario ya está conectado, no volvemos a redirigir
    if (this.usuarioActivo) {
      return;
    }

    this.cargando = true;
    this.errorLogin = null;

    this.authService.loginRedirect({
      scopes: ['user.read']
    });
  }

  cargarCatalogo(): void {
    this.cargandoProductos = true;
    this.errorProductos = null;

    this.productoService.obtenerProductos().subscribe({
      next: (datos) => {
        this.zone.run(() => {
          this.productos = datos;
          this.cargandoProductos = false;
          this.cdr.detectChanges(); // Pinta las tarjetas de productos en el acto
        });
        console.log('Catálogo cargado con éxito:', datos);
      },
      error: (err) => {
        this.zone.run(() => {
          this.cargandoProductos = false;
          this.errorProductos = 'No se pudo conectar con el microservicio en el puerto 8080.';
          this.cdr.detectChanges();
        });
        console.error('[Error Catálogo]:', err);
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logoutRedirect();
  }
}