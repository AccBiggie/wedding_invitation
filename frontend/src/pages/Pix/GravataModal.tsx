import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Dialog, Snackbar } from '@mui/material';
import { pixService } from '../../services/pix.service'; import type { PixGenerated } from '../../types/api';
import { formatMoneyInput, parseMoneyInput } from '../../utils/money';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Svg = ({ children, size = 24, viewBox = '0 0 24 24', className }: { children: ReactNode; size?: number; viewBox?: string; className?: string }) => <svg className={className} width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
const IconGift = () => <Svg size={30}><path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" /><path d="M12 8l0 13" /><path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" /></Svg>;
const IconClose = () => <Svg size={22}><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></Svg>;
const IconQr = () => <Svg size={26} viewBox="0 0 24 24"><path d="M4 4h6v6h-6z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6h-6z" /><path d="M7 7v.01" /><path d="M17 7v.01" /><path d="M7 17v.01" /><path d="M14 14h3" /><path d="M20 14v.01" /><path d="M14 14v3" /><path d="M14 20h3" /><path d="M17 17h3" /><path d="M20 17v3" /></Svg>;
const IconShield = () => <Svg size={20}><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></Svg>;
const IconHeart = () => <Svg size={16}><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></Svg>;
const IconCopy = () => <Svg size={22}><path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></Svg>;
const IconBack = () => <Svg size={18}><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></Svg>;
// Raminho dourado ao lado do titulo; espelhado do lado direito.
const Leaf = ({ flip }: { flip?: boolean }) => <Svg size={34} viewBox="0 0 34 20" className={`gravata-leaf${flip ? ' is-flip' : ''}`}><path d="M2 15c8-1 16-4 30-12" /><path d="M10 13c-1-3 0-6 3-7c1 3 0 6-3 7z" fill="currentColor" fillOpacity=".25" /><path d="M17 10c-1-3 1-6 4-6c0 3-1 5-4 6z" fill="currentColor" fillOpacity=".25" /><path d="M24 7c0-3 2-5 5-5c0 3-2 5-5 5z" fill="currentColor" fillOpacity=".25" /><path d="M13 13c2 2 5 2 7 1c-2-2-5-2-7-1z" fill="currentColor" fillOpacity=".25" /></Svg>;
const Curl = ({ flip }: { flip?: boolean }) => <Svg size={24} viewBox="0 0 24 14" className={`gravata-curl${flip ? ' is-flip' : ''}`}><path d="M22 12c-6 0-11-2-13-6c-1-3 1-5 3-4c2 1 1 4-1 4c-3 0-5-2-6-4" /></Svg>;
// Ramagem em traco fino no canto superior esquerdo da arte.
const Branch = () => <svg className="gravata-branch" viewBox="0 0 160 170" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden="true">
  <path d="M8 160C14 110 34 62 78 30c18-13 40-20 70-22" /><path d="M20 112c-12-6-16-18-12-30c10 6 14 18 12 30z" /><path d="M30 86c-10-8-12-20-6-31c9 8 11 20 6 31z" /><path d="M44 63c-8-9-8-21 0-30c7 9 7 21 0 30z" />
  <path d="M62 44c-4-11 0-22 10-27c3 11-1 22-10 27z" /><path d="M86 28c2-11 11-18 22-18c-2 11-11 18-22 18z" /><path d="M112 17c6-9 17-12 27-8c-6 9-17 12-27 8z" />
  <path d="M26 98c12-2 22 4 26 14c-12 1-22-5-26-14z" /><path d="M40 72c12 0 20 8 22 18c-12-1-20-8-22-18z" /><path d="M56 52c11 2 18 11 18 21c-11-2-18-10-18-21z" />
  <path d="M14 30c6-10 18-14 28-10c-4 4-2 10 4 10" /><circle cx="46" cy="27" r="2.5" /><path d="M120 34c-6 4-8 10-4 15" />
</svg>;

export function GravataModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState(''); const [generated, setGenerated] = useState<PixGenerated | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  useEffect(() => { if (!open) { setGenerated(null); setAmount(''); setError(''); } }, [open]);
  const generate = async () => { const value = parseMoneyInput(amount); if (!Number.isFinite(value) || value <= 0 || value > 1000000) { setError('Informe um valor entre R$ 0,01 e R$ 1.000.000,00.'); return; } setLoading(true); setError(''); try { setGenerated(await pixService.generate(value)); } catch { setError('Não foi possível gerar o QR Code PIX. Tente novamente.'); } finally { setLoading(false); } };
  const copy = async () => { if (!generated) return; try { await navigator.clipboard.writeText(generated.payload); setNotice('Código PIX copiado com sucesso.'); } catch { setError('Não foi possível copiar. Selecione e copie o código manualmente.'); } };
  return <><Dialog open={open} onClose={onClose} aria-labelledby="gravata-title" slotProps={{ paper: { className: 'gravata-paper' } }}>
    <button type="button" className="gravata-close" aria-label="Fechar" onClick={onClose}><IconClose /></button>
    <div className="gravata-art">
      <span className="gravata-glow" /><span className="gravata-arch" /><Branch />
      <img src="/gravata-avatar.png" alt="Noivo de terno verde e gravata dourada" />
    </div>
    <div className="gravata-body">
      <span className="gravata-badge"><IconGift /></span>
      <div className="gravata-curls"><Curl /><Curl flip /></div>
      <h2 id="gravata-title" className="gravata-title"><Leaf />Gravata online<Leaf flip /></h2>
      <div className="gravata-dot"><i /><b /><i /></div>
      {!generated ? <>
        <p className="gravata-lead">Ajude os noivos a celebrar este momento especial.</p>
        <div className="gravata-rule"><i /><IconHeart /><i /></div>
        <p className="gravata-text">Escolha o valor do seu pedacinho da gravata. Em seguida, use o QR Code PIX para fazer sua contribuição.</p>
        <form className="gravata-form" onSubmit={event => { event.preventDefault(); generate(); }} noValidate>
          <label htmlFor="gravata-amount">Qual valor você deseja contribuir?</label>
          <div className="gravata-input"><span>R$</span><input id="gravata-amount" inputMode="decimal" autoComplete="off" placeholder="0,00" value={amount} onChange={event => { setAmount(formatMoneyInput(event.target.value)); setError(''); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'gravata-error' : undefined} /></div>
          {error && <p id="gravata-error" className="gravata-error" role="alert">{error}</p>}
          <button type="submit" className="gravata-btn" disabled={loading}><IconQr />{loading ? 'Gerando...' : 'Gerar QR Code'}</button>
        </form>
      </> : <>
        <p className="gravata-lead gravata-lead-sm">PIX gerado no valor de <strong>{currency(generated.amount)}</strong></p>
        <div className="gravata-qr"><img src={generated.qrCode} alt="QR Code PIX" /></div>
        <div className="gravata-form">
          <label htmlFor="gravata-code">Código PIX copia e cola</label>
          <textarea id="gravata-code" className="gravata-code" value={generated.payload} readOnly rows={3} onFocus={event => event.target.select()} />
          {error && <p className="gravata-error" role="alert">{error}</p>}
          <button type="button" className="gravata-btn" onClick={copy}><IconCopy />Copiar código PIX</button>
          <button type="button" className="gravata-link" onClick={() => { setGenerated(null); setError(''); }}><IconBack />Escolher outro valor</button>
        </div>
      </>}
      <p className="gravata-safe"><i /><IconShield /><span>Transação <strong>100%</strong> segura via PIX</span><i /></p>
    </div>
  </Dialog><Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar></>;
}
