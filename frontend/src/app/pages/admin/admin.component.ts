import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { UsuarioService } from '../../services/usuario.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="p-8 bg-gray-50 min-h-screen">
      <div class="max-w-6xl mx-auto">
        <header class="mb-10">
          <h1 class="text-4xl font-extrabold text-gray-900 tracking-tight">Panel de Administración</h1>
          <p class="text-gray-600 mt-2 text-lg">Gestione su equipo de trabajo, asigne roles y sectores estratégicos.</p>
        </header>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Formulario de Creación/Edición -->
          <div class="lg:col-span-1">
            <div class="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 sticky top-8">
              <h2 class="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                <span class="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-3 text-sm font-bold">
                  {{ editMode ? '✎' : '+' }}
                </span>
                {{ editMode ? 'Editar Empleado' : 'Nuevo Empleado' }}
              </h2>
              
              <form (ngSubmit)="guardarUsuario()" class="space-y-5">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Nombre Completo</label>
                    <input type="text" name="nombre" [(ngModel)]="nuevoUsuario.nombre" placeholder="Ej. Juan Pérez" 
                      class="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" required>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Correo Electrónico</label>
                    <input type="email" name="email" [(ngModel)]="nuevoUsuario.email" placeholder="usuario@empresa.com" 
                      class="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" required>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-1">C.I.</label>
                      <input type="text" name="ci" [(ngModel)]="nuevoUsuario.ci" placeholder="1234567" 
                        class="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" required>
                    </div>
                    <div>
                      <label class="block text-sm font-semibold text-gray-700 mb-1">Teléfono</label>
                      <input type="text" name="telefono" [(ngModel)]="nuevoUsuario.telefono" placeholder="70000000" 
                        class="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" required>
                    </div>
                  </div>

                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Contraseña {{ editMode ? '(Opcional)' : '' }}</label>
                    <input type="password" name="password" [(ngModel)]="nuevoUsuario.password" placeholder="••••••••" 
                      class="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" [required]="!editMode">
                  </div>
                  
                  <div>
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Rol en el Sistema</label>
                    <select name="rol" [(ngModel)]="nuevoUsuario.rol" class="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" required>
                        <option value="" disabled selected>Seleccione un Rol</option>
                        <option value="DISENADOR">Diseñador de Procesos</option>
                        <option value="FUNCIONARIO">Funcionario Operativo</option>
                    </select>
                  </div>

                  <div *ngIf="sistemaGenerado">
                    <label class="block text-sm font-semibold text-gray-700 mb-1">Asignar a Sector</label>
                    <select name="areaTrabajo" [(ngModel)]="nuevoUsuario.areaTrabajo" class="w-full p-3 border border-blue-100 bg-blue-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="">Sin asignar (Soporte)</option>
                        <option *ngFor="let s of sectores" [value]="s.id">{{ s.nombre }}</option>
                    </select>
                  </div>
                </div>
                
                <div *ngIf="mensaje" [ngClass]="{'bg-green-50 text-green-700 border-green-200': !esError, 'bg-red-50 text-red-700 border-red-200': esError}" 
                  class="p-3 rounded-xl border text-sm font-medium animate-pulse">
                  {{ mensaje }}
                </div>

                <div class="flex gap-3 pt-4">
                  <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95">
                    {{ editMode ? 'Actualizar' : 'Guardar' }}
                  </button>
                  <button *ngIf="editMode" type="button" (click)="cancelarEdicion()" class="bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-3 px-6 rounded-xl transition-all active:scale-95">
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Tabla de Usuarios -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 class="text-xl font-bold text-gray-800">Equipo de Trabajo</h2>
                <span class="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {{ listaUsuarios.length }} Miembros
                </span>
              </div>
              
              <div class="overflow-x-auto">
                <table class="w-full text-left">
                  <thead class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                    <tr>
                      <th class="px-6 py-4 font-bold">Empleado</th>
                      <th class="px-6 py-4 font-bold">Rol</th>
                      <th class="px-6 py-4 font-bold">Asignación</th>
                      <th class="px-6 py-4 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr *ngFor="let u of listaUsuarios" class="hover:bg-blue-50/30 transition-colors group">
                      <td class="px-6 py-4">
                        <div class="flex items-center">
                          <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold mr-3 shadow-md">
                            {{ u.nombre.charAt(0) }}
                          </div>
                          <div>
                            <div class="font-bold text-gray-900">{{ u.nombre }}</div>
                            <div class="text-xs text-gray-500">{{ u.email }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4">
                        <span [ngClass]="u.rol === 'DISENADOR' ? 'bg-purple-100 text-purple-700 ring-1 ring-purple-200' : 'bg-green-100 text-green-700 ring-1 ring-green-200'" 
                          class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase">
                          {{ u.rol }}
                        </span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex items-center text-sm text-gray-600">
                          <div *ngIf="u.areaTrabajo" class="flex items-center">
                            <span class="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                            {{ getNombreSector(u.areaTrabajo) }}
                          </div>
                          <span *ngIf="!u.areaTrabajo" class="text-gray-400 italic text-xs">Sin sector asignado</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex justify-end gap-2 transition-opacity">
                          <!-- Botón Editar -->
                          <button (click)="seleccionarParaEdicion(u)" class="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-5M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                          
                          <!-- Botón Eliminar con Confirmación Inline -->
                          <button (click)="eliminarUsuario(u.id)" 
                            [ngClass]="confirmarEliminacion === u.id ? 'bg-red-600 text-white animate-pulse' : 'text-red-600 hover:bg-red-100'"
                            class="p-2 rounded-lg transition-all flex items-center gap-1 overflow-hidden" 
                            [title]="confirmarEliminacion === u.id ? '¿Seguro?' : 'Eliminar'">
                            
                            <svg *ngIf="confirmarEliminacion !== u.id" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span *ngIf="confirmarEliminacion === u.id" class="text-[10px] font-bold px-1 whitespace-nowrap">¿BORRAR?</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr *ngIf="listaUsuarios.length === 0">
                      <td colspan="4" class="px-6 py-12 text-center text-gray-400 italic">
                        No hay empleados registrados en su equipo.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminComponent implements OnInit {
  nuevoUsuario: any = {
    nombre: '', email: '', ci: '', telefono: '', password: '', rol: '', empresaId: '', areaTrabajo: ''
  };
  listaUsuarios: any[] = [];
  sectores: any[] = [];
  sistemaGenerado = false;
  mensaje = '';
  esError = false;
  editMode = false;
  usuarioEditandoId: string | null = null;
  confirmarEliminacion: string | null = null;

  private apiBaseUrl = '/api';

  constructor(
    private usuarioService: UsuarioService, 
    private authService: AuthService,
    private http: HttpClient
  ) {}
  
  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.empresaId) {
        this.nuevoUsuario.empresaId = user.empresaId;
        this.sistemaGenerado = user.sistemaGenerado;
        this.cargarUsuarios();
        if (this.sistemaGenerado) {
          this.cargarSectores();
        }
      }
    });
  }

  cargarUsuarios() {
    this.http.get<any[]>(`${this.apiBaseUrl}/usuarios/empresa/${this.nuevoUsuario.empresaId}`).subscribe({
      next: (res) => this.listaUsuarios = res,
      error: (err) => console.error("Error cargando usuarios", err)
    });
  }

  cargarSectores() {
    this.http.get<any[]>(`${this.apiBaseUrl}/sectores/empresa/${this.nuevoUsuario.empresaId}`).subscribe({
      next: (res) => this.sectores = res,
      error: (err) => console.error("Error cargando sectores", err)
    });
  }

  getNombreSector(id: string) {
    if (!id) return '';
    const sector = this.sectores.find(s => s.id === id);
    return sector ? sector.nombre : 'Cargando...';
  }

  seleccionarParaEdicion(usuario: any) {
    this.editMode = true;
    this.usuarioEditandoId = usuario.id;
    this.nuevoUsuario = { ...usuario, password: '' }; 
    this.mensaje = `Editando a ${usuario.nombre}`;
    this.esError = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelarEdicion() {
    this.editMode = false;
    this.usuarioEditandoId = null;
    this.resetForm();
    this.mensaje = '';
  }

  resetForm() {
    const empId = this.nuevoUsuario.empresaId;
    this.nuevoUsuario = {
      nombre: '', email: '', ci: '', telefono: '', password: '', rol: '', empresaId: empId, areaTrabajo: ''
    };
  }

  guardarUsuario() {
    if (!this.nuevoUsuario.rol) {
      this.esError = true;
      this.mensaje = "Debe seleccionar un rol.";
      return;
    }

    if (this.editMode && this.usuarioEditandoId) {
      this.usuarioService.actualizarUsuario(this.usuarioEditandoId, this.nuevoUsuario).subscribe({
        next: () => {
          this.esError = false;
          this.mensaje = "Usuario actualizado exitosamente.";
          this.cargarUsuarios();
          this.cancelarEdicion();
        },
        error: (err) => {
          this.esError = true;
          this.mensaje = err.error?.mensaje || "Error al actualizar el usuario.";
        }
      });
    } else {
      this.usuarioService.crearUsuario(this.nuevoUsuario).subscribe({
        next: () => {
          this.esError = false;
          this.mensaje = "Usuario creado exitosamente.";
          this.cargarUsuarios();
          this.resetForm();
        },
        error: (err) => {
          this.esError = true;
          this.mensaje = err.error?.mensaje || "Error al crear el usuario.";
        }
      });
    }
  }

  eliminarUsuario(id: string) {
    if (this.confirmarEliminacion === id) {
      this.usuarioService.eliminarUsuario(id).subscribe({
        next: () => {
          this.esError = false;
          this.mensaje = "Usuario eliminado.";
          this.confirmarEliminacion = null;
          this.cargarUsuarios();
        },
        error: (err) => {
          this.esError = true;
          this.mensaje = "No se pudo eliminar el usuario.";
          this.confirmarEliminacion = null;
        }
      });
    } else {
      this.confirmarEliminacion = id;
      setTimeout(() => {
        if (this.confirmarEliminacion === id) this.confirmarEliminacion = null;
      }, 3000);
    }
  }
}
