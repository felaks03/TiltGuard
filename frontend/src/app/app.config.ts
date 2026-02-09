import { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
import {
  provideHttpClient,
  HTTP_INTERCEPTORS,
  withInterceptorsFromDi,
} from "@angular/common/http";

import { routes } from "./app.routes";
import { AuthInterceptor } from "./interceptors/auth.interceptor";

/**
 * Configuración de la aplicación Angular
 *
 * Providers:
 * - provideRouter(routes): Configura las rutas
 * - provideHttpClient(withInterceptorsFromDi()): Proporciona HttpClient con soporte para interceptores
 * - HTTP_INTERCEPTORS: Registra el AuthInterceptor en todas las solicitudes
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    // Registra el AuthInterceptor para TODAS las solicitudes HTTP
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
};
