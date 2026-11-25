import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api.config';
import { IniciarPagoRequest, IniciarPagoResponse } from '../models/pago';

@Injectable({
  providedIn: 'root' 
})
export class PagoService {
  
  private apiUrl = API_ENDPOINTS.pagos;

  
  constructor(private http: HttpClient) {}

 
  iniciarPago(request: IniciarPagoRequest): Observable<IniciarPagoResponse> {
    return this.http.post<IniciarPagoResponse>(`${this.apiUrl}/iniciar`, request);
  }
}