import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpedienteService {
  private apiUrl = '/api/tramites';

  constructor(private http: HttpClient) {}

  getHistorial(tramiteId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${tramiteId}/historial`);
  }

  getTramitesPorEmpresa(empresaId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/empresa/${empresaId}`);
  }
}
