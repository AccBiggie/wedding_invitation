import { useEffect, useRef } from 'react';
import './logo-fetech.js';

// Logo FETECH animado (layout 10 do componente LogoFetech do design system). O modulo
// logo-fetech.js e copiado sem alteracoes e expoe window.LogoFetech. Uma instancia por
// montagem: toca so com a barra final na tela e a aba visivel; ao desmontar, para e sai.

interface LogoFetechInstance { svg: SVGSVGElement; tocar(): void; parar(): void; final(): void; tocando(): boolean }
declare global { interface Window { LogoFetech?: { criar(element: Element, options?: { loop?: boolean; pausa?: number }): LogoFetechInstance } } }

export function FetechAnimatedLogo() {
  const host = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element || !window.LogoFetech) return;
    const logo = window.LogoFetech.criar(element, { loop: true });
    const target = element.closest('.barra-final') || element;
    let visible = false;
    const sync = () => { if (visible && !document.hidden) { if (!logo.tocando()) logo.tocar(); } else logo.parar(); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0.4 });
    observer.observe(target);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
      logo.parar();
      logo.svg.remove();
    };
  }, []);
  return <span ref={host} className="logo-fetech-host" />;
}
