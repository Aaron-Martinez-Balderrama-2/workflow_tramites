import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private API_URL = '/api';

  constructor(private http: HttpClient) { }

  // ----- USUARIOS -----
  getUsuarios(): Observable<any> {
    return this.http.get(`${this.API_URL}/usuarios`);
  }
  
  crearUsuario(usuario: any): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios`, usuario);
  }

  // ----- AREAS DE TRABAJO -----
  getAreas(): Observable<any> {
    return this.http.get(`${this.API_URL}/areas`);
  }
  
  crearArea(area: any): Observable<any> {
    return this.http.post(`${this.API_URL}/areas`, area);
  }

  // ----- POLITICAS Y DIAGRAMAS -----
  guardarPolitica(nombre: string, descripcion: string, diagramaXML: string): Observable<any> {
    const payload = {
      nombre: nombre,
      descripcion: descripcion,
      // Usamos "enlaces" como el contenedor del XML en la DB por ahora, o agregamos "xml"
      // Lo meteremos en el objeto dinamico de la base de datos
      nodos: [], 
      enlaces: [],
      xml_bpmn: diagramaXML,
      creadorId: 'admin-123'
    };
    return this.http.post(`${this.API_URL}/politicas`, payload);
  }

  consultarGemini(prompt: string, diagramaXML: string): Observable<any> {
    const payload = { prompt, diagrama: diagramaXML };
    return this.http.post(`${this.API_URL}/politicas/asistente-ia`, payload, { responseType: 'text' });
  }
}
