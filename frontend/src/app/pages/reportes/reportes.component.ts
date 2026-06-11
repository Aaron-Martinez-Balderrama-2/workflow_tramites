import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType, Chart, registerables } from 'chart.js';
import { AuthService } from '../../services/auth/auth.service';

import { FormsModule } from '@angular/forms';

Chart.register(...registerables);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, FormsModule],
  templateUrl: './reportes.component.html'
})
export class ReportesComponent implements OnInit {
  analyticsData: any = null;
  riesgosData: any[] = [];
  loadingRiesgos: boolean = false;
  reporteTexto: string = '';
  isSpeaking: boolean = false;
  isListening: boolean = false;
  recognition: any;

  // Pie Chart options
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: ['Pendiente', 'En Proceso', 'Finalizado'],
    datasets: [{ data: [0, 0, 0], backgroundColor: ['#ef4444', '#f59e0b', '#22c55e'] }]
  };
  public pieChartType: ChartType = 'pie';

  // Bar Chart options
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  };
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Trámites por Sector', backgroundColor: '#3b82f6' }]
  };
  public barChartType: ChartType = 'bar';

  constructor(private http: HttpClient, private authService: AuthService) {}

  ngOnInit() {
    this.cargarDatos();
    this.initSpeechRecognition();
  }

  initSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'es-ES';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event: any) => {
        const command = event.results[0][0].transcript.toLowerCase();
        this.procesarComandoVoz(command);
        this.isListening = false;
      };

      this.recognition.onerror = (event: any) => {
        console.error('Error de reconocimiento de voz', event);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };
    }
  }

  activarMicrofono() {
    if (this.recognition) {
      this.recognition.start();
    } else {
      alert("Tu navegador no soporta comandos de voz. Usa Chrome.");
    }
  }

  procesarComandoVoz(comando: string) {
    console.log("Comando IA:", comando);
    
    // Cambios para el gráfico 1 (Estado)
    if (comando.includes('pastel') || comando.includes('torta')) {
      this.pieChartType = 'pie';
    } else if (comando.includes('dona') || comando.includes('anillo')) {
      this.pieChartType = 'doughnut';
    } else if (comando.includes('polar')) {
      this.pieChartType = 'polarArea';
    }
    
    // Cambios para el gráfico 2 (Sector)
    if (comando.includes('barra') || comando.includes('segmentacion') || comando.includes('segmentación')) {
      this.barChartType = 'bar';
    } else if (comando.includes('linea') || comando.includes('línea')) {
      this.barChartType = 'line';
    } else if (comando.includes('radar')) {
      this.barChartType = 'radar';
    }
  }

  cargarDatos() {
    this.authService.currentUser$.subscribe(user => {
      if (user && user.empresaId) {
        // Cargar Estadísticas Globales
        this.http.get(`/api/analiticas/globales/${user.empresaId}`).subscribe({
          next: (res: any) => {
            this.analyticsData = res;
            this.procesarGraficos();
            this.generarReporteLocal();
          },
          error: (err) => console.error('Error cargando analíticas', err)
        });
        
        // Cargar Monitor de Riesgos IA
        this.loadingRiesgos = true;
        this.http.get(`/api/analiticas/riesgos/${user.empresaId}`).subscribe({
          next: (res: any) => {
            this.riesgosData = res.predictions || [];
            this.loadingRiesgos = false;
          },
          error: (err) => {
            console.error('Error cargando monitor de riesgos', err);
            this.loadingRiesgos = false;
          }
        });
      }
    });
  }

  procesarGraficos() {
    // Torta
    const d = this.analyticsData.estadoDistribucion;
    this.pieChartData.datasets[0].data = [d.PENDIENTE || 0, d.EN_PROCESO || 0, d.FINALIZADO || 0];

    // Barras
    const sectores = Object.keys(this.analyticsData.cargaPorSector);
    const valores = Object.values(this.analyticsData.cargaPorSector) as number[];
    this.barChartData.labels = sectores;
    this.barChartData.datasets[0].data = valores;
  }

  generarReporteLocal() {
    const d = this.analyticsData.estadoDistribucion;
    if (d.PENDIENTE > d.FINALIZADO) {
      this.reporteTexto = `Actualmente existe un cuello de botella. Tenemos ${d.PENDIENTE} trámites pendientes que superan a los finalizados. El tiempo promedio de resolución es de ${this.analyticsData.tiempoPromedioResolucionHoras} horas. Se sugiere reasignar recursos urgentes al sector con más carga.`;
    } else {
      this.reporteTexto = `El flujo operativo es saludable. Se han finalizado ${d.FINALIZADO} trámites con éxito, manteniendo un tiempo de resolución de ${this.analyticsData.tiempoPromedioResolucionHoras} horas en promedio.`;
    }
  }

  reproducirAudio() {
    if (!this.reporteTexto) return;
    
    if (this.isSpeaking) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      return;
    }

    const utterance = new SpeechSynthesisUtterance(this.reporteTexto);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    
    utterance.onend = () => {
      this.isSpeaking = false;
    };
    
    this.isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  }
}
