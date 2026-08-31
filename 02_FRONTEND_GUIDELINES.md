# 🎨 Guía de Frontend — Glassmorphism

> Cualquier componente nuevo debe usar estas variables y reglas. No introducir Bootstrap,
> Material ni otra librería de UI sin documentarlo primero en `00_PROJECT_CONTEXT.md`.

## Principios del estilo glassmorphism

- Fondos semitransparentes con **blur** (`backdrop-filter`)
- Bordes finos y sutiles con opacidad baja
- Sombras suaves, difusas
- Fondo general con gradientes o formas de color detrás de las tarjetas de vidrio (el blur necesita algo de color detrás para verse bien)
- Jerarquía visual por transparencia, no solo por color sólido

## Variables CSS base (`styles/_glass-tokens.scss`)

```scss
:root {
  /* Superficies de vidrio */
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-bg-strong: rgba(255, 255, 255, 0.14);
  --glass-border: rgba(255, 255, 255, 0.18);
  --glass-blur: blur(16px);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);

  /* Radios */
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;

  /* Color de marca (ajustar según identidad final) */
  --accent-primary: #7C5CFF;
  --accent-secondary: #22D3EE;

  /* Fondo base (gradiente detrás de las tarjetas de vidrio) */
  --bg-gradient: radial-gradient(circle at top left, #1B1035, #0B0715 70%);
}
```

## Componente base `.glass-card`

```scss
.glass-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  box-shadow: var(--glass-shadow);
}
```

## Reglas de uso

1. Toda tarjeta, modal o panel flotante hereda de `.glass-card` (o de un componente Angular `<glass-card>` reutilizable en `shared/components/`).
2. El fondo de la app (`--bg-gradient`) siempre debe tener suficiente variación de color/luz para que el blur se note — nunca poner una tarjeta de vidrio sobre un fondo plano de un solo color.
3. Texto sobre vidrio: usar blanco/gris claro con buen contraste (revisar accesibilidad — el blur reduce legibilidad si el contraste es bajo).
4. Estados interactivos (hover, focus) suben ligeramente la opacidad (`--glass-bg-strong`) en vez de cambiar el color base.
5. El chat en vivo y el widget del bot de IA usan la misma variable `--glass-bg`, diferenciados solo por un acento de color (`--accent-primary` para mentor humano, `--accent-secondary` para el bot) para que el aprendiz distinga visualmente con quién está hablando.

## Componentes compartidos previstos (`shared/components/`)

- `glass-card`
- `glass-button`
- `glass-navbar`
- `glass-modal`
- `role-badge` (visual distinto por rol: aprendiz / mentor / administrador)
- `chat-bubble` (variante humano / variante bot)

## ⚠️ Regla obligatoria: renderizado de respuestas del bot

Las respuestas del bot pueden venir en markdown (listas, negritas, bloques de código). El flujo correcto es:

```ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';

// 1. Parsear markdown → HTML
const html = marked.parse(respuestaDelBot);

// 2. SIEMPRE sanitizar antes de insertar en el DOM
const htmlSeguro = DOMPurify.sanitize(html);
```

Nunca hacer `[innerHTML]="respuestaDelBot"` directo ni `[innerHTML]="html"` sin pasar por `DOMPurify.sanitize()` — el contenido sale de un modelo de IA (Groq) y se trata como no confiable, igual que cualquier input externo. Esto aplica al componente `chat-bubble` en su variante bot.
