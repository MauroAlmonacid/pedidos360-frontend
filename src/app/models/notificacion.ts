// ============================================================
// Modelos que reflejan las clases Java del microservicio
// pedidos360-notificaciones:
//   dto/ItemDTO.java
//   dto/EventoPedidoCreado.java
// y el contrato del EmailController.java:
//   POST /api/email/enviar?to=&subject=&body=
// ============================================================

// Corresponde a dto/ItemDTO.java
export interface ItemNotificacion {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
}

// Corresponde a dto/EventoPedidoCreado.java (payload que consume
// NotificacionConsumer.java desde RabbitMQ). El frontend lo usa para
// construir un reenvio manual del correo de confirmacion.
export interface EventoPedidoCreado {
  idOrden: number;
  clienteEmail: string;
  total: number;
  items: ItemNotificacion[];
}

// Payload del endpoint EmailController.java (viajan como query params)
export interface EnviarCorreoRequest {
  to: string;
  subject: string;
  body: string;
}

// Registro local de notificaciones mostradas en el panel
export type TipoNotificacion = 'exito' | 'info' | 'error';

export interface RegistroNotificacion {
  tipo: TipoNotificacion;
  titulo: string;
  detalle: string;
  fecha: Date;
}
