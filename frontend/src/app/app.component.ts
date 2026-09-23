import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SplashScreenComponent } from './shared/components/splash-screen/splash-screen.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SplashScreenComponent], // 2. AGREGALO A LOS IMPORTS
  template: `
    <!-- 3. AGREGA LA ETIQUETA AQUÍ -->
    <app-splash-screen></app-splash-screen>
    
    <router-outlet></router-outlet>
  `,
  styles: [`
    /* Estilos globales si los tienes */
  `]
})
export class AppComponent {
  title = 'MentorSync';
}