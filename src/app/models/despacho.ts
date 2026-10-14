// ============================================================
// Modelo que refleja exactamente la entidad
// pedidos360-despachos/model/Despacho.java
// ============================================================

export interface Despacho {
  id: number;
  idOrden: number;
  clienteEmail: string;
  codigoSeguimiento: string;
  estado: string;
  fechaCreacion: string; // LocalDateTime -> ISO string
}

// Payload para el endpoint PUT /api/despachos/{id}/estado
export interface ActualizarEstadoDespachoRequest {
  estado: string;
}

// Estados manejados por el flujo de despachos.
// El DespachoConsumer.java crea los despachos en "EN_PREPARACION".
export type EstadoDespacho = 'EN_PREPARACION' | 'EN_RUTA' | 'ENTREGADO' | 'CANCELADO';

export const ESTADOS_DESPACHO: EstadoDespacho[] = [
  'EN_PREPARACION',
  'EN_RUTA',
  'ENTREGADO',
  'CANCELADO',
];

// Etiquetas legibles para la interfaz
export const ETIQUETAS_ESTADO_DESPACHO: Record<string, string> = {
  EN_PREPARACION: 'En preparación',
  EN_RUTA: 'En ruta',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado',
};

// Clases CSS de color para los badges de despacho
export const COLORES_ESTADO_DESPACHO: Record<string, string> = {
  EN_PREPARACION: 'warning',
  EN_RUTA: 'info',
  ENTREGADO: 'success',
  CANCELADO: 'danger',
};

export const ESTADO_DESPACHO_INICIAL = 'EN_PREPARACION';
