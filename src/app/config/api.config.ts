// ============================================================
// Configuracion central de endpoints de los microservicios.
// Todas las peticiones viajan por el API Gateway de AWS, que es
// el dominio protegido por el interceptor de MSAL (auth-config.ts).
//
// Mapeo de rutas (segun el @RequestMapping de cada controlador):
//   Productos        -> Pedidos360ProductosApplication       (local :8080)
//   Carrito          -> CarritoController  @RequestMapping("/carrito")      (local :8082)
//   Ordenes          -> OrdenController    @RequestMapping("/ordenes")      (local :8083)
//   Despachos        -> DespachoController @RequestMapping("/api/despachos")(local :8084)
//   Notificaciones   -> EmailController    @RequestMapping("/api/email")    (local :8085)
//
// Si el API Gateway expone las rutas con otro prefijo (por ejemplo
// quitando el "/api"), basta con ajustar unicamente este archivo.
// ============================================================

export const API_GATEWAY_BASE = 'https://c9dnj0qg84.execute-api.us-east-1.amazonaws.com';

export const API_ENDPOINTS = {
  productos: `${API_GATEWAY_BASE}/productos`,
  carrito: `${API_GATEWAY_BASE}/carrito`,
  ordenes: `${API_GATEWAY_BASE}/ordenes`,
  despachos: `${API_GATEWAY_BASE}/api/despachos`,
  email: `${API_GATEWAY_BASE}/api/email`,
} as const;
