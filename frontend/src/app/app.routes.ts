import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegistroComponent } from './pages/registro/registro.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { AdminComponent } from './pages/admin/admin.component';
import { OperacionesComponent } from './pages/operaciones/operaciones.component';
import { TareasComponent } from './pages/tareas/tareas.component';
import { LienzoDisenoComponent } from './components/lienzo-diseno/lienzo-diseno.component';
import { ManualComponent } from './pages/manual/manual.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'registro', component: RegistroComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent,
    canActivate: [authGuard] 
  },
  { 
    path: 'admin', 
    component: AdminComponent, 
    canActivate: [authGuard, roleGuard], 
    data: { expectedRoles: ['ADMINISTRADOR'] } 
  },
  { 
    path: 'operaciones', 
    component: OperacionesComponent,
    canActivate: [authGuard, roleGuard], 
    data: { expectedRoles: ['ADMINISTRADOR', 'DISENADOR', 'FUNCIONARIO'] } 
  },
  { 
    path: 'diseno', 
    component: LienzoDisenoComponent,
    canActivate: [authGuard, roleGuard], 
    data: { expectedRoles: ['ADMINISTRADOR', 'DISENADOR'] } 
  },
  { 
    path: 'tareas', 
    component: TareasComponent,
    canActivate: [authGuard, roleGuard], 
    data: { expectedRoles: ['ADMINISTRADOR', 'DISENADOR', 'FUNCIONARIO'] } 
  },
  { 
    path: 'manual', 
    component: ManualComponent,
    canActivate: [authGuard] 
  }
];
