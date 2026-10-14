import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';
import { Producto } from './models/producto';
import { ProductoService } from './services/producto.service';
// Modelo y servicio del carrito
import { Pedido } from './models/pedido';
import { CarritoService } from './services/carrito.service';
// Integración: Órdenes, Despachos y Notificaciones
import { CrearOrdenRequest, Orden, COLORES_ESTADO_ORDEN } from './models/orden';
import { OrdenService } from './services/orden.service';
import {
  Despacho,
  ESTADOS_DESPACHO,
  ETIQUETAS_ESTADO_DESPACHO,
  COLORES_ESTADO_DESPACHO,
} from './models/despacho';
import { DespachoService } from './services/despacho.service';
import { RegistroNotificacion, TipoNotificacion } from './models/notificacion';
import { NotificacionService } from './services/notificacion.service';

type Seccion = 'catalogo' | 'ordenes' | 'despachos' | 'notificaciones';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // Lista reactiva para almacenar los ítems del carrito
  itemsCarrito: Pedido[] = [];
  mensajeCarrito: string | null = null;
  mostrarCarrito: boolean = false;

  // Navegación entre secciones del portal
  seccionActiva: Seccion = 'catalogo';

  // ===== Órdenes =====
  ordenes: Orden[] = [];
  cargandoOrdenes: boolean = false;
  errorOrdenes: string | null = null;
  generandoOrden: boolean = false;
  mensajeCheckout: string | null = null;
  errorCheckout: string | null = null;

  // ===== Despachos =====
  despachos: Despacho[] = [];
  cargandoDespachos: boolean = false;
  errorDespachos: string | null = null;
  actualizandoDespachoId: number | null = null;

  // ===== Notificaciones =====
  notificaciones: RegistroNotificacion[] = [];
  enviandoReenvioId: number | null = null;
  correoPruebaTo: string = '';
  correoPruebaSubject: string = 'Prueba de Notificaciones - Pedidos360';
  correoPruebaBody: string = 'Este es un correo de prueba enviado desde el frontend de Pedidos360.';
  enviandoPrueba: boolean = false;

  // Constantes expuestas al template para pintar selects y etiquetas
  readonly estadosDespacho = ESTADOS_DESPACHO;
  readonly etiquetasEstadoDespacho = ETIQUETAS_ESTADO_DESPACHO;
  private readonly coloresEstadoOrden = COLORES_ESTADO_ORDEN;
  private readonly coloresEstadoDespacho = COLORES_ESTADO_DESPACHO;

  constructor(
    private authService: MsalService,
    private productoService: ProductoService,
    private carritoService: CarritoService,
    private ordenService: OrdenService,
    private despachoService: DespachoService,
    private notificacionService: NotificacionService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      await this.authService.instance.initialize();
      const respuesta = await this.authService.instance.handleRedirectPromise();

      this.zone.run(() => {
        let cuentaParaActivar = null;

        if (respuesta && respuesta.account) {
          cuentaParaActivar = respuesta.account;
        } else {
          const cuentas = this.authService.instance.getAllAccounts();
          if (cuentas.length > 0) {
            cuentaParaActivar = cuentas[0];
          }
        }

        if (cuentaParaActivar) {
          this.authService.instance.setActiveAccount(cuentaParaActivar);
          this.usuarioActivo = cuentaParaActivar.name || cuentaParaActivar.username;
          this.correoUsuario = cuentaParaActivar.username || null;
          this.correoPruebaTo = this.correoUsuario || '';
          console.log('>>> Cuenta activa registrada en MSAL:', cuentaParaActivar.username);

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
    if (this.usuarioActivo) return;
    this.cargando = true;
    this.errorLogin = null;
    this.authService.loginRedirect({
      scopes: ['api://b723576c-f14c-46b7-a4d6-bb1750acbed5/access_as_user']
    });
  }

  // ============================================================
  // Catálogo / Carrito (lógica existente)
  // ============================================================
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

  agregarAlCarrito(prod: Producto): void {
    if (prod.stock === 0) {
      return;
    }

    const nuevoPedido: Pedido = {
      idProducto: prod.id,
      nombre: prod.nombre,
      precio: prod.precio,
      cantidad: 1
    };

    this.carritoService.agregarAlCarrito(nuevoPedido).subscribe({
      next: (pedidoRegistrado) => {
        this.zone.run(() => {
          // Aseguramos conservar el idProducto aunque el backend no lo devuelva
          if (pedidoRegistrado.idProducto == null) {
            pedidoRegistrado.idProducto = prod.id;
          }
          this.itemsCarrito.push(pedidoRegistrado);
          this.mostrarCarrito = true;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error('>>> Error al enviar el producto al microservicio 8082:', err);
      }
    });
  }

  alternarCarrito(): void {
    this.mostrarCarrito = !this.mostrarCarrito;
  }

  cerrarPanelCarrito(): void {
    this.mostrarCarrito = false;
  }

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

  obtenerTotalUnidades(): number {
    return this.itemsCarrito.reduce((acumulado, item) => acumulado + item.cantidad, 0);
  }

  obtenerTotalCarrito(): number {
    return this.itemsCarrito.reduce((acumulado, item) => acumulado + (item.precio * item.cantidad), 0);
  }

  // ============================================================
  // Navegación
  // ============================================================
  cambiarSeccion(seccion: Seccion): void {
    this.seccionActiva = seccion;
    if (seccion === 'ordenes' && this.ordenes.length === 0) {
      this.cargarOrdenes();
    }
    if (seccion === 'despachos' && this.despachos.length === 0) {
      this.cargarDespachos();
    }
    this.cdr.detectChanges();
  }

  // ============================================================
  // Flujo de Checkout: Carrito -> Órdenes
  // ============================================================
  generarOrden(): void {
    if (this.generandoOrden) return;

    this.mensajeCheckout = null;
    this.errorCheckout = null;

    if (this.itemsCarrito.length === 0) {
      this.errorCheckout = 'Tu carrito está vacío. Agrega productos antes de confirmar la compra.';
      return;
    }

    if (!this.correoUsuario) {
      this.errorCheckout = 'No se pudo obtener tu correo electrónico de la sesión.';
      return;
    }

    // 1. Transformamos los ítems del carrito (Pedido) al formato CrearOrdenRequest
    const request: CrearOrdenRequest = {
      clienteEmail: this.correoUsuario,
      items: this.itemsCarrito.map((item) => ({
        idProducto: this.resolverIdProducto(item),
        cantidad: item.cantidad,
        precioUnitario: item.precio
      }))
    };

    this.generandoOrden = true;

    this.ordenService.crearOrden(request).subscribe({
      next: (orden) => {
        this.zone.run(() => {
          this.generandoOrden = false;
          this.ordenes = [orden, ...this.ordenes];
          this.mensajeCheckout =
            `Orden #${orden.id} generada con éxito. Enviamos el detalle de confirmación a ${orden.clienteEmail}.`;
          this.registrarNotificacion(
            'info',
            `Orden #${orden.id} creada`,
            'El correo de confirmación está siendo procesado de forma asíncrona por NotificacionConsumer.'
          );

          // 2. Vaciamos el carrito local y en el backend
          this.itemsCarrito = [];
          this.mostrarCarrito = false;
          this.carritoService.vaciarCarrito().subscribe({
            error: (err) => console.error('[Checkout] No se pudo vaciar el carrito en el backend:', err)
          });

          // 3. Recargamos el catálogo para reflejar el descuento de stock (ProductoConsumer)
          this.cargarCatalogo();

          // 4. Refrescamos despachos y esperamos la creación asíncrona (DespachoConsumer)
          this.cargarDespachos();
          this.esperarDespachoDeOrden(orden.id, 6);

          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.generandoOrden = false;
          this.errorCheckout = 'No se pudo generar la orden. Verifica el microservicio de órdenes (puerto 8083).';
          console.error('[Checkout] Error al crear la orden:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Resuelve el idProducto del ítem: prioriza el id guardado y, si no,
  // lo busca en el catálogo por nombre.
  private resolverIdProducto(item: Pedido): number {
    if (item.idProducto != null) {
      return item.idProducto;
    }
    const encontrado = this.productos.find((p) => p.nombre === item.nombre);
    if (encontrado) {
      return encontrado.id;
    }
    return item.id ?? 0;
  }

  // ============================================================
  // Órdenes
  // ============================================================
  cargarOrdenes(): void {
    this.cargandoOrdenes = true;
    this.errorOrdenes = null;
    this.ordenService.listarOrdenes().subscribe({
      next: (datos) => {
        this.zone.run(() => {
          this.ordenes = datos ?? [];
          this.cargandoOrdenes = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.cargandoOrdenes = false;
          this.errorOrdenes = 'No se pudo conectar con el microservicio de órdenes en el puerto 8083.';
          console.error('[Órdenes] Error al listar órdenes:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  claseEstadoOrden(estado: string): string {
    return this.coloresEstadoOrden[estado] ?? 'info';
  }

  // ============================================================
  // Despachos
  // ============================================================
  cargarDespachos(): void {
    this.cargandoDespachos = true;
    this.errorDespachos = null;
    this.despachoService.listarDespachos().subscribe({
      next: (datos) => {
        this.zone.run(() => {
          this.despachos = datos ?? [];
          this.cargandoDespachos = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.cargandoDespachos = false;
          this.errorDespachos = 'No se pudo conectar con el microservicio de despachos en el puerto 8084.';
          console.error('[Despachos] Error al listar despachos:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Espera con reintentos la creación asíncrona del despacho tras crear la orden
  private esperarDespachoDeOrden(idOrden: number, intentosRestantes: number): void {
    this.despachoService.consultarPorOrden(idOrden).subscribe({
      next: (despacho) => {
        this.zone.run(() => {
          this.mezclarDespacho(despacho);
          this.registrarNotificacion(
            'exito',
            `Despacho ${despacho.codigoSeguimiento}`,
            `Guía de envío generada automáticamente para la orden #${idOrden}.`
          );
          this.cdr.detectChanges();
        });
      },
      error: () => {
        // El consumidor aún no ha creado el registro (latencia asíncrona)
        if (intentosRestantes > 0) {
          setTimeout(() => this.esperarDespachoDeOrden(idOrden, intentosRestantes - 1), 2000);
        }
      }
    });
  }

  private mezclarDespacho(despacho: Despacho): void {
    const indice = this.despachos.findIndex((d) => d.id === despacho.id);
    if (indice >= 0) {
      this.despachos[indice] = despacho;
      this.despachos = [...this.despachos];
    } else {
      this.despachos = [despacho, ...this.despachos];
    }
  }

  actualizarEstadoDespacho(despacho: Despacho, nuevoEstado: string): void {
    if (!despacho.id || nuevoEstado === despacho.estado) return;

    this.actualizandoDespachoId = despacho.id;
    this.despachoService.actualizarEstado(despacho.id, nuevoEstado).subscribe({
      next: (actualizado) => {
        this.zone.run(() => {
          this.mezclarDespacho(actualizado);
          this.actualizandoDespachoId = null;
          this.registrarNotificacion(
            'info',
            `Despacho ${actualizado.codigoSeguimiento}`,
            `Estado actualizado a ${this.etiquetaEstadoDespacho(actualizado.estado)}.`
          );
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.actualizandoDespachoId = null;
          console.error('[Despachos] Error al actualizar estado:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  verDespachoDeOrden(idOrden: number): void {
    this.seccionActiva = 'despachos';
    this.cargarDespachos();
  }

  etiquetaEstadoDespacho(estado: string): string {
    return this.etiquetasEstadoDespacho[estado] ?? estado;
  }

  claseEstadoDespacho(estado: string): string {
    return this.coloresEstadoDespacho[estado] ?? 'info';
  }

  obtenerDespachoDeOrden(idOrden: number): Despacho | undefined {
    return this.despachos.find((d) => d.idOrden === idOrden);
  }

  // ============================================================
  // Notificaciones
  // ============================================================
  registrarNotificacion(tipo: TipoNotificacion, titulo: string, detalle: string): void {
    this.notificaciones = [{ tipo, titulo, detalle, fecha: new Date() }, ...this.notificaciones];
    if (this.notificaciones.length > 30) {
      this.notificaciones = this.notificaciones.slice(0, 30);
    }
  }

  // Reenvía manualmente el correo de confirmación de una orden usando EmailController
  reenviarConfirmacion(orden: Orden): void {
    if (this.enviandoReenvioId !== null) return;

    const asunto = `Confirmación de Compra - Pedido #${orden.id}`;
    const cuerpo =
      `¡Hola!\n\nReenviamos la confirmación de tu orden.\n` +
      `- N° de Orden: ${orden.id}\n` +
      `- Total pagado: $${orden.total}\n` +
      `- Estado: ${orden.estado}\n\n` +
      `¡Gracias por comprar en Pedidos360!`;

    this.enviandoReenvioId = orden.id;
    this.notificacionService.enviarCorreo(orden.clienteEmail, asunto, cuerpo).subscribe({
      next: (respuesta) => {
        this.zone.run(() => {
          this.enviandoReenvioId = null;
          this.registrarNotificacion('exito', `Correo reenviado`, `Orden #${orden.id} → ${orden.clienteEmail}`);
          console.log('[Notificaciones] Respuesta:', respuesta);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.enviandoReenvioId = null;
          this.registrarNotificacion(
            'error',
            'No se pudo enviar el correo',
            'Verifica el microservicio de notificaciones (puerto 8085) y su configuración SMTP.'
          );
          console.error('[Notificaciones] Error al reenviar:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Prueba directa del endpoint EmailController.java desde el panel
  enviarCorreoPrueba(): void {
    if (this.enviandoPrueba) return;
    if (!this.correoPruebaTo) {
      this.registrarNotificacion('error', 'Falta destinatario', 'Ingresa un correo de destino para la prueba.');
      return;
    }

    this.enviandoPrueba = true;
    this.notificacionService
      .enviarCorreo(this.correoPruebaTo, this.correoPruebaSubject, this.correoPruebaBody)
      .subscribe({
        next: (respuesta) => {
          this.zone.run(() => {
            this.enviandoPrueba = false;
            this.registrarNotificacion('exito', 'Correo de prueba enviado', `Destino: ${this.correoPruebaTo}`);
            console.log('[Notificaciones] Respuesta prueba:', respuesta);
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.zone.run(() => {
            this.enviandoPrueba = false;
            this.registrarNotificacion(
              'error',
              'Error al enviar correo de prueba',
              'Verifica el microservicio de notificaciones (puerto 8085) y su configuración SMTP.'
            );
            console.error('[Notificaciones] Error en prueba:', err);
            this.cdr.detectChanges();
          });
        }
      });
  }

  cerrarSesion(): void {
    this.authService.logoutRedirect();
  }
}
