import { useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import { Dialog } from '@mui/material';
import { resolveImageUrl } from '../../services/images.service';
import type { PublicGiftProduct } from '../../types/api';
import { PixQrDialog } from '../Pix/GravataEntry';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const Icon = ({ d, size = 22 }: { d: string; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
const CLOSE = 'M18 6l-12 12M6 6l12 12';
const PREV = 'M15 6l-6 6l6 6';
const NEXT = 'M9 6l6 6l-6 6';
const QR = 'M4 4h6v6h-6zM14 4h6v6h-6zM4 14h6v6h-6zM7 7v.01M17 7v.01M7 17v.01M14 14h3M20 14v.01M14 14v3M14 20h3M17 17h3M20 17v3';
const EXTERNAL = 'M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6M11 13l9 -9M15 4h5v5';

// Galeria do presente: miniaturas na lateral, imagem grande e setas no canto.
// Navega por clique, setas do teclado (com foco na imagem) e arraste no celular.
function Gallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const touchX = useRef<number | null>(null);
  const many = images.length > 1;
  const go = (next: number) => setIndex((next + images.length) % images.length);
  useEffect(() => { thumbs.current[index]?.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }, [index]);
  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); go(index - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); go(index + 1); }
  };
  const onTouchEnd = (event: TouchEvent) => {
    if (touchX.current === null) return;
    const delta = event.changedTouches[0].clientX - touchX.current; touchX.current = null;
    if (Math.abs(delta) > 40) go(index + (delta < 0 ? 1 : -1));
  };
  const current = images[index];
  return <div className={`giftdlg-gallery${many ? '' : ' is-single'}`}>
    {many && <div className="giftdlg-thumbs" role="group" aria-label="Fotos do presente">{images.map((src, position) => <button key={`${position}-${src}`} ref={node => { thumbs.current[position] = node; }} type="button" aria-label={`Ver foto ${position + 1} de ${images.length}`} aria-current={position === index} className={`giftdlg-thumb${position === index ? ' is-active' : ''}`} onClick={() => setIndex(position)}>
      {failed[src] ? <span aria-hidden="true">{position + 1}</span> : <img src={resolveImageUrl(src)} alt="" loading="lazy" onError={() => setFailed(value => ({ ...value, [src]: true }))} />}
    </button>)}</div>}
    <div className="giftdlg-stage" tabIndex={many ? 0 : -1} role={many ? 'region' : undefined} aria-roledescription={many ? 'galeria' : undefined} aria-label={many ? `${name}: foto ${index + 1} de ${images.length}. Use as setas para trocar.` : undefined} onKeyDown={many ? onKey : undefined} onTouchStart={event => { touchX.current = event.touches[0].clientX; }} onTouchEnd={many ? onTouchEnd : undefined}>
      {!current || failed[current] ? <span className="giftdlg-placeholder" aria-hidden="true">{name.trim().charAt(0)}</span> : <img key={current} src={resolveImageUrl(current)} alt={many ? `${name} — foto ${index + 1} de ${images.length}` : name} onError={() => setFailed(value => ({ ...value, [current]: true }))} />}
      {many && <div className="giftdlg-arrows">
        <button type="button" className="giftdlg-arrow" aria-label="Foto anterior" onClick={() => go(index - 1)}><Icon d={PREV} /></button>
        <button type="button" className="giftdlg-arrow" aria-label="Próxima foto" onClick={() => go(index + 1)}><Icon d={NEXT} /></button>
      </div>}
      {many && <span className="giftdlg-sr" aria-live="polite">Foto {index + 1} de {images.length}</span>}
    </div>
  </div>;
}

// "Ver presente": galeria, detalhes e o link do produto na loja (cadastrado no painel).
// Sem fluxo de compra por enquanto; quando houver (PIX, marcar como comprado), entra aqui.
export function GiftDetailsDialog({ product, category, pixActive = false, onClose }: { product: PublicGiftProduct; category: string; pixActive?: boolean; onClose: () => void }) {
  const images = [product.image, ...(product.images || [])].filter(Boolean);
  const [pixOpen, setPixOpen] = useState(false);
  return <><Dialog open onClose={onClose} aria-labelledby="gift-details-title" slotProps={{ paper: { className: 'giftdlg-paper' } }}>
    <button type="button" className="gravata-close" aria-label="Fechar" onClick={onClose}><Icon d={CLOSE} /></button>
    <Gallery images={images} name={product.name} />
    <div className="giftdlg-body">
      {category && <span className="giftdlg-kicker">{category}</span>}
      <h2 id="gift-details-title" className="giftdlg-title">{product.name}</h2>
      <span className="giftdlg-price">{currency(product.price)}</span>
      {product.description && <p className="giftdlg-text">{product.description}</p>}
      <div className="giftdlg-actions">
        {/* PIX e a acao principal; a loja vira secundaria quando as duas existem. */}
        {pixActive && <button type="button" className="gravata-btn" onClick={() => setPixOpen(true)}><Icon d={QR} size={22} />Presentear com PIX</button>}
        {product.storeUrl && <a className={`${pixActive ? 'giftdlg-secondary' : 'gravata-btn'} giftdlg-store`} href={product.storeUrl} target="_blank" rel="noopener noreferrer">Ver produto na loja<Icon d={EXTERNAL} size={20} /><span className="giftdlg-sr"> (abre em nova aba)</span></a>}
        <button type="button" className={pixActive || product.storeUrl ? 'giftdlg-back' : 'gravata-btn'} onClick={onClose}>Voltar aos presentes</button>
      </div>
    </div>
  </Dialog>{pixOpen && <PixQrDialog open onClose={() => setPixOpen(false)} amount={product.price} gift={product.name} />}</>;
}
