import { Component, AfterViewInit, ViewChild, ElementRef, ViewEncapsulation, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import BpmnModeler from 'bpmn-js/lib/Modeler';
import { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } from 'bpmn-js-properties-panel';
import camundaModdleDescriptor from 'camunda-bpmn-moddle/resources/camunda.json';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { WebSocketService } from '../../services/websocket.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-lienzo-diseno',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="flex flex-col h-screen">
      <div class="bg-gray-100 p-4 border-b flex justify-between items-center">
        <div class="flex items-center gap-4">
            <h2 class="text-xl font-bold">Modelador de Política de Negocio</h2>
            <button (click)="abrirModalCodigo()" class="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-3 text-sm rounded">
                Código -> Diagrama
            </button>
            <button (click)="verificarUsurpacion()" class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 text-sm rounded">
                Verificar Usurpación de Funciones
            </button>
            <button (click)="guardarDiagrama()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 text-sm rounded flex items-center gap-1">
                💾 Guardar
            </button>
        </div>
        <div class="flex gap-2 items-center">
            <button (click)="toggleHistorial()" class="text-gray-600 hover:text-gray-800 font-semibold text-sm underline px-2">
                Mis Diagramas ({{ listaPolitas.length }})
            </button>
            <button (click)="generarSistema()" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded shadow">
                🚀 Generar Sistema (Activar)
            </button>
        </div>
      </div>
      <div class="flex flex-1 relative bg-white overflow-hidden">
        <!-- Panel de Historial Lateral -->
        <div *ngIf="mostrarHistorial" class="w-64 bg-gray-50 border-r overflow-y-auto flex flex-col shadow-inner animate-in slide-in-from-left duration-300">
            <div class="p-4 border-b bg-gray-100 font-bold flex justify-between items-center text-sm">
                <span>HISTORIAL DE DISEÑOS</span>
                <button (click)="mostrarHistorial = false" class="text-gray-500 hover:text-black">&times;</button>
            </div>
            <div *ngFor="let pol of listaPolitas" 
                 (click)="cargarPolitica(pol)"
                 class="p-4 border-b hover:bg-blue-50 cursor-pointer transition-colors group">
                <div class="font-semibold text-xs text-blue-600 mb-1">ID: {{ pol.id?.substring(0,8) }}</div>
                <div class="text-sm font-bold text-gray-800">{{ pol.nombre || 'Diagrama sin nombre' }}</div>
                <div class="text-xs text-gray-500">{{ pol.fechaCreacion | date:'short' }}</div>
                <div class="mt-2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">Haz clic para cargar</div>
            </div>
            <div *ngIf="listaPolitas.length === 0" class="p-8 text-center text-gray-400 text-sm">
                No tienes diagramas guardados aún.
            </div>
        </div>
        <div #canvas class="flex-1 h-full"></div>
        <div #properties class="w-80 border-l bg-gray-50 overflow-y-auto" id="properties-panel"></div>
        <!-- Burbuja Flotante del Asistente Gemini AI -->
        <div [style.left.px]="geminiX" [style.top.px]="geminiY" class="absolute z-50 flex flex-col items-end">
            <!-- La Burbuja en sí (Botón flotante) -->
            <button *ngIf="!mostrarAsistente" 
                    (mousedown)="onDragStart($event)"
                    (click)="toggleAsistente()"
                    class="w-16 h-16 bg-slate-900 rounded-full shadow-2xl flex items-center justify-center text-white text-3xl cursor-move hover:bg-black transition-colors border-4 border-white">
                🦙
            </button>

            <!-- Panel Expandido del Asistente Gemini -->
            <div *ngIf="mostrarAsistente" class="bg-white border-2 border-blue-500 rounded-xl shadow-2xl w-96 flex flex-col overflow-hidden" style="height: 450px;">
                <!-- Header Arrastrable -->
                <div (mousedown)="onDragStart($event)" class="bg-slate-900 text-white p-3 font-bold flex justify-between items-center cursor-move">
                    <span class="flex items-center gap-2">🦙 Asistente Ollama AI <span class="text-xs font-normal" *ngIf="procesandoIA">(Procesando local...)</span></span>
                    <button (click)="toggleAsistente()" class="text-white hover:text-gray-200 text-xl font-bold px-2">&times;</button>
                </div>
                <!-- Cuerpo del Chat -->
                <div class="flex-1 p-4 overflow-y-auto bg-gray-50 text-sm flex flex-col gap-3">
                    <div *ngFor="let msg of mensajesChat" 
                         [ngClass]="msg.soyYo ? 'bg-blue-600 text-white self-end rounded-tr-none' : 'bg-blue-100 text-blue-900 self-start rounded-tl-none'"
                         class="p-3 rounded-lg shadow-sm w-5/6 whitespace-pre-wrap">
                        {{ msg.texto }}
                    </div>

                    <div *ngIf="mensajesChat.length === 0" class="bg-blue-100 text-blue-900 p-3 rounded-lg rounded-tl-none self-start shadow-sm w-5/6">
                        ¡Hola! Soy tu asistente BPMN. Dime qué quieres modificar en tu diagrama, o envíame una imagen/audio de referencia.
                    </div>
                    
                    <!-- Previsualización de Imagen Cargada -->
                    <div *ngIf="imagenBase64" class="self-end relative bg-gray-200 p-2 rounded-lg mt-2">
                        <img [src]="imagenBase64" class="max-h-32 rounded border shadow-sm">
                        <button (click)="imagenBase64 = null" class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md">x</button>
                    </div>

                    <div *ngIf="audioBase64" class="self-end relative bg-blue-50 p-2 rounded-lg mt-2 border border-blue-200">
                        <span class="text-xs text-blue-700 font-bold flex items-center gap-1">🎵 Audio listo para enviar</span>
                        <button (click)="audioBase64 = null" class="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow-md">x</button>
                    </div>
                </div>
                <!-- Área de Input -->
                <div class="p-3 bg-white border-t flex flex-col gap-3">
                    <textarea [(ngModel)]="promptIA" placeholder="Ej: Agrega un carril para Legal..." class="w-full p-3 border rounded-lg text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"></textarea>
                    <div class="flex gap-2 justify-between items-center">
                        <div class="flex gap-2">
                            <input type="file" #fileInput (change)="cargarImagen($event)" class="hidden" accept="image/*">
                            <button (click)="fileInput.click()" class="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center text-lg shadow-sm transition" title="Adjuntar Imagen">📷</button>
                            <button (click)="toggleGrabacion()" 
                                    [ngClass]="grabandoAudio ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'"
                                    class="p-2 rounded-full w-10 h-10 flex items-center justify-center text-lg shadow-sm transition" title="Grabar Audio">
                                🎙️
                            </button>
                        </div>
                        <button (click)="enviarPromptIA()" [disabled]="procesandoIA || (!promptIA && !imagenBase64 && !audioBase64)" class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-full font-bold shadow-md transition-colors flex items-center gap-2">
                            <span *ngIf="!procesandoIA">Enviar</span>
                            <span *ngIf="procesandoIA">⌛</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <!-- Modal Código -> Diagrama -->
      <div *ngIf="mostrarModalCodigo" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-xl w-3/4 max-w-4xl h-3/4 flex flex-col">
            <h3 class="text-lg font-bold mb-4">Importar BPMN desde Código</h3>
            <textarea [(ngModel)]="codigoBPMN" class="flex-1 p-2 border font-mono text-xs mb-4 w-full" placeholder="Pega el código XML aquí..."></textarea>
            <div class="flex justify-end gap-2">
                <button (click)="mostrarModalCodigo = false" class="px-4 py-2 bg-gray-300 rounded">Cancelar</button>
                <button (click)="generarDesdeCodigo()" class="px-4 py-2 bg-blue-600 text-white font-bold rounded">Generar Diagrama</button>
            </div>
        </div>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  styles: [`
    .bjs-powered-by { display: none; }
  `]
})
export class LienzoDisenoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas', { static: true }) private canvas!: ElementRef;
  @ViewChild('properties', { static: true }) private propertiesPanel!: ElementRef;
  private modeler: any;
  
  // Variables Gemini y Burbuja
  promptIA = '';
  imagenBase64: string | null = null;
  audioBase64: string | null = null;
  procesandoIA = false;
  mostrarAsistente = false;
  mensajesChat: {texto: string, soyYo: boolean}[] = [];
  
  // Audio Recording
  grabandoAudio = false;
  private mediaRecorder: any;
  private audioChunks: any[] = [];
  
  // Posición inicial de la burbuja (abajo a la derecha)
  geminiX = window.innerWidth - 450;
  geminiY = window.innerHeight - 500;
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  
  // Variables Código -> Diagrama
  mostrarModalCodigo = false;
  codigoBPMN = '';

  // Variables Historial
  mostrarHistorial = false;
  listaPolitas: any[] = [];
  idPoliticaActual: string | null = null;

  // Variables WebSockets
  empresaId: string | null = null;
  usuarioId: string | null = null;
  ignorandoCambioRemoto = false;

  constructor(private http: HttpClient, private wsService: WebSocketService, private authService: AuthService) {
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.empresaId = user.empresaId;
        this.usuarioId = user.id;
      }
    });
  }

  ngAfterViewInit() {
    this.modeler = new BpmnModeler({
      container: this.canvas.nativeElement,
      propertiesPanel: {
        parent: this.propertiesPanel.nativeElement
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule
      ],
      moddleExtensions: {
        camunda: camundaModdleDescriptor
      },
      keyboard: { bindTo: document }
    });

    // XML Base inicial de Bonitasoft con Calles
    const initialXML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_1" name="Proceso Principal" processRef="Process_1" />
  </bpmn:collaboration>
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_1" name="Calle 1 (Legal)">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="StartEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_1_di" bpmnElement="Participant_1" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="600" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_1_di" bpmnElement="Lane_1" isHorizontal="true">
        <dc:Bounds x="190" y="80" width="570" height="250" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="252" y="162" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

    this.modeler.importXML(initialXML).then(() => {
      const canvas = this.modeler.get('canvas');
      canvas.zoom('fit-viewport');

      // Escuchar cambios en el diagrama para enviarlos por WebSocket (Colaboración)
      this.modeler.on('commandStack.changed', async () => {
        if (!this.ignorandoCambioRemoto && this.empresaId && this.usuarioId) {
          const xml = await this.exportXML();
          if (xml) {
            this.wsService.enviarCambio(this.empresaId, xml, this.usuarioId);
          }
        }
      });
      
      // Conectar WebSocket y suscribirse a cambios
      if (this.empresaId) {
        this.wsService.conectar(this.empresaId);
        this.wsService.diagramaActualizado$.subscribe(xmlRemoto => {
           // Importar el XML remoto sin disparar otro evento de cambio local
           this.ignorandoCambioRemoto = true;
           this.modeler.importXML(xmlRemoto).then(() => {
              this.ignorandoCambioRemoto = false;
           });
        });
      }
      
      // Cargar historial inicial
      this.cargarHistorial();
      
    }).catch((err: any) => console.error("Error cargando BPMN:", err));
  }

  ngOnDestroy() {
    this.wsService.desconectar();
  }

  // Ahora exporta XML en lugar de JSON (estándar BPMN real)
  async exportXML(): Promise<string | null> {
    if (this.modeler) {
      try {
        const { xml } = await this.modeler.saveXML({ format: true });
        return xml;
      } catch (err) {
        console.error("Error exportando XML", err);
        return null;
      }
    }
    return null;
  }

  importXML(xml: string) {
    if (this.modeler) {
      this.modeler.importXML(xml);
    }
  }

  async generarSistema() {
    const xml = await this.exportXML();
    if(xml) {
       const politicaId = this.idPoliticaActual || "temp";
       this.http.post('http://localhost:8081/api/sistema/generar/' + politicaId, {}).subscribe({
          next: (res: any) => {
            alert(res.mensaje || "Sistema Generado Exitosamente");
            this.authService.checkSistemaGenerado().subscribe();
          },
          error: (err) => alert("Error al generar sistema: " + (err.error?.error || "Desconocido"))
       });
    }
  }

  // --- Funcionalidades Extendidas (Fase 2 Extendida) ---

  toggleAsistente() {
    if (!this.isDragging) {
      this.mostrarAsistente = !this.mostrarAsistente;
    }
  }

  onDragStart(event: MouseEvent) {
    this.isDragging = false;
    this.dragStartX = event.clientX - this.geminiX;
    this.dragStartY = event.clientY - this.geminiY;

    const onMouseMove = (e: MouseEvent) => {
      this.isDragging = true;
      this.geminiX = e.clientX - this.dragStartX;
      this.geminiY = e.clientY - this.dragStartY;
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      // Pequeño timeout para evitar que el click dispare el toggle si se arrastró
      setTimeout(() => this.isDragging = false, 50);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }

  abrirModalCodigo() {
    this.mostrarModalCodigo = true;
  }

  generarDesdeCodigo() {
    if (this.codigoBPMN && this.codigoBPMN.trim() !== '') {
      this.importXML(this.codigoBPMN);
      this.mostrarModalCodigo = false;
      this.codigoBPMN = '';
      
      // Emitir el cambio a los colaboradores
      setTimeout(async () => {
        if(this.empresaId && this.usuarioId) {
          const xml = await this.exportXML();
          if(xml) this.wsService.enviarCambio(this.empresaId, xml, this.usuarioId);
        }
      }, 500);
    }
  }

  cargarImagen(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenBase64 = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  toggleGrabacion() {
    if (this.grabandoAudio) {
      this.mediaRecorder.stop();
      this.grabandoAudio = false;
    } else {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        this.mediaRecorder = new MediaRecorder(stream);
        this.audioChunks = [];
        this.mediaRecorder.ondataavailable = (event: any) => this.audioChunks.push(event.data);
        this.mediaRecorder.onstop = () => {
          const audioBlob = new Blob(this.audioChunks, { type: 'audio/mp3' });
          const reader = new FileReader();
          reader.onload = (e: any) => this.audioBase64 = e.target.result;
          reader.readAsDataURL(audioBlob);
          stream.getTracks().forEach(track => track.stop());
        };
        this.mediaRecorder.start();
        this.grabandoAudio = true;
      }).catch(err => {
        alert("No se pudo acceder al micrófono: " + err);
      });
    }
  }

  async enviarPromptIA() {
    if (!this.promptIA && !this.imagenBase64 && !this.audioBase64) return;
    
    let userMsg = this.promptIA;
    if (!userMsg) {
       if (this.imagenBase64) userMsg = "Enviando imagen...";
       if (this.audioBase64) userMsg = "Enviando audio...";
    }
    
    this.mensajesChat.push({ texto: userMsg, soyYo: true });

    this.procesandoIA = true;
    const diagramaActual = await this.exportXML();
    
    const payload = {
       prompt: this.promptIA,
       diagrama: diagramaActual,
       imagen: this.imagenBase64,
       audio: this.audioBase64
    };

    const tempPrompt = this.promptIA;
    this.promptIA = '';
    this.imagenBase64 = null;
    this.audioBase64 = null;

    this.http.post('http://localhost:8081/api/politicas/asistente-ia', payload, { responseType: 'text' }).subscribe({
      next: (res: string) => {
         if (res && res.includes('bpmn:definitions')) {
             this.importXML(res);
             // No mostramos el XML en el chat, solo un mensaje de éxito
             this.mensajesChat.push({ texto: "✅ Diagrama actualizado localmente.", soyYo: false });
         } else {
             // Es una respuesta de texto o un error
             try {
                const json = JSON.parse(res);
                this.mensajesChat.push({ texto: json.error || json.mensaje || res, soyYo: false });
             } catch(e) {
                this.mensajesChat.push({ texto: res, soyYo: false });
             }
         }
         this.procesandoIA = false;
      },
      error: (err) => {
         this.mensajesChat.push({ texto: "Lo siento, hubo un error de conexión con mi motor de IA.", soyYo: false });
         this.procesandoIA = false;
      }
    });
  }

  async verificarUsurpacion() {
    const xml = await this.exportXML();
    if (xml) {
      if (!this.mostrarAsistente) this.toggleAsistente();
      this.mensajesChat.push({ texto: "🔍 Analizando usurpación de funciones en el diagrama...", soyYo: true });
      this.procesandoIA = true;
      
      this.http.post('http://localhost:8081/api/politicas/verificar', { diagrama: xml }).subscribe({
         next: (res: any) => {
             this.mensajesChat.push({ 
               texto: "📋 REPORTE DE AUDITORÍA:\n\n" + (res.mensaje || "No se detectaron usurpaciones."), 
               soyYo: false 
             });
             this.procesandoIA = false;
         },
         error: (err) => {
             this.mensajesChat.push({ texto: "Error al realizar la auditoría de funciones.", soyYo: false });
             this.procesandoIA = false;
         }
      });
    }
  }

  // --- Gestión de Guardado e Historial ---

  cargarHistorial() {
    if (this.empresaId) {
      this.http.get<any[]>('http://localhost:8081/api/politicas/empresa/' + this.empresaId).subscribe({
        next: (res) => this.listaPolitas = res.reverse(),
        error: (err) => console.error("Error cargando historial", err)
      });
    }
  }

  toggleHistorial() {
    this.mostrarHistorial = !this.mostrarHistorial;
    if (this.mostrarHistorial) this.cargarHistorial();
  }

  async guardarDiagrama() {
    const xml = await this.exportXML();
    if (!xml || !this.empresaId || !this.usuarioId) return;

    const nombre = prompt("Ingresa un nombre para este diagrama:", "Diagrama " + new Date().toLocaleDateString());
    if (!nombre) return;

    console.log("Guardando diagrama para Empresa:", this.empresaId);
    
    const payload = {
      id: this.idPoliticaActual,
      nombre: nombre,
      xmlBpmn: xml,
      empresaId: this.empresaId,
      creadorId: this.usuarioId,
      isActiva: false
    };

    if (this.idPoliticaActual) {
      this.http.put('http://localhost:8081/api/politicas/' + this.idPoliticaActual, payload).subscribe({
        next: (res: any) => {
          console.log("Update success:", res);
          alert("Diagrama actualizado correctamente");
          this.cargarHistorial();
        },
        error: (err) => console.error("Error al actualizar:", err)
      });
    } else {
      this.http.post('http://localhost:8081/api/politicas', payload).subscribe({
        next: (res: any) => {
          console.log("Save success:", res);
          this.idPoliticaActual = res.id;
          alert("Diagrama guardado exitosamente");
          this.cargarHistorial();
        },
        error: (err) => console.error("Error al guardar:", err)
      });
    }
  }

  cargarPolitica(pol: any) {
    if (pol.xmlBpmn) {
      this.importXML(pol.xmlBpmn);
      this.idPoliticaActual = pol.id;
      this.mostrarHistorial = false;
      
      // Emitir el cambio a los colaboradores
      setTimeout(async () => {
        if(this.empresaId && this.usuarioId) {
          const xml = await this.exportXML();
          if(xml) this.wsService.enviarCambio(this.empresaId, xml, this.usuarioId);
        }
      }, 500);
    }
  }
}
