# 🎨 Guía de Frontend — Glassmorphism

> Cualquier componente nuevo debe usar estas variables y reglas. No introducir Bootstrap,
> Material ni otra librería de UI sin documentarlo primero en `00_PROJECT_CONTEXT.md`.

## Principios del estilo glassmorphism

- Fondos semitransparentes con **blur** (`backdrop-filter: blur(18px)`)
- Bordes finos con opacidad baja + sombras difusas
- Fondo con gradiente/vanta detrás de las tarjetas (el blur necesita color detrás)
- Jerarquía por transparencia, no solo por color sólido
- Tema oscuro fijo (`dark`) con acentos de marca violeta y cian

## Variables CSS reales (`src/styles.css`)

```css
:root {
  color-scheme: dark;
  --glass-bg: rgba(255, 255, 255, 0.07);
  --glass-bg-strong: rgba(255, 255, 255, 0.13);
  --glass-border: rgba(255, 255, 255, 0.14);
  --glass-blur: blur(18px);
  --glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
  --glass-input: rgba(5, 5, 14, 0.55);
  --bg-gradient: radial-gradient(circle at top left, #1B1035, #0B0715 70%);
  /* + tokens base: --bg-base, --surface-*, --border-*, --text-*, --accent-violet/cyan, --radius-*, --shadow-* */
}
```

Tema único y fijo oscuro gestionado por `ThemeService` (`shared/services/theme.service.ts`) (`mode: 'dark'`). Los modos claro y cyberpunk fueron removidos por completo del sistema.

Tokens legacy en `src/styles/_glass-tokens.scss` y `src/styles/styles.scss` (Tailwind) coexisten pero la verdad vigente es `src/styles.css`.

## Componente base `.glass-card` / `.glass-panel`

```css
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

1. Toda tarjeta/modal/panel hereda de `.glass-card`/`.glass-panel` o de `<app-glass-card>` (`shared/components/glass-card`).
2. El fondo de la app siempre debe tener variación (Vanta `vanta-background` + `--bg-gradient`) para que el blur se note.
3. Texto sobre vidrio: blanco/gris claro con contraste accesible.
4. Hover/focus sube opacidad a `--glass-bg-strong`, no cambia color base.
5. Chat: misma `--glass-bg` con acento `--accent-violet` (humano) vs `--accent-cyan` (bot) para distinguir.
6. No agregar librerías de UI nuevas sin actualizar `00_PROJECT_CONTEXT.md`. Fuente tipográfica: `Space Grotesk` (display) + `Inter` (body) vía Google Fonts. Iconos: Font Awesome 6.5.2 CDN (ver `index.html`).

## Componentes compartidos reales (`shared/components/`)

- `sidebar` — Atlas-style: rail 56px fijo + explorer 280px auto-hide hover (total 336px), glassmorphism, `SidebarItem {key,label,icon}`, `title` input
- `vanta-background` — fondo global `three`+`vanta` (púrpura low-poly)
- `splash-screen`, `logo`, `glass-card`, `button`, `input`
- `pipes/filter.pipe.ts`, `services/theme.service.ts`, `directives/` (reservado)

## Home hero (actual)

`home-page` usa `gsap`+`animejs` para SVG draw-line loop, spotlight que sigue cursor, tilt 3D, typer rotativo (`programación|Angular|Python|BD|IA`), marquee infinito, stats counters con `IntersectionObserver`, timeline con `timeline-fill` atado al scroll, bento con spotlight y tilt, CTA con borde cónico animado.

## ⚠️ Regla obligatoria: renderizado de respuestas del bot

```ts
import { marked } from 'marked';
import DOMPurify from 'dompurify';
const html = marked.parse(respuestaDelBot);
const htmlSeguro = DOMPurify.sanitize(html);
// luego [innerHTML]="htmlSeguro"
```

Nunca `[innerHTML]="respuestaDelBot"` directo — el contenido viene de Groq y es no confiable. Aplica a `chat-bubble` futuro y a cualquier render de `modulos.lecciones.contenido`.
