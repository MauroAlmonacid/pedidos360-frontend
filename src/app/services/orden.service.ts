import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CrearOrdenRequest, Orden } from '../models/orden';
import { API_ENDPOINTS } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class OrdenService {
  // Apunta al microservicio pedidos360-ordenes (local :8083 / API Gateway)
  private apiUrl = API_ENDPOINTS.ordenes;

  constructor(private http: HttpClient) {}

  // POST /ordenes -> crea la orden, descuenta stock y dispara los eventos
  crearOrden(request: CrearOrdenRequest): Observable<Orden> {
    return this.http.post<Orden>(this.apiUrl, request);
  }

  // GET /ordenes -> listado completo de ordenes
  listarOrdenes(): Observable<Orden[]> {
    return this.http.get<Orden[]>(this.apiUrl);
  }

  // NOTA: OrdenController.java no expone busqueda por ID ni por cliente.
  // Si se agregan en el backend, descomentar los metodos siguientes.
  //
  // obtenerPorId(id: number): Observable<Orden> {
  //   return this.http.get<Orden>(`${this.apiUrl}/${id}`);
  // }
  //
  // obtenerPorCliente(email: string): Observable<Orden[]> {
  //   return this.http.get<Orden[]>(`${this.apiUrl}/cliente/${email}`);
  // }
}
