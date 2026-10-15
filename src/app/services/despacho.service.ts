import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { Observable } from 'rxjs';

import { ActualizarEstadoDespachoRequest, Despacho } from '../models/despacho';

import { API_ENDPOINTS } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class DespachoService {
  private apiUrl = API_ENDPOINTS.despachos;

  constructor(private http: HttpClient) {}

  listarDespachos(): Observable<Despacho[]> {
    return this.http.get<Despacho[]>(this.apiUrl);
  }

  consultarPorOrden(idOrden: number): Observable<Despacho> {
    return this.http.get<Despacho>(`${this.apiUrl}/orden/${idOrden}`);
  }

  actualizarEstado(id: number, estado: string): Observable<Despacho> {
    const body: ActualizarEstadoDespachoRequest = { estado };
    return this.http.put<Despacho>(`${this.apiUrl}/${id}/estado`, body);
  }
}