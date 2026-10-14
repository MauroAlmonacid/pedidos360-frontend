import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActualizarEstadoDespachoRequest, Despacho } from '../models/despacho';
import { API_ENDPOINTS } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class DespachoService {
  // Apunta al microservicio pedidos360-despachos (local :8084 / API Gateway)
  private apiUrl = API_ENDPOINTS.despachos;

  constructor(private http: HttpClient) {}

  // GET /api/despachos -> todos los despachos registrados
  listarDespachos(): Observable<Despacho[]> {
    return this.http.get<Despacho[]>(this.apiUrl);
  }

  // GET /api/despachos/orden/{idOrden} -> despacho asociado a una orden
  consultarPorOrden(idOrden: number): Observable<Despacho> {
    return this.http.get<Despacho>(`${this.apiUrl}/orden/${idOrden}`);
  }

  // PUT /api/despachos/{id}/estado -> actualiza el estado del despacho
  actualizarEstado(id: number, estado: string): Observable<Despacho> {
    const body: ActualizarEstadoDespachoRequest = { estado };
    return this.http.put<Despacho>(`${this.apiUrl}/${id}/estado`, body);
  }
}
