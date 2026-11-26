import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MsalService } from '@azure/msal-angular';
import { Producto } from './models/producto';
import { ProductoService } from './services/producto.service';
import { Pedido } from './models/pedido';
import { CarritoService } from './services/carrito.service';
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
import { PagoService } from './services/pago.service';
import { RecomendacionProducto } from './models/recomendacion';
import { RecomendacionService } from './services/recomendacion.service';

type Seccion = 'catalogo' | 'populares' | 'ordenes' | 'administracion';
type SubseccionAdmin = 'envios' | 'mensajes';

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

  itemsCarrito: Pedido[] = [];
  mostrarCarrito: boolean = false;

  seccionActiva: Seccion = 'catalogo';
  subseccionAdmin: SubseccionAdmin = 'envios';

  ordenes: Orden[] = [];
  cargandoOrdenes: boolean = false;
  errorOrdenes: string | null = null;
  generandoOrden: boolean = false;
  mensajeCheckout: string | null = null;
  errorCheckout: string | null = null;

  despachos: Despacho[] = [];
  cargandoDespachos: boolean = false;
  errorDespachos: string | null = null;
  actualizandoDespachoId: number | null = null;

  notificaciones: RegistroNotificacion[] = [];
  enviandoReenvioId: number | null = null;
  correoPruebaTo: string = '';
  correoPruebaSubject: string = 'Mensaje de prueba - Pedidos360';
  correoPruebaBody: string = 'Este es un correo de prueba enviado desde la tienda Pedidos360.';
  enviandoPrueba: boolean = false;

  topRecomendaciones: RecomendacionProducto[] = [];
  cargandoRecomendaciones: boolean = false;
  categoriaFiltro: string = 'TODAS';

  procesandoPagoOrdenId: number | null = null;
  mensajePago: string | null = null;
  errorPago: string | null = null;
  urlWebPayGenerada: string | null = null;

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
    private pagoService: PagoService,
    private recomendacionService: RecomendacionService,
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

          this.cargarCatalogo();
          this.cargarCarrito();
          this.cargarTopRecomendaciones();
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

  cerrarSesion(): void {
    this.authService.logoutRedirect();
  }

  // ============================================================
  // Utilidades visuales
  // ============================================================
  formatoPrecio(valor: number | undefined | null): string {
    const numero = Number(valor ?? 0);
    const seguro = Number.isFinite(numero) ? numero : 0;
    return `$ ${new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(seguro)} CLP`;
  }

  obtenerInicial(texto: string | null | undefined): string {
    const limpio = (texto || '').trim();
    return limpio ? limpio.charAt(0).toUpperCase() : '?';
  }

  etiquetaEstadoOrden(estado: string): string {
    const etiquetas: Record<string, string> = {
      COMPLETADO: 'Completada',
      PENDIENTE: 'Pendiente',
      CANCELADO: 'Cancelada'
    };
    return etiquetas[estado] ?? estado;
  }

  nombreProducto(idProducto: number): string {
    return this.productos.find((p) => p.id === idProducto)?.nombre ?? `Producto #${idProducto}`;
  }

  productoDeRecomendacion(rec: RecomendacionProducto): Producto | null {
    const id = Number(String(rec.idProducto).replace(/^PROD-/i, ''));
    if (Number.isFinite(id)) {
      const porId = this.productos.find((p) => p.id === id);
      if (porId) return porId;
    }
    return this.productos.find((p) => p.nombre === rec.nombreProducto) ?? null;
  }

  // ============================================================
  // Catálogo y carrito
  // ============================================================
  cargarCatalogo(): void {
    this.cargandoProductos = true;
    this.errorProductos = null;
    this.productoService.obtenerProductos().subscribe({
      next: (datos) => {
        this.zone.run(() => {
          this.productos = datos;
          this.cargandoProductos = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.zone.run(() => {
          this.cargandoProductos = false;
          this.errorProductos = 'No pudimos cargar el catálogo. Vuelve a intentarlo en unos instantes.';
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
    if (prod.stock === 0) return;

    const nuevoPedido: Pedido = {
      idProducto: prod.id,
      nombre: prod.nombre,
      precio: prod.precio,
      cantidad: 1
    };

    this.carritoService.agregarAlCarrito(nuevoPedido).subscribe({
      next: (pedidoRegistrado) => {
        this.zone.run(() => {
          if (pedidoRegistrado.idProducto == null) {
            pedidoRegistrado.idProducto = prod.id;
          }
          this.itemsCarrito.push(pedidoRegistrado);
          this.mostrarCarrito = true;
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('[Error al agregar al carrito]:', err)
    });

    this.registrarEventoProducto(prod, 'VISTA');
  }

  vaciarTodoElCarrito(): void {
    this.carritoService.vaciarCarrito().subscribe({
      next: () => {
        this.zone.run(() => {
          this.itemsCarrito = [];
          this.cdr.detectChanges();
        });
      },
      error: (err) => console.error('[Error al vaciar carrito]:', err)
    });
  }

  obtenerTotalUnidades(): number {
    return this.itemsCarrito.reduce((acumulado, item) => acumulado + item.cantidad, 0);
  }

  obtenerTotalCarrito(): number {
    return this.itemsCarrito.reduce((acumulado, item) => acumulado + item.precio * item.cantidad, 0);
  }

  alternarCarrito(): void {
    this.mostrarCarrito = !this.mostrarCarrito;
  }

  cerrarPanelCarrito(): void {
    this.mostrarCarrito = false;
  }

  // ============================================================
  // Navegación
  // ============================================================
  cambiarSeccion(seccion: Seccion | 'carrito'): void {
    if (seccion === 'carrito') {
      this.mostrarCarrito = true;
      return;
    }

    this.seccionActiva = seccion;
    this.mostrarCarrito = false;

    if (seccion === 'populares' && this.topRecomendaciones.length === 0) {
      this.cargarTopRecomendaciones();
    }
    if (seccion === 'ordenes' && this.ordenes.length === 0) {
      this.cargarOrdenes();
    }
    if (seccion === 'administracion' && this.subseccionAdmin === 'envios' && this.despachos.length === 0) {
      this.cargarDespachos();
    }

    this.cdr.detectChanges();
  }

  cambiarSubseccionAdmin(subseccion: SubseccionAdmin): void {
    this.subseccionAdmin = subseccion;
    if (subseccion === 'envios' && this.despachos.length === 0) {
      this.cargarDespachos();
    }
    this.cdr.detectChanges();
  }

  // ============================================================
  // Checkout: crear orden y abrir WebPay de inmediato
  // ============================================================
  generarOrden(): void {
    if (this.generandoOrden) return;

    this.mensajeCheckout = null;
    this.errorCheckout = null;
    this.mensajePago = null;
    this.errorPago = null;

    if (this.itemsCarrito.length === 0) {
      this.errorCheckout = 'Tu carrito está vacío. Agrega productos antes de continuar.';
      return;
    }

    if (!this.correoUsuario) {
      this.errorCheckout = 'No pudimos obtener tu correo. Inicia sesión nuevamente para continuar.';
      return;
    }

    const request: CrearOrdenRequest = {
      clienteEmail: this.correoUsuario,
      items: this.itemsCarrito.map((item) => ({
        idProducto: this.resolverIdProducto(item),
        cantidad: item.cantidad,
        precioUnitario: item.precio
      }))
    };

    this.generandoOrden = true;
    const ventanaPago = this.abrirVentanaPago();

    this.ordenService.crearOrden(request).subscribe({
      next: (orden) => {
        this.zone.run(() => {
          this.generandoOrden = false;
          this.ordenes = [orden, ...this.ordenes];
          this.mensajeCheckout = '¡Compra confirmada! Te enviamos el detalle a tu correo.';
          this.registrarNotificacion(
            'info',
            'Compra confirmada',
            'Te enviamos el detalle de tu compra a tu correo.'
          );

          for (const item of this.itemsCarrito) {
            const idProducto = this.resolverIdProducto(item);
            const prodCatalogo = this.productos.find((p) => p.id === idProducto);
            this.registrarEventoProducto(
              prodCatalogo ?? {
                id: idProducto,
                nombre: item.nombre,
                descripcion: '',
                categoria: 'General',
                precio: item.precio,
                stock: 0
              },
              'COMPRA'
            );
          }
          setTimeout(() => this.cargarTopRecomendaciones(), 1200);

          this.itemsCarrito = [];
          this.carritoService.vaciarCarrito().subscribe({
            error: (err) => console.error('[Checkout] No se pudo vaciar el carrito:', err)
          });

          this.cargarCatalogo();
          this.cargarDespachos();
          this.esperarDespachoDeOrden(orden.id, 6);

          this.iniciarPagoWebPay(orden, ventanaPago);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.generandoOrden = false;
          this.cerrarVentanaPago(ventanaPago);
          this.errorCheckout = 'No pudimos confirmar tu compra. Inténtalo nuevamente en unos minutos.';
          console.error('[Checkout] Error al crear la orden:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  private resolverIdProducto(item: Pedido): number {
    if (item.idProducto != null) return item.idProducto;
    const encontrado = this.productos.find((p) => p.nombre === item.nombre);
    return encontrado ? encontrado.id : item.id ?? 0;
  }

  private registrarEventoProducto(prod: Producto, tipo: 'VISTA' | 'COMPRA'): void {
    this.recomendacionService.registrarEvento({
      idCliente: this.correoUsuario || 'cliente',
      idProducto: `PROD-${prod.id}`,
      nombreProducto: prod.nombre,
      categoria: prod.categoria || 'General',
      tipoEvento: tipo
    }).subscribe({
      error: (err) => console.warn('[Recomendaciones] No se pudo registrar la interacción:', err)
    });
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
          this.errorOrdenes = 'No pudimos cargar tus órdenes. Vuelve a intentarlo en unos instantes.';
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
  // Envíos
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
          this.errorDespachos = 'No pudimos cargar el estado de tus envíos. Vuelve a intentarlo en unos instantes.';
          console.error('[Despachos] Error al listar envíos:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  private esperarDespachoDeOrden(idOrden: number, intentosRestantes: number): void {
    this.despachoService.consultarPorOrden(idOrden).subscribe({
      next: (despacho) => {
        this.zone.run(() => {
          this.mezclarDespacho(despacho);
          this.registrarNotificacion(
            'exito',
            'Envío preparado',
            'Ya puedes revisar el estado de tu entrega en Seguimiento de envíos.'
          );
          this.cdr.detectChanges();
        });
      },
      error: () => {
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
            'Estado del envío actualizado',
            `Ahora está ${this.etiquetaEstadoDespacho(actualizado.estado).toLowerCase()}.`
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
    this.seccionActiva = 'administracion';
    this.subseccionAdmin = 'envios';
    this.cargarDespachos();
  }

  etiquetaEstadoDespacho(estado: string): string {
    return this.etiquetasEstadoDespacho[estado] ?? estado;
  }

  claseEstadoDespacho(estado: string): string {
    return this.coloresEstadoDespacho[estado] ?? 'info';
  }

  // ============================================================
  // Mensajes
  // ============================================================
  registrarNotificacion(tipo: TipoNotificacion, titulo: string, detalle: string): void {
    this.notificaciones = [{ tipo, titulo, detalle, fecha: new Date() }, ...this.notificaciones];
    if (this.notificaciones.length > 30) {
      this.notificaciones = this.notificaciones.slice(0, 30);
    }
  }

  reenviarConfirmacion(orden: Orden): void {
    if (this.enviandoReenvioId !== null) return;

    const asunto = `Confirmación de compra - Pedido #${orden.id}`;
    const cuerpo =
      `¡Hola!\n\nAquí tienes el detalle de tu compra.\n` +
      `- N° de orden: ${orden.id}\n` +
      `- Total: ${this.formatoPrecio(orden.total)}\n` +
      `- Estado: ${this.etiquetaEstadoOrden(orden.estado)}\n\n` +
      `¡Gracias por comprar en Pedidos360!`;

    this.enviandoReenvioId = orden.id;
    this.notificacionService.enviarCorreo(orden.clienteEmail, asunto, cuerpo).subscribe({
      next: () => {
        this.zone.run(() => {
          this.enviandoReenvioId = null;
          this.registrarNotificacion('exito', 'Correo enviado', `Reenviamos el detalle a ${orden.clienteEmail}.`);
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.enviandoReenvioId = null;
          this.registrarNotificacion('error', 'No pudimos enviar el correo', 'Vuelve a intentarlo más tarde.');
          console.error('[Notificaciones] Error al reenviar:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  enviarCorreoPrueba(): void {
    if (this.enviandoPrueba) return;
    if (!this.correoPruebaTo) {
      this.registrarNotificacion('error', 'Falta el destinatario', 'Ingresa un correo para continuar.');
      return;
    }

    this.enviandoPrueba = true;
    this.notificacionService
      .enviarCorreo(this.correoPruebaTo, this.correoPruebaSubject, this.correoPruebaBody)
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.enviandoPrueba = false;
            this.registrarNotificacion('exito', 'Correo enviado', `Mensaje enviado a ${this.correoPruebaTo}.`);
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.zone.run(() => {
            this.enviandoPrueba = false;
            this.registrarNotificacion(
              'error',
              'No pudimos enviar el correo',
              'Revisa los datos e inténtalo nuevamente.'
            );
            console.error('[Notificaciones] Error en el envío:', err);
            this.cdr.detectChanges();
          });
        }
      });
  }

  // ============================================================
  // Productos más populares
  // ============================================================
  cargarTopRecomendaciones(): void {
    this.cargandoRecomendaciones = true;
    const peticion$ =
      this.categoriaFiltro === 'TODAS'
        ? this.recomendacionService.obtenerTop5()
        : this.recomendacionService.obtenerTopPorCategoria(this.categoriaFiltro);

    peticion$.subscribe({
      next: (lista) => {
        this.zone.run(() => {
          this.topRecomendaciones = lista ?? [];
          this.cargandoRecomendaciones = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.cargandoRecomendaciones = false;
          console.error('[Recomendaciones] Error al cargar los favoritos:', err);
          this.cdr.detectChanges();
        });
      }
    });
  }

  filtrarRecomendaciones(categoria: string): void {
    this.categoriaFiltro = categoria;
    this.cargarTopRecomendaciones();
  }

  // ============================================================
  // WebPay
  // ============================================================
  pagarOrdenWebPay(orden: Orden): void {
    const ventanaPago = this.abrirVentanaPago();
    this.iniciarPagoWebPay(orden, ventanaPago);
  }

  private abrirVentanaPago(): Window | null {
    try {
      return window.open('', '_blank');
    } catch {
      return null;
    }
  }

  private cerrarVentanaPago(ventana: Window | null): void {
    if (ventana && !ventana.closed) {
      ventana.close();
    }
  }

  private iniciarPagoWebPay(orden: Orden, ventanaPago: Window | null): void {
    if (this.procesandoPagoOrdenId !== null) return;

    this.mensajePago = null;
    this.errorPago = null;
    this.urlWebPayGenerada = null;
    this.procesandoPagoOrdenId = orden.id;

    this.pagoService.iniciarPago({
      clientId: this.correoUsuario || orden.clienteEmail,
      amount: orden.total,
      transactionId: `ORD-${orden.id}`
    }).subscribe({
      next: (res) => {
        this.zone.run(() => {
          this.procesandoPagoOrdenId = null;
          const urlFinal = res.url && res.token ? `${res.url}?token_ws=${res.token}` : res.url || null;
          this.urlWebPayGenerada = urlFinal;
          this.mensajePago = 'Tu pago está listo. Completa el proceso en WebPay para finalizar tu compra.';
          this.registrarNotificacion(
            'exito',
            'Pago iniciado',
            'Completa el proceso en WebPay para finalizar tu compra.'
          );

          if (urlFinal) {
            if (ventanaPago && !ventanaPago.closed) {
              ventanaPago.location.href = urlFinal;
              ventanaPago.focus();
            } else {
              window.open(urlFinal, '_blank');
            }
          } else {
            this.cerrarVentanaPago(ventanaPago);
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.procesandoPagoOrdenId = null;
          this.cerrarVentanaPago(ventanaPago);
          if (err.status === 429) {
            this.errorPago = 'Demasiados intentos en poco tiempo. Espera un momento y vuelve a intentarlo.';
          } else {
            this.errorPago = 'No pudimos iniciar el pago. Inténtalo nuevamente.';
          }
          this.registrarNotificacion('error', 'No pudimos iniciar el pago', this.errorPago);
          this.cdr.detectChanges();
        });
      }
    });
  }
}
