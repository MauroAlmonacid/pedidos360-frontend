import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';
// 1. Importamos el modelo y el servicio que creamos
import { Producto } from './models/producto';
import { ProductoService } from './services/producto.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule], // CommonModule permite usar directivas como *ngFor y *ngIf
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

  // 3. Inyectamos ProductoService en el constructor junto al servicio de MSAL
  constructor(
    private authService: MsalService,
    private productoService: ProductoService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.authService.instance.initialize();
      const cuentas = this.authService.instance.getAllAccounts();
      if (cuentas.length > 0) {
        this.usuarioActivo = cuentas[0].name || cuentas[0].username;
        this.correoUsuario = cuentas[0].username || null;
        // Si ya había sesión activa previa, cargamos el catálogo de inmediato
        this.cargarCatalogo();
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
          this.correoUsuario = resultado.account?.username || null;
          this.cargando = false;
          // Tras iniciar sesión exitosamente, traemos los productos de la base de datos
          this.cargarCatalogo();
        },
        error: (error) => {
          this.cargando = false;
          this.errorLogin = 'No se pudo completar el inicio de sesión con Microsoft.';
          console.error('[Error Login]:', error);
        }
      });
  }

  // 4. Método que llama a Spring Boot por HTTP GET y rellena el arreglo de productos
  cargarCatalogo(): void {
    this.cargandoProductos = true;
    this.errorProductos = null;
    this.productoService.obtenerProductos().subscribe({
      next: (datos) => {
        this.productos = datos;
        this.cargandoProductos = false;
        console.log('Productos cargados con éxito desde Spring Boot:', datos);
      },
      error: (err) => {
        this.cargandoProductos = false;
        this.errorProductos = 'No se pudo conectar con el microservicio de productos en el puerto 8080. Verifica que el servidor de Spring Boot esté en ejecución e intenta nuevamente.';
        console.error('Error al consultar microservicio de productos:', err);
      }
    });
  }

  cerrarSesion(): void {
    this.authService.logoutPopup()
      .subscribe({
        next: () => {
          this.usuarioActivo = null;
          this.correoUsuario = null;
          this.productos = []; // Vaciamos los productos en pantalla al salir
        }
      });
  }
}