import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import { CrudDialog } from '../../components/common/CrudDialog';
import { godparentsService } from '../../services/godparents.service';
import type { GodparentInput } from '../../types/api';

const roles = [{ value: 'groomsman', label: 'Padrinho' }, { value: 'bridesmaid', label: 'Madrinha' }, { value: 'mother', label: 'Mãe' }, { value: 'father', label: 'Pai' }, { value: 'other', label: 'Outro' }];
const blank: GodparentInput = { name: '', partnerName: '', role: 'groomsman', cardRole: '', phone: '', email: '', description: '', image: '', images: [], order: 0, active: true };
const prepareImage = (file: File): Promise<string> => new Promise((resolve, reject) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) return reject(new Error('Escolha uma imagem JPG, PNG ou WebP de até 8 MB.'));
  const url = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    URL.revokeObjectURL(url);
    try {
      const scale = Math.min(1, 480 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Não foi possível processar a imagem.');
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      let result = canvas.toDataURL('image/webp', .82);
      if (result.length > 200000) result = canvas.toDataURL('image/jpeg', .65);
      if (result.length > 200000) throw new Error('A imagem é grande demais após o processamento.');
      resolve(result);
    } catch (reason) { reject(reason); }
  };
  image.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Não foi possível abrir a imagem.')); };
  image.src = url;
});

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
  const selectImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []); event.target.value = '';
    if (!files.length) return;
    if (Number(Boolean(form.image)) + form.images.length + files.length > 5) { setError('Selecione no máximo cinco imagens.'); return; }
    setUploading(true); setError('');
    try {
      const selected = await Promise.all(files.map(prepareImage));
      setForm(current => {
        const photos = [current.image, ...current.images, ...selected].filter(Boolean);
        return { ...current, image: photos[0] || '', images: photos.slice(1) };
      });
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível processar a imagem.'); }
    finally { setUploading(false); }
  };
  const removeImage = (index: number) => setForm(current => {
    const photos = [current.image, ...current.images].filter(Boolean);
    photos.splice(index, 1);
    return { ...current, image: photos[0] || '', images: photos.slice(1) };
  });
  const photos = [form.image, ...form.images].filter(Boolean);
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
        <TextField label="Foto do card (URL)" value={form.image.startsWith('data:') ? '' : form.image} onChange={e => change('image', e.target.value)} helperText={form.image.startsWith('data:') ? 'Imagem selecionada do seu dispositivo.' : 'Informe uma URL pública ou selecione uma imagem abaixo.'} />
        <TextField label="Ordem" type="number" value={form.order} onChange={e => change('order', Number(e.target.value))} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
      </Box>
      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Button component="label" variant="outlined" disabled={uploading || saving || photos.length >= 5}>{uploading ? 'Processando imagens...' : 'Escolher imagens'}<Box component="input" type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={selectImage} sx={{ position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' }} /></Button><Typography variant="body2" color="text.secondary">Até 5 imagens. A primeira é a foto do card público.</Typography></Stack>
      {photos.length > 0 && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>{photos.map((photo, index) => <Box key={`${index}-${photo.slice(0, 32)}`} sx={{ width: 120 }}><Box component="img" src={photo} alt={`Prévia ${index + 1} do padrinho`} sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2 }} /><Typography variant="caption" sx={{ display: 'block' }}>{index === 0 ? 'Principal' : `Imagem ${index + 1}`}</Typography><Button size="small" onClick={() => removeImage(index)} disabled={uploading || saving}>Remover</Button></Box>)}</Box>}
      <TextField label="Descrição" multiline minRows={3} value={form.description} onChange={e => change('description', e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
      <FormControlLabel control={<Switch checked={form.active} onChange={e => change('active', e.target.checked)} />} label="Ativo" />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', pt: 2 }}><Button onClick={onClose} disabled={saving || uploading}>Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={saving || uploading}>{saving ? 'Salvando...' : 'Salvar'}</Button></Stack>
    </Stack></Paper>}</CrudDialog>;
}
