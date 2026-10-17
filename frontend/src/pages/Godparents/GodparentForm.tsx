import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField } from '@mui/material';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import { PageHeader } from '../../components/common/PageHeader';
import { godparentsService } from '../../services/godparents.service';
import type { GodparentInput } from '../../types/api';

const roles = [{ value: 'groomsman', label: 'Padrinho' }, { value: 'bridesmaid', label: 'Madrinha' }, { value: 'mother', label: 'Mãe' }, { value: 'father', label: 'Pai' }, { value: 'other', label: 'Outro' }];
const blank: GodparentInput = { name: '', role: 'groomsman', phone: '', email: '', description: '', image: '', order: 0, active: true };

export function GodparentForm() {
  const { id } = useParams(); const navigate = useNavigate();
  const [form, setForm] = useState<GodparentInput>(blank);
  const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  useEffect(() => { if (!id) return; godparentsService.getById(id).then(item => setForm({ name: item.name, role: item.role, phone: item.phone, email: item.email, description: item.description, image: item.image, order: item.order, active: item.active })).catch(() => setError('Não foi possível carregar o padrinho.')).finally(() => setLoading(false)); }, [id]);
  const change = <K extends keyof GodparentInput>(key: K, value: GodparentInput[K]) => setForm(current => ({ ...current, [key]: value }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (saving) return;
    if (!form.name.trim() || !Number.isSafeInteger(form.order) || form.order < 0 || (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))) { setError('Revise nome, e-mail e ordem.'); return; }
    setSaving(true); setError('');
    try { if (id) await godparentsService.update(id, form); else await godparentsService.create(form); navigate('/padrinhos', { state: { notice: id ? 'Padrinho atualizado com sucesso.' : 'Padrinho cadastrado com sucesso.' } }); }
    catch { setError('Não foi possível salvar o padrinho.'); } finally { setSaving(false); }
  };
  return <><PageHeader title={id ? 'Editar padrinho' : 'Adicionar padrinho'} subtitle="Gerencie as pessoas especiais que farão parte do casamento." />
    {loading ? <CircularProgress /> : <Paper component="form" onSubmit={submit} sx={{ p: 3, maxWidth: 850 }}><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <TextField label="Nome" required value={form.name} onChange={e => change('name', e.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField select label="Função" required value={form.role} onChange={e => change('role', e.target.value as GodparentInput['role'])}>{roles.map(role => <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>)}</TextField>
        <TextField label="Telefone" value={form.phone} onChange={e => change('phone', e.target.value)} slotProps={{ htmlInput: { maxLength: 30 } }} />
        <TextField label="E-mail" type="email" value={form.email} onChange={e => change('email', e.target.value)} />
        <TextField label="Imagem (URL)" value={form.image} onChange={e => change('image', e.target.value)} helperText="Informe uma URL pública da imagem." />
        <TextField label="Ordem" type="number" value={form.order} onChange={e => change('order', Number(e.target.value))} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
      </Box>
      {form.image && <Box component="img" src={form.image} alt="Prévia do padrinho" sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2 }} />}
      <TextField label="Descrição" multiline minRows={3} value={form.description} onChange={e => change('description', e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
      <FormControlLabel control={<Switch checked={form.active} onChange={e => change('active', e.target.checked)} />} label="Ativo" />
      <Stack direction="row" spacing={1}><Button onClick={() => navigate('/padrinhos')}>Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</Button></Stack>
    </Stack></Paper>}</>;
}
