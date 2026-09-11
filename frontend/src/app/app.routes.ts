import { Routes } from '@angular/router';
import { HomePage } from './features/home/pages/home-page/home-page.component';
import { CursosPageComponent } from './features/courses/pages/cursos-page/cursos-page.component';
import { VantaBackgroundComponent } from './shared/components/vanta-background/vanta-background.component';
import { AprendizPageComponent } from './features/learner-dashboard/aprendiz-page.component';
import { MentorPageComponent } from './features/mentor-dashboard/mentor-dashboard.component';
import { AdminPageComponent } from './features/admin-panel/admin-panel.component';
import { roleGuard } from './core/guards/role.guard';
import { AuthComponent } from './features/auth/pages/auth.component';

export const routes: Routes = [
  {
    path: '',
    component: VantaBackgroundComponent,
    children: [
      { path: '', component: HomePage },
      { path: 'auth', component: AuthComponent },
      
      // Redirecciones directas hacia la nueva vista unificada
      { path: 'login', redirectTo: 'auth', pathMatch: 'full' },
      { path: 'registro', redirectTo: 'auth', pathMatch: 'full' },

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
  },
  { path: '**', redirectTo: '' }
];