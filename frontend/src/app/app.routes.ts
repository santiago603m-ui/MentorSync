import { Routes } from '@angular/router';
import { ResponsiveLayoutComponent } from './layouts/responsiveLayout';
import { LoginPageComponent } from './features/auth/pages/loginPage';
import { RegistroPageComponent } from './features/auth/pages/registroPage';
import { HomePage } from './pages/homePage';
import { CursosPageComponent } from './pages/cursos/cursos-page.component';
// Importa al loguear de acuerdo a su respectivo rol.
import { AprendizPageComponent } from './features/Aprendiz/aprendiz-page.component';
import { MentorPageComponent } from './features/mentor/mentorPage';
import { AdminPageComponent } from './features/admin-panel/adminPage';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    component: ResponsiveLayoutComponent,
    children: [
      { path: '', component: HomePage },
      { path: 'login', component: LoginPageComponent },
      { path: 'registro', component: RegistroPageComponent },
      { path: 'cursos', component: CursosPageComponent },

      {
        path: 'aprendiz',
        component: AprendizPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['Aprendiz'] }
      },

      {
        path: 'mentor',
        component: MentorPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['Mentor'] }
      },
      {
        path: 'admin',
        component: AdminPageComponent,
        canActivate: [roleGuard],
        data: { roles: ['Administrador'] }
      }
    ]
  }
];
