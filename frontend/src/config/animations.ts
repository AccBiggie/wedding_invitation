// Padrao unico das animacoes de entrada da landing (ScrollReveal). Os valores de
// duracao e distancia tambem existem como variaveis CSS (--reveal-*) em style.css;
// mantenha os dois em sincronia.
export const revealConfig = {
  durationMs: 600,
  distancePx: 24,
  staggerMs: 80,
  /** Itens alem deste indice aparecem junto com o ultimo do stagger. */
  maxStaggerItems: 6,
  /** O elemento revela quando o topo passa ~12% acima da base da tela. */
  rootMargin: '0px 0px -12% 0px',
  mobile: { query: '(max-width: 700px)', durationMs: 480, distancePx: 16, staggerMs: 60, maxStaggerItems: 4 }
} as const;

/**
 * fade: so opacidade | fade-up/down: sobe/desce | fade-left/right: entra pela
 * direita/esquerda deslizando nessa direcao | scale-soft: 0.97 -> 1 (imagens).
 */
export type RevealPreset = 'fade' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'scale-soft';
