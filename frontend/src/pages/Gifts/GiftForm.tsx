import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Box, Button, Card, CardContent, CardMedia, CircularProgress, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import { ImageUpload } from '../../components/common/ImageUpload';
import { resolveImageUrl } from '../../services/images.service';
import { CrudDialog } from '../../components/common/CrudDialog'; import { giftsService } from '../../services/gifts.service'; import type { GiftInput } from '../../types/api';

const blank: GiftInput = { name: '', description: '', price: 0, category: '', image: '', order: 0, active: true };
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export function GiftForm({ id, onClose, onSaved }: { id?: string; onClose: () => void; onSaved: (notice: string) => void }) {
  const [form, setForm] = useState<GiftInput>(blank); const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!id) return;
    let active = true;
    giftsService.getById(id).then(item => { if (active) setForm({ name: item.name, description: item.description, price: item.price, category: item.category, image: item.image, order: item.order, active: item.active }); }).catch(() => {
      if (active) { setLoadFailed(true); setError('Não foi possível carregar o presente.'); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const change = <K extends keyof GiftInput>(key: K, value: GiftInput[K]) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => { event.preventDefault(); if (saving || uploading || loading || loadFailed) return; if (!form.name.trim() || !Number.isFinite(form.price) || form.price <= 0 || !Number.isSafeInteger(form.order) || form.order < 0) { setError('Revise nome, preço e ordem.'); return; } setSaving(true); setError(''); try { if (id) await giftsService.update(id, form); else await giftsService.create(form); onSaved(id ? 'Presente atualizado com sucesso.' : 'Presente cadastrado com sucesso.'); } catch { setError('Não foi possível salvar o presente.'); } finally { setSaving(false); } };
  return <CrudDialog busy={saving} onClose={onClose} title={id ? 'Editar presente' : 'Adicionar presente'}>
    {loading ? <CircularProgress aria-label="Carregando cadastro" /> : loadFailed ? <Alert severity="error">{error}</Alert> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(200px, 1fr)' }, gap: 3 }}><Paper component="form" onSubmit={submit} elevation={0} sx={{ py: 1 }}><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <TextField autoFocus label="Nome" required value={form.name} onChange={e => change('name', e.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField label="Preço (R$)" required type="number" value={form.price} onChange={e => change('price', Number(e.target.value))} slotProps={{ htmlInput: { min: .01, step: .01 } }} />
        <TextField label="Categoria" value={form.category} onChange={e => change('category', e.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} />
        <TextField label="Ordem" type="number" value={form.order} onChange={e => change('order', Number(e.target.value))} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
      </Box>
      <TextField label="Imagem (URL)" value={form.image.startsWith('/api/images/') ? '' : form.image} onChange={e => change('image', e.target.value)} helperText="Opcional: informe uma URL pública ou envie uma imagem abaixo." />
      <ImageUpload value={form.image ? [form.image] : []} category="gift" disabled={saving} onBusyChange={setUploading} onChange={images => change('image', images[0] || '')} />
      <TextField label="Descrição" multiline minRows={3} value={form.description} onChange={e => change('description', e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
      <FormControlLabel control={<Switch checked={form.active} onChange={e => change('active', e.target.checked)} />} label="Ativo" />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', pt: 2 }}><Button onClick={onClose} disabled={saving || uploading}>Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={saving || uploading}>{saving ? 'Salvando...' : 'Salvar'}</Button></Stack>
    </Stack></Paper><Card sx={{ alignSelf: 'start' }}><Typography sx={{ p: 2, fontWeight: 600 }}>Prévia do card público</Typography>{form.image && !form.image.startsWith('/api/images/') && <CardMedia component="img" image={resolveImageUrl(form.image)} alt={form.name || 'Imagem do presente'} sx={{ height: 180, objectFit: 'cover' }} />}<CardContent><Typography variant="h6">{form.name || 'Nome do presente'}</Typography><Typography color="primary.main" sx={{ fontWeight: 700 }}>{currency(Number.isFinite(form.price) ? form.price : 0)}</Typography></CardContent></Card></Box>}</CrudDialog>;
}
