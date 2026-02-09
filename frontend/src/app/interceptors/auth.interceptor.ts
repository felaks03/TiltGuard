import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { AuthService } from "../services/auth.service";

/**
 * AuthInterceptor intercepta TODAS las solicitudes HTTP
 * Si hay token en localStorage, lo agrega al header Authorization
 *
 * Flujo:
 * 1. Cada solicitud HTTP pasa por aquí
 * 2. Se obtiene el token del AuthService
 * 3. Si existe token, se agrega al header Authorization
 * 4. La solicitud continúa con el token inyectado
 *
 * Ejemplo de header que agrega:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  /**
   * Intercepta TODAS las solicitudes HTTP
   * @param request - La solicitud HTTP
   * @param next - El siguiente handler en la cadena
   * @returns Observable del evento HTTP
   */
  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    // NO agregar token a las rutas de autenticación
    const isAuthRoute = request.url.includes("/api/auth/");

    if (!isAuthRoute) {
      // Para rutas que NO son de auth, agregar el token
      const token = this.authService.getToken();
      console.log(
        `[AuthInterceptor] URL: ${request.url}, Token: ${token ? "SÍ" : "NO"}`,
      );

      if (token) {
        request = request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log(`[AuthInterceptor] Token agregado al header`);
      } else {
        console.warn(
          `[AuthInterceptor] No hay token disponible para ${request.url}`,
        );
      }
    }

    // Continúa con la solicitud (ahora con el token en el header)
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error(
          `[AuthInterceptor] Error ${error.status}: ${error.message}`,
        );
        // Si recibimos 401, limpiamos la sesión
        if (error.status === 401) {
          console.warn(
            `[AuthInterceptor] Token inválido o expirado, limpiando sesión`,
          );
          this.authService.logout();
        }
        return throwError(() => error);
      }),
    );
  }
}
