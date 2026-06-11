import { Component, OnInit } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, CommonModule],
  template: `
    <nav class="bg-gray-800 p-4 text-white flex justify-between items-center">
        <div class="font-bold text-xl">PolicyFlow AI</div>
        
        <!-- Enlaces si el usuario NO está logueado -->
        <div class="flex gap-4" *ngIf="!isLoggedIn">
            <a routerLink="/login" class="hover:text-blue-300">Login</a>
            <a routerLink="/registro" class="bg-blue-600 px-3 py-1 rounded hover:bg-blue-700">Registrarse</a>
        </div>

        <!-- Enlaces si el usuario SÍ está logueado -->
        <div class="flex gap-4 items-center" *ngIf="isLoggedIn">
            <span class="text-sm text-gray-400 mr-4">Hola, {{ currentUser?.nombre }} ({{ currentUser?.rol }})</span>
            
            <a *ngIf="currentUser?.rol === 'ADMINISTRADOR'" routerLink="/admin" class="hover:text-blue-300">Gestionar Usuarios</a>
            
            <a *ngIf="currentUser?.rol === 'ADMINISTRADOR' || currentUser?.rol === 'DISENADOR'" routerLink="/diseno" class="hover:text-blue-300">Modelar BPMN</a>
            
            <!-- Módulos de Fase 3 (Operativos) -->
            <a *ngIf="currentUser?.sistemaGenerado" routerLink="/operaciones" class="hover:text-blue-300">Gestionar Trámites</a>
            <a *ngIf="currentUser?.sistemaGenerado" routerLink="/tareas" class="hover:text-blue-300">Gestionar Tareas</a>
            <a *ngIf="currentUser?.sistemaGenerado" routerLink="/repositorio" class="hover:text-blue-300 font-bold text-blue-200">📚 Gestor Documental</a>
            <a *ngIf="currentUser?.sistemaGenerado" routerLink="/reportes" class="hover:text-blue-300 font-bold text-blue-200">📊 Reportes IA</a>
            
            <a routerLink="/manual" class="bg-blue-900/50 px-3 py-1 rounded border border-blue-700 hover:bg-blue-800 transition-colors">Manual</a>
            
            <button (click)="logout()" class="ml-4 text-red-400 hover:text-red-300">Cerrar Sesión</button>
        </div>
    </nav>
    <div class="main-content min-h-[calc(100vh-64px)]">
        <router-outlet></router-outlet>
    </div>
  `
})
export class AppComponent implements OnInit {
  isLoggedIn = false;
  currentUser: any = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
