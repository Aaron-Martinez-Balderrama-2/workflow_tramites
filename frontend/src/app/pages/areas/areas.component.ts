import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-areas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-borderCol-light dark:border-borderCol-dark p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-slate-800 dark:text-white">Áreas de Trabajo (CU-02)</h2>
      </div>

      <!-- Fomulario Real -->
      <div class="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg mb-6 border border-borderCol-light dark:border-borderCol-dark">
        <h3 class="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3">Crear Nueva Área</h3>
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <label class="block text-xs text-slate-500 mb-1">Nombre del Área</label>
            <input [(ngModel)]="nuevaArea.nombre" class="w-full border rounded p-2 text-sm bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:ring-1 focus:ring-primary-500">
          </div>
          <div class="flex-[2]">
            <label class="block text-xs text-slate-500 mb-1">Descripción</label>
            <input [(ngModel)]="nuevaArea.descripcion" class="w-full border rounded p-2 text-sm bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:ring-1 focus:ring-primary-500">
          </div>
          <div class="flex-1">
            <label class="block text-xs text-slate-500 mb-1">ID Responsable (Usuario)</label>
            <input [(ngModel)]="nuevaArea.responsableId" placeholder="Ej: 60a1b..." class="w-full border rounded p-2 text-sm bg-white dark:bg-slate-800 dark:text-white dark:border-slate-600 focus:ring-1 focus:ring-primary-500 font-mono text-xs">
          </div>
          <button (click)="guardarArea()" class="bg-primary-600 text-white px-6 py-2 rounded shadow-sm hover:bg-primary-700 h-[38px] text-sm font-medium transition-colors">
            Guardar en BD
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div *ngFor="let a of areas" class="border border-borderCol-light dark:border-borderCol-dark rounded-lg p-4 bg-slate-50 dark:bg-slate-900">
          <h3 class="font-bold text-slate-800 dark:text-white mb-2">{{ a.nombre }}</h3>
          <p class="text-sm text-slate-600 dark:text-slate-400">{{ a.descripcion }}</p>
          <div class="mt-4 pt-4 border-t border-borderCol-light dark:border-borderCol-dark flex justify-between">
            <span class="text-xs text-slate-500 font-mono">ID: {{ a.id }}</span>
            <span class="text-xs font-semibold text-primary-600 dark:text-primary-400">Responsable: {{ a.responsableId || 'Sin asignar' }}</span>
          </div>
        </div>
        
        <div *ngIf="areas.length === 0" class="col-span-2 p-8 text-center text-slate-500">
          No hay áreas registradas en la base de datos. Crea una arriba.
        </div>
      </div>
    </div>
  `
})
export class AreasComponent implements OnInit {
  areas: any[] = [];
  nuevaArea = { nombre: '', descripcion: '', responsableId: '' };

  constructor(private apiService: ApiService) { }
  
  ngOnInit(): void {
    this.cargarAreas();
  }

  cargarAreas() {
    this.apiService.getAreas().subscribe(data => {
      this.areas = data;
    });
  }

  guardarArea() {
    if (!this.nuevaArea.nombre) {
      alert("Por favor completa el nombre del área");
      return;
    }
    this.apiService.crearArea(this.nuevaArea).subscribe(res => {
      this.nuevaArea = { nombre: '', descripcion: '', responsableId: '' };
      this.cargarAreas(); 
    });
  }
}
