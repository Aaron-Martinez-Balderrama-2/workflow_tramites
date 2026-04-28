import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LienzoDisenoComponent } from '../../components/lienzo-diseno/lienzo-diseno.component';
import { SidebarIaComponent } from '../../components/sidebar-ia/sidebar-ia.component';
import { ApiService } from '../../services/api.service';
import { UsuariosComponent } from '../usuarios/usuarios.component';
import { AreasComponent } from '../areas/areas.component';
import { TramitesComponent } from '../tramites/tramites.component';
import { ManualComponent } from '../manual/manual.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LienzoDisenoComponent, SidebarIaComponent, UsuariosComponent, AreasComponent, TramitesComponent, ManualComponent],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  isDarkMode = false;
  isLeftSidebarOpen = true;
  isRightSidebarOpen = true;
  currentView: string = 'modelador';

  switchView(view: string) {
    this.currentView = view;
  }

  @ViewChild(LienzoDisenoComponent) lienzo!: LienzoDisenoComponent;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.isDarkMode = true;
      document.body.classList.add('dark');
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  toggleLeftSidebar() {
    this.isLeftSidebarOpen = !this.isLeftSidebarOpen;
  }

  toggleRightSidebar() {
    this.isRightSidebarOpen = !this.isRightSidebarOpen;
  }

  async guardarSistema() {
    const xml = await this.lienzo.exportXML();
    if (xml) {
      this.apiService.guardarPolitica('Solicitud de Medidor', 'Flujo base', xml).subscribe({
        next: (res) => alert('¡Política guardada en MongoDB con éxito! ID: ' + res.id),
        error: (err) => alert('Error al guardar: ' + err.message)
      });
    }
  }

  @ViewChild(SidebarIaComponent) sidebarIa!: SidebarIaComponent;

  async onSolicitarGrafo() {
    const xml = await this.lienzo.exportXML();
    const ultimoMensaje = this.sidebarIa.mensajes[this.sidebarIa.mensajes.length - 1].texto;
    if(xml) {
        this.sidebarIa.procesarConGrafo(ultimoMensaje, xml);
    }
  }

  onAplicarCambios(nuevoXML: string) {
    this.lienzo.importXML(nuevoXML);
  }
}
