import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-borderCol-light dark:border-borderCol-dark p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-slate-800 dark:text-white">Gestión de Usuarios (CU-01)</h2>
      </div>
      
      <!-- Fomulario Real -->
      <div class="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-6 border border-borderCol-light dark:border-borderCol-dark">
        <h3 class="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">Crear Nuevo Usuario</h3>
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <label class="block text-xs text-slate-500 mb-1">Nombre</label>
            <input [(ngModel)]="nuevoUsuario.nombre" class="w-full border rounded p-2 text-sm bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:ring-1 focus:ring-primary-500">
          </div>
          <div class="flex-1">
            <label class="block text-xs text-slate-500 mb-1">Email</label>
            <input [(ngModel)]="nuevoUsuario.email" class="w-full border rounded p-2 text-sm bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:ring-1 focus:ring-primary-500">
          </div>
          <div class="flex-1">
            <label class="block text-xs text-slate-500 mb-1">Rol</label>
            <select [(ngModel)]="nuevoUsuario.rol" class="w-full border rounded p-2 text-sm bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:ring-1 focus:ring-primary-500">
              <option value="ADMIN">Administrador</option>
              <option value="FUNCIONARIO">Funcionario</option>
              <option value="CLIENTE">Cliente</option>
            </select>
          </div>
          <button (click)="guardarUsuario()" class="bg-primary-600 text-white px-6 py-2 rounded shadow-sm hover:bg-primary-700 h-[38px] text-sm font-medium transition-colors">
            Guardar en BD
          </button>
        </div>
      </div>
      
      <!-- Tabla Real -->
      <table class="w-full text-left border-collapse">
        <thead>
          <tr class="bg-slate-50 dark:bg-slate-900 border-b border-borderCol-light dark:border-borderCol-dark">
            <th class="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">ID (MongoDB)</th>
            <th class="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Nombre</th>
            <th class="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Email</th>
            <th class="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Rol</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let u of usuarios" class="border-b border-borderCol-light dark:border-borderCol-dark">
            <td class="p-3 text-xs text-slate-500 font-mono">{{ u.id }}</td>
            <td class="p-3 text-sm text-slate-700 dark:text-slate-300">{{ u.nombre }}</td>
            <td class="p-3 text-sm text-slate-700 dark:text-slate-300">{{ u.email }}</td>
            <td class="p-3">
              <span class="text-xs px-2 py-1 rounded" 
                    [ngClass]="{'bg-blue-100 text-blue-800': u.rol === 'FUNCIONARIO', 'bg-green-100 text-green-800': u.rol === 'ADMIN', 'bg-gray-100 text-gray-800': u.rol === 'CLIENTE'}">
                {{ u.rol }}
              </span>
            </td>
          </tr>
          <tr *ngIf="usuarios.length === 0">
            <td colspan="4" class="p-4 text-center text-slate-500 text-sm">No hay usuarios en la base de datos. Crea uno arriba.</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  nuevoUsuario = { nombre: '', email: '', rol: 'FUNCIONARIO' };

  constructor(private apiService: ApiService) { }
  
  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.apiService.getUsuarios().subscribe(data => {
      this.usuarios = data;
    });
  }

  guardarUsuario() {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.email) {
      alert("Por favor completa nombre y email");
      return;
    }
    this.apiService.crearUsuario(this.nuevoUsuario).subscribe(res => {
      this.nuevoUsuario = { nombre: '', email: '', rol: 'FUNCIONARIO' };
      this.cargarUsuarios(); 
    });
  }
}
