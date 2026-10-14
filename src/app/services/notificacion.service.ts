import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class NotificacionService {
  // Apunta al microservicio pedidos360-notificaciones (local :8085 / API Gateway)
  private apiUrl = API_ENDPOINTS.email;

  constructor(private http: HttpClient) {}

  // POST /api/email/enviar?to=&subject=&body=
  // EmailController.java recibe los datos como @RequestParam y devuelve texto plano.
  enviarCorreo(to: string, subject: string, body: string): Observable<string> {
    const params = new HttpParams()
      .set('to', to)
      .set('subject', subject)
      .set('body', body);

    return this.http.post(`${this.apiUrl}/enviar`, null, {
      params,
      responseType: 'text'
    });
  }
}
