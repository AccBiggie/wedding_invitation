import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import api from '../services/api';
import { resolveImageUrl } from '../services/images.service';
import { storeCategoriesService } from '../services/storeCategories.service';
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
  const [failed, setFailed] = useState(false);
  return <span className="wed-shop-thumb">{failed ? <span className="wed-shop-initial" aria-hidden="true">{category.name.trim().charAt(0)}</span> : <img src={resolveImageUrl(category.image)} alt="" loading="lazy" onError={() => setFailed(true)} />}</span>;
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
    {items === null ? <ul className="wed-shop-cats is-loading" aria-hidden="true">{[0, 1, 2, 3, 4].map(index => <li key={index}><span className="wed-shop-thumb" /><span className="wed-shop-name" /></li>)}</ul>
      : items.length ? <ul className="wed-shop-cats" aria-label={`Categorias da ${store.name.toLowerCase()}`}>{items.map(item => <li key={item._id}><a className="wed-shop-link" href={`/lista-na-loja/${item.slug}`} aria-label={`Ver presentes de ${item.name}`}><CategoryThumb category={item} /><span className="wed-shop-name">{item.name}</span></a></li>)}</ul>
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
