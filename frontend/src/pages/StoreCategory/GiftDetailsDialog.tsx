import { useState } from 'react';
import { Dialog } from '@mui/material';
import { resolveImageUrl } from '../../services/images.service';
import type { PublicGiftProduct } from '../../types/api';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// "Ver presente": detalhes completos do produto. Sem fluxo de compra por enquanto;
// quando houver (escolher presente, PIX, marcar como comprado), a acao entra aqui.
export function GiftDetailsDialog({ product, category, onClose }: { product: PublicGiftProduct; category: string; onClose: () => void }) {
  const [failed, setFailed] = useState(false);
  return <Dialog open onClose={onClose} aria-labelledby="gift-details-title" slotProps={{ paper: { className: 'giftdlg-paper' } }}>
    <button type="button" className="gravata-close" aria-label="Fechar" onClick={onClose}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" aria-hidden="true"><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></svg></button>
    <div className="giftdlg-image">{product.image && !failed ? <img src={resolveImageUrl(product.image)} alt={product.name} onError={() => setFailed(true)} /> : <span aria-hidden="true">{product.name.trim().charAt(0)}</span>}</div>
    <div className="giftdlg-body">
      {category && <span className="giftdlg-kicker">{category}</span>}
      <h2 id="gift-details-title" className="giftdlg-title">{product.name}</h2>
      <span className="giftdlg-price">{currency(product.price)}</span>
      {product.description && <p className="giftdlg-text">{product.description}</p>}
      <button type="button" className="gravata-btn" onClick={onClose}>Voltar aos presentes</button>
    </div>
  </Dialog>;
}
