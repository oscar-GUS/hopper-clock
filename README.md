# HopperClock Calculator

Calculadora de relojes de hoppers de Minecraft (tiempo ↔ ítems). Herramienta de
[MineLite](https://minelite.es), extraída a su propio repo y embebida por `<iframe>`
(mismo patrón que `skin-editor`).

- **Stack:** Vite + React + TypeScript + Tailwind.
- **Dev:** `npm install && npm run dev`
- **Build:** `npm run build` → `dist/`
- **Deploy:** push a `main` → GitHub Actions publica `dist/` en la rama `gh-pages`
  → GitHub Pages sirve `https://oscar-gus.github.io/hopper-clock/`.

## Logro secreto (easter egg)

Embebido en MineLite, el cálculo avisa al parent por `postMessage`
(`{ source: 'hopper-clock', evento: 'hopper_clock', payload }`) para que MineLite
—que sí tiene la sesión del usuario— compruebe el logro secreto en su servidor.
Los valores concretos del logro viven solo en el backend de MineLite.

En MineLite, la página que embebe el iframe debe escuchar ese mensaje y reenviarlo
a `/api/achievements/track`.
