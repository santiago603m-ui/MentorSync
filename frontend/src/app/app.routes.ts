import { Routes } from '@angular/router';
import { ResponsiveLayoutComponent } from './layouts/responsiveLayout';
import { LoginPageComponent } from './features/auth/pages/loginPage';
import { RegistroPageComponent } from './features/auth/pages/registroPage';
import { HomePage } from './pages/homePage';

export const routes: Routes = [
  {
    path: '',
    component: ResponsiveLayoutComponent,
    children: [
      { path: '', component: HomePage}, // Ruta raíz que apunta a HomePage
      { path: 'login', component: LoginPageComponent },
      { path: 'registro', component: RegistroPageComponent }
    ]
  }
];
