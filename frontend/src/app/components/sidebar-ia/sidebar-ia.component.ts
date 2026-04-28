import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-sidebar-ia',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar-ia.component.html'
})
export class SidebarIaComponent {
  promptActual: string = '';
  mensajes: {texto: string, esUsuario: boolean, tiempo: string}[] = [
    {texto: "Hola, soy PolicyFlow AI. Analizaré tu diagrama actual y ejecutaré tus órdenes.", esUsuario: false, tiempo: "Ahora"}
  ];
  cargando = false;

  @Output() aplicarCambios = new EventEmitter<any>();
  @Output() solicitarGrafo = new EventEmitter<void>();

  constructor(private apiService: ApiService) {}

  enviarMensaje() {
    if (!this.promptActual.trim()) return;
    
    const texto = this.promptActual;
    this.promptActual = '';
    
    this.mensajes.push({texto, esUsuario: true, tiempo: new Date().toLocaleTimeString()});
    this.cargando = true;

    // Dispara evento para que Dashboard inyecte el grafo
    this.solicitarGrafo.emit();
  }

  procesarConGrafo(textoPrompt: string, grafoActual: string) {
    this.apiService.consultarGemini(textoPrompt, grafoActual).subscribe({
      next: (res) => {
         this.mensajes.push({texto: "Hecho. Revisa el lienzo.", esUsuario: false, tiempo: new Date().toLocaleTimeString()});
         this.cargando = false;
         try {
           const xmlLimpio = res.replace(/```xml/g, "").replace(/```/g, "").trim();
           this.aplicarCambios.emit(xmlLimpio);
         } catch(e) {
           console.error("Gemini devolvió un error de parseo:", e);
         }
      },
      error: (err) => {
         this.cargando = false;
         this.mensajes.push({texto: "Error de IA: " + err.message, esUsuario: false, tiempo: new Date().toLocaleTimeString()});
      }
    });
  }
}
