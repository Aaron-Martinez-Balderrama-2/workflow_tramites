import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/auth';
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const user = localStorage.getItem('user');
    if (user) {
      this.currentUserSubject.next(JSON.parse(user));
      // Sincronizar estado con el servidor al cargar la aplicación
      this.checkSistemaGenerado().subscribe();
    }
  }

  registerAdmin(userData: any) {
    return this.http.post(`${this.apiUrl}/register-admin`, userData);
  }

  registerEmpresa(usuarioId: string, empresaData: any) {
    return this.http.post(`${this.apiUrl}/register-empresa/${usuarioId}`, empresaData).pipe(
      tap((res: any) => {
        // Al registrar empresa, autologueamos al admin actualizando la sesión
        this.setSession(res.usuario);
      })
    );
  }

  login(credentials: any) {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((user: any) => {
        this.setSession(user);
      })
    );
  }

  logout() {
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private setSession(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  checkSistemaGenerado() {
    const user = this.currentUserSubject.value;
    if (user && user.empresaId) {
       return this.http.get(`http://localhost:8081/api/auth/empresa/${user.empresaId}`).pipe(
         tap((empresa: any) => {
            if (empresa.sistemaGenerado !== user.sistemaGenerado) {
              const updatedUser = { ...user, sistemaGenerado: empresa.sistemaGenerado };
              this.setSession(updatedUser);
            }
         })
       );
    }
    return new BehaviorSubject(null).asObservable();
  }
}
