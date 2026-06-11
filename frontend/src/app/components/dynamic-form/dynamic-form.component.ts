import { Component, Input, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormularioSyncService, SyncDelta } from '../../services/formulario-sync.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.css'
})
export class DynamicFormComponent implements OnInit, OnDestroy {
  @Input() formSchema: any[] = [];
  @Input() formData: any = {};
  @Input() tramiteId: string = '';
  @Input() miUsuarioId: string = '';
  @Input() miNombre: string = 'Usuario';
  @Input() readonly: boolean = false;
  
  @Output() formDataChange = new EventEmitter<any>();

  ultimaModificacion: { autorNombre: string, fecha: Date } | null = null;
  modificacionesPorCampo: { [key: string]: { autorNombre: string, fecha: Date } } = {};

  private deltaSub: Subscription | null = null;

  // AI Voice Recording State
  isRecording = false;
  isProcessing = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  constructor(
    private formSync: FormularioSyncService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    if (this.tramiteId && this.miUsuarioId) {
      this.formSync.conectar(this.tramiteId, this.miUsuarioId);
      this.deltaSub = this.formSync.formDelta$.subscribe(delta => {
        if (delta.emisorId !== this.miUsuarioId) {
          this.formData[delta.campoId] = delta.valor;
          this.formDataChange.emit(this.formData);

          const mod = { autorNombre: delta.autorNombre, fecha: new Date(delta.timestamp) };
          this.ultimaModificacion = mod;
          this.modificacionesPorCampo[delta.campoId] = mod;
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.deltaSub) this.deltaSub.unsubscribe();
    this.formSync.desconectar();
    
    // Cleanup media recorder if active
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  onFieldChange(campoId: string, event: any) {
    if (this.readonly) return;
    
    let valor = event.target ? event.target.value : event;
    if (event.target && event.target.type === 'checkbox') {
        valor = event.target.checked;
    }

    this.formData[campoId] = valor;
    this.formDataChange.emit(this.formData);

    const mod = { autorNombre: this.miNombre + " (Tú)", fecha: new Date() };
    this.ultimaModificacion = mod;
    this.modificacionesPorCampo[campoId] = mod;

    if (this.tramiteId) {
      this.formSync.enviarDelta(this.tramiteId, {
        emisorId: this.miUsuarioId,
        autorNombre: this.miNombre,
        campoId: campoId,
        valor: valor,
        timestamp: Date.now()
      });
    }
  }

  // --- AI Voice Integration ---
  async toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = () => this.processAudio();
      
      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.error('Error accediendo al micrófono:', err);
      alert('No se pudo acceder al micrófono. Asegúrate de dar los permisos.');
    }
  }

  private stopRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.isRecording = false;
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
  }

  private async processAudio() {
    if (this.audioChunks.length === 0) return;
    
    this.isProcessing = true;
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', audioBlob, 'grabacion.webm');
    formData.append('schemaStr', JSON.stringify(this.formSchema));

    try {
      // LLamamos al proxy de Spring Boot
      const response: any = await firstValueFrom(
        this.http.post('/api/ai/transcribe', formData)
      );

      if (response && response.success && response.extractedData) {
        // Autocompletar los campos con lo devuelto por la IA
        for (const [key, value] of Object.entries(response.extractedData)) {
          // Emitimos como si el usuario lo hubiera tecleado para que se sincronice colaborativamente
          this.onFieldChange(key, value);
        }
        
        console.log("Transcripción de la IA:", response.transcription);
      }
    } catch (err) {
      console.error('Error procesando el audio con IA:', err);
      alert('Hubo un error al procesar el audio con la Inteligencia Artificial.');
    } finally {
      this.isProcessing = false;
    }
  }
}
