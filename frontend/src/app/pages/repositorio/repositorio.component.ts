import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ExpedienteService } from '../../services/expediente.service';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-repositorio',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './repositorio.component.html'
})
export class RepositorioComponent implements OnInit {
  tramites: any[] = [];
  currentUser: any = null;
  cargando = true;

  // Variables para Visor de Expediente
  tramiteSeleccionado: any = null;
  historialVersiones: any[] = [];
  versionActualSeleccionada: any = null;

  constructor(
    private expedienteService: ExpedienteService,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.cargarTramites();
      }
    });
  }

  cargarTramites() {
    this.cargando = true;
    this.expedienteService.getTramitesPorEmpresa(this.currentUser.empresaId).subscribe({
      next: (data) => {
        this.tramites = data;
        this.cargando = false;
        
        // Auto-abrir si viene en los query params
        this.route.queryParams.subscribe(params => {
          const tramiteId = params['tramiteId'];
          if (tramiteId) {
            const tr = this.tramites.find(t => t.id === tramiteId);
            if (tr) this.verExpediente(tr);
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  verExpediente(tramite: any) {
    this.tramiteSeleccionado = tramite;
    this.cargando = true;
    this.expedienteService.getHistorial(tramite.id).subscribe({
      next: (versiones) => {
        // Parsear los JSON de variables para la vista
        this.historialVersiones = versiones.map(v => ({
            ...v,
            datosParsed: v.variables ? JSON.parse(v.variables) : {}
        })).sort((a,b) => b.version - a.version); // Descendente
        
        if (this.historialVersiones.length > 0) {
            this.versionActualSeleccionada = this.historialVersiones[0];
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error(err);
        this.cargando = false;
      }
    });
  }

  cerrarExpediente() {
    this.tramiteSeleccionado = null;
    this.historialVersiones = [];
    this.versionActualSeleccionada = null;
  }

  seleccionarVersion(version: any) {
    this.versionActualSeleccionada = version;
  }
}
