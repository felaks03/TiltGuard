import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Router } from "@angular/router";

@Injectable({
  providedIn: "root",
})
export class AuthService {
  // URL del backend
  private apiUrl = "http://localhost:3000/api/auth";

  // BehaviorSubject para el usuario actual (reactivo)
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // BehaviorSubject para el estado de autenticación (reactivo)
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    // Al iniciar el servicio, verifica si hay token guardado
    this.checkStoredToken();
  }

  /**
   * Verifica si hay token guardado en localStorage
   * Si existe, marca el usuario como autenticado
   */
  private checkStoredToken(): void {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (token && user) {
      try {
        this.currentUserSubject.next(JSON.parse(user));
        this.isAuthenticatedSubject.next(true);
      } catch (e) {
        // Si hay error al parsear, limpia el almacenamiento
        this.logout();
      }
    }
  }

  /**
   * Registra un nuevo usuario
   * POST /api/auth/register
   *
   * Parámetros:
   * - nombre: string (mínimo 2 caracteres)
   * - email: string (debe ser válido y único)
   * - password: string (mínimo 6 caracteres)
   */
  register(nombre: string, email: string, password: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/register`, {
        nombre,
        email,
        password,
      })
      .pipe(
        tap((response: any) => {
          if (response.token && response.user) {
            // Guarda el token en localStorage
            localStorage.setItem("token", response.token);
            // Guarda los datos del usuario en localStorage
            localStorage.setItem("user", JSON.stringify(response.user));
            // Actualiza los BehaviorSubjects
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
          }
        }),
      );
  }

  /**
   * Inicia sesión con email y contraseña
   * POST /api/auth/login
   *
   * Parámetros:
   * - email: string
   * - password: string
   */
  login(email: string, password: string): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/login`, {
        email,
        password,
      })
      .pipe(
        tap((response: any) => {
          if (response.token && response.user) {
            console.log(
              `[AuthService] Login exitoso para ${response.user.email}`,
            );
            // Guarda el token
            localStorage.setItem("token", response.token);
            console.log(`[AuthService] Token guardado en localStorage`);
            // Guarda los datos del usuario
            localStorage.setItem("user", JSON.stringify(response.user));
            // Actualiza los BehaviorSubjects
            this.currentUserSubject.next(response.user);
            this.isAuthenticatedSubject.next(true);
          }
        }),
      );
  }

  /**
   * Cierra sesión y limpia todo
   */
  logout(): void {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(["/login"]);
  }

  /**
   * Verifica si el usuario está autenticado
   * Retorna: true si hay token, false si no
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  }

  /**
   * Verifica si el usuario es administrador
   * Retorna: true si el rol es 'admin', false si no
   */
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user && user.rol === "admin";
  }

  /**
   * Obtiene el token JWT almacenado
   * Retorna: string (token) o null si no existe
   */
  getToken(): string | null {
    return localStorage.getItem("token");
  }

  /**
   * Obtiene el usuario actual
   * Retorna: objeto del usuario o null
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el usuario actual como observable
   * Útil para componentes que necesitan reactividad
   */
  getCurrentUser$(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Suplanta a otro usuario (solo para admins)
   * POST /api/auth/impersonate/:userId
   *
   * Parámetros:
   * - userId: string (ID del usuario a suplantar)
   */
  impersonate(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/impersonate/${userId}`, {}).pipe(
      tap((response: any) => {
        if (response.token && response.user) {
          console.log(
            `[AuthService] Suplantación exitosa: ahora eres ${response.user.email}`,
          );
          // Guarda el nuevo token
          localStorage.setItem("token", response.token);
          // Guarda los datos del usuario suplantado
          localStorage.setItem("user", JSON.stringify(response.user));
          // Actualiza los BehaviorSubjects
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
    );
  }

  /**
   * Detiene la suplantación y vuelve a la sesión del admin original
   * POST /api/auth/stop-impersonation
   */
  stopImpersonation(): Observable<any> {
    return this.http.post(`${this.apiUrl}/stop-impersonation`, {}).pipe(
      tap((response: any) => {
        if (response.token && response.user) {
          console.log(
            `[AuthService] Suplantación detenida: volviste a ser ${response.user.email}`,
          );
          // Restaura el token del admin
          localStorage.setItem("token", response.token);
          // Restaura los datos del admin
          localStorage.setItem("user", JSON.stringify(response.user));
          // Actualiza los BehaviorSubjects
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      }),
    );
  }

  /**
   * Verifica si estamos suplantando a otro usuario
   * Retorna: true si el token contiene impersonatedBy, false si no
   */
  isImpersonating(): boolean {
    const user = this.currentUserSubject.value;
    return user && !!user.impersonatedBy;
  }

  /**
   * Obtiene el ID del admin que está suplantando (si existe)
   * Retorna: string (ID del admin) o null
   */
  getImpersonatedBy(): string | null {
    const user = this.currentUserSubject.value;
    return user && user.impersonatedBy ? user.impersonatedBy : null;
  }
}
