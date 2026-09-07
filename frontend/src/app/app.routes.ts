import { Routes } from '@angular/router';
import { ResponsiveLayoutComponent } from './layouts/responsiveLayout';
import { LoginPageComponent } from './features/auth/pages/loginPage';
import { RegistroPageComponent } from './features/auth/pages/registroPage';
import { HomePage } from './pages/homePage';
import { authGuard } from '../app/core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: ResponsiveLayoutComponent,
    children: [
      { path: '', component: HomePage },
      { path: 'login', component: LoginPageComponent },
      { path: 'registro', component: RegistroPageComponent }
      // Para proteger una ruta en el futuro, añade: canActivate: [authGuard]
    ]
  }
];