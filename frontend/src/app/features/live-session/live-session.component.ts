import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { io, Socket } from 'socket.io-client';
import { LiveSessionService, LiveSession, ChatSesionMensaje } from '../../core/services/live-session.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-live-session',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="live-layout">
      <div class="live-header glass-panel">
        <div class="header-left">
          <button class="btn-back" (click)="volver()"><i class="fas fa-arrow-left"></i> Volver</button>
          @if (sesion) {
            <div class="header-info">
              <h2><i class="fas fa-video"></i> {{ sesion.titulo }}</h2>
              <span class="badge-estado" [ngClass]="'estado-' + sesion.estado">{{ sesion.estado }}</span>
              <span class="link-code">ID: {{ sesion._id | slice:0:8 }}…</span>
            </div>
          } @else {
            <h2>Sesión en vivo</h2>
          }
        </div>
        <div class="header-actions">
          @if (esMentor && sesion) {
            @if (sesion.estado === 'programada') {
              <button class="btn-cyan-glow" (click)="iniciarSesion()"><i class="fas fa-play"></i> Iniciar</button>
            }
            @if (sesion.estado === 'en_curso') {
              <button class="btn-danger" (click)="finalizarSesion()"><i class="fas fa-stop"></i> Finalizar</button>
            }
            <button class="btn-ghost" (click)="copiarLink()"><i class="fas fa-link"></i> Copiar link</button>
          }
          <span class="estado-socket" [class.online]="conectado">
            <span class="dot"></span> {{ conectado ? 'Conectado' : 'Desconectado' }}
          </span>
        </div>
      </div>

      @if (error) {
        <div class="alert-error glass-panel"><i class="fas fa-exclamation-circle"></i> {{ error }}</div>
      }

      @if (!sesionId) {
        <div class="join-panel glass-panel">
          <h3><i class="fas fa-sign-in-alt"></i> Unirse a sesión en vivo</h3>
          <p>Pega el código o link que te compartió el mentor.</p>
          <div class="join-row">
            <input class="glass-input" [(ngModel)]="codigoInput" placeholder="Código o link (ej. 68f... o https://.../sesion/68f...)" />
            <button class="btn-cyan-glow" (click)="unirseConCodigo()"><i class="fas fa-door-open"></i> Unirse</button>
          </div>
          @if (errorJoin) { <p class="error-text">{{ errorJoin }}</p> }
        </div>
      }

      @if (sesion) {
        <div class="live-body">
          <div class="video-area glass-panel">
            @if (sesion.urlReunion) {
              <iframe [src]="urlSegura" frameborder="0" allow="camera; microphone; fullscreen" class="video-frame"></iframe>
            } @else {
              <div class="video-placeholder">
                <i class="fas fa-chalkboard-teacher"></i>
                <p>Sesión en vivo — chat habilitado. Pide al mentor que agregue un <strong>urlReunion</strong> para video.</p>
                @if (esMentor) {
                  <div class="url-form">
                    <input class="glass-input" [(ngModel)]="nuevaUrl" placeholder="https://meet.jit.si/..." />
                    <button class="btn-ghost" (click)="guardarUrl()">Guardar URL</button>
                  </div>
                }
              </div>
            }
            <div class="sesion-meta">
              <span><i class="fas fa-users"></i> {{ participantes.length }} participantes</span>
              <span><i class="fas fa-comments"></i> {{ mensajes.length }} mensajes</span>
              @if (escribiendo) { <span class="typing"><i class="fas fa-pen"></i> {{ escribiendo }} está escribiendo…</span> }
            </div>
          </div>

          <div class="chat-area glass-panel">
            <div class="chat-header">
              <h4><i class="fas fa-comments"></i> Chat en vivo</h4>
              <span class="badge-live">LIVE</span>
            </div>
            <div class="chat-messages" #chatScroll>
              @for (m of mensajes; track m._id) {
                <div class="msg" [class.mine]="esMio(m)" [class.bot]="m.rolRemitente === 'bot'">
                  <div class="msg-head">
                    <strong>{{ m.rolRemitente === 'bot' ? '🤖 Bot' : (m.email || m.remitenteId) }}</strong>
                    <small>{{ m.createdAt | date:'short' }}</small>
                  </div>
                  <p class="msg-body">{{ m.contenido }}</p>
                </div>
              } @empty {
                <p class="empty-chat">Aún no hay mensajes. ¡Sé el primero!</p>
              }
            </div>
            <div class="chat-input">
              <input
                class="glass-input"
                [(ngModel)]="nuevoMensaje"
                placeholder="Escribe un mensaje…"
                (keydown.enter)="enviarMensaje()"
                (input)="notificarEscribiendo()"
              />
              <button class="btn-cyan-glow" (click)="enviarMensaje()" [disabled]="!nuevoMensaje.trim()"><i class="fas fa-paper-plane"></i></button>
            </div>
            @if (avisoBot) {
              <div class="aviso-bot"><i class="fas fa-robot"></i> {{ avisoBot }}</div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; padding: 1.5rem; }
    .live-layout { max-width: 1280px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
    .live-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; flex-wrap: wrap; gap: 1rem; }
    .header-left { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
    .header-info { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
    .header-info h2 { margin: 0; font-size: 1.1rem; }
    .badge-estado { padding: 0.2rem 0.6rem; border-radius: 999px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
    .estado-programada { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .estado-en_curso { background: rgba(34,197,94,0.15); color: #22c55e; border: 1px solid rgba(34,197,94,0.3); }
    .estado-finalizada { background: rgba(100,116,139,0.15); color: #94a3b8; border: 1px solid rgba(100,116,139,0.3); }
    .estado-cancelada { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
    .link-code { font-size: 0.7rem; color: var(--text-muted); font-family: monospace; }
    .header-actions { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; }
    .estado-socket { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: var(--text-muted); }
    .estado-socket.online { color: #22c55e; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; display: inline-block; }
    .btn-back, .btn-ghost, .btn-danger { padding: 0.45rem 0.9rem; border-radius: 999px; border: 1px solid var(--glass-border); background: var(--glass-bg); color: var(--text-primary); cursor: pointer; font-weight: 600; font-size: 0.8rem; }
    .btn-cyan-glow { background: linear-gradient(135deg, #06b6d4, #3b82f6); color: #fff; border: none; padding: 0.5rem 1.1rem; border-radius: 999px; font-weight: 700; cursor: pointer; box-shadow: 0 0 12px rgba(6,182,212,0.3); }
    .btn-danger { background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; border: none; }
    .alert-error { padding: 0.8rem 1rem; color: #ef4444; border: 1px solid rgba(239,68,68,0.3); background: rgba(239,68,68,0.08); }
    .join-panel { padding: 1.5rem; text-align: center; }
    .join-panel h3 { margin: 0 0 0.5rem; }
    .join-row { display: flex; gap: 0.6rem; justify-content: center; margin-top: 1rem; flex-wrap: wrap; }
    .glass-input { background: var(--glass-input); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 0.55rem 0.9rem; border-radius: 9px; outline: none; min-width: 280px; font-size: 0.85rem; }
    .glass-panel { background: var(--glass-bg); border: 1px solid var(--glass-border); backdrop-filter: var(--glass-blur); -webkit-backdrop-filter: var(--glass-blur); border-radius: 14px; box-shadow: var(--glass-shadow); }
    .live-body { display: grid; grid-template-columns: 1.6fr 0.9fr; gap: 1rem; min-height: 520px; }
    @media (max-width: 900px) { .live-body { grid-template-columns: 1fr; } }
    @media (max-width: 768px) {
      :host { padding: 1rem; }
      .live-header { flex-direction: column; align-items: stretch; }
      .header-left, .header-actions { width: 100%; justify-content: space-between; }
      .video-frame { height: 260px; }
      .glass-input { min-width: 0; }
    }
    @media (max-width: 480px) {
      :host { padding: 0.75rem; }
      .live-header { padding: 0.8rem; }
      .header-info h2 { font-size: 0.95rem; }
      .join-row { flex-direction: column; }
      .join-row .glass-input, .chat-input .glass-input { width: 100%; }
      .video-placeholder { padding: 1.2rem; min-height: 220px; }
      .video-frame { height: 220px; }
      .chat-messages { max-height: 300px; }
      .sesion-meta { gap: 0.6rem; font-size: 0.7rem; }
    }
    .video-area { display: flex; flex-direction: column; overflow: hidden; padding: 0; }
    .video-frame { width: 100%; height: 420px; border-radius: 14px 14px 0 0; background: #000; }
    .video-placeholder { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; text-align: center; gap: 0.8rem; min-height: 320px; }
    .video-placeholder i { font-size: 2.5rem; color: #06b6d4; }
    .url-form { display: flex; gap: 0.5rem; margin-top: 0.5rem; flex-wrap: wrap; justify-content: center; }
    .sesion-meta { display: flex; gap: 1rem; padding: 0.7rem 1rem; font-size: 0.75rem; color: var(--text-secondary); border-top: 1px solid var(--glass-border); flex-wrap: wrap; }
    .typing { color: #22D3EE; font-style: italic; }
    .chat-area { display: flex; flex-direction: column; overflow: hidden; }
    .chat-header { display: flex; justify-content: space-between; align-items: center; padding: 0.9rem 1rem; border-bottom: 1px solid var(--glass-border); }
    .chat-header h4 { margin: 0; font-size: 0.9rem; }
    .badge-live { background: #ef4444; color: #fff; font-size: 0.6rem; font-weight: 800; padding: 0.15rem 0.4rem; border-radius: 4px; letter-spacing: 0.06em; }
    .chat-messages { flex: 1; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem; min-height: 260px; max-height: 420px; }
    .msg { background: var(--glass-bg-strong); border: 1px solid var(--glass-border); border-radius: 10px; padding: 0.6rem 0.75rem; }
    .msg.mine { border-color: rgba(6,182,212,0.35); background: rgba(6,182,212,0.08); }
    .msg.bot { border-color: rgba(139,107,255,0.25); background: rgba(139,107,255,0.07); }
    .msg-head { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-muted); margin-bottom: 0.2rem; }
    .msg-body { margin: 0; font-size: 0.85rem; color: var(--text-primary); white-space: pre-wrap; word-break: break-word; }
    .empty-chat { text-align: center; color: var(--text-muted); font-size: 0.8rem; padding: 1rem; }
    .chat-input { display: flex; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid var(--glass-border); }
    .chat-input .glass-input { flex: 1; min-width: 0; }
    .aviso-bot { padding: 0.6rem 1rem; font-size: 0.75rem; color: #a78bfa; background: rgba(139,107,255,0.08); border-top: 1px solid var(--glass-border); }
    .error-text { color: #ef4444; font-size: 0.75rem; margin-top: 0.5rem; }
  `],
})
export class LiveSessionComponent implements OnInit, OnDestroy {
  sesionId: string | null = null;
  sesion: LiveSession | null = null;
  mensajes: ChatSesionMensaje[] = [];
  participantes: string[] = [];
  nuevoMensaje = '';
  codigoInput = '';
  nuevaUrl = '';
  error = '';
  errorJoin = '';
  conectado = false;
  escribiendo: string | null = null;
  avisoBot: string | null = null;
  esMentor = false;
  urlSegura: string | null = null;

  private socket: Socket | null = null;
  private timeoutEscribiendo: ReturnType<typeof setTimeout> | null = null;

  @ViewChild('chatScroll') chatScroll?: ElementRef;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private liveService: LiveSessionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.esMentor = this.authService.rolCoincide(['mentor', 'administrador']);
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.sesionId = id;
        this.cargarSesion();
      }
    });
    // Si no hay :id, queda en modo "pegar código"
  }

  ngOnDestroy(): void {
    this.desconectarSocket();
  }

  cargarSesion(): void {
    if (!this.sesionId) return;
    this.liveService.obtener(this.sesionId).subscribe({
      next: (s) => {
        this.sesion = s;
        this.nuevaUrl = s.urlReunion || '';
        this.actualizarUrlSegura();
        this.cargarMensajes();
        this.conectarSocket();
      },
      error: (err) => (this.error = err.error?.error?.message || 'No se pudo cargar la sesión'),
    });
  }

  cargarMensajes(): void {
    if (!this.sesionId) return;
    this.liveService.listarMensajes(this.sesionId).subscribe({
      next: (msgs) => {
        this.mensajes = msgs;
        setTimeout(() => this.scrollAbajo(), 100);
      },
      error: () => {},
    });
  }

  conectarSocket(): void {
    if (!this.sesionId) return;
    const token = this.authService.getToken();
    if (!token) {
      this.error = 'Debes iniciar sesión para unirte';
      return;
    }
    this.socket = io('http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.conectado = true;
      this.socket!.emit('sala:unirse', { liveSessionId: this.sesionId }, (res: { success: boolean; message: string }) => {
        if (!res.success) this.error = res.message;
      });
    });

    this.socket.on('disconnect', () => (this.conectado = false));
    this.socket.on('connect_error', (err) => (this.error = err.message));

    this.socket.on('sala:mensaje_nuevo', (msg: ChatSesionMensaje) => {
      this.mensajes.push(msg);
      this.scrollAbajo();
    });

    this.socket.on('sala:usuario_unido', (data: { usuario: { email: string } }) => {
      this.participantes.push(data.usuario.email);
    });

    this.socket.on('sala:usuario_salio', () => {});
    this.socket.on('sala:escribiendo', (data: { usuario: { email: string }; escribiendo: boolean }) => {
      this.escribiendo = data.escribiendo ? data.usuario.email : null;
      if (data.escribiendo && this.timeoutEscribiendo) clearTimeout(this.timeoutEscribiendo);
      if (data.escribiendo) {
        this.timeoutEscribiendo = setTimeout(() => (this.escribiendo = null), 2000);
      }
    });
    this.socket.on('mentor_desconectado', () => {
      this.avisoBot = 'El mentor se ha desconectado. El asistente de IA está disponible.';
    });
    this.socket.on('bot_activado', (data: { message: string }) => {
      this.avisoBot = data.message;
    });
  }

  desconectarSocket(): void {
    if (this.socket) {
      if (this.sesionId) this.socket.emit('sala:abandonar', { liveSessionId: this.sesionId });
      this.socket.disconnect();
      this.socket = null;
    }
  }

  enviarMensaje(): void {
    const texto = this.nuevoMensaje.trim();
    if (!texto || !this.socket || !this.sesionId) return;
    this.socket.emit('sala:mensaje', { liveSessionId: this.sesionId, contenido: texto }, (res: { success: boolean; message: string }) => {
      if (!res.success) this.error = res.message;
    });
    this.nuevoMensaje = '';
  }

  notificarEscribiendo(): void {
    if (!this.socket || !this.sesionId) return;
    this.socket.emit('sala:escribiendo', { liveSessionId: this.sesionId, escribiendo: this.nuevoMensaje.length > 0 });
  }

  esMio(m: ChatSesionMensaje): boolean {
    const user = this.authService.getUsuario();
    return !!user && m.remitenteId === user.id;
  }

  scrollAbajo(): void {
    if (this.chatScroll) {
      try {
        const el = this.chatScroll.nativeElement as HTMLElement;
        el.scrollTop = el.scrollHeight;
      } catch {}
    }
  }

  unirseConCodigo(): void {
    const id = this.liveService.extraerId(this.codigoInput);
    if (!id) {
      this.errorJoin = 'Código o link inválido. Debe ser un ID de 24 caracteres o un link /sesion/:id';
      return;
    }
    this.router.navigate(['/sesion', id]);
  }

  copiarLink(): void {
    if (!this.sesion) return;
    const link = this.liveService.generarLink(this.sesion._id);
    navigator.clipboard.writeText(link);
    this.avisoBot = `Link copiado: ${link}`;
    setTimeout(() => (this.avisoBot = null), 3000);
  }

  iniciarSesion(): void {
    if (!this.sesionId) return;
    this.liveService.cambiarEstado(this.sesionId, 'en_curso').subscribe({
      next: (s) => {
        this.sesion = s;
        this.socket?.emit('bot_activado', { liveSessionId: this.sesionId });
      },
      error: (err) => (this.error = err.error?.error?.message || 'No se pudo iniciar'),
    });
  }

  finalizarSesion(): void {
    if (!this.sesionId) return;
    this.liveService.cambiarEstado(this.sesionId, 'finalizada').subscribe({
      next: (s) => (this.sesion = s),
      error: (err) => (this.error = err.error?.error?.message || 'No se pudo finalizar'),
    });
  }

  guardarUrl(): void {
    // Guardar urlReunion es solo un PATCH de curso/sesión; por ahora lo dejamos como aviso
    this.actualizarUrlSegura();
  }

  private actualizarUrlSegura(): void {
    this.urlSegura = this.sesion?.urlReunion || null;
  }

  volver(): void {
    this.desconectarSocket();
    const rol = this.authService.getRol()?.toLowerCase();
    if (rol === 'mentor') this.router.navigate(['/mentor']);
    else if (rol === 'aprendiz') this.router.navigate(['/aprendiz']);
    else this.router.navigate(['/']);
  }
}
