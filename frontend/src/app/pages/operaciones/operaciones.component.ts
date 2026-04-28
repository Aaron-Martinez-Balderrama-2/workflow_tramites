import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-operaciones',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="p-8 bg-gray-50 min-h-screen">
      <div class="max-w-7xl mx-auto">
        <header class="flex justify-between items-center mb-8">
            <div>
                <h1 class="text-3xl font-extrabold text-gray-900 tracking-tight">Gestión de Trámites</h1>
                <p class="text-gray-600 mt-1">Registro, seguimiento y control de flujo por sector.</p>
            </div>
            <!-- Solo Admin puede crear nuevos trámites inicialmente (o según lógica de negocio) -->
            <button *ngIf="currentUser?.rol === 'ADMINISTRADOR'" (click)="abrirModalCrear()" class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95">
                <span class="text-lg">＋</span> Nuevo Trámite
            </button>
        </header>

        <!-- Filtros Rápidos -->
        <div class="mb-6 flex gap-4">
            <div class="bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm text-sm">
                <span class="text-gray-500">Vista:</span> 
                <span class="ml-2 font-bold text-blue-600">
                    {{ currentUser?.rol === 'ADMINISTRADOR' ? 'Global (Todo el sistema)' : 'Sectorial (' + getNombreSector(currentUser?.areaTrabajo) + ')' }}
                </span>
            </div>
        </div>

        <!-- Grilla de Trámites -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 text-gray-500 text-[10px] uppercase tracking-[0.1em] font-bold">
                        <tr>
                            <th class="px-6 py-5">ID / Fecha</th>
                            <th class="px-6 py-5">Cliente</th>
                            <th class="px-6 py-5">Ubicación (Sector)</th>
                            <th class="px-6 py-5">Estado</th>
                            <th class="px-6 py-5 text-center">Avance</th>
                            <th class="px-6 py-5 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr *ngFor="let t of tramitesFiltrados" class="hover:bg-blue-50/30 transition-colors group">
                            <td class="px-6 py-4">
                                <div class="text-xs font-mono text-blue-600 font-bold">#{{ t.id?.substring(0,8) }}</div>
                                <div class="text-[10px] text-gray-400 mt-0.5">{{ t.fechaCreacion | date:'short' }}</div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="font-bold text-gray-800">{{ t.clienteNombre }}</div>
                                <div class="text-[11px] text-gray-500 truncate max-w-[200px]">{{ t.descripcion }}</div>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-2">
                                    <div class="w-2 h-2 rounded-full bg-indigo-400"></div>
                                    <span class="text-sm font-semibold text-gray-700">{{ getNombreSector(t.sectorId) }}</span>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span [ngClass]="{
                                    'bg-amber-100 text-amber-700 ring-1 ring-amber-200': t.estado === 'PENDIENTE',
                                    'bg-blue-100 text-blue-700 ring-1 ring-blue-200': t.estado === 'EN_PROCESO',
                                    'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200': t.estado === 'FINALIZADO'
                                }" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-tight">
                                    {{ t.estado }}
                                </span>
                            </td>
                            <td class="px-6 py-4">
                                <div class="flex flex-col items-center">
                                    <span class="text-xs font-bold text-blue-600 mb-1">{{ t.porcentajeAvance }}%</span>
                                    <div class="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div [style.width.%]="t.porcentajeAvance" class="h-full bg-blue-500 transition-all duration-1000"></div>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex justify-end gap-2" *ngIf="puedeEditar(t)">
                                    <button (click)="seleccionarParaEdicion(t)" class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                                        </svg>
                                    </button>
                                    <button (click)="confirmarEliminar(t.id)" 
                                        [ngClass]="confirmarId === t.id ? 'bg-red-600 text-white animate-pulse' : 'text-red-600 hover:bg-red-100'"
                                        class="p-2 rounded-lg transition-all">
                                        <svg *ngIf="confirmarId !== t.id" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        <span *ngIf="confirmarId === t.id" class="text-[10px] font-bold px-1">BORRAR?</span>
                                    </button>
                                </div>
                                <span *ngIf="!puedeEditar(t)" class="text-[10px] text-gray-400 italic">Solo Lectura</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
                <div *ngIf="tramitesFiltrados.length === 0" class="p-20 text-center text-gray-400">
                    <div class="text-5xl mb-4 opacity-20">📂</div>
                    <p class="italic">No se encontraron trámites en este sector.</p>
                </div>
            </div>
        </div>
      </div>

      <!-- Modal Crear/Editar Trámite -->
      <div *ngIf="mostrarModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div class="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/20 animate-in fade-in zoom-in duration-200">
              <h2 class="text-2xl font-bold mb-2 text-gray-800">{{ editMode ? 'Editar Trámite' : 'Registrar Nuevo Trámite' }}</h2>
              <p class="text-sm text-gray-500 mb-8">{{ editMode ? 'Actualiza la información básica del cliente.' : 'Inicia un nuevo flujo de trabajo en el sistema.' }}</p>
              
              <div class="space-y-5">
                  <div>
                      <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Nombre del Cliente</label>
                      <input [(ngModel)]="nuevoTramite.clienteNombre" type="text" placeholder="Ej. Juan Manuel Rosas"
                        class="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all">
                  </div>
                  <div>
                      <label class="block text-xs font-bold text-gray-400 uppercase mb-1.5 ml-1">Descripción / Notas Iniciales</label>
                      <textarea [(ngModel)]="nuevoTramite.descripcion" placeholder="Detalles del trámite o requisitos especiales..."
                        class="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-32 resize-none transition-all"></textarea>
                  </div>
              </div>
              
              <div class="flex justify-end gap-3 mt-10">
                  <button (click)="cerrarModal()" class="px-6 py-3 text-gray-500 font-bold hover:text-gray-700 transition-colors">Cerrar</button>
                  <button (click)="guardarTramite()" 
                    [disabled]="!nuevoTramite.clienteNombre"
                    class="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-bold rounded-xl shadow-lg shadow-blue-100 transition-all active:scale-95">
                    {{ editMode ? 'Guardar Cambios' : 'Iniciar Flujo' }}
                  </button>
              </div>
          </div>
      </div>
    </div>
  `
})
export class OperacionesComponent implements OnInit {
  tramites: any[] = [];
  tramitesFiltrados: any[] = [];
  sectores: any[] = [];
  mostrarModal = false;
  editMode = false;
  confirmarId: string | null = null;
  nuevoTramite: any = { clienteNombre: '', descripcion: '' };
  currentUser: any;

  private apiBaseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.cargarSectores();
        this.cargarTramites();
      }
    });
  }

  cargarSectores() {
    this.http.get<any[]>(`${this.apiBaseUrl}/sectores/empresa/${this.currentUser.empresaId}`).subscribe({
      next: (res) => this.sectores = res,
      error: (err) => console.error("Error cargando sectores", err)
    });
  }

  cargarTramites() {
    this.http.get<any[]>(`${this.apiBaseUrl}/tramites/empresa/${this.currentUser.empresaId}`).subscribe({
      next: (res) => {
        this.tramites = res.reverse();
        this.aplicarFiltros();
      },
      error: (err) => console.error("Error cargando trámites", err)
    });
  }

  aplicarFiltros() {
    if (this.currentUser?.rol === 'ADMINISTRADOR') {
      this.tramitesFiltrados = this.tramites;
    } else {
      // Funcionarios y Diseñadores solo ven trámites en SU área
      this.tramitesFiltrados = this.tramites.filter(t => t.sectorId === this.currentUser.areaTrabajo);
    }
  }

  getNombreSector(id: string) {
    if (!id) return 'Iniciando...';
    const s = this.sectores.find(sec => sec.id === id);
    return s ? s.nombre : 'Cargando...';
  }

  puedeEditar(t: any): boolean {
    if (this.currentUser?.rol === 'ADMINISTRADOR') return true;
    // Funcionario o Diseñador solo si es de su sector
    return t.sectorId === this.currentUser?.areaTrabajo;
  }

  abrirModalCrear() {
    this.editMode = false;
    this.nuevoTramite = { clienteNombre: '', descripcion: '' };
    this.mostrarModal = true;
  }

  seleccionarParaEdicion(t: any) {
    this.editMode = true;
    this.nuevoTramite = { ...t };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
    this.editMode = false;
    this.nuevoTramite = { clienteNombre: '', descripcion: '' };
  }

  guardarTramite() {
    if (!this.nuevoTramite.clienteNombre) return;
    
    if (this.editMode) {
      this.http.put(`${this.apiBaseUrl}/tramites/${this.nuevoTramite.id}`, this.nuevoTramite).subscribe({
        next: () => {
          this.cargarTramites();
          this.cerrarModal();
        },
        error: (err) => alert("Error al actualizar")
      });
    } else {
      const payload = {
        ...this.nuevoTramite,
        empresaId: this.currentUser.empresaId
      };
      this.http.post(`${this.apiBaseUrl}/tramites`, payload).subscribe({
        next: () => {
          this.cargarTramites();
          this.cerrarModal();
        },
        error: (err) => alert("Error al crear")
      });
    }
  }

  confirmarEliminar(id: string) {
    if (this.confirmarId === id) {
      this.http.delete(`${this.apiBaseUrl}/tramites/${id}`).subscribe({
        next: () => {
          this.cargarTramites();
          this.confirmarId = null;
        },
        error: (err) => alert("No se pudo eliminar")
      });
    } else {
      this.confirmarId = id;
      setTimeout(() => this.confirmarId = null, 3000);
    }
  }
}
