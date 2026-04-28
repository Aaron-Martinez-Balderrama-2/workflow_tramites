import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <!-- Paso 1: Registro de Administrador -->
      <div *ngIf="paso === 1" class="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Crear tu cuenta
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            o <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-500">inicia sesión</a> si ya tienes una
          </p>
        </div>
        <form class="mt-8 space-y-6" (ngSubmit)="registrarAdmin()">
          <div class="rounded-md shadow-sm -space-y-px">
            <div>
              <input name="nombre" type="text" required [(ngModel)]="usuario.nombre" class="input-field rounded-t-md" placeholder="Nombre completo">
            </div>
            <div>
              <input name="ci" type="text" required [(ngModel)]="usuario.ci" class="input-field" placeholder="Carnet de Identidad">
            </div>
            <div>
              <input name="telefono" type="text" required [(ngModel)]="usuario.telefono" class="input-field" placeholder="Teléfono">
            </div>
            <div>
              <input name="email" type="email" required [(ngModel)]="usuario.email" class="input-field" placeholder="Correo electrónico">
            </div>
            <div>
              <input name="password" type="password" required [(ngModel)]="usuario.password" class="input-field rounded-b-md" placeholder="Contraseña">
            </div>
          </div>

          <div *ngIf="error" class="text-red-500 text-sm text-center">{{ error }}</div>

          <div>
            <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Registrar
            </button>
          </div>
        </form>
      </div>

      <!-- Paso 2: Creación de la Empresa (Modal-like) -->
      <div *ngIf="paso === 2" class="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md border-2 border-blue-500">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            ¡Bienvenido!
          </h2>
          <p class="mt-2 text-center text-md text-gray-600 dark:text-gray-400">
            Para empezar, ¿Cuál es el nombre de tu empresa?
          </p>
        </div>
        <form class="mt-8 space-y-6" (ngSubmit)="registrarEmpresa()">
          <div>
            <input name="nombreEmpresa" type="text" required [(ngModel)]="nombreEmpresa" class="input-field rounded-md" placeholder="Nombre de la Empresa">
          </div>

          <div *ngIf="error" class="text-red-500 text-sm text-center">{{ error }}</div>

          <div>
            <button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
              Crear Empresa e Iniciar Sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .input-field {
      @apply appearance-none relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm;
    }
  `]
})
export class RegistroComponent {
  paso = 1;
  usuario = { nombre: '', ci: '', telefono: '', email: '', password: '' };
  nombreEmpresa = '';
  usuarioIdCreado = '';
  error = '';

  constructor(private authService: AuthService, private router: Router) {}

  registrarAdmin() {
    this.authService.registerAdmin(this.usuario).subscribe({
      next: (res: any) => {
        this.usuarioIdCreado = res.usuarioId;
        this.paso = 2; // Avanzar al paso de crear empresa
        this.error = '';
      },
      error: (err) => {
        this.error = err.error.mensaje || 'Error al registrar el usuario.';
      }
    });
  }

  registrarEmpresa() {
    this.authService.registerEmpresa(this.usuarioIdCreado, { nombre: this.nombreEmpresa }).subscribe({
      next: (res: any) => {
        // Redirigir al panel de administración tras crear la empresa
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.error = 'Error al registrar la empresa.';
      }
    });
  }
}
