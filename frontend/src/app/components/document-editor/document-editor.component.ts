import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DocumentEditorModule } from '@onlyoffice/document-editor-angular';
import { AuthService } from '../../services/auth/auth.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-document-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, DocumentEditorModule],
  template: `
    <div class="w-full flex flex-col h-[70vh] bg-slate-100 rounded-xl overflow-hidden shadow-lg border border-slate-300 relative">
        
        <!-- Header Controls -->
        <div class="w-full bg-white border-b border-slate-300 p-3 flex justify-between items-center z-10 shadow-sm">
            <h3 class="font-bold text-slate-700 flex items-center gap-2">
                <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Editor de Documento
            </h3>
            <div class="flex items-center gap-3">
                <input type="file" #fileInput accept=".docx" class="hidden" (change)="onFileSelected($event)">
                <button (click)="fileInput.click()" class="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                    Importar DOCX
                </button>
                <button (click)="toggleHistory()" class="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Historial de Versiones
                </button>
            </div>
        </div>

        <div class="flex-1 relative flex">
            <!-- ONLYOFFICE Editor -->
            <div class="flex-1 h-full w-full">
                <document-editor 
                    *ngIf="configCargada"
                    id="docxEditor" 
                    documentServerUrl="http://localhost/"
                    [config]="editorConfig">
                </document-editor>
                
                <div *ngIf="!configCargada" class="w-full h-full flex items-center justify-center bg-white flex-col gap-4">
                    <span class="animate-spin text-5xl">⏳</span>
                    <p class="font-bold text-slate-500">Conectando con ONLYOFFICE Document Server...</p>
                </div>
            </div>

            <!-- Version History Sidebar -->
            <div *ngIf="showHistory" class="w-80 bg-slate-50 border-l border-slate-300 h-full flex flex-col shadow-[-4px_0_15px_rgba(0,0,0,0.05)] transition-all">
                <div class="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                    <h4 class="font-bold text-slate-700">Historial</h4>
                    <button (click)="toggleHistory()" class="text-slate-400 hover:text-slate-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div class="flex-1 overflow-y-auto p-4 space-y-4">
                    <div *ngIf="versiones.length === 0" class="text-center text-sm text-slate-500 py-8">
                        No hay versiones guardadas aún.
                    </div>
                    
                    <div *ngFor="let v of versiones" class="bg-white border border-slate-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div class="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                        <div class="flex justify-between items-start mb-2">
                            <span class="font-bold text-blue-700 text-sm">Versión {{v.version}}</span>
                            <span class="text-xs text-slate-400 font-mono">{{formatDate(v.fechaGuardado)}}</span>
                        </div>
                        <p class="text-xs text-slate-600 mb-3"><span class="font-semibold">Autor:</span> {{v.autor}}</p>
                        <button (click)="rollback(v.id)" class="w-full bg-slate-100 hover:bg-blue-50 text-blue-600 py-1.5 rounded text-xs font-semibold transition-colors border border-transparent hover:border-blue-200">
                            Restaurar esta versión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
  `
})
export class DocumentEditorComponent implements OnInit, OnDestroy {
  @Input() tramiteId!: string;
  
  currentUser: any = null;
  configCargada = false;
  editorConfig: any = {};
  
  showHistory = false;
  versiones: any[] = [];
  
  // Track reload to force OnlyOffice component re-rendering
  editorKeySuffix = 0;

  constructor(private authService: AuthService, private http: HttpClient) {
    this.authService.currentUser$.subscribe((user: any) => this.currentUser = user);
  }

  ngOnInit() {
      this.initEditor();
  }

  async initEditor() {
      this.configCargada = false;
      const docKey = this.tramiteId + "_doc_v" + this.editorKeySuffix;

      this.editorConfig = {
          document: {
              fileType: "docx",
              key: docKey,
              title: "Tramite Oficial - " + this.tramiteId + ".docx",
              url: window.location.origin + "/api/onlyoffice/download/" + this.tramiteId + "?t=" + new Date().getTime(),
              permissions: {
                  edit: true,
                  download: true
              }
          },
          documentType: "word",
          editorConfig: {
              callbackUrl: window.location.origin + "/api/onlyoffice/callback/" + this.tramiteId,
              user: {
                  id: this.currentUser?.id || "guest",
                  name: this.currentUser?.nombre || "Usuario Invitado"
              },
              mode: "edit",
              customization: {
                  chat: true,
                  comments: true,
                  compactHeader: false,
                  forcesave: true
              }
          }
      };

      try {
          const res: any = await firstValueFrom(this.http.post('/api/onlyoffice/sign', this.editorConfig));
          this.editorConfig.token = res.token;
          this.configCargada = true;
      } catch(e) {
          console.error("Error signing payload:", e);
          alert("Hubo un error de conexión con el backend al intentar firmar el documento.");
      }
  }

  async toggleHistory() {
      this.showHistory = !this.showHistory;
      if (this.showHistory) {
          await this.loadHistory();
      }
  }

  async loadHistory() {
      try {
          const res: any = await firstValueFrom(this.http.get('/api/onlyoffice/history/' + this.tramiteId));
          this.versiones = res;
      } catch (e) {
          console.error("Error cargando historial", e);
      }
  }

  formatDate(isoDate: string) {
      if (!isoDate) return '';
      const d = new Date(isoDate);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  }

  async onFileSelected(event: any) {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.name.endsWith('.docx')) {
          alert("Solo se permiten archivos .docx");
          return;
      }

      const formData = new FormData();
      formData.append('file', file);

      try {
          this.configCargada = false; // Hide editor while uploading
          await firstValueFrom(this.http.post('/api/onlyoffice/upload/' + this.tramiteId, formData));
          
          alert("Archivo importado exitosamente.");
          this.editorKeySuffix++; // Change key to force ONLYOFFICE to fetch new file instead of using cache
          this.initEditor();
      } catch (e) {
          console.error("Error subiendo archivo", e);
          alert("Ocurrió un error al importar el archivo.");
          this.configCargada = true;
      }
  }

  async rollback(versionId: string) {
      if (!confirm("¿Estás seguro de restaurar esta versión? Esto sobreescribirá el documento actual.")) return;

      try {
          this.configCargada = false; // Hide editor during rollback
          await firstValueFrom(this.http.post('/api/onlyoffice/rollback/' + this.tramiteId + '/' + versionId, {}));
          
          alert("Documento restaurado exitosamente.");
          this.editorKeySuffix++; // Change key to force reload
          this.initEditor();
          this.loadHistory(); // refresh history to show the new rollback version
      } catch (e) {
          console.error("Error en rollback", e);
          alert("Ocurrió un error al intentar restaurar el documento.");
          this.configCargada = true;
      }
  }

  ngOnDestroy() {}
}
