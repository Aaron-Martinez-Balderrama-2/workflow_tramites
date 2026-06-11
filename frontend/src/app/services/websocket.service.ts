import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private client: Client;
  private diagramaSubject = new Subject<string>();
  public diagramaActualizado$ = this.diagramaSubject.asObservable();
  
  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws-diagrama'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });

    this.client.onConnect = (frame) => {
      console.log('Conectado al WebSocket de Colaboración');
    };

    this.client.onStompError = (frame) => {
      console.error('Error de Broker: ' + frame.headers['message']);
      console.error('Detalles: ' + frame.body);
    };
  }

  conectar(empresaId: string, miUsuarioId: string) {
    if(!this.client.active) {
      this.client.onConnect = () => {
        // Suscribirse a los cambios del diagrama de la empresa actual
        this.client.subscribe(`/topic/diagrama/${empresaId}`, (message: Message) => {
          if (message.body) {
            const payload = JSON.parse(message.body);
            // Ignorar los mensajes enviados por uno mismo
            if (payload.emisorId !== miUsuarioId) {
               this.diagramaSubject.next(payload.xml);
            }
          }
        });
      };
      this.client.activate();
    }
  }

  enviarCambio(empresaId: string, xml: string, emisorId: string) {
    if (this.client.active) {
      this.client.publish({
        destination: `/app/diagrama/${empresaId}`,
        body: JSON.stringify({ xml, emisorId })
      });
    }
  }

  desconectar() {
    if (this.client.active) {
      this.client.deactivate();
    }
  }
}
