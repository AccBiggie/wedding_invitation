import { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogContent, IconButton, InputAdornment, Snackbar, Stack, TextField, Typography } from '@mui/material';
import Close from '@mui/icons-material/Close'; import QrCode2Outlined from '@mui/icons-material/QrCode2Outlined'; import VerifiedUserOutlined from '@mui/icons-material/VerifiedUserOutlined'; import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined'; import ArrowBackOutlined from '@mui/icons-material/ArrowBackOutlined';
import { pixService } from '../../services/pix.service'; import type { PixGenerated } from '../../types/api';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function GravataModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState(''); const [generated, setGenerated] = useState<PixGenerated | null>(null); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  useEffect(() => { if (!open) { setGenerated(null); setAmount(''); setError(''); } }, [open]);
  const generate = async () => { const value = Number(amount); if (!Number.isFinite(value) || value <= 0 || value > 1000000) { setError('Informe um valor entre R$ 0,01 e R$ 1.000.000,00.'); return; } setLoading(true); setError(''); try { setGenerated(await pixService.generate(value)); } catch { setError('Não foi possível gerar o QR Code PIX. Tente novamente.'); } finally { setLoading(false); } };
  const copy = async () => { if (!generated) return; try { await navigator.clipboard.writeText(generated.payload); setNotice('Código PIX copiado com sucesso.'); } catch { setError('Não foi possível copiar. Selecione e copie o código manualmente.'); } };
  return <><Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" aria-labelledby="gravata-title"><DialogContent sx={{ p: { xs: 2, sm: 4 }, position: 'relative', bgcolor: '#fbfaf6' }}>
    <IconButton aria-label="Fechar" onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}><Close /></IconButton>
    <Stack spacing={2} sx={{ alignItems: 'center', textAlign: 'center' }}><Box component="img" src="/gravata-avatar.png" alt="Avatar com terno verde e gravata dourada" sx={{ width: 160, height: 160, objectFit: 'cover', objectPosition: '50% 15%', borderRadius: '50%', border: '3px solid #c0a057' }} />
      <Typography id="gravata-title" variant="h5" color="primary.main">Gravata Online</Typography>
      {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
      {!generated ? <><Typography>Ajude os noivos a celebrar este momento especial.</Typography><Typography color="text.secondary">Escolha o valor do seu pedacinho da gravata. Em seguida, use o QR Code PIX para fazer sua contribuição.</Typography>
        <TextField label="Qual valor você deseja contribuir?" type="number" value={amount} onChange={e => setAmount(e.target.value)} fullWidth slotProps={{ htmlInput: { min: .01, step: .01 }, input: { startAdornment: <InputAdornment position="start">R$</InputAdornment> } }} />
        <Button fullWidth variant="contained" startIcon={<QrCode2Outlined />} onClick={generate} disabled={loading}>{loading ? 'Gerando...' : 'Gerar QR Code'}</Button><Typography variant="caption" color="text.secondary"><VerifiedUserOutlined sx={{ fontSize: 15, verticalAlign: 'middle', mr: .5 }} />Transação 100% segura via PIX</Typography></> : <><Typography variant="h6">PIX gerado</Typography><Typography variant="h5" color="primary.main">{currency(generated.amount)}</Typography>
        <Box component="img" src={generated.qrCode} alt="QR Code PIX" sx={{ width: 260, maxWidth: '100%' }} /><TextField fullWidth label="Código PIX" value={generated.payload} slotProps={{ input: { readOnly: true } }} multiline minRows={2} /><Button fullWidth variant="contained" startIcon={<ContentCopyOutlined />} onClick={copy}>Copiar código PIX</Button><Button startIcon={<ArrowBackOutlined />} onClick={() => { setGenerated(null); setError(''); }}>Voltar</Button></>}
    </Stack></DialogContent></Dialog><Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar></>;
}
