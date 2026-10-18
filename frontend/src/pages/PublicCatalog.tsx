import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import api from '../services/api';
import { resolveImageUrl } from '../services/images.service';
import type { ApiResponse, GiftProduct, Godparent } from '../types/api';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const roleName: Record<Godparent['role'], string> = { groomsman: 'Padrinho', bridesmaid: 'Madrinha', mother: 'Mãe', father: 'Pai', other: 'Outro' };
interface Couple { names: string[]; role: string; photo: string }
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
  return <Carousel label="Padrinhos">{items.map(item => <GodparentCard key={item._id} couple={{ names: [item.name, item.partnerName].filter(Boolean), role: item.cardRole || roleName[item.role], photo: resolveImageUrl(item.image) }} />)}</Carousel>;
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
