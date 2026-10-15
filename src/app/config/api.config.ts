
export const API_GATEWAY_BASE = 'https://c9dnj0qg84.execute-api.us-east-1.amazonaws.com';

export const API_ENDPOINTS = {
  productos: `${API_GATEWAY_BASE}/productos`,
  carrito: `${API_GATEWAY_BASE}/carrito`,
  ordenes: `${API_GATEWAY_BASE}/ordenes`,
  despachos: `${API_GATEWAY_BASE}/despachos`,
  email: `${API_GATEWAY_BASE}/api/email`,
} as const;
