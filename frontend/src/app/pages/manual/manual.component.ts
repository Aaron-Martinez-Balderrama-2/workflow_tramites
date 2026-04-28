import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-manual',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './manual.component.html',
  styleUrl: './manual.component.css'
})
export class ManualComponent {
  seccionActual: string = 'introduccion';

  cambiarSeccion(seccion: string) {
    this.seccionActual = seccion;
  }
}
