import { Suspense, lazy, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import api from '../services/api';
import { resolveImageUrl } from '../services/images.service';
import { storeCategoriesService } from '../services/storeCategories.service';
import { categoryImageUrl } from '../utils/categoryIcons';
import { ScrollReveal } from '../components/reveal/ScrollReveal';
import { Blossom } from '../components/decor/Blossom';
import type { ApiResponse, GiftProduct, Godparent, Pagination, PublicGiftProduct, PublicStoreCategory } from '../types/api';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const roleName: Record<Godparent['role'], string> = { groomsman: 'Padrinho', bridesmaid: 'Madrinha', mother: 'Mãe', father: 'Pai', other: 'Outro' };
interface Couple { names: string[]; role: string; photos: string[] }
// Porta-retrato pequeno: pede a miniatura nitida gerada no servidor em vez do original de 1200px.
const framePhotoUrl = (value: string) => value.startsWith('/api/images/') ? `${resolveImageUrl(value)}?w=480` : resolveImageUrl(value);
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
  return <Carousel label="Padrinhos">{items.map(item => <GodparentCard key={item._id} couple={{ names: [item.name, item.partnerName].filter(Boolean), role: item.cardRole || roleName[item.role], photos: [item.image, ...(item.images || [])].filter(Boolean).slice(0, 2).map(framePhotoUrl) }} />)}</Carousel>;
}
function CategoryThumb({ category }: { category: PublicStoreCategory }) {
  const [failed, setFailed] = useState(false); const src = categoryImageUrl(category);
  return <span className="wed-shop-thumb">{failed || !src ? <span className="wed-shop-initial" aria-hidden="true">{category.name.trim().charAt(0)}</span> : <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} />}</span>;
}
// Mesmos presentes e mesmo carregamento da pagina da categoria (/lista-na-loja/:slug).
const ProductCards = lazy(() => import('./StoreCategory/StoreCategoryContent').then(module => ({ default: module.ProductCards })));
const PAGE_SIZE = 12;
type Pick = { status: 'idle' } | { status: 'loading' } | { status: 'error' } | { status: 'ready'; products: PublicGiftProduct[]; pagination: Pagination };

// Categorias da "Lista na loja" como botoes: a escolhida mostra os presentes logo abaixo.
// Enquanto nada foi escolhido, cinco sinais convidam a clicar: a dica com seta, um anel
// dourado que percorre os circulos quando a secao aparece (e repete a cada 6 s), o balao
// no primeiro circulo, o "ver presentes" no hover/foco e o quadro vazio com uma flor.
// Depois da escolha tudo isso some e nenhuma animacao continua rodando.
function StoreCategoryPicker({ items, label }: { items: PublicStoreCategory[]; label: string }) {
  const [chosen, setChosen] = useState<PublicStoreCategory | null>(null);
  const [pick, setPick] = useState<Pick>({ status: 'idle' });
  const list = useRef<HTMLUListElement>(null);
  const request = useRef(0);
  useEffect(() => {
    const node = list.current;
    if (!node || chosen || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let interval = 0, timers: number[] = [];
    const call = () => {
      timers.forEach(clearTimeout); timers = [];
      node.querySelectorAll<HTMLElement>('.wed-shop-ring').forEach((ring, index) => {
        timers.push(window.setTimeout(() => { ring.classList.add('is-calling'); timers.push(window.setTimeout(() => ring.classList.remove('is-calling'), 1100)); }, index * 180));
      });
    };
    const stop = () => { clearInterval(interval); interval = 0; };
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return stop();
      if (!interval) { call(); interval = window.setInterval(call, 6000); }
    }, { threshold: .5 });
    observer.observe(node);
    return () => { observer.disconnect(); stop(); timers.forEach(clearTimeout); node.querySelectorAll('.is-calling').forEach(ring => ring.classList.remove('is-calling')); };
  }, [chosen]);
  const load = (category: PublicStoreCategory) => {
    const id = ++request.current;
    setPick({ status: 'loading' });
    storeCategoriesService.getPublicBySlug(category.slug, 1, PAGE_SIZE)
      .then(data => { if (id === request.current) setPick({ status: 'ready', products: data.products, pagination: data.pagination }); })
      .catch(() => { if (id === request.current) setPick({ status: 'error' }); });
  };
  const choose = (category: PublicStoreCategory) => { if (chosen?._id === category._id) return; setChosen(category); load(category); };
  return <>
    <p className={`wed-shop-hint${chosen ? ' is-done' : ''}`} aria-hidden={chosen ? true : undefined}>
      <span className="wed-shop-hint-arrow" aria-hidden="true">↓</span>
      <span className="wed-shop-hint-mouse">Escolha uma categoria para ver os presentes dela</span>
      <span className="wed-shop-hint-touch">Toque em uma categoria para ver os presentes dela</span>
    </p>
    <div className="wed-shop-rail">
      <ScrollReveal as="ul" stagger delay={200} ref={list} className="wed-shop-cats" aria-label={label}>{items.map((item, index) => {
        const active = chosen?._id === item._id;
        return <li key={item._id}><button type="button" className="wed-shop-pick" aria-pressed={active} onClick={() => choose(item)}>
          {index === 0 && !chosen && <span className="wed-shop-balloon" aria-hidden="true"><span className="wed-shop-hint-mouse">Clique para ver os presentes</span><span className="wed-shop-hint-touch">Toque para ver os presentes</span></span>}
          {index === 0 && !chosen && <span className="wed-shop-balloon-tip" aria-hidden="true" />}
          <span className="wed-shop-ring"><CategoryThumb category={item} />{active && <Blossom size={18} seed={5 + index} className="wed-shop-seal" />}</span>
          <span className="wed-shop-name">{item.name}</span>
          <span className="wed-shop-more" aria-hidden="true">ver presentes →</span>
        </button></li>;
      })}</ScrollReveal>
    </div>
    <div className="wed-shop-products" aria-live="polite" aria-busy={pick.status === 'loading'}>
      {!chosen ? <div className="wed-shop-waiting"><Blossom size={22} seed={3} /><b>Nenhuma categoria escolhida ainda</b><span>Toque em um dos círculos acima e os presentes aparecem aqui.</span></div>
        : pick.status === 'loading' || pick.status === 'idle' ? <><span className="wed-sr">Carregando presentes de {chosen.name}</span><ul className="wed-catpage-grid is-loading" aria-hidden="true">{[0, 1, 2, 3].map(index => <li key={index} className="wed-card wed-catpage-card"><div className="wed-gift-image wed-catpage-image" /><span /><span /></li>)}</ul></>
        : pick.status === 'error' ? <div className="wed-shop-waiting"><b>Não foi possível carregar os presentes de {chosen.name}.</b><button type="button" className="wed-btn wed-btn-ghost" onClick={() => load(chosen)}>Tentar novamente</button></div>
        : <>
          <header className="wed-shop-products-head">
            <h4>Presentes de {chosen.name}</h4>
            {pick.pagination.total > 0 && <span>{pick.pagination.total} {pick.pagination.total === 1 ? 'presente' : 'presentes'}</span>}
          </header>
          {pick.products.length ? <Suspense fallback={null}><ProductCards products={pick.products} category={chosen.name} nameTag="h5" /></Suspense>
            : <p className="wed-shop-empty">Ainda não adicionamos presentes nesta categoria. Novidades em breve.</p>}
          {pick.pagination.totalPages > 1 && <a className="wed-shop-all" href={`/lista-na-loja/${chosen.slug}`}>Ver todos os {pick.pagination.total} presentes de {chosen.name} →</a>}
        </>}
    </div>
  </>;
}
interface Store { name: string; description: string; url?: string }
// Layout 3 da "Lista na loja": card horizontal com as categorias ativas em circulos;
// escolher uma mostra os presentes dela logo abaixo. "Em breve" so enquanto nao ha categorias.
// O id e o alvo do "Ver todas as categorias" da pagina da categoria.
export function PublicStoreCategories({ store, icon }: { store: Store; icon: ReactNode }) {
  const [items, setItems] = useState<PublicStoreCategory[] | null>(null);
  useEffect(() => { storeCategoriesService.listPublic().then(setItems).catch(() => setItems([])); }, []);
  const titleId = useId();
  const comingSoon = items !== null && !items.length;
  return <ScrollReveal as="article" className="wed-card wed-shop" id="lista-na-loja" aria-labelledby={titleId}>
    <ScrollReveal stagger preset="fade" delay={80} className="wed-shop-head">
      <span className="wed-shop-icon">{icon}</span>
      <h3 id={titleId} className="wed-shop-title">{store.name}</h3>
      {store.url ? <a className="wed-shop-badge is-link" href={store.url} target="_blank" rel="noreferrer">Abrir lista</a> : comingSoon && <span className="wed-shop-badge">Em breve</span>}
    </ScrollReveal>
    <ScrollReveal as="p" preset="fade" delay={160} className="wed-shop-desc">{store.description}</ScrollReveal>
    {items === null ? <div className="wed-shop-rail"><ul className="wed-shop-cats is-loading" aria-hidden="true">{[0, 1, 2, 3, 4].map(index => <li key={index}><span className="wed-shop-thumb" /><span className="wed-shop-name" /></li>)}</ul></div>
      : items.length ? <StoreCategoryPicker items={items} label={`Categorias da ${store.name.toLowerCase()}`} />
      : <p className="wed-shop-empty">Novas categorias serão disponibilizadas em breve.</p>}
  </ScrollReveal>;
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
