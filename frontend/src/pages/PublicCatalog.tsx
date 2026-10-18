import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import api from '../services/api';
import { resolveImageUrl } from '../services/images.service';
import { storeCategoriesService } from '../services/storeCategories.service';
import { categoryImageUrl } from '../utils/categoryIcons';
import type { ApiResponse, GiftProduct, Godparent, PublicStoreCategory } from '../types/api';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const roleName: Record<Godparent['role'], string> = { groomsman: 'Padrinho', bridesmaid: 'Madrinha', mother: 'Mãe', father: 'Pai', other: 'Outro' };
interface Couple { names: string[]; role: string; photos: string[] }
function GiftDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const [overflow, setOverflow] = useState(false);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const descriptionId = useId();
  useEffect(() => {
    if (expanded || !paragraphRef.current) return;
    const paragraph = paragraphRef.current;
    const measure = () => setOverflow(paragraph.scrollHeight > paragraph.clientHeight + 1);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(paragraph);
    return () => observer.disconnect();
  }, [description, expanded]);
  return <>
    <p id={descriptionId} ref={paragraphRef} className={`wed-gift-description${expanded ? ' is-expanded' : ''}`}>{description}</p>
    {overflow && <button type="button" className="wed-gift-more" aria-controls={descriptionId} aria-expanded={expanded} onClick={() => setExpanded(value => !value)}>{expanded ? 'Ler menos' : 'Leia mais'}</button>}
  </>;
}
export function PublicGodparents({ fallback, Carousel, GodparentCard }: { fallback: ReactNode; Carousel: ({ label, children }: { label: string; children: ReactNode }) => ReactNode; GodparentCard: ({ couple }: { couple: Couple }) => ReactNode }) {
  const [items, setItems] = useState<Godparent[] | null>(null);
  useEffect(() => { api.get<ApiResponse<Godparent[]>>('/public/godparents').then(r => setItems(r.data.data)).catch(() => setItems([])); }, []);
  if (!items?.length) return <>{fallback}</>;
  return <Carousel label="Padrinhos">{items.map(item => <GodparentCard key={item._id} couple={{ names: [item.name, item.partnerName].filter(Boolean), role: item.cardRole || roleName[item.role], photos: [item.image, ...(item.images || [])].filter(Boolean).slice(0, 2).map(resolveImageUrl) }} />)}</Carousel>;
}
function CategoryThumb({ category }: { category: PublicStoreCategory }) {
  const [failed, setFailed] = useState(false); const src = categoryImageUrl(category);
  return <span className="wed-shop-thumb">{failed || !src ? <span className="wed-shop-initial" aria-hidden="true">{category.name.trim().charAt(0)}</span> : <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />}</span>;
}
const MARQUEE_SPEED = 45; // px por segundo
const CategoryItems = ({ items, hidden }: { items: PublicStoreCategory[]; hidden?: boolean }) => <>{items.map(item => <li key={item._id}><a className="wed-shop-link" href={`/lista-na-loja/${item.slug}`} aria-label={hidden ? undefined : `Ver presentes de ${item.name}`} tabIndex={hidden ? -1 : undefined}><CategoryThumb category={item} /><span className="wed-shop-name">{item.name}</span></a></li>)}</>;
// Categorias numa linha so. Se nao couberem, rolam em laco continuo (a lista e
// duplicada so visualmente); o mouse, o foco ou o toque desaceleram ate parar e,
// ao sair, a faixa acelera de volta. A velocidade e trocada aos poucos pela Web
// Animations API, sem o "tranco" de um animation-play-state. Com movimento
// reduzido no sistema, vira uma faixa com rolagem manual.
function CategoryMarquee({ items, label }: { items: PublicStoreCategory[]; label: string }) {
  const viewport = useRef<HTMLDivElement>(null); const track = useRef<HTMLDivElement>(null); const set = useRef<HTMLUListElement>(null);
  const animation = useRef<Animation | null>(null); const frame = useRef(0); const target = useRef(1); const resume = useRef(0);
  const [loopWidth, setLoopWidth] = useState(0);
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  // Largura de um ciclo (lista + espaco ate a copia). 0 = cabe na linha, sem animacao.
  useLayoutEffect(() => {
    const measure = () => {
      if (!viewport.current || !set.current) return;
      const gap = parseFloat(getComputedStyle(set.current).columnGap) || 0;
      const content = set.current.scrollWidth - (loopWidth ? gap : 0);
      setLoopWidth(content > viewport.current.clientWidth + 1 ? content + gap : 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (viewport.current) observer.observe(viewport.current);
    if (set.current) observer.observe(set.current); // nomes mudam de largura quando a fonte carrega
    return () => observer.disconnect();
  }, [items, loopWidth]);
  useEffect(() => {
    if (!loopWidth || reduced || !track.current) return;
    const running = track.current.animate([{ transform: 'translateX(0)' }, { transform: `translateX(-${loopWidth}px)` }], { duration: loopWidth / MARQUEE_SPEED * 1000, iterations: Infinity });
    running.playbackRate = target.current; animation.current = running;
    return () => { running.cancel(); animation.current = null; };
  }, [loopWidth, reduced]);
  useEffect(() => () => { cancelAnimationFrame(frame.current); clearTimeout(resume.current); }, []);
  const easeTo = (rate: number) => {
    target.current = rate; clearTimeout(resume.current); cancelAnimationFrame(frame.current);
    const step = () => {
      const running = animation.current; if (!running) return;
      const next = running.playbackRate + (target.current - running.playbackRate) * .1;
      running.playbackRate = Math.abs(target.current - next) < .01 ? target.current : next;
      if (running.playbackRate !== target.current) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  };
  const marquee = loopWidth > 0;
  return <div ref={viewport} className={`wed-shop-marquee${marquee ? (reduced ? ' is-scroll' : ' is-marquee') : ''}`}
    onMouseEnter={() => easeTo(0)} onMouseLeave={() => easeTo(1)}
    onFocus={() => easeTo(0)} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) easeTo(1); }}
    onTouchStart={() => easeTo(0)} onTouchEnd={() => { clearTimeout(resume.current); resume.current = window.setTimeout(() => easeTo(1), 1800); }}>
    <div ref={track} className="wed-shop-track">
      <ul ref={set} className="wed-shop-cats" aria-label={label}><CategoryItems items={items} /></ul>
      {marquee && !reduced && <ul className="wed-shop-cats" aria-hidden="true"><CategoryItems items={items} hidden /></ul>}
    </div>
  </div>;
}
interface Store { name: string; description: string; url?: string }
// Layout 3 da "Lista na loja": card horizontal com as categorias ativas em circulos;
// cada uma leva a /lista-na-loja/:slug. "Em breve" so enquanto nao ha categorias.
// O id e o alvo do "Ver todas as categorias" da pagina da categoria.
export function PublicStoreCategories({ store, icon }: { store: Store; icon: ReactNode }) {
  const [items, setItems] = useState<PublicStoreCategory[] | null>(null);
  useEffect(() => { storeCategoriesService.listPublic().then(setItems).catch(() => setItems([])); }, []);
  const titleId = useId();
  const comingSoon = items !== null && !items.length;
  return <article className="wed-card wed-shop" id="lista-na-loja" aria-labelledby={titleId}>
    <div className="wed-shop-head">
      <span className="wed-shop-icon">{icon}</span>
      <h3 id={titleId} className="wed-shop-title">{store.name}</h3>
      {store.url ? <a className="wed-shop-badge is-link" href={store.url} target="_blank" rel="noreferrer">Abrir lista</a> : comingSoon && <span className="wed-shop-badge">Em breve</span>}
    </div>
    <p className="wed-shop-desc">{store.description}</p>
    {items === null ? <div className="wed-shop-rail"><div className="wed-shop-marquee"><ul className="wed-shop-cats is-loading" aria-hidden="true">{[0, 1, 2, 3, 4].map(index => <li key={index}><span className="wed-shop-thumb" /><span className="wed-shop-name" /></li>)}</ul></div></div>
      : items.length ? <div className="wed-shop-rail"><CategoryMarquee items={items} label={`Categorias da ${store.name.toLowerCase()}`} /></div>
      : <p className="wed-shop-empty">Novas categorias serão disponibilizadas em breve.</p>}
  </article>;
}
export function PublicGifts({ Carousel }: { Carousel: ({ label, children }: { label: string; children: ReactNode }) => ReactNode }) {
  const [items, setItems] = useState<GiftProduct[]>([]);
  useEffect(() => { api.get<ApiResponse<GiftProduct[]>>('/public/gift-products').then(r => setItems(r.data.data)).catch(() => setItems([])); }, []);
  if (!items.length) return null;
  return <Carousel label="Lista de presentes">{items.map(item => <div className="wed-card wed-gift" key={item._id}>
    <div className="wed-gift-image">{item.image ? <img src={resolveImageUrl(item.image)} alt={item.name} loading="lazy" /> : <span aria-hidden="true">{item.name.trim().charAt(0)}</span>}</div>
    <strong>{item.name}</strong>
    <span className="wed-gift-price">{currency(item.price)}</span>
    {item.description && <GiftDescription description={item.description} />}
  </div>)}</Carousel>;
}
