import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Pedido } from '../models/pedido';
import { API_ENDPOINTS } from '../config/api.config';

@Injectable({
  providedIn: 'root' // Permite inyectar este servicio en cualquier componente
})
export class CarritoService {
  // URL directa al microservicio de carrito en el puerto 8082
  private apiUrl = API_ENDPOINTS.carrito; 

  // Inyectamos HttpClient para comunicarnos por la red
  constructor(private http: HttpClient) {}

  // Consulta la lista actual de pedidos guardados en memoria en Spring Boot
  obtenerCarrito(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(this.apiUrl);
  }

  // Envía un nuevo pedido al backend mediante el método HTTP POST
  agregarAlCarrito(pedido: Pedido): Observable<Pedido> {
    return this.http.post<Pedido>(this.apiUrl, pedido);
  }

  // Limpia todos los registros en el backend mediante HTTP DELETE
  vaciarCarrito(): Observable<void> {
    return this.http.delete<void>(this.apiUrl);
  }
}