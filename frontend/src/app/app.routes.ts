import { Routes } from '@angular/router';
import { PagoResultadoComponent } from './features/pagos/pago-resultado/pago-resultado.component'; 
import { HomePage } from './features/home/home-page.component';
import { CursosPageComponent } from './features/courses/cursos-page.component';
import { VantaBackgroundComponent } from './shared/components/vanta-background/vanta-background.component';
import { AprendizPageComponent } from './features/learner-dashboard/aprendiz-page.component';
import { MentorPageComponent } from './features/mentor-dashboard/mentor-dashboard.component';
import { AdminPageComponent } from './features/admin-panel/admin-panel.component';
import { roleGuard } from './core/guards/role.guard';
import { AuthComponent } from './features/auth/auth.component';
import { LiveSessionComponent } from './features/live-session/live-session.component';

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

      // 👇 nuevo
      {
        path: 'pago/resultado',
        component: PagoResultadoComponent,
        canActivate: [roleGuard],
        data: { roles: ['Aprendiz'] }
      },

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
      },
      {
        path: 'sesion/:id',
        component: LiveSessionComponent,
        canActivate: [roleGuard],
        data: { roles: ['Aprendiz', 'Mentor', 'Administrador'] }
      },
      {
        path: 'unirse',
        component: LiveSessionComponent,
        canActivate: [roleGuard],
        data: { roles: ['Aprendiz', 'Mentor', 'Administrador'] }
      }
    ]
  }
];