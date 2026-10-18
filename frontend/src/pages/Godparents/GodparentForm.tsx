import { useEffect, useState, type FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField } from '@mui/material';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import { CrudDialog } from '../../components/common/CrudDialog';
import { godparentsService } from '../../services/godparents.service';
import type { GodparentInput } from '../../types/api';
import { ImageUpload } from '../../components/common/ImageUpload';

const roles = [{ value: 'groomsman', label: 'Padrinho' }, { value: 'bridesmaid', label: 'Madrinha' }, { value: 'mother', label: 'Mãe' }, { value: 'father', label: 'Pai' }, { value: 'other', label: 'Outro' }];
const blank: GodparentInput = { name: '', partnerName: '', role: 'groomsman', cardRole: '', phone: '', email: '', description: '', image: '', images: [], order: 0, active: true };
export function GodparentForm({ id, onClose, onSaved }: { id?: string; onClose: () => void; onSaved: (notice: string) => void }) {
  const [form, setForm] = useState<GodparentInput>(blank);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!id) return;
    let active = true;
    godparentsService.getById(id).then(item => { if (active) setForm({ name: item.name, partnerName: item.partnerName || '', role: item.role, cardRole: item.cardRole || '', phone: item.phone, email: item.email, description: item.description, image: item.image, images: item.images || [], order: item.order, active: item.active }); }).catch(() => {
      if (active) { setLoadFailed(true); setError('Não foi possível carregar o padrinho.'); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const change = <K extends keyof GodparentInput>(key: K, value: GodparentInput[K]) => setForm(current => ({ ...current, [key]: value }));
  const photos = [form.image, ...form.images].filter(Boolean);
  const setPhotos = (images: string[]) => setForm(current => ({ ...current, image: images[0] || '', images: images.slice(1) }));
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (saving || uploading || loading || loadFailed) return;
    if (!form.name.trim() || form.partnerName.length > 120 || form.cardRole.length > 120 || !Number.isSafeInteger(form.order) || form.order < 0 || (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))) { setError('Revise nomes, legenda, e-mail e ordem.'); return; }
    setSaving(true); setError('');
    try { if (id) await godparentsService.update(id, form); else await godparentsService.create(form); onSaved(id ? 'Padrinho atualizado com sucesso.' : 'Padrinho cadastrado com sucesso.'); }
    catch { setError('Não foi possível salvar o padrinho.'); } finally { setSaving(false); }
  };
  return <CrudDialog busy={saving} onClose={onClose} title={id ? 'Editar padrinho' : 'Adicionar padrinho'}>
    {loading ? <CircularProgress aria-label="Carregando cadastro" /> : loadFailed ? <Alert severity="error">{error}</Alert> : <Paper component="form" onSubmit={submit} elevation={0} sx={{ py: 1 }}><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <TextField autoFocus label="Primeiro nome no card" required value={form.name} onChange={e => change('name', e.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField label="Segundo nome no card" value={form.partnerName} onChange={e => change('partnerName', e.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField select label="Função" required value={form.role} onChange={e => change('role', e.target.value as GodparentInput['role'])}>{roles.map(role => <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>)}</TextField>
        <TextField label="Legenda do card" value={form.cardRole} onChange={e => change('cardRole', e.target.value)} helperText="Ex.: Padrinhos da noiva. Em branco, usa a função." slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField label="Telefone" value={form.phone} onChange={e => change('phone', e.target.value)} slotProps={{ htmlInput: { maxLength: 30 } }} />
        <TextField label="E-mail" type="email" value={form.email} onChange={e => change('email', e.target.value)} />
        <TextField label="Foto do card (URL)" value={form.image.startsWith('data:') || form.image.startsWith('/api/images/') ? '' : form.image} onChange={e => change('image', e.target.value)} helperText="Opcional: informe uma URL pública ou envie imagens abaixo." />
        <TextField label="Ordem" type="number" value={form.order} onChange={e => change('order', Number(e.target.value))} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
      </Box>
      <ImageUpload value={photos} category="godparent" maxImages={5} disabled={saving} onBusyChange={setUploading} onChange={setPhotos} />
      <TextField label="Descrição" multiline minRows={3} value={form.description} onChange={e => change('description', e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
      <FormControlLabel control={<Switch checked={form.active} onChange={e => change('active', e.target.checked)} />} label="Ativo" />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', pt: 2 }}><Button onClick={onClose} disabled={saving || uploading}>Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={saving || uploading}>{saving ? 'Salvando...' : 'Salvar'}</Button></Stack>
    </Stack></Paper>}</CrudDialog>;
}
