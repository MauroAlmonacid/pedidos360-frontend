import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api.config';
import { EventoProductoRequest, RecomendacionProducto } from '../models/recomendacion';

@Injectable({
  providedIn: 'root'
})
export class RecomendacionService {
  private apiUrl = API_ENDPOINTS.recomendaciones;

  constructor(private http: HttpClient) {}

  obtenerTop5(): Observable<RecomendacionProducto[]> {
    return this.http.get<RecomendacionProducto[]>(`${this.apiUrl}/top`);
  }

  obtenerTopPorCategoria(categoria: string): Observable<RecomendacionProducto[]> {
    return this.http.get<RecomendacionProducto[]>(`${this.apiUrl}/top/${categoria}`);
  }

  registrarEvento(evento: EventoProductoRequest): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/eventos`, evento);
  }
}