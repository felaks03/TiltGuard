# 🔐 Guía Completa: Sistema de Login y Register para TiltGuard

Este README proporciona una guía **paso a paso, muy detallada** para construir un sistema completo de autenticación (Login y Register) en TiltGuard.

---

## 📋 Tabla de Contenidos

1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Paso a Paso Detallado](#paso-a-paso-detallado)
   - [Paso 1: AuthService](#paso-1-crear-authservice-frontend)
   - [Paso 2: Guards](#paso-2-crear-guards-de-ruta)
   - [Paso 3: Interceptor HTTP](#paso-3-crear-interceptor-http)
   - [Paso 4: LoginComponent](#paso-4-crear-logincomponent)
   - [Paso 5: RegisterComponent](#paso-5-crear-registercomponent)
   - [Paso 6: Actualizar Rutas](#paso-6-actualizar-rutas-frontend)
   - [Paso 7: Configurar Interceptor](#paso-7-configurar-interceptor-en-appconfig)
   - [Paso 8: Endpoints Backend](#paso-8-crear-endpoints-backend)
   - [Paso 9: Conectar Rutas Backend](#paso-9-conectar-rutas-auth-al-backend)
   - [Paso 10: Compilar y Probar](#paso-10-compilar-verificar-y-probar)

---

## Resumen del Proyecto

### ¿Qué vamos a construir?

Un sistema de autenticación completo que permite:

1. **Registro de nuevos usuarios** con validaciones
2. **Login de usuarios** con generación de JWT
3. **Redirección automática** según rol (admin → /admin, usuario → /user)
4. **Protección de rutas** mediante guardias Angular
5. **Almacenamiento seguro de tokens** en localStorage
6. **Inyección automática de tokens** en solicitudes HTTP

### Tecnologías Usadas

- **Frontend**: Angular 21, Reactive Forms, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Base de Datos**: MongoDB (ya configurada)
- **Autenticación**: JWT (JSON Web Tokens)
- **Encriptación**: bcryptjs (ya en User model)

---

## Arquitectura del Sistema

### Estructura de Archivos por Componente

**IMPORTANTE:** Cada componente en TiltGuard debe tener **exactamente 5 archivos**:

```
component-name/
├── component-name.component.ts       # Lógica del componente (TypeScript)
├── component-name.component.html     # Template HTML
├── component-name.component.scss     # Estilos SCSS
├── component-name.component.module.ts # Módulo Angular
└── component-name.service.ts         # Servicio (lógica compartida)
```

**Aplicado a nuestros nuevos componentes:**

```
frontend/src/app/pages/
├── login/
│   ├── login.component.ts
│   ├── login.component.html
│   ├── login.component.scss
│   ├── login.component.module.ts
│   └── login.service.ts
└── register/
    ├── register.component.ts
    ├── register.component.html
    ├── register.component.scss
    ├── register.component.module.ts
    └── register.service.ts
```

---

### Diagrama de Flujo del Sistema
┌─────────────────────────────────────────────────────────────┐
│                        USUARIO                              │
└────────────────┬────────────────────────────────────┬────────┘
                 │                                    │
                 ▼                                    ▼
        ┌─────────────────┐             ┌─────────────────────┐
        │ /register       │             │ /login              │
        │ (Público)       │             │ (Público)           │
        └────────┬────────┘             └──────────┬──────────┘
                 │                                 │
                 │ POST /api/auth/register        │ POST /api/auth/login
                 │                                 │
                 └──────────────┬──────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │   BACKEND EXPRESS   │
                    │  /api/auth/register │
                    │  /api/auth/login    │
                    └───────────┬──────────┘
                                │
                    ┌───────────▼──────────┐
                    │      MongoDB        │
                    │  (Guardar usuario)  │
                    └─────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │  Generar JWT Token  │
                    └───────────┬──────────┘
                                │
                    ┌───────────▼──────────┐
                    │  Enviar a Frontend  │
                    └───────────┬──────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
    Guardar Token        Guardar Usuario          localStorage
    en localStorage      en localStorage              │
        │                       │                      │
        └───────────────────────┼──────────────────────┘
                                │
                    ┌───────────▼──────────┐
                    │   AuthService       │
                    │  Maneja tokens      │
                    └───────────┬──────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
    AuthGuard          AdminGuard            AuthInterceptor
    (Verifica auth)    (Verifica admin)      (Inyecta JWT)
        │                       │                      │
        └───────────────────────┼──────────────────────┘
                                │
        ┌───────────────────────┴───────────────────────┐
        │                                               │
        ▼                                               ▼
    /user (Usuario regular)              /admin (Administrador)
    Dashboard de Usuario                 Dashboard de Admin
```

---

## Paso a Paso Detallado

---

### **PASO 1: Crear AuthService (Frontend)**

**¿Para qué sirve?**
El AuthService es el "corazón" del sistema de autenticación. Es un servicio Angular que:
- Comunica con el backend para registrar y hacer login
- Guarda el token JWT en localStorage
- Proporciona métodos para verificar si el usuario está autenticado
- Verifica si el usuario es admin
- Proporciona el token para que el interceptor lo inyecte en solicitudes

**Archivos a crear:**
- `frontend/src/app/services/auth.service.ts`

**Pasos:**

1. **Crea la carpeta de servicios** (si no existe):
   ```bash
   mkdir -p /home/felixpop/Escritorio/TiltGuard/frontend/src/app/services
   ```

2. **Crea el archivo `auth.service.ts`**:
   
   En VS Code, abre el explorador de archivos y ve a:
   `frontend/src/app/services/`
   
   Haz clic derecho → Nuevo archivo → Escribe `auth.service.ts`

3. **Copia este código completo** en el archivo:

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL del backend
  private apiUrl = 'http://localhost:5000/api/auth';
  
  // BehaviorSubject para el usuario actual (reactivo)
  private currentUserSubject = new BehaviorSubject<any>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  // BehaviorSubject para el estado de autenticación (reactivo)
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Al iniciar el servicio, verifica si hay token guardado
    this.checkStoredToken();
  }

  /**
   * Verifica si hay token guardado en localStorage
   * Si existe, marca el usuario como autenticado
   */
  private checkStoredToken(): void {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
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
    return this.http.post(`${this.apiUrl}/register`, { 
      nombre, 
      email, 
      password 
    }).pipe(
      tap((response: any) => {
        if (response.token && response.user) {
          // Guarda el token en localStorage
          localStorage.setItem('token', response.token);
          // Guarda los datos del usuario en localStorage
          localStorage.setItem('user', JSON.stringify(response.user));
          // Actualiza los BehaviorSubjects
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
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
    return this.http.post(`${this.apiUrl}/login`, { 
      email, 
      password 
    }).pipe(
      tap((response: any) => {
        if (response.token && response.user) {
          // Guarda el token
          localStorage.setItem('token', response.token);
          // Guarda los datos del usuario
          localStorage.setItem('user', JSON.stringify(response.user));
          // Actualiza los BehaviorSubjects
          this.currentUserSubject.next(response.user);
          this.isAuthenticatedSubject.next(true);
        }
      })
    );
  }

  /**
   * Cierra sesión y limpia todo
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  /**
   * Verifica si el usuario está autenticado
   * Retorna: true si hay token, false si no
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Verifica si el usuario es admin
   * Retorna: true si el rol es 'admin', false si no
   */
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user && user.role === 'admin';
  }

  /**
   * Obtiene el usuario actual
   * Retorna: objeto con id, nombre, email, role
   */
  getCurrentUser(): any {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el token JWT
   * Usado por el interceptor para inyectar en solicitudes
   * Retorna: string con el token o null si no existe
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
```

**Explicación del código:**

- **Injectable**: Marca la clase como un servicio que puede ser inyectado
- **BehaviorSubject**: Permite que componentes se suscriban a cambios en la autenticación
- **checkStoredToken()**: Al iniciar, verifica si hay sesión guardada
- **register()**: Llama al backend, guarda token y usuario
- **login()**: Llama al backend, guarda token y usuario
- **logout()**: Limpia todo y redirige a /login
- **isAuthenticated()**: Retorna true/false si hay token
- **isAdmin()**: Retorna true/false si el usuario es admin

**Verificación:**
En VS Code, el archivo debe compilar sin errores rojos.

---

### **PASO 2: Crear Guards de Ruta**

**¿Para qué sirven?**
Los Guards protegen las rutas. Son como "porteros" que dicen:
- **AuthGuard**: "¿Estás autenticado? Si no, vete a /login"
- **AdminGuard**: "¿Eres admin? Si no, vete a /user"

**Archivos a crear:**
- `frontend/src/app/guards/auth.guard.ts`
- `frontend/src/app/guards/admin.guard.ts`

**Pasos:**

1. **Crea la carpeta de guards** (si no existe):
   ```bash
   mkdir -p /home/felixpop/Escritorio/TiltGuard/frontend/src/app/guards
   ```

2. **Crea el archivo `auth.guard.ts`**:

```typescript
import { Injectable } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard protege rutas que requieren autenticación
 * Si el usuario NO está autenticado, lo redirige a /login
 */
export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si está autenticado, permite el acceso
  if (authService.isAuthenticated()) {
    return true;
  }

  // Si NO está autenticado, redirige a /login
  router.navigate(['/login']);
  return false;
};
```

3. **Crea el archivo `admin.guard.ts`**:

```typescript
import { Injectable } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * AdminGuard protege rutas que requieren ser admin
 * - Si eres admin, permite el acceso
 * - Si eres usuario regular, redirige a /user
 * - Si no estás autenticado, redirige a /login
 */
export const AdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Si está autenticado Y es admin, permite el acceso
  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // Si está autenticado pero NO es admin, redirige a /user
  if (authService.isAuthenticated()) {
    router.navigate(['/user']);
    return false;
  }

  // Si NO está autenticado, redirige a /login
  router.navigate(['/login']);
  return false;
};
```

**Explicación:**

- **CanActivateFn**: Función que decide si permitir acceso a una ruta
- **inject()**: Obtiene instancias de servicios
- **route, state**: Parámetros de la ruta actual
- **return true**: Permite el acceso
- **return false**: Bloquea el acceso

**Verificación:**
Ambos archivos deben compilar sin errores.

---

### **PASO 3: Crear Interceptor HTTP**

**¿Para qué sirve?**
El interceptor es como un "inspector de aduanas" que revisa TODAS las solicitudes HTTP:
- Si hay token en localStorage, lo agrega al header `Authorization`
- Todas las solicitudes al backend incluyen el JWT automáticamente

**Archivos a crear:**
- `frontend/src/app/interceptors/auth.interceptor.ts`

**Pasos:**

1. **Crea la carpeta de interceptors** (si no existe):
   ```bash
   mkdir -p /home/felixpop/Escritorio/TiltGuard/frontend/src/app/interceptors
   ```

2. **Crea el archivo `auth.interceptor.ts`**:

```typescript
import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * AuthInterceptor intercepta TODAS las solicitudes HTTP
 * Si hay token en localStorage, lo agrega al header Authorization
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // Obtiene el token del AuthService
    const token = this.authService.getToken();
    
    // Si existe token, lo agrega al header
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    // Continúa con la solicitud (ahora con el token en el header)
    return next.handle(request);
  }
}
```

**Explicación:**

- **HttpInterceptor**: Interfaz para interceptar solicitudes
- **intercept()**: Método que se ejecuta en cada solicitud
- **request.clone()**: Crea una copia de la solicitud con cambios
- **setHeaders**: Agrega un header a la solicitud
- **Authorization: Bearer ${token}**: Formato estándar de JWT

**Verificación:**
El archivo debe compilar sin errores.

---

### **PASO 4: Crear LoginComponent**

**¿Para qué sirve?**
Es la página de login. Permite:
- Ingresar email y contraseña
- Validar datos
- Llamar al backend para autenticarse
- Redirigir según el rol (admin → /admin, usuario → /user)

**Archivos a crear:**
- `frontend/src/app/pages/login/login.component.ts`
- `frontend/src/app/pages/login/login.component.html`
- `frontend/src/app/pages/login/login.component.scss`

**Pasos:**

1. **Asegúrate que la carpeta `/pages/login/` existe pero está vacía**:
   ```bash
   ls -la /home/felixpop/Escritorio/TiltGuard/frontend/src/app/pages/login/
   ```

2. **Crea el archivo TypeScript `login.component.ts`**:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * LoginComponent - Página de inicio de sesión
 * 
 * Responsabilidades:
 * - Mostrar formulario de login (email, password)
 * - Validar datos
 * - Llamar a AuthService.login()
 * - Redirigir según rol
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;        // Formulario reactivo
  isLoading = false;             // Flag para mostrar spinner
  errorMessage: string | null = null; // Mensaje de error

  constructor(
    private fb: FormBuilder,       // Para construir formularios
    private authService: AuthService, // Para hacer login
    private router: Router         // Para redirigir
  ) {}

  ngOnInit(): void {
    // Inicializa el formulario cuando carga el componente
    this.initializeForm();
  }

  /**
   * Crea el formulario reactivo con validadores
   */
  private initializeForm(): void {
    this.loginForm = this.fb.group({
      // Email: requerido y debe ser válido
      email: ['', [Validators.required, Validators.email]],
      // Password: requerido y mínimo 6 caracteres
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  /**
   * Se ejecuta al hacer submit del formulario
   */
  onSubmit(): void {
    // Si el formulario no es válido, no hace nada
    if (this.loginForm.invalid) {
      return;
    }

    // Muestra spinner
    this.isLoading = true;
    this.errorMessage = null;

    // Extrae los valores del formulario
    const { email, password } = this.loginForm.value;

    // Llama al AuthService para hacer login
    this.authService.login(email, password).subscribe({
      next: (response) => {
        // Login exitoso
        this.isLoading = false;
        const user = response.user;
        
        // Redirige según el rol del usuario
        if (user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else {
          this.router.navigate(['/user']);
        }
      },
      error: (error) => {
        // Login fallido
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Email o contraseña incorrectos';
      }
    });
  }

  /**
   * Verifica si un campo tiene un error específico
   * Usado para mostrar mensajes de error en el template
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }
}
```

3. **Crea el archivo HTML `login.component.html`**:

```html
<div class="login-container">
  <div class="login-card">
    <h1>Inicia Sesión</h1>
    <p class="subtitle">Accede a tu cuenta de TiltGuard</p>

    <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
      <!-- Campo Email -->
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          placeholder="tu@email.com"
          class="form-input"
          [class.error]="hasError('email', 'required') || hasError('email', 'email')"
        />
        <div class="error-message" *ngIf="hasError('email', 'required')">
          El email es requerido
        </div>
        <div class="error-message" *ngIf="hasError('email', 'email')">
          El email debe ser válido
        </div>
      </div>

      <!-- Campo Contraseña -->
      <div class="form-group">
        <label for="password">Contraseña</label>
        <input
          id="password"
          type="password"
          formControlName="password"
          placeholder="Tu contraseña"
          class="form-input"
          [class.error]="hasError('password', 'required') || hasError('password', 'minlength')"
        />
        <div class="error-message" *ngIf="hasError('password', 'required')">
          La contraseña es requerida
        </div>
        <div class="error-message" *ngIf="hasError('password', 'minlength')">
          La contraseña debe tener al menos 6 caracteres
        </div>
      </div>

      <!-- Mensaje de Error General -->
      <div class="error-box" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>

      <!-- Botón Submit -->
      <button
        type="submit"
        class="btn-submit"
        [disabled]="loginForm.invalid || isLoading"
      >
        {{ isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión' }}
      </button>
    </form>

    <!-- Link a Registro -->
    <p class="register-link">
      ¿No tienes cuenta? <a routerLink="/register">Regístrate aquí</a>
    </p>
  </div>
</div>
```

4. **Crea el archivo SCSS `login.component.scss`**:

```scss
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 400px;
  width: 100%;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h1 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 28px;
  text-align: center;
}

.subtitle {
  color: #666;
  margin: 0 0 30px 0;
  text-align: center;
  font-size: 14px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  padding: 12px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &.error {
    border-color: #e74c3c;
    background-color: #fadbd8;
  }
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: -4px;
}

.error-box {
  background-color: #fadbd8;
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.register-link {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 20px;

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      color: #764ba2;
      text-decoration: underline;
    }
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 30px 20px;
  }

  h1 {
    font-size: 24px;
  }

  .form-input {
    padding: 10px 12px;
    font-size: 16px;
  }

  .btn-submit {
    padding: 10px 16px;
    font-size: 14px;
  }
}
```

**Verificación:**
- El archivo TypeScript debe compilar sin errores
- Los estilos deben aplicarse correctamente

---

### **PASO 5: Crear RegisterComponent**

**¿Para qué sirve?**
Es la página de registro. Permite:
- Ingresar nombre, email, contraseña y confirmación
- Validar que las contraseñas coincidan
- Validar mínimos caracteres
- Llamar al backend para registrar
- Redirigir a /login después del registro exitoso

**Archivos a crear:**
- `frontend/src/app/pages/register/register.component.ts`
- `frontend/src/app/pages/register/register.component.html`
- `frontend/src/app/pages/register/register.component.scss`

**Pasos:**

1. **Crea el archivo TypeScript `register.component.ts`**:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * RegisterComponent - Página de registro
 * 
 * Responsabilidades:
 * - Mostrar formulario de registro (nombre, email, password, confirmación)
 * - Validar que las contraseñas coincidan
 * - Validar longitud de caracteres
 * - Llamar a AuthService.register()
 * - Redirigir a /login después
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isLoading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  /**
   * Crea el formulario reactivo con validadores
   * Incluye validador personalizado para coincidencia de contraseñas
   */
  private initializeForm(): void {
    this.registerForm = this.fb.group(
      {
        // Nombre: requerido, mínimo 2 caracteres
        nombre: ['', [Validators.required, Validators.minLength(2)]],
        // Email: requerido y válido
        email: ['', [Validators.required, Validators.email]],
        // Password: requerido, mínimo 6 caracteres
        password: ['', [Validators.required, Validators.minLength(6)]],
        // Confirmación de contraseña: requerida
        passwordConfirm: ['', [Validators.required]],
      },
      // Validador de grupo para verificar que las contraseñas coincidan
      { validators: this.passwordMatchValidator }
    );
  }

  /**
   * Validador personalizado que verifica si las contraseñas coinciden
   * Se aplica al FormGroup, no a un campo individual
   */
  private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const passwordConfirm = group.get('passwordConfirm')?.value;
    
    // Si las contraseñas coinciden, retorna null (válido)
    // Si no coinciden, retorna error
    return password === passwordConfirm ? null : { passwordMismatch: true };
  }

  /**
   * Se ejecuta al hacer submit del formulario
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    // Solo necesitamos nombre, email y password (no passwordConfirm)
    const { nombre, email, password } = this.registerForm.value;

    // Llama al AuthService para registrar
    this.authService.register(nombre, email, password).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = '¡Registro exitoso! Redirigiendo a login...';

        // Espera 1.5 segundos y redirige a /login
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.error || 'Error en el registro. Intenta de nuevo.';
      }
    });
  }

  /**
   * Verifica si un campo tiene un error específico
   */
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  /**
   * Verifica específicamente si las contraseñas no coinciden
   */
  passwordMismatch(): boolean {
    return !!(this.registerForm.hasError('passwordMismatch') && 
              this.registerForm.get('passwordConfirm')?.touched);
  }
}
```

2. **Crea el archivo HTML `register.component.html`**:

```html
<div class="register-container">
  <div class="register-card">
    <h1>Crear Cuenta</h1>
    <p class="subtitle">Únete a TiltGuard hoy</p>

    <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
      <!-- Campo Nombre -->
      <div class="form-group">
        <label for="nombre">Nombre Completo</label>
        <input
          id="nombre"
          type="text"
          formControlName="nombre"
          placeholder="Tu nombre completo"
          class="form-input"
          [class.error]="hasError('nombre', 'required') || hasError('nombre', 'minlength')"
        />
        <div class="error-message" *ngIf="hasError('nombre', 'required')">
          El nombre es requerido
        </div>
        <div class="error-message" *ngIf="hasError('nombre', 'minlength')">
          El nombre debe tener al menos 2 caracteres
        </div>
      </div>

      <!-- Campo Email -->
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          placeholder="tu@email.com"
          class="form-input"
          [class.error]="hasError('email', 'required') || hasError('email', 'email')"
        />
        <div class="error-message" *ngIf="hasError('email', 'required')">
          El email es requerido
        </div>
        <div class="error-message" *ngIf="hasError('email', 'email')">
          El email debe ser válido
        </div>
      </div>

      <!-- Campo Contraseña -->
      <div class="form-group">
        <label for="password">Contraseña</label>
        <input
          id="password"
          type="password"
          formControlName="password"
          placeholder="Mínimo 6 caracteres"
          class="form-input"
          [class.error]="hasError('password', 'required') || hasError('password', 'minlength')"
        />
        <div class="error-message" *ngIf="hasError('password', 'required')">
          La contraseña es requerida
        </div>
        <div class="error-message" *ngIf="hasError('password', 'minlength')">
          La contraseña debe tener al menos 6 caracteres
        </div>
      </div>

      <!-- Campo Confirmar Contraseña -->
      <div class="form-group">
        <label for="passwordConfirm">Confirmar Contraseña</label>
        <input
          id="passwordConfirm"
          type="password"
          formControlName="passwordConfirm"
          placeholder="Repite tu contraseña"
          class="form-input"
          [class.error]="passwordMismatch()"
        />
        <div class="error-message" *ngIf="passwordMismatch()">
          Las contraseñas no coinciden
        </div>
      </div>

      <!-- Mensaje de Error -->
      <div class="error-box" *ngIf="errorMessage">
        {{ errorMessage }}
      </div>

      <!-- Mensaje de Éxito -->
      <div class="success-box" *ngIf="successMessage">
        {{ successMessage }}
      </div>

      <!-- Botón Submit -->
      <button
        type="submit"
        class="btn-submit"
        [disabled]="registerForm.invalid || isLoading"
      >
        {{ isLoading ? 'Registrando...' : 'Registrarse' }}
      </button>
    </form>

    <!-- Link a Login -->
    <p class="login-link">
      ¿Ya tienes cuenta? <a routerLink="/login">Inicia sesión aquí</a>
    </p>
  </div>
</div>
```

3. **Crea el archivo SCSS `register.component.scss`**:

```scss
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  padding: 40px;
  max-width: 400px;
  width: 100%;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

h1 {
  color: #333;
  margin: 0 0 10px 0;
  font-size: 28px;
  text-align: center;
}

.subtitle {
  color: #666;
  margin: 0 0 30px 0;
  text-align: center;
  font-size: 14px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  color: #333;
  font-weight: 500;
  font-size: 14px;
}

.form-input {
  padding: 12px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.3s ease;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &.error {
    border-color: #e74c3c;
    background-color: #fadbd8;
  }
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: -4px;
}

.error-box {
  background-color: #fadbd8;
  border: 1px solid #e74c3c;
  color: #c0392b;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.success-box {
  background-color: #d5f4e6;
  border: 1px solid #27ae60;
  color: #229954;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.btn-submit {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 10px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.login-link {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin-top: 20px;

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;

    &:hover {
      color: #764ba2;
      text-decoration: underline;
    }
  }
}

@media (max-width: 480px) {
  .register-card {
    padding: 30px 20px;
  }

  h1 {
    font-size: 24px;
  }

  .form-input {
    padding: 10px 12px;
    font-size: 16px;
  }

  .btn-submit {
    padding: 10px 16px;
    font-size: 14px;
  }
}
```

---

### **PASO 6: Actualizar Rutas del Frontend**

**¿Para qué sirve?**
Configurar las rutas para que:
- `/login` y `/register` sean públicas (sin guards)
- `/admin/*` esté protegida con AuthGuard + AdminGuard
- `/user` esté protegida con AuthGuard
- La raíz `/` redirija a `/login`

**Archivo a modificar:**
- `frontend/src/app/app.routes.ts`

**Pasos:**

1. **Abre el archivo** `frontend/src/app/app.routes.ts`

2. **Reemplaza TODO el contenido** con:

```typescript
import { Routes } from "@angular/router";
import { LoginComponent } from "./pages/login/login.component";
import { RegisterComponent } from "./pages/register/register.component";
import { AuthGuard } from "./guards/auth.guard";
import { AdminGuard } from "./guards/admin.guard";

export const routes: Routes = [
  // ============================================
  // RUTAS PÚBLICAS (sin autenticación requerida)
  // ============================================
  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "register",
    component: RegisterComponent,
  },

  // ============================================
  // RUTAS PROTEGIDAS DE ADMINISTRADOR
  // Requieren: autenticación + rol admin
  // ============================================
  {
    path: "admin",
    loadComponent: () =>
      import("./admin/admin-dashboard/admin-dashboard.component").then(
        (m) => m.AdminDashboardComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: "admin/user-list",
    loadComponent: () =>
      import("./admin/userlist/userlist.component").then(
        (m) => m.UserlistComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: "admin/user-details/:id",
    loadComponent: () =>
      import("./admin/user-details/user-details.component").then(
        (m) => m.UserDetailsComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },
  {
    path: "admin/user-edit/:id",
    loadComponent: () =>
      import("./admin/user-edit/user-edit.component").then(
        (m) => m.UserEditComponent,
      ),
    canActivate: [AuthGuard, AdminGuard],
  },

  // ============================================
  // RUTAS PROTEGIDAS DE USUARIO
  // Requieren: autenticación (cualquier rol)
  // ============================================
  {
    path: "user",
    loadComponent: () =>
      import("./main/user-dashboard/user-dashboard.component").then(
        (m) => m.UserDashboardComponent,
      ),
    canActivate: [AuthGuard],
  },

  // ============================================
  // RUTAS POR DEFECTO
  // ============================================
  {
    path: "",
    redirectTo: "login",
    pathMatch: "full",
  },
  {
    path: "**",
    redirectTo: "login",
  },
];
```

**Explicación:**

- **Rutas públicas**: `/login` y `/register` SIN guards
- **canActivate: [AuthGuard, AdminGuard]**: Requiere autenticación Y ser admin
- **canActivate: [AuthGuard]**: Requiere solo autenticación
- **redirectTo**: Redirige rutas desconocidas a `/login`

---

### **PASO 7: Configurar Interceptor en app.config.ts**

**¿Para qué sirve?**
Registrar el AuthInterceptor en los providers para que se ejecute en TODAS las solicitudes HTTP.

**Archivo a modificar:**
- `frontend/src/app/app.config.ts`

**Pasos:**

1. **Abre el archivo** `frontend/src/app/app.config.ts`

2. **Reemplaza el contenido** con:

```typescript
import { ApplicationConfig } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, HTTP_INTERCEPTORS } from "@angular/common/http";

import { routes } from "./app.routes";
import { AuthInterceptor } from "./interceptors/auth.interceptor";

/**
 * Configuración de la aplicación Angular
 * 
 * Providers:
 * - provideRouter(routes): Configura las rutas
 * - provideHttpClient(): Proporciona HttpClient para solicitudes HTTP
 * - HTTP_INTERCEPTORS: Registra el AuthInterceptor
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    // Registra el interceptor para TODAS las solicitudes HTTP
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
};
```

**Explicación:**

- **provideRouter(routes)**: Activa el enrutamiento
- **provideHttpClient()**: Activa el cliente HTTP
- **HTTP_INTERCEPTORS**: Registra nuestro interceptor
- **multi: true**: Permite múltiples interceptores

---

### **PASO 8: Crear Endpoints Backend**

**¿Para qué sirven?**
Son las rutas del servidor que:
- Registran nuevos usuarios
- Validan credenciales
- Retornan JWT

**Archivos a crear:**
- `backend/src/controllers/authController.ts`
- `backend/src/routes/auth.ts`

**Pasos:**

1. **Crea el archivo `authController.ts`**:

En `backend/src/controllers/authController.ts`:

```typescript
import { Response } from "express";
import { Request } from "express";
import User from "../models/User";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Variables de entorno para JWT
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production";
const JWT_EXPIRE = process.env.JWT_EXPIRE || "7d";

/**
 * POST /api/auth/register
 * 
 * Registra un nuevo usuario en la aplicación
 * 
 * Body:
 * {
 *   "nombre": "Juan Pérez",
 *   "email": "juan@example.com",
 *   "password": "password123"
 * }
 * 
 * Respuesta exitosa:
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "507f1f77bcf86cd799439011",
 *     "nombre": "Juan Pérez",
 *     "email": "juan@example.com",
 *     "role": "usuario"
 *   }
 * }
 */
export const register = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { nombre, email, password } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !email || !password) {
      res.status(400).json({
        success: false,
        error: "Nombre, email y contraseña son requeridos",
      });
      return;
    }

    // Validar longitud de contraseña (mínimo 6 caracteres)
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: "La contraseña debe tener mínimo 6 caracteres",
      });
      return;
    }

    // Verificar que el email no esté ya registrado
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        error: "El email ya está registrado",
      });
      return;
    }

    // Crear nuevo usuario
    const user = new User({
      nombre: nombre.trim(),
      email: email.trim(),
      password, // Se encriptará automáticamente por el pre-hook del modelo
      rol: "usuario", // Rol por defecto
      activo: true,
    });

    // Guardar en base de datos
    await user.save();

    // Generar JWT (válido por 7 días)
    const token = jwt.sign(
      { id: user._id, role: user.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE } as any
    );

    // Responder con token y datos del usuario
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        role: user.rol,
      },
    });
  } catch (error) {
    const err = error as any;
    let errorMessage = "Error al registrar el usuario";

    // Manejo de errores específicos de MongoDB
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      errorMessage = `El ${field} ya está registrado`;
    } else if (err.errors) {
      errorMessage = Object.values(err.errors)
        .map((e: any) => e.message)
        .join(", ");
    } else if (err.message) {
      errorMessage = err.message;
    }

    res.status(400).json({
      success: false,
      error: errorMessage,
    });
  }
};

/**
 * POST /api/auth/login
 * 
 * Inicia sesión con email y contraseña
 * 
 * Body:
 * {
 *   "email": "juan@example.com",
 *   "password": "password123"
 * }
 * 
 * Respuesta exitosa:
 * {
 *   "success": true,
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "user": {
 *     "id": "507f1f77bcf86cd799439011",
 *     "nombre": "Juan Pérez",
 *     "email": "juan@example.com",
 *     "role": "usuario"
 *   }
 * }
 */
export const login = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validar que ambos campos estén presentes
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: "Email y contraseña son requeridos",
      });
      return;
    }

    // Buscar el usuario por email
    // IMPORTANTE: .select("+password") porque el modelo User tiene select: false en password
    const user = await User.findOne({ email }).select("+password");

    // Si el usuario no existe
    if (!user) {
      res.status(401).json({
        success: false,
        error: "Email o contraseña incorrectos",
      });
      return;
    }

    // Comparar la contraseña ingresada con la guardada (encriptada)
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    // Si la contraseña es incorrecta
    if (!isPasswordCorrect) {
      res.status(401).json({
        success: false,
        error: "Email o contraseña incorrectos",
      });
      return;
    }

    // Generar JWT
    const token = jwt.sign(
      { id: user._id, role: user.rol },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE } as any
    );

    // Responder con token y datos del usuario
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        role: user.rol,
      },
    });
  } catch (error) {
    const err = error as any;
    res.status(500).json({
      success: false,
      error: err.message || "Error al iniciar sesión",
    });
  }
};
```

2. **Crea el archivo `auth.ts` en rutas**:

En `backend/src/routes/auth.ts`:

```typescript
import express from "express";
import { register, login } from "../controllers/authController";

/**
 * Rutas de autenticación
 * 
 * POST /api/auth/register - Registrar nuevo usuario
 * POST /api/auth/login - Iniciar sesión
 */
const router = express.Router();

// Ruta de registro
router.post("/register", register);

// Ruta de login
router.post("/login", login);

export default router;
```

---

### **PASO 9: Conectar Rutas Auth al Backend**

**¿Para qué sirve?**
Importar las rutas de autenticación en el archivo principal del backend para que estén disponibles.

**Archivo a modificar:**
- `backend/src/index.ts`

**Pasos:**

1. **Abre el archivo** `backend/src/index.ts`

2. **Busca la línea**:
   ```typescript
   import userRoutes from "./routes/users";
   ```

3. **Después de esa línea, agrega**:
   ```typescript
   import authRoutes from "./routes/auth";
   ```

4. **Busca la línea**:
   ```typescript
   // Routes
   app.use("/api/usuarios", userRoutes);
   ```

5. **Antes de esa línea, agrega**:
   ```typescript
   app.use("/api/auth", authRoutes);
   ```

**Archivo completo debería verse así:**

```typescript
import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import userRoutes from "./routes/users";
import authRoutes from "./routes/auth";  // ← AGREGAR ESTA LÍNEA

dotenv.config();

const app: Express = express();

// Configuración de Base de Datos
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://admin:password123@localhost:27017/tiltguard?authSource=admin";

// Conectar a MongoDB
mongoose.connect(MONGODB_URI).catch((_err) => {
  // MongoDB connection error
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);         // ← AGREGAR ESTA LÍNEA
app.use("/api/usuarios", userRoutes);

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ message: "Backend is running" });
});

// Error handling middleware
app.use((_err: any, _req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({ error: "Something went wrong!" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {});
```

---

### **PASO 10: Compilar, Verificar y Probar**

**¿Para qué sirve?**
Asegurarse de que todo compila sin errores y que el sistema funciona correctamente.

**Pasos:**

1. **Detén cualquier proceso anterior**:
   ```bash
   killall -9 node npm ng 2>/dev/null || true
   sleep 1
   ```

2. **Compila el backend**:
   ```bash
   cd /home/felixpop/Escritorio/TiltGuard/backend
   npm run build
   ```
   
   ✅ Debería decir: "Successfully compiled" o terminar sin errores

3. **Compila el frontend**:
   ```bash
   cd /home/felixpop/Escritorio/TiltGuard/frontend
   ng build --configuration development
   ```
   
   ✅ Debería terminar con "Build at: ..." y un hash

4. **Inicia el backend**:
   ```bash
   cd /home/felixpop/Escritorio/TiltGuard/backend
   npm start &
   sleep 2
   ```

5. **Verifica que el backend responde**:
   ```bash
   curl -s http://localhost:5000/api/health
   ```
   
   ✅ Debería responder: `{"message":"Backend is running"}`

6. **Inicia el frontend**:
   ```bash
   cd /home/felixpop/Escritorio/TiltGuard/frontend
   ng serve &
   sleep 5
   ```

7. **Abre el navegador**:
   ```
   http://localhost:4200/login
   ```
   
   ✅ Debería ver la página de login

8. **Prueba el registro**:
   - Haz clic en "Regístrate aquí"
   - Llena el formulario:
     - Nombre: "Juan Pérez"
     - Email: "juan@example.com"
     - Contraseña: "password123"
     - Confirmar: "password123"
   - Haz clic en "Registrarse"
   - ✅ Debería redirigir a /login con mensaje de éxito

9. **Prueba el login**:
   - Email: "juan@example.com"
   - Contraseña: "password123"
   - ✅ Debería redirigir a /user (dashboard de usuario)

10. **Prueba login como admin**:
    - Email: "dsa@dsa.dsa" (usuario admin de prueba que ya existe)
    - Contraseña: "dsadsa"
    - ✅ Debería redirigir a /admin (dashboard de admin)

---

## 🎯 Resumen de lo que hicimos

| Paso | Qué | Dónde | Por qué |
|------|-----|-------|--------|
| 1 | AuthService | frontend/services/ | Comunica con backend, guarda token |
| 2 | Guards | frontend/guards/ | Protege rutas según autenticación |
| 3 | Interceptor | frontend/interceptors/ | Inyecta token en solicitudes |
| 4 | LoginComponent | frontend/pages/login/ | Página de login |
| 5 | RegisterComponent | frontend/pages/register/ | Página de registro |
| 6 | Actualizar rutas | frontend/app.routes.ts | Configura rutas públicas/protegidas |
| 7 | Configurar interceptor | frontend/app.config.ts | Registra interceptor |
| 8 | authController + auth routes | backend/controllers/, backend/routes/ | Endpoints de auth |
| 9 | Importar en index.ts | backend/src/index.ts | Activa las rutas auth |
| 10 | Compilar y probar | Terminal | Verifica que todo funciona |

---

## 📝 Notas importantes

- **localStorage**: Los tokens se guardan en localStorage (NO es seguro en producción, usar HttpOnly cookies)
- **JWT expira**: El token expira en 7 días (configurable con JWT_EXPIRE)
- **Contraseña mínimo 6 caracteres**: Validado en frontend Y backend
- **Email único**: MongoDB valida que no haya emails duplicados
- **Encriptación bcrypt**: Las contraseñas se encriptan automáticamente con el pre-hook del modelo User
- **Roles**: Solo "admin" y "usuario", duros en la base de datos

---

## 🆘 Si algo falla

**Error de compilación en TypeScript**: Revisa que hayas importado correctamente todos los módulos
**Error 404 en API**: Verifica que el backend está en puerto 5000 y las rutas están importadas
**Login no funciona**: Verifica que el usuario existe en MongoDB y la contraseña es correcta
**Rutas no protegidas**: Asegúrate de agregar `canActivate: [AuthGuard]` en app.routes.ts

---

¡Con esto deberías tener un **sistema completo de autenticación funcional**! 🎉

Sigue **paso a paso** en orden, y si algo no funciona, avísame con el error específico.
