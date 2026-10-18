import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, FormControlLabel, MenuItem, Paper, Snackbar, Stack, Switch, TextField, Typography } from '@mui/material';
import SaveOutlined from '@mui/icons-material/SaveOutlined'; import QrCode2Outlined from '@mui/icons-material/QrCode2Outlined';
import { PageHeader } from '../../components/common/PageHeader'; import { pixService } from '../../services/pix.service'; import type { PixGenerated, PixInput } from '../../types/api';
import { formatMoneyInput, parseMoneyInput } from '../../utils/money';

const blank: PixInput = { keyType: 'email', pixKey: '', receiverName: '', receiverCity: '', description: '', active: true };
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export function PixPage() {
  const [form, setForm] = useState<PixInput>(blank); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState('100,00'); const [generating, setGenerating] = useState(false); const [generated, setGenerated] = useState<PixGenerated | null>(null);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  useEffect(() => { pixService.getSettings().then(item => { if (item) setForm({ keyType: item.keyType, pixKey: item.pixKey, receiverName: item.receiverName, receiverCity: item.receiverCity, description: item.description, active: item.active }); }).catch(() => setError('Não foi possível carregar a configuração PIX.')).finally(() => setLoading(false)); }, []);
  const change = <K extends keyof PixInput>(key: K, value: PixInput[K]) => setForm(current => ({ ...current, [key]: value }));
  const save = async (event: FormEvent) => { event.preventDefault(); if (saving) return; setSaving(true); setError(''); try { await pixService.saveSettings(form); setNotice('Configuração PIX salva com sucesso.'); } catch { setError('Não foi possível salvar a configuração PIX. Confira a chave e os campos.'); } finally { setSaving(false); } };
  const generate = async () => { const value = parseMoneyInput(amount); if (!Number.isFinite(value) || value <= 0) { setError('Informe um valor válido.'); return; } setGenerating(true); setError(''); try { setGenerated(await pixService.generate(value)); } catch { setError('Não foi possível gerar o QR Code PIX. Verifique se a configuração está ativa e salva.'); } finally { setGenerating(false); } };
  return <><PageHeader title="PIX / Gravata Online" subtitle="Configure o recebimento e teste o QR Code PIX." />
    {loading ? <CircularProgress /> : <Stack spacing={3} sx={{ maxWidth: 900 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <Paper component="form" onSubmit={save} sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h6">Configuração PIX</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
          <TextField select label="Tipo da chave" value={form.keyType} onChange={e => change('keyType', e.target.value as PixInput['keyType'])}><MenuItem value="cpf">CPF</MenuItem><MenuItem value="cnpj">CNPJ</MenuItem><MenuItem value="email">E-mail</MenuItem><MenuItem value="phone">Telefone</MenuItem><MenuItem value="random">Aleatória</MenuItem></TextField>
          <TextField label="Chave PIX" required value={form.pixKey} onChange={e => change('pixKey', e.target.value)} helperText={form.keyType === 'phone' ? 'Use +55 seguido do DDD e número.' : undefined} />
          <TextField label="Nome do recebedor" required value={form.receiverName} onChange={e => change('receiverName', e.target.value)} />
          <TextField label="Cidade" required value={form.receiverCity} onChange={e => change('receiverCity', e.target.value)} />
        </Box><TextField label="Descrição" value={form.description} onChange={e => change('description', e.target.value)} slotProps={{ htmlInput: { maxLength: 72 } }} />
        <FormControlLabel control={<Switch checked={form.active} onChange={e => change('active', e.target.checked)} />} label="Ativo" />
        <Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={saving} sx={{ alignSelf: 'start' }}>{saving ? 'Salvando...' : 'Salvar configuração'}</Button>
      </Stack></Paper>
      <Paper sx={{ p: 3 }}><Stack spacing={2}><Typography variant="h6">Testar QR Code</Typography><TextField label="Valor (R$)" type="text" value={amount} onChange={e => setAmount(formatMoneyInput(e.target.value))} slotProps={{ htmlInput: { inputMode: 'decimal', placeholder: '0,00' } }} sx={{ maxWidth: 220 }} /><Button variant="outlined" startIcon={<QrCode2Outlined />} onClick={generate} disabled={generating} sx={{ alignSelf: 'start' }}>{generating ? 'Gerando...' : 'Gerar QR Code'}</Button>{generated && <Box><Typography variant="h6">{currency(generated.amount)}</Typography><Box component="img" src={generated.qrCode} alt="QR Code PIX de teste" sx={{ width: 240, maxWidth: '100%' }} /><TextField fullWidth label="Código PIX" value={generated.payload} slotProps={{ input: { readOnly: true } }} /></Box>}</Stack></Paper>
    </Stack>}
    <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
  </>;
}
