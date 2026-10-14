import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto';
import { API_ENDPOINTS } from '../config/api.config';

@Injectable({
  providedIn: 'root' // Disponible para cualquier parte de la aplicación
})
export class ProductoService {
  // URL del endpoint expuesto por nuestro backend en Spring Boot
  private apiUrl = API_ENDPOINTS.productos;

  constructor(private http: HttpClient) {}

  // Consulta la API y devuelve una transmisión asíncrona (Observable) con la lista
  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }
}