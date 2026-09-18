import { Routes } from '@angular/router';
import { ResponsiveLayoutComponent } from './layouts/responsive-layout/responsive-layout.component';
import { LoginPageComponent } from './features/auth/pages/loginPage';
import { RegistroPageComponent } from './features/auth/pages/registroPage';
import { AprendizPageComponent } from './features/Aprendiz/aprendiz-page.component';
import { MentorPageComponent } from './features/mentor/mentorPage';
import { AdminPageComponent } from './features/admin-panel/adminPage';
import { roleGuard } from './core/guards/role.guard';
import { HomePage } from './features/home/pages/home-page/home-page.component';
import { NavbarComponent } from '../app/layouts/navbar//navbar.component';
import { CursosPageComponent } from './pages/cursos/cursos-page.component';
import { VantaBackgroundComponent } from './shared/components/vanta-background/vanta-background.component';

export const routes: Routes = [
  {
    path: '',
    component: VantaBackgroundComponent,
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
