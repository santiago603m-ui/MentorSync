import { Routes } from '@angular/router';
import { ResponsiveLayoutComponent } from './layouts/responsive-layout/responsive-layout.component';
import { LoginPageComponent } from './features/auth/pages/loginPage';
import { RegistroPageComponent } from './features/auth/pages/registroPage';
import { HomePage } from './features/home/pages/home-page/home-page.component';
import { CursosPageComponent } from './features/courses/pages/cursos-page/cursos-page.component';
import { VantaBackgroundComponent } from './shared/components/vanta-background/vanta-background.component';

export const routes: Routes = [
  {
    path: '',
    component: VantaBackgroundComponent,
    children: [
      { path: '', component: HomePage},
      { path: 'login', component: LoginPageComponent },
      { path: 'registro', component: RegistroPageComponent },
      { path: 'cursos', component: CursosPageComponent }
    ]
  }
];