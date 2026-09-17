/**
 * Transición de página global (App Router `template`):
 * fade + y 8px a 420ms con `--ease-out-expo`.
 *
 * Es CSS puro (`.page-enter` en globals.css) a propósito: framer-motion
 * captura `initial`/`transition` al montar, así que un flip post-mount de
 * `useReducedMotion` no cancela la animación ya iniciada y el usuario RM
 * seguía viendo el fade. Con CSS, `prefers-reduced-motion` se resuelve en
 * la hoja de estilos —sin estado de React— por lo que SSR y primer render
 * del cliente son idénticos y con RM la página queda estática.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
