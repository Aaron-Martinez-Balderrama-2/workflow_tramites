import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-tramites',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div class="space-y-6">
        
        <!-- Iniciar Trámite (CU-05) -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-borderCol-light dark:border-borderCol-dark p-6">
          <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-4">Generar Sistema de Trámites (CU-05)</h2>
          <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">Inicia una nueva instancia basándose en las Políticas de Negocio (Modelador).</p>
          <div class="flex gap-4">
            <select class="bg-slate-50 dark:bg-slate-900 border border-borderCol-light dark:border-borderCol-dark rounded p-2 text-slate-700 dark:text-slate-300">
              <option>Solicitud de Medidor</option>
              <option>Permiso de Construcción</option>
            </select>
            <button class="bg-blue-600 text-white px-4 py-2 rounded shadow-sm hover:bg-blue-700">Iniciar Trámite</button>
          </div>
        </div>
  
        <!-- Bandeja (CU-03, CU-06, CU-07, CU-08) -->
        <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-borderCol-light dark:border-borderCol-dark p-6">
          <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-4">Bandeja de Tareas (CU-03, CU-06, CU-07, CU-08)</h2>
          
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-900 border-b border-borderCol-light dark:border-borderCol-dark">
                <th class="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Instancia</th>
                <th class="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Cliente</th>
                <th class="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Estado / Nodo (CU-06)</th>
                <th class="p-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Acción (CU-07)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-borderCol-light dark:border-borderCol-dark">
                <td class="p-3 text-sm text-slate-700 dark:text-slate-300">TRM-9912</td>
                <td class="p-3 text-sm text-slate-700 dark:text-slate-300">Carlos Slim</td>
                <td class="p-3"><span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Análisis Legal</span></td>
                <td class="p-3">
                  <button class="bg-green-500 text-white text-xs px-3 py-1 rounded mr-2 hover:bg-green-600">Aprobar</button>
                  <button class="bg-red-500 text-white text-xs px-3 py-1 rounded hover:bg-red-600">Rechazar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
  
      </div>
    </div>
  `
})
export class TramitesComponent implements OnInit {
  constructor() { }
  ngOnInit(): void { }
}
