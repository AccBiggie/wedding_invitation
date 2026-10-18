import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Dialog, Snackbar } from '@mui/material';
import { pixService } from '../../services/pix.service'; import type { PixGenerated } from '../../types/api';

const Svg = ({ children, size = 22 }: { children: ReactNode; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
const IconClose = () => <Svg><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></Svg>;
const IconCopy = () => <Svg><path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></Svg>;

// QR Code da chave PIX sem valor definido: o convidado escolhe o valor no app do banco.
export function PixKeyQrModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pix, setPix] = useState<Omit<PixGenerated, 'amount'> | null>(null); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  useEffect(() => { if (!open || pix) return; setError(''); pixService.keyQrCode().then(setPix).catch(() => setError('Não foi possível carregar o QR Code PIX. Tente novamente.')); }, [open, pix]);
  const copy = async () => { if (!pix) return; try { await navigator.clipboard.writeText(pix.payload); setNotice('Código PIX copiado com sucesso.'); } catch { setError('Não foi possível copiar o código PIX.'); } };
  return <><Dialog open={open} onClose={onClose} aria-label="QR Code PIX" slotProps={{ paper: { className: 'pixqr-paper' } }}>
    <button type="button" className="gravata-close" aria-label="Fechar" onClick={onClose}><IconClose /></button>
    <div className="pixqr-code">{pix ? <img src={pix.qrCode} alt="QR Code PIX" /> : !error && <span className="pixqr-loading">Carregando...</span>}</div>
    {error && <p className="gravata-error" role="alert">{error}</p>}
    <button type="button" className="gravata-btn" onClick={copy} disabled={!pix}><IconCopy />Copiar QR Code</button>
  </Dialog><Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar></>;
}
