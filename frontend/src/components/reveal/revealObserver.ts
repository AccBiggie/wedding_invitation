import { revealConfig } from '../../config/animations';

export interface RevealOptions { delay: number; stagger: boolean; once: boolean }

// Um unico IntersectionObserver para todos os elementos: nada de listeners de
// scroll. O estado vive em atributos do proprio elemento (sem re-render do React):
//   data-revealed     -> estado final (CSS faz a transicao)
//   data-reveal-done  -> animacao concluida: o CSS tira a transicao para nao
//                        atrasar hovers e o transform deixa de existir.
const registered = new WeakMap<Element, RevealOptions>();
const timers = new WeakMap<Element, number>();
let observer: IntersectionObserver | null | undefined;
// Salvaguarda: elementos tao no fim da pagina que, mesmo com a rolagem no maximo,
// nunca cruzariam a linha de disparo (rootMargin) sao revelados ao entrar na tela.
let edgeObserver: IntersectionObserver | null = null;

// Fracao da tela abaixo da linha de disparo ("-12%" no rootMargin).
const triggerOffset = () => Math.abs(parseFloat(revealConfig.rootMargin.split(' ')[2])) / 100;
const matches = (query: string) => typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches);
const reducedMotion = () => matches('(prefers-reduced-motion: reduce)');

function settle(element: Element) { element.setAttribute('data-revealed', ''); element.setAttribute('data-reveal-done', ''); }

function show(element: HTMLElement, options: RevealOptions) {
  const mobile = matches(revealConfig.mobile.query);
  const step = mobile ? revealConfig.mobile.staggerMs : revealConfig.staggerMs;
  const maxItems = mobile ? revealConfig.mobile.maxStaggerItems : revealConfig.maxStaggerItems;
  let last = options.delay;
  if (options.stagger) Array.from(element.children).forEach((child, index) => {
    const delay = options.delay + Math.min(index, maxItems - 1) * step;
    (child as HTMLElement).style.setProperty('--reveal-delay', `${delay}ms`);
    last = Math.max(last, delay);
  });
  element.setAttribute('data-revealed', '');
  if (!options.once) return;
  observer?.unobserve(element); edgeObserver?.unobserve(element);
  const duration = mobile ? revealConfig.mobile.durationMs : revealConfig.durationMs;
  timers.set(element, window.setTimeout(() => element.setAttribute('data-reveal-done', ''), last + duration + 80));
}

function getObserver() {
  if (observer !== undefined) return observer;
  observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
    for (const entry of entries) {
      const options = registered.get(entry.target);
      if (!options) continue;
      if (entry.isIntersecting) show(entry.target as HTMLElement, options);
      else if (!options.once) entry.target.removeAttribute('data-revealed');
    }
  }, { rootMargin: revealConfig.rootMargin, threshold: 0 });
  edgeObserver = new IntersectionObserver(entries => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const line = window.innerHeight * (1 - triggerOffset());
    for (const entry of entries) {
      const options = registered.get(entry.target);
      if (!options || !entry.isIntersecting || entry.target.hasAttribute('data-revealed')) continue;
      const topAtMaxScroll = entry.boundingClientRect.top + window.scrollY - maxScroll;
      if (topAtMaxScroll > line - 1) show(entry.target as HTMLElement, options);
    }
  }, { threshold: 0 });
  return observer;
}

/** Registra o elemento; devolve a limpeza. Sem suporte ou com movimento reduzido, mostra na hora. */
export function observeReveal(element: HTMLElement, options: RevealOptions) {
  const io = getObserver();
  if (!io || reducedMotion()) { settle(element); return () => {}; }
  registered.set(element, options);
  io.observe(element); edgeObserver?.observe(element);
  return () => { io.unobserve(element); edgeObserver?.unobserve(element); window.clearTimeout(timers.get(element)); registered.delete(element); };
}
