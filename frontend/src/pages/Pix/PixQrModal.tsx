import { useState, type ReactNode } from 'react';
import { Alert, Dialog, Snackbar } from '@mui/material';
import { pixService } from '../../services/pix.service'; import type { PixGenerated } from '../../types/api';
import { formatMoneyInput, formatMoneyValue, parseMoneyInput } from '../../utils/money';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const Svg = ({ children, size = 22 }: { children: ReactNode; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>;
const IconClose = () => <Svg><path d="M18 6l-12 12" /><path d="M6 6l12 12" /></Svg>;
const IconCopy = () => <Svg><path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></Svg>;
const IconQr = () => <Svg size={24}><path d="M4 4h6v6h-6z" /><path d="M14 4h6v6h-6z" /><path d="M4 14h6v6h-6z" /><path d="M7 7v.01" /><path d="M17 7v.01" /><path d="M7 17v.01" /><path d="M14 14h3" /><path d="M20 14v.01" /><path d="M14 14v3" /><path d="M14 20h3" /><path d="M17 17h3" /><path d="M20 17v3" /></Svg>;
const IconBack = () => <Svg size={18}><path d="M5 12l14 0" /><path d="M5 12l6 6" /><path d="M5 12l6 -6" /></Svg>;
const IconShield = () => <Svg size={20}><path d="M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3" /><path d="M9 12l2 2l4 -4" /></Svg>;

type Generated = Omit<PixGenerated, 'amount'> & { amount: number };

// QR Code PIX no padrao do modal da gravata: valor -> "Gerar QR Code" -> QR + copiar.
// - Card "Chave PIX" (so visualizacao): campo zerado; sem valor, gera o QR da chave
//   e o convidado digita o valor no app do banco.
// - "Presentear com PIX" no presente: campo ja vem com o preco, que pode ser ajustado.
export function PixQrModal({ open, onClose, amount = 0, gift }: { open: boolean; onClose: () => void; amount?: number; gift?: string }) {
  const [value, setValue] = useState(() => amount > 0 ? formatMoneyValue(amount) : '');
  const [generated, setGenerated] = useState<Generated | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  const generate = async () => {
    const parsed = value ? parseMoneyInput(value) : 0;
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1000000) { setError('Informe um valor de até R$ 1.000.000,00.'); return; }
    setLoading(true); setError('');
    try { setGenerated(parsed > 0 ? await pixService.generate(parsed) : { ...await pixService.keyQrCode(), amount: 0 }); }
    catch { setError('Não foi possível gerar o QR Code PIX. Tente novamente.'); } finally { setLoading(false); }
  };
  const copy = async () => { if (!generated) return; try { await navigator.clipboard.writeText(generated.payload); setNotice('Código PIX copiado com sucesso.'); } catch { setError('Não foi possível copiar o código PIX.'); } };
  return <><Dialog open={open} onClose={onClose} aria-labelledby="pixqr-title" aria-describedby="pixqr-text" slotProps={{ paper: { className: 'pixqr-paper' } }}>
    <button type="button" className="gravata-close" aria-label="Fechar" onClick={onClose}><IconClose /></button>
    <h2 id="pixqr-title" className="pixqr-title">{gift ? 'Presentear com PIX' : 'QR Code PIX'}</h2>
    {gift && <p className="pixqr-gift">{gift}</p>}
    {!generated ? <>
      <p id="pixqr-text" className="pixqr-text">{gift
        ? <>O valor do presente já está preenchido. Gere o QR Code e pague no app do seu banco — se quiser, ajuste o valor antes.</>
        : <>Informe um valor ou deixe zerado para digitar no app do banco. Se preferir, envie o <strong>valor de um presente da nossa lista</strong>: ele chega para nós como se você o tivesse escolhido.</>}</p>
      <form className="gravata-form" onSubmit={event => { event.preventDefault(); generate(); }} noValidate>
        <label htmlFor="pixqr-amount">Valor do PIX</label>
        <div className="gravata-input"><span>R$</span><input id="pixqr-amount" inputMode="decimal" autoComplete="off" placeholder="0,00" value={value} onChange={event => { setValue(formatMoneyInput(event.target.value)); setError(''); }} aria-invalid={Boolean(error)} aria-describedby={error ? 'pixqr-error' : undefined} /></div>
        {error && <p id="pixqr-error" className="gravata-error" role="alert">{error}</p>}
        <button type="submit" className="gravata-btn" disabled={loading}><IconQr />{loading ? 'Gerando...' : 'Gerar QR Code'}</button>
      </form>
    </> : <>
      <p id="pixqr-text" className="pixqr-text">{generated.amount > 0 ? <>PIX de <strong>{currency(generated.amount)}</strong>. Escaneie no app do seu banco ou copie o código.</> : <>QR Code <strong>sem valor definido</strong>: digite o valor no app do seu banco.</>}</p>
      <div className="pixqr-code"><img src={generated.qrCode} alt={generated.amount > 0 ? `QR Code PIX de ${currency(generated.amount)}` : 'QR Code PIX sem valor definido'} /></div>
      {error && <p className="gravata-error" role="alert">{error}</p>}
      <button type="button" className="gravata-btn" onClick={copy}><IconCopy />Copiar QR Code</button>
      <button type="button" className="gravata-link" onClick={() => { setGenerated(null); setError(''); }}><IconBack />Alterar valor</button>
    </>}
    <p className="gravata-safe"><i /><IconShield /><span>Transação <strong>100%</strong> segura via PIX</span><i /></p>
  </Dialog><Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar></>;
}
