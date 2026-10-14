// ============================================================
// Modelos que reflejan exactamente las clases Java del
// microservicio pedidos360-ordenes:
//   model/Orden.java
//   model/OrdenItem.java
//   dto/CrearOrdenRequest.java
// ============================================================

// Corresponde a model/OrdenItem.java
export interface OrdenItem {
  id?: number;
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
}

// Corresponde a model/Orden.java
export interface Orden {
  id: number;
  clienteEmail: string;
  total: number;
  fechaCreacion: string; // LocalDateTime -> ISO string
  estado: string;
  items: OrdenItem[];
}

// Corresponde a CrearOrdenRequest.ItemRequest
export interface CrearOrdenItemRequest {
  idProducto: number;
  cantidad: number;
  precioUnitario: number;
}

// Corresponde a dto/CrearOrdenRequest.java
export interface CrearOrdenRequest {
  clienteEmail: string;
  items: CrearOrdenItemRequest[];
}

// Estado que asigna OrdenService.java al crear la orden
export const ESTADO_ORDEN_COMPLETADO = 'COMPLETADO';

// Paleta de colores para los badges de estado de la orden
export const COLORES_ESTADO_ORDEN: Record<string, string> = {
  COMPLETADO: 'success',
  PENDIENTE: 'warning',
  CANCELADO: 'danger',
};
