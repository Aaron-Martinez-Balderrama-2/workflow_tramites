import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject } from 'rxjs';

export interface SyncDelta {
  emisorId: string;
  autorNombre: string;
  campoId: string;
  valor: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class FormularioSyncService {
  private client: Client;
  private formDeltaSubject = new Subject<SyncDelta>();
  public formDelta$ = this.formDeltaSubject.asObservable();
  
  private connectionStatusSubject = new Subject<boolean>();
  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  
  private currentSubscription: any = null;

  constructor() {
    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws-diagrama'),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000
    });
  }

  conectar(tramiteId: string, miUsuarioId: string) {
    const subscribeToTopic = () => {
      if (this.currentSubscription) {
          this.currentSubscription.unsubscribe();
      }
      this.currentSubscription = this.client.subscribe(`/topic/tramite/${tramiteId}`, (message: Message) => {
        if (message.body) {
          const payload = JSON.parse(message.body);
          if (payload.emisorId !== miUsuarioId) {
             this.formDeltaSubject.next(payload);
          }
        }
      });
      this.connectionStatusSubject.next(true);
    };

    if(!this.client.active) {
      this.client.onConnect = () => {
        subscribeToTopic();
      };
      this.client.onDisconnect = () => {
        this.connectionStatusSubject.next(false);
      };
      this.client.activate();
    } else {
      subscribeToTopic();
    }
  }

  enviarDelta(tramiteId: string, delta: SyncDelta) {
    if (this.client.active) {
      this.client.publish({
        destination: `/app/tramite/${tramiteId}`,
        body: JSON.stringify(delta)
      });
    }
  }

  desconectar() {
    if (this.client.active) {
      this.client.deactivate();
    }
  }
}
