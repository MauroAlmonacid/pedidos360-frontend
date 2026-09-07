import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto';

@Injectable({
  providedIn: 'root' // Disponible para cualquier parte de la aplicación
})
export class ProductoService {
  // URL del endpoint expuesto por nuestro backend en Spring Boot
  private apiUrl = 'https://c9dnj0qg84.execute-api.us-east-1.amazonaws.com/productos';

  constructor(private http: HttpClient) {}

  // Consulta la API y devuelve una transmisión asíncrona (Observable) con la lista
  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }
}