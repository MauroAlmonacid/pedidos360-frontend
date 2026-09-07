import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { AuthenticationResult } from '@azure/msal-browser';
import { Producto } from './models/producto';
import { ProductoService } from './services/producto.service';
// 1. Importamos el modelo y el nuevo servicio de carrito
import { Pedido } from './models/pedido';
import { CarritoService } from './services/carrito.service';

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

  // 2. Lista reactiva para almacenar los ítems del carrito
  itemsCarrito: Pedido[] = [];
  mensajeCarrito: string | null = null;

  // 3. Controla la visibilidad del panel lateral deslizante (drawer)
  mostrarCarrito: boolean = false;

  constructor(
    private authService: MsalService,
    private productoService: ProductoService,
    // 4. Inyectamos el servicio del carrito
    private carritoService: CarritoService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      // 1. PRIMER PASO VITAL: Girar la llave y encender el motor de MSAL
      await this.authService.instance.initialize();

      // 2. SEGUNDO PASO: Ya con el motor encendido, procesamos el retorno de Microsoft
      const respuesta = await this.authService.instance.handleRedirectPromise();

      this.zone.run(() => {
        let cuentaParaActivar = null;

        // Verificamos si volvemos de un login recién completado
        if (respuesta && respuesta.account) {
          cuentaParaActivar = respuesta.account;
        } else {
          // Si la página se recargó y ya había una sesión guardada en localStorage
          const cuentas = this.authService.instance.getAllAccounts();
          if (cuentas.length > 0) {
            cuentaParaActivar = cuentas[0];
          }
        }

        // Declaramos la cuenta activa para que el interceptor sepa a quién timbrar los tokens
        if (cuentaParaActivar) {
          this.authService.instance.setActiveAccount(cuentaParaActivar);
          this.usuarioActivo = cuentaParaActivar.name || cuentaParaActivar.username;
          this.correoUsuario = cuentaParaActivar.username || null;
          console.log('>>> Cuenta activa registrada en MSAL:', cuentaParaActivar.username);

          // Ahora que la identidad está firme, cargamos los datos protegidos
          this.cargarCatalogo();
          this.cargarCarrito();
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      console.error('[Error de Autenticación]:', error);
    }
  }

  iniciarSesion(): void {
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
    this.productoService.obtenerProductos().subscribe({
      next: (datos) => {
        this.zone.run(() => {
          this.productos = datos;
          this.cargandoProductos = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.cargandoProductos = false;
          this.errorProductos = 'No se pudo conectar con el microservicio en el puerto 8080.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  // 4. Consulta los pedidos guardados en el puerto 8082
  cargarCarrito(): void {
    this.carritoService.obtenerCarrito().subscribe({
      next: (pedidos) => {
        this.zone.run(() => {
          this.itemsCarrito = pedidos;
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('[Error al cargar carrito]:', err)
    });
  }

  // 5. Envía un nuevo pedido por HTTP POST a Spring Boot
agregarAlCarrito(prod: Producto): void {
  // Escudo: si el producto no tiene existencias, no hacemos nada
  if (prod.stock === 0) {
    return;
  }

  console.log('>>> Clic recibido en frontend para:', prod.nombre);

  const nuevoPedido: Pedido = {
    nombre: prod.nombre,
    precio: prod.precio,
    cantidad: 1
  };

  // El método .subscribe() activa el envío HTTP POST hacia http://localhost:8082/carrito
  this.carritoService.agregarAlCarrito(nuevoPedido).subscribe({
    next: (pedidoRegistrado) => {
      console.log('>>> Éxito: Pedido guardado en Spring Boot:', pedidoRegistrado);

      this.zone.run(() => {
        // Agregamos el ítem recibido a la lista en pantalla
        this.itemsCarrito.push(pedidoRegistrado);

        // ABRIR EL PANEL LATERAL AUTOMÁTICAMENTE para que veas que el producto entró
        this.mostrarCarrito = true;

        // Forzamos a Angular a redibujar la vista en el acto
        this.cdr.detectChanges();
      });
    },
    error: (err) => {
      console.error('>>> Error al enviar el producto al microservicio 8082:', err);
    }
  });
}

  // 7. Abre o cierra el panel lateral deslizante del carrito
  alternarCarrito(): void {
    this.mostrarCarrito = !this.mostrarCarrito;
  }

  // 8. Cierra el panel lateral del carrito (al hacer clic en el fondo)
  cerrarPanelCarrito(): void {
    this.mostrarCarrito = false;
  }

  // 9. Vacía por completo el carrito tanto en el backend como en la vista
  vaciarTodoElCarrito(): void {
    this.carritoService.vaciarCarrito().subscribe({
      next: () => {
        this.zone.run(() => {
          this.itemsCarrito = [];
          this.mensajeCarrito = 'Carrito vaciado';
          this.cdr.detectChanges();

          setTimeout(() => {
            this.mensajeCarrito = null;
            this.cdr.detectChanges();
          }, 3000);
        });
      },
      error: (err) => console.error('[Error al vaciar carrito]:', err)
    });
  }

  // 10. Calcula el total de unidades sumando las cantidades del carrito
  obtenerTotalUnidades(): number {
    return this.itemsCarrito.reduce((acumulado, item) => acumulado + item.cantidad, 0);
  }

  // 6. Calcula el costo total sumando los precios del carrito
  obtenerTotalCarrito(): number {
    return this.itemsCarrito.reduce((acumulado, item) => acumulado + (item.precio * item.cantidad), 0);
  }

  cerrarSesion(): void {
    this.authService.logoutRedirect();
  }
}