import { useCallback, type CSSProperties, type ElementType, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import type { RevealPreset } from '../../config/animations';
import { observeReveal } from './revealObserver';

export interface ScrollRevealProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
  /** Elemento renderizado: o reveal vai no proprio elemento, sem wrapper extra. */
  as?: ElementType;
  preset?: RevealPreset;
  /** Atraso em ms (no stagger, atraso do primeiro filho). */
  delay?: number;
  /** Anima os filhos diretos em sequencia (cards, listas). */
  stagger?: boolean;
  /** Padrao true: revela uma vez e nao repete ao rolar de volta. */
  once?: boolean;
  ref?: Ref<HTMLElement>;
  [attribute: `data-${string}`]: unknown;
}

// Revela o elemento quando ele entra na tela (ver revealObserver). Funciona com
// qualquer tag ou componente que repasse ref e props para o DOM.
export function ScrollReveal({ as: Tag = 'div', preset = 'fade-up', delay = 0, stagger = false, once = true, ref, style, children, ...rest }: ScrollRevealProps) {
  const attach = useCallback((node: HTMLElement | null) => {
    if (typeof ref === 'function') ref(node); else if (ref) (ref as { current: HTMLElement | null }).current = node;
    if (!node) return;
    const stop = observeReveal(node, { delay, stagger, once });
    return () => { stop(); if (typeof ref === 'function') ref(null); else if (ref) (ref as { current: HTMLElement | null }).current = null; };
  }, [ref, delay, stagger, once]);
  const attributes = stagger ? { 'data-reveal-group': preset } : { 'data-reveal': preset };
  return <Tag ref={attach} {...attributes} {...rest} style={{ ...style, '--reveal-delay': `${delay}ms` } as CSSProperties}>{children}</Tag>;
}
