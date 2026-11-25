export interface RecomendacionProducto {
  idProducto: string;      
  nombreProducto: string;  
  categoria: string;      
  vistas: number;          
  compras: number;        
  puntaje: number;         
  actualizadoEn?: string;  
}

export interface EventoProductoRequest {
  idCliente: string;              
  idProducto: string;              
  nombreProducto: string;        
  categoria: string;            
  tipoEvento: 'VISTA' | 'COMPRA'; 
}