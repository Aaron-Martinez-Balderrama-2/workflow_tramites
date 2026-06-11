import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth/auth.service';
import { UsuarioService } from '../../services/usuario.service';
import { FormsModule } from '@angular/forms';

import { DynamicFormComponent } from '../../components/dynamic-form/dynamic-form.component';
import { DocumentEditorComponent } from '../../components/document-editor/document-editor.component';

declare var webkitSpeechRecognition: any;

@Component({
  selector: 'app-tareas',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, DynamicFormComponent, DocumentEditorComponent],
  template: `
    <div class="p-8 bg-slate-50 min-h-screen pb-20">
      <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-end mb-12">
            <div>
                <h1 class="text-4xl font-black text-slate-900 tracking-tight">Consola de Operaciones</h1>
                <p class="text-slate-500 mt-2 text-lg font-medium">Bandeja de entrada inteligente y jerarquizada.</p>
            </div>
            <div class="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-slate-100">
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Filtrar Sector</span>
                <select [(ngModel)]="filtroSector" (change)="cargarTareas()" class="p-3 border-0 bg-slate-50 rounded-xl outline-none text-sm font-bold text-slate-700 min-w-[220px]">
                    <option value="">Todos los Sectores</option>
                    <option *ngFor="let s of sectores" [value]="s.id">{{ s.nombre }}</option>
                </select>
            </div>
        </header>

        <!-- Acordeón de Trámites -->
        <div class="space-y-4">
            <div *ngFor="let grupo of tareasAgrupadas" class="bg-white rounded-[2rem] border border-slate-200/60 shadow-sm overflow-hidden transition-all duration-300"
                 [ngClass]="grupo.expandido ? 'ring-2 ring-blue-500/20 shadow-xl' : 'hover:border-slate-300'">
                
                <!-- Cabecera del Trámite -->
                <div (click)="grupo.expandido = !grupo.expandido" class="p-6 cursor-pointer flex items-center justify-between group select-none">
                    <div class="flex items-center gap-6">
                        <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all"
                             [ngClass]="grupo.expandido ? 'bg-blue-600 text-white rotate-0' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'">
                            {{ grupo.expandido ? '📂' : '📁' }}
                        </div>
                        <div>
                            <div class="flex items-center gap-3">
                                <h2 class="text-xl font-black text-slate-800 tracking-tight">{{ getNombreTramite(grupo.tramiteId) }}</h2>
                                <span class="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md">ID: #{{ grupo.tramiteId.substring(0,8) }}</span>
                            </div>
                            <p class="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                {{ grupo.totalTareas }} Tareas en {{ grupo.sectores.length }} áreas de impacto
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex flex-col items-end mr-4">
                            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Motor de Flujo</span>
                            <span class="text-sm font-black" 
                                  [ngClass]="getEstadoTramite(grupo.tramiteId) === 'FINALIZADO' ? 'text-emerald-500' : 'text-blue-600'">
                                {{ getEstadoTramite(grupo.tramiteId) === 'FINALIZADO' ? '✓ CASO CERRADO' : '↻ EN EJECUCIÓN DINÁMICA' }}
                            </span>
                        </div>
                        <div class="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-all text-xl"
                             [ngClass]="{'rotate-180': grupo.expandido}">
                            ▼
                        </div>
                    </div>
                </div>

                <!-- Contenido Expandible -->
                <div *ngIf="grupo.expandido" class="border-t border-slate-100 p-8 bg-slate-50/50 animate-in slide-in-from-top duration-300">
                    <div class="space-y-10">
                        <div *ngFor="let sector of grupo.sectores">
                            <div class="flex items-center gap-3 mb-6">
                                <span class="w-2 h-2 rounded-full bg-blue-400"></span>
                                <h3 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{{ sector.nombre }}</h3>
                                <div class="h-px bg-slate-200 flex-1 ml-2"></div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div *ngFor="let tarea of sector.tareas" 
                                     class="bg-white rounded-3xl shadow-sm border border-slate-200/50 p-6 hover:shadow-lg transition-all duration-300 relative overflow-hidden group/card">
                                    
                                    <div class="absolute top-4 right-4 flex gap-1 items-center">
                                        <div [ngClass]="{
                                            'bg-amber-500': tarea.estado === 'PENDIENTE',
                                            'bg-blue-500': tarea.estado === 'EN_PROCESO',
                                            'bg-emerald-500': tarea.estado === 'COMPLETADA'
                                        }" class="w-2 h-2 rounded-full"></div>
                                        <span class="text-[9px] font-black text-slate-400 uppercase">{{ tarea.estado }}</span>
                                    </div>

                                    <div class="flex items-start gap-4 mb-6">
                                        <div class="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg shadow-inner">📋</div>
                                        <div class="flex-1 min-w-0">
                                            <h4 class="font-black text-slate-800 truncate text-sm">{{ tarea.nombre }}</h4>
                                            <p class="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter truncate">
                                                Responsable: <span class="text-slate-600">{{ getNombreUsuario(tarea.asignadoA) }}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div class="bg-slate-50 p-3 rounded-xl mb-6 min-h-[60px] border border-slate-100/50">
                                        <p class="text-[11px] text-slate-600 line-clamp-3 leading-relaxed mt-0.5 font-semibold text-xs">
                                            {{ esJsonFormulario(tarea.requisitos) ? 'Esta tarea contiene un formulario estructurado dinámico.' : (tarea.requisitos || 'Atención operativa sin requisitos específicos.') }}
                                        </p>
                                    </div>

                                    <div class="flex justify-between items-center pt-4 border-t border-slate-50">
                                        <div class="flex gap-2">
                                            <button *ngIf="tarea.estado === 'PENDIENTE' && puedeAsignar(tarea)"
                                                    (click)="abrirModalAsignacion(tarea); $event.stopPropagation()"
                                                    class="px-4 py-2 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-black rounded-xl shadow-md transition-all active:scale-95">
                                                ASIGNAR
                                            </button>
                                            <button *ngIf="tarea.estado === 'EN_PROCESO' && puedeProcesar(tarea)"
                                                    (click)="abrirModalProceso(tarea); $event.stopPropagation()"
                                                    class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95">
                                                ATENDER
                                            </button>
                                            <button *ngIf="tarea.estado === 'COMPLETADA'"
                                                    (click)="irAlHistorial(tarea.tramiteId); $event.stopPropagation()"
                                                    class="px-5 py-2.5 bg-green-100 text-green-700 hover:bg-green-200 text-[10px] font-black rounded-xl shadow-sm transition-all active:scale-95">
                                                VER HISTORIAL
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div *ngIf="tareasAgrupadas.length === 0" class="text-center py-40">
            <div class="text-8xl mb-6 opacity-20">🏝️</div>
            <h3 class="text-2xl font-black text-slate-300">Bandeja libre de tareas</h3>
            <p class="text-slate-400 mt-2">Prueba cambiando el filtro de sector o revisa otros trámites.</p>
        </div>
      </div>

      <!-- Modal de Procesamiento (Checklist + Notas) -->
      <div *ngIf="mostrarModal" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-300">
              <div class="bg-slate-900 p-8 text-white flex justify-between items-start">
                  <div>
                      <h2 class="text-3xl font-black">{{ tareaSeleccionada?.nombre }}</h2>
                      <p class="text-[10px] text-slate-400 mt-2 uppercase tracking-widest">Caso: {{ getNombreTramite(tareaSeleccionada?.tramiteId) }}</p>
                  </div>
                  <button (click)="cerrarModal()" class="w-10 h-10 rounded-full bg-white/10 flex justify-center items-center hover:bg-white/20">&times;</button>
              </div>
              
              <!-- Pestañas (Tabs) -->
              <div class="flex border-b border-slate-200 bg-slate-50 px-8 pt-4">
                  <button (click)="pestanaActiva = 'datos'" 
                          [ngClass]="pestanaActiva === 'datos' ? 'border-b-4 border-blue-600 text-blue-600 font-black' : 'text-slate-400 font-bold hover:text-slate-600'"
                          class="px-6 py-4 transition-all text-sm uppercase tracking-wider">
                      📋 Datos Operativos
                  </button>
                  <button (click)="pestanaActiva = 'documento'" 
                          [ngClass]="pestanaActiva === 'documento' ? 'border-b-4 border-blue-600 text-blue-600 font-black' : 'text-slate-400 font-bold hover:text-slate-600'"
                          class="px-6 py-4 transition-all text-sm uppercase tracking-wider">
                      📝 Redactor Oficial
                  </button>
              </div>
              
              <!-- Tab 1: Datos Operativos -->
              <div *ngIf="pestanaActiva === 'datos'" class="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 custom-scroll" style="max-height: 60vh; overflow-y: auto;">
                  <div class="space-y-6">
                      <div class="flex justify-between items-center">
                          <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Formulario Estructurado (BPMN)
                          </h4>

                      </div>
                      
                      <div *ngIf="camposDinamicos.length > 0" class="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scroll relative">
                          <div *ngIf="cargandoIA" class="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-xl">
                              <span class="text-xs font-black text-slate-800 animate-pulse bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200">La IA está extrayendo los datos... ✨</span>
                          </div>

                          <app-dynamic-form 
                              [formSchema]="camposDinamicos"
                              [(formData)]="formData"
                              [tramiteId]="tareaSeleccionada?.tramiteId"
                              [miUsuarioId]="currentUser?.id"
                              [miNombre]="currentUser?.nombre"
                              [readonly]="false">
                          </app-dynamic-form>
                      </div>

                      <div *ngIf="camposDinamicos.length === 0" class="p-5 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-400 text-sm font-bold">
                          Esta tarea no requiere llenado de formulario específico.
                      </div>
                  </div>

                  <div class="space-y-6">
                      <div class="flex justify-between items-center">
                          <h4 class="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Nota Operativa (Opcional)
                          </h4>
                          <button (click)="iniciarDictado('notaGlobal')" [ngClass]="grabandoDictado['notaGlobal'] ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600'" class="w-8 h-8 rounded-full flex justify-center items-center" title="Dictar Nota">🎙️</button>
                      </div>
                      <textarea [(ngModel)]="notaActual" placeholder="Anotaciones extra..." class="w-full h-24 p-4 bg-slate-50 border-0 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
                  </div>
              </div>

              <!-- Tab 2: Redactor Oficial -->
              <div *ngIf="pestanaActiva === 'documento'" class="p-0 bg-slate-100 flex flex-col custom-scroll" style="height: 65vh;">
                  <app-document-editor class="flex-1 h-full" [tramiteId]="tareaSeleccionada?.tramiteId"></app-document-editor>
              </div>

              <!-- Botonera Inferior -->
              <div class="p-6 bg-white border-t border-slate-100 flex gap-4">
                  <button (click)="cerrarModal()" class="flex-1 py-4 text-slate-400 font-black">Posponer</button>
                  <button (click)="completarTareaConNotas()" class="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-xl">FINALIZAR TAREA</button>
              </div>
          </div>
      </div>

      <!-- Modal de Selección de Usuario (FILTRADO POR SECTOR) -->
      <div *ngIf="mostrarModalAsignar" class="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div class="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
              <div class="p-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                    <h3 class="text-2xl font-black text-slate-800 tracking-tight">Seleccionar Oficial</h3>
                    <p class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">Para: {{ getNombreSector(tareaSeleccionada?.sectorId) }}</p>
                  </div>
                  <button (click)="mostrarModalAsignar = false" class="text-slate-400 hover:text-slate-600 text-3xl">&times;</button>
              </div>
              <div class="p-6 max-h-[450px] overflow-y-auto custom-scroll">
                  <!-- Solo mostramos usuarios que pertenecen al sector de la tarea -->
                  <div *ngFor="let user of getUsuariosFiltrados()" 
                       (click)="confirmarAsignacion(user.id)"
                       class="flex items-center gap-5 p-5 hover:bg-blue-600 rounded-3xl cursor-pointer transition-all group border-2 border-transparent hover:border-blue-400 mb-3 shadow-sm hover:shadow-xl hover:shadow-blue-200">
                      <div class="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-lg font-black text-slate-500 group-hover:bg-white group-hover:text-blue-600 transition-all">
                          {{ user.nombre.substring(0,1) }}
                      </div>
                      <div class="flex-1">
                          <div class="text-sm font-black text-slate-800 group-hover:text-white">{{ user.nombre }}</div>
                          <div class="text-[10px] font-bold text-slate-400 group-hover:text-blue-100 uppercase tracking-tighter">{{ user.rol }}</div>
                      </div>
                      <span class="text-[10px] font-black text-blue-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity uppercase">Asignar</span>
                  </div>

                  <!-- Mensaje si no hay nadie en ese sector -->
                  <div *ngIf="getUsuariosFiltrados().length === 0" class="p-10 text-center space-y-4">
                      <div class="text-4xl">⚠️</div>
                      <p class="text-sm font-bold text-slate-400 italic">No hay funcionarios asignados a este sector actualmente.</p>
                      <p class="text-[10px] text-slate-300">Asigna funcionarios a este sector en el Panel de Usuarios.</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  `
})
export class TareasComponent implements OnInit {
  sectores: any[] = [];
  tramites: any[] = [];
  tareas: any[] = [];
  usuarios: any[] = [];
  tareasAgrupadas: any[] = [];
  currentUser: any;
  filtroSector: string = '';
  
  // Modal Processing
  mostrarModal = false;
  tareaSeleccionada: any = null;
  notaActual: string = '';
  dictando = false;
  recognition: any;
  pestanaActiva: 'datos' | 'documento' = 'datos';

  // Modal Assignment
  mostrarModalAsignar = false;

  // Dynamic Form Variables
  camposDinamicos: any[] = [];
  formData: any = {};

  private apiBaseUrl = '/api/tramites';

  constructor(
    private http: HttpClient, 
    private authService: AuthService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'es-ES';

      this.recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        this.notaActual += (this.notaActual ? ' ' : '') + text;
        this.dictando = false;
      };

      this.recognition.onerror = () => {
        this.dictando = false;
      };
    }
  }

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.cargarDatosBase();
      }
    });
  }

  cargarDatosBase() {
    this.http.get<any[]>('/api/sectores/empresa/' + this.currentUser.empresaId).subscribe(res => this.sectores = res);
    this.http.get<any[]>(`${this.apiBaseUrl}/empresa/${this.currentUser.empresaId}`).subscribe(res => this.tramites = res);
    this.usuarioService.getUsuariosByEmpresa(this.currentUser.empresaId).subscribe(res => this.usuarios = res);
    this.cargarTareas();
  }

  irAlHistorial(tramiteId: string) {
    this.router.navigate(['/repositorio'], { queryParams: { tramiteId: tramiteId } });
  }

  cargarTareas() {
    this.http.get<any[]>(`${this.apiBaseUrl}/tareas/empresa/${this.currentUser.empresaId}`).subscribe(res => {
      this.tareas = res;
      this.agruparTareas();
    });
  }

  agruparTareas() {
    const tareasBase = this.tareas.filter(t => {
      const matchSector = this.filtroSector ? t.sectorId === this.filtroSector : true;
      if (this.currentUser.rol === 'FUNCIONARIO' && !this.filtroSector) {
         return t.sectorId === this.currentUser.areaTrabajo;
      }
      return matchSector;
    });

    const grupos: any[] = [];
    const tramiteIds = [...new Set(tareasBase.map(t => t.tramiteId))];

    tramiteIds.forEach(tId => {
      const tareasDelTramite = tareasBase.filter(t => t.tramiteId === tId);
      const sectorIds = [...new Set(tareasDelTramite.map(t => t.sectorId))];
      
      const sectoresDelTramite = sectorIds.map(sId => ({
        id: sId,
        nombre: this.getNombreSector(sId),
        tareas: tareasDelTramite.filter(t => t.sectorId === sId)
      }));

      const anterior = this.tareasAgrupadas.find(g => g.tramiteId === tId);

      grupos.push({
        tramiteId: tId,
        sectores: sectoresDelTramite,
        totalTareas: tareasDelTramite.length,
        expandido: anterior ? anterior.expandido : false
      });
    });

    this.tareasAgrupadas = grupos;
  }

  getNombreTramite(id: string) {
    const t = this.tramites.find(tr => tr.id === id);
    return t ? t.clienteNombre : 'Expediente #' + id.substring(0,8);
  }

  getProgresoTramite(id: string) {
    const t = this.tramites.find(tr => tr.id === id);
    return t ? t.porcentajeAvance : 0;
  }

  getEstadoTramite(id: string) {
    const t = this.tramites.find(tr => tr.id === id);
    return t ? t.estado : 'DESCONOCIDO';
  }

  getNombreSector(id: string) {
    return this.sectores.find(s => s.id === id)?.nombre || 'Desconocido';
  }

  getNombreUsuario(id: string) {
    if (!id) return 'SIN ASIGNAR';
    const u = this.usuarios.find(user => user.id === id);
    return u ? u.nombre : 'CARGANDO...';
  }

  // MÉTODO PARA FILTRAR USUARIOS POR EL SECTOR DE LA TAREA SELECCIONADA
  getUsuariosFiltrados(): any[] {
    if (!this.tareaSeleccionada) return [];
    // Filtramos los usuarios de la empresa para que solo aparezcan los del sector de la tarea
    // También permitimos al Administrador (opcionalmente) aparecer si es que está asignado al sector.
    return this.usuarios.filter(u => u.areaTrabajo === this.tareaSeleccionada.sectorId);
  }

  getNotasHeredadas() {
    if (!this.tareaSeleccionada) return '';
    const t = this.tramites.find(tr => tr.id === this.tareaSeleccionada.tramiteId);
    return t ? t.notasGenerales : '';
  }

  puedeAsignar(tarea: any): boolean {
    return this.currentUser.rol === 'ADMINISTRADOR' || this.currentUser.areaTrabajo === tarea.sectorId;
  }

  esJsonFormulario(str: string): boolean {
    if (!str) return false;
    try {
      const parsed = JSON.parse(str);
      return Array.isArray(parsed);
    } catch (e) {
      return false;
    }
  }

  puedeProcesar(tarea: any): boolean {
    return this.currentUser.rol === 'ADMINISTRADOR' || this.currentUser.id === tarea.asignadoA;
  }

  abrirModalAsignacion(tarea: any) {
    this.tareaSeleccionada = tarea;
    this.mostrarModalAsignar = true;
  }

  confirmarAsignacion(usuarioId: string) {
    this.http.put(`${this.apiBaseUrl}/tareas/${this.tareaSeleccionada.id}/asignar?usuarioId=${usuarioId}`, {}).subscribe(() => {
      this.cargarTareas();
      this.mostrarModalAsignar = false;
    });
  }

  abrirModalProceso(tarea: any) {
    this.tareaSeleccionada = tarea;
    this.notaActual = '';
    this.camposDinamicos = [];
    this.formData = {};
    this.pestanaActiva = 'datos'; // Por defecto iniciar en datos

    // Intenta parsear los requisitos como JSON Arquitectónico
    if (tarea.requisitos) {
       try {
          const parsed = JSON.parse(tarea.requisitos);
          if (Array.isArray(parsed)) {
             this.camposDinamicos = parsed;
             this.camposDinamicos.forEach(c => this.formData[c.id] = '');
          }
       } catch (e) {
          console.warn("La metadata de requisitos no es un JSON válido de Camunda.");
       }
    }
    this.mostrarModal = true;
  }

  cargandoIA = false;
  grabandoDictado: { [key: string]: boolean } = {};

  cerrarModal() {
    this.mostrarModal = false;
    this.cargandoIA = false;
    this.grabandoDictado = {};
  }

  iniciarDictado(campoId: string) {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta dictado por voz.");
      return;
    }
    
    if (this.grabandoDictado[campoId]) {
       this.grabandoDictado[campoId] = false;
       return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.start();
    
    this.grabandoDictado[campoId] = true;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (campoId === 'notaGlobal') {
          this.notaActual = (this.notaActual || '') + ' ' + transcript;
          this.notaActual = this.notaActual.trim();
      } else {
          this.formData[campoId] = (this.formData[campoId] || '') + ' ' + transcript;
          this.formData[campoId] = this.formData[campoId].trim();
      }
      this.grabandoDictado[campoId] = false;
    };
    
    recognition.onerror = () => { this.grabandoDictado[campoId] = false; };
    recognition.onend = () => { this.grabandoDictado[campoId] = false; };
  }

  llenarConIA() {
    const contexto = prompt("Describe la situación o los datos del formulario (la IA los extraerá y llenará los campos automáticamente):");
    if (!contexto) return;
    
    this.cargandoIA = true;
    const payload = {
        texto: contexto,
        metadata: JSON.stringify(this.camposDinamicos),
        audio: "null"
    };
    
    this.http.post<any>(`${this.apiBaseUrl}/tareas/llenar-ia`, payload).subscribe({
        next: (res) => {
            if (res && typeof res === 'object') {
                Object.keys(res).forEach(key => {
                    this.formData[key] = res[key];
                });
            }
            this.cargandoIA = false;
        },
        error: (err) => {
            alert("Error al contactar a la IA");
            this.cargandoIA = false;
        }
    });
  }

  completarTareaConNotas() {
    // Empaquetamos las respuestas del formulario dinámico a un JSON plano para el backend
    const payload = {
      requisitos: JSON.stringify(this.formData),
      notas: this.notaActual
    };
    
    this.http.put(`${this.apiBaseUrl}/tareas/${this.tareaSeleccionada.id}/completar`, payload).subscribe({
      next: () => {
        this.cargarTareas();
        this.cerrarModal();
        this.http.get<any[]>(`${this.apiBaseUrl}/empresa/${this.currentUser.empresaId}`).subscribe(res => this.tramites = res);
      },
      error: (err) => alert("Error al finalizar la atención")
    });
  }
}
