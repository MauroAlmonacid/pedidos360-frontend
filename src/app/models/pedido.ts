// Representa la estructura exacta de un ítem dentro del carrito en Spring Boot
export interface Pedido {
  id?: number;          // Identificador opcional generado por el sistema
  idProducto?: number;  // ID del producto del catálogo (necesario para crear la orden)
  nombre: string;       // Nombre del producto que el usuario eligió
  precio: number;       // Precio unitario del artículo
  cantidad: number;     // Unidades solicitadas
}
