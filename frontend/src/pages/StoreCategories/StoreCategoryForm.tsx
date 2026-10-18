import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { Alert, Box, Button, Card, CardContent, CircularProgress, FormControlLabel, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import { ImageUpload } from '../../components/common/ImageUpload';
import { resolveImageUrl } from '../../services/images.service';
import { CrudDialog } from '../../components/common/CrudDialog'; import { storeCategoriesService } from '../../services/storeCategories.service'; import type { StoreCategoryInput } from '../../types/api';

type Field = 'name' | 'description' | 'image' | 'order';
const blank: StoreCategoryInput = { name: '', description: '', image: '', order: 0, active: true };
const validate = (form: StoreCategoryInput) => {
  const errors: Partial<Record<Field, string>> = {};
  if (!form.name.trim()) errors.name = 'Informe o nome da categoria.';
  if (!form.description.trim()) errors.description = 'Informe a descrição da categoria.';
  if (!form.image) errors.image = 'Envie uma imagem ou informe uma URL.';
  if (!Number.isSafeInteger(form.order) || form.order < 0) errors.order = 'A ordem deve ser um número inteiro a partir de 0.';
  return errors;
};
export function StoreCategoryForm({ id, onClose, onSaved }: { id?: string; onClose: () => void; onSaved: (notice: string) => void }) {
  const [form, setForm] = useState<StoreCategoryInput>(blank); const [loadFailed, setLoadFailed] = useState(false);
  const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState('');
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({}); const [submitted, setSubmitted] = useState(false);
  const [details, setDetails] = useState<{ slug: string; productCount: number } | null>(null); const navigate = useNavigate();
  useEffect(() => {
    if (!id) return;
    let active = true;
    storeCategoriesService.getById(id).then(item => { if (active) { setForm({ name: item.name, description: item.description, image: item.image, order: item.order, active: item.active }); setDetails({ slug: item.slug, productCount: item.productCount }); } }).catch(() => {
      if (active) { setLoadFailed(true); setError('Não foi possível carregar a categoria.'); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const change = <K extends keyof StoreCategoryInput>(key: K, value: StoreCategoryInput[K]) => setForm(current => { const next = { ...current, [key]: value }; if (submitted) setErrors(validate(next)); return next; });
  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (saving || uploading || loading || loadFailed) return;
    setSubmitted(true); const found = validate(form); setErrors(found);
    if (Object.keys(found).length) { setError('Revise os campos destacados.'); return; }
    setSaving(true); setError('');
    try { if (id) await storeCategoriesService.update(id, form); else await storeCategoriesService.create(form); onSaved(id ? 'Categoria atualizada com sucesso.' : 'Categoria cadastrada com sucesso.'); }
    catch (reason) {
      // O backend devolve os erros por campo (422); mostramos cada um no seu input.
      const server = axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(reason) ? reason.response?.data : undefined;
      if (server?.errors) setErrors(Object.fromEntries(Object.entries(server.errors).map(([key, value]) => [key, value[0]])));
      setError(server?.errors ? 'Revise os campos destacados.' : server?.message || 'Não foi possível salvar a categoria.');
    } finally { setSaving(false); }
  };
  const external = form.image && !form.image.startsWith('/api/images/') ? form.image : '';
  return <CrudDialog busy={saving} onClose={onClose} title={id ? 'Editar categoria' : 'Adicionar categoria'}>
    {loading ? <CircularProgress aria-label="Carregando cadastro" /> : loadFailed ? <Alert severity="error">{error}</Alert> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(200px, 1fr)' }, gap: 3 }}><Paper component="form" onSubmit={submit} noValidate elevation={0} sx={{ py: 1 }}><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}>
        <TextField autoFocus label="Nome" required value={form.name} onChange={e => change('name', e.target.value)} error={Boolean(errors.name)} helperText={errors.name} slotProps={{ htmlInput: { maxLength: 80 } }} />
        <TextField label="Ordem" type="number" value={form.order} onChange={e => change('order', Number(e.target.value))} error={Boolean(errors.order)} helperText={errors.order || 'Menor número aparece primeiro.'} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
      </Box>
      <TextField label="Descrição" required multiline minRows={3} value={form.description} onChange={e => change('description', e.target.value)} error={Boolean(errors.description)} helperText={errors.description || `${form.description.length}/500`} slotProps={{ htmlInput: { maxLength: 500 } }} />
      <TextField label="Imagem (URL)" required value={external} onChange={e => change('image', e.target.value)} error={Boolean(errors.image)} helperText={errors.image || 'Informe uma URL pública ou envie uma imagem abaixo. Prefira imagens quadradas.'} />
      <ImageUpload value={form.image ? [form.image] : []} category="storeCategory" disabled={saving} onBusyChange={setUploading} onChange={images => change('image', images[0] || '')} />
      <FormControlLabel control={<Switch checked={form.active} onChange={e => change('active', e.target.checked)} />} label="Ativa (exibida na landing page)" />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', pt: 2 }}><Button onClick={onClose} disabled={saving || uploading}>Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={saving || uploading}>{saving ? 'Salvando...' : 'Salvar'}</Button></Stack>
    </Stack></Paper><Card sx={{ alignSelf: 'start' }}><Typography sx={{ p: 2, fontWeight: 600 }}>Prévia na landing</Typography><CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.2 }}>
      <Box sx={{ width: 112, height: 112, p: '5px', borderRadius: '50%', border: '1px solid #e7ddc4', bgcolor: '#fffdf9', boxShadow: '0 4px 14px rgba(150,120,50,.12)' }}>{form.image ? <Box component="img" src={resolveImageUrl(form.image)} alt={form.name || 'Imagem da categoria'} sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }} /> : <Box sx={{ width: '100%', height: '100%', borderRadius: '50%', bgcolor: '#f4f0e7' }} />}</Box>
      <Typography sx={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontSize: 20, color: '#1f4536' }}>{form.name || 'Nome da categoria'}</Typography>
      {!form.active && <Typography variant="caption" color="text.secondary">Inativa: não aparece na landing.</Typography>}
    </CardContent>{details && <CardContent sx={{ borderTop: 1, borderColor: 'divider' }}><Stack spacing={1}>
      <Typography variant="body2">Produtos vinculados: <strong>{details.productCount}</strong></Typography>
      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>Página pública: /lista-na-loja/{details.slug}</Typography>
      <Button size="small" variant="outlined" startIcon={<Inventory2Outlined />} disabled={saving} onClick={() => navigate(`/presentes?categoryId=${id}`)}>Ver produtos desta categoria</Button>
    </Stack></CardContent>}</Card></Box>}</CrudDialog>;
}
