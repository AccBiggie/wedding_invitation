import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Card, CardContent, CardMedia, CircularProgress, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import { PageHeader } from '../../components/common/PageHeader'; import { giftsService } from '../../services/gifts.service'; import type { GiftInput } from '../../types/api';

const blank: GiftInput = { name: '', description: '', price: 0, category: '', image: '', order: 0, active: true };
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export function GiftForm() {
  const { id } = useParams(); const navigate = useNavigate();
  const [form, setForm] = useState<GiftInput>(blank); const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (!id) return; giftsService.getById(id).then(item => setForm({ name: item.name, description: item.description, price: item.price, category: item.category, image: item.image, order: item.order, active: item.active })).catch(() => setError('Não foi possível carregar o presente.')).finally(() => setLoading(false)); }, [id]);
  const change = <K extends keyof GiftInput>(key: K, value: GiftInput[K]) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => { event.preventDefault(); if (saving) return; if (!form.name.trim() || !Number.isFinite(form.price) || form.price <= 0 || !Number.isSafeInteger(form.order) || form.order < 0) { setError('Revise nome, preço e ordem.'); return; } setSaving(true); setError(''); try { if (id) await giftsService.update(id, form); else await giftsService.create(form); navigate('/presentes', { state: { notice: id ? 'Presente atualizado com sucesso.' : 'Presente cadastrado com sucesso.' } }); } catch { setError('Não foi possível salvar o presente.'); } finally { setSaving(false); } };
  return <><PageHeader title={id ? 'Editar presente' : 'Adicionar presente'} subtitle="Gerencie os produtos disponíveis na lista de presentes." />
    {loading ? <CircularProgress /> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 2fr) minmax(250px, 1fr)' }, gap: 3 }}><Paper component="form" onSubmit={submit} sx={{ p: 3 }}><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <TextField label="Nome" required value={form.name} onChange={e => change('name', e.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField label="Preço (R$)" required type="number" value={form.price} onChange={e => change('price', Number(e.target.value))} slotProps={{ htmlInput: { min: .01, step: .01 } }} />
        <TextField label="Categoria" value={form.category} onChange={e => change('category', e.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} />
        <TextField label="Ordem" type="number" value={form.order} onChange={e => change('order', Number(e.target.value))} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
      </Box>
      <TextField label="Imagem (URL)" value={form.image} onChange={e => change('image', e.target.value)} helperText="Informe uma URL pública da imagem." />
      <TextField label="Descrição" multiline minRows={3} value={form.description} onChange={e => change('description', e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
      <FormControlLabel control={<Switch checked={form.active} onChange={e => change('active', e.target.checked)} />} label="Ativo" />
      <Stack direction="row" spacing={1}><Button onClick={() => navigate('/presentes')}>Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></Stack>
    </Stack></Paper><Card sx={{ alignSelf: 'start' }}><Typography sx={{ p: 2, fontWeight: 600 }}>Prévia do card público</Typography>{form.image && <CardMedia component="img" image={form.image} alt={form.name || 'Imagem do presente'} sx={{ height: 180, objectFit: 'cover' }} />}<CardContent><Typography variant="h6">{form.name || 'Nome do presente'}</Typography><Typography color="primary.main" sx={{ fontWeight: 700 }}>{currency(Number.isFinite(form.price) ? form.price : 0)}</Typography></CardContent></Card></Box>}</>;
}
