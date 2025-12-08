import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

// 1. IMPORTAR LAS HERRAMIENTAS HTTP
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// 2. IMPORTAR TU INTERCEPTOR (Chequeá que la ruta sea correcta)
import { authInterceptor } from './app/core/interceptors/auth.interceptor'; 

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Tus rutas

    // 3. ACÁ ESTÁ LA SOLUCIÓN AL ERROR
    // Esto habilita el cliente HTTP y conecta el Interceptor para enviar el Token
    provideHttpClient(
      withInterceptors([authInterceptor]) 
    )
  ]
})
.catch(err => console.error(err));