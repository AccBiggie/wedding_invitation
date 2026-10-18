import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { Alert, Box, Button, Card, CardContent, CardMedia, CircularProgress, FormControlLabel, MenuItem, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import SaveOutlined from '@mui/icons-material/SaveOutlined';
import { ImageUpload } from '../../components/common/ImageUpload';
import { resolveImageUrl } from '../../services/images.service';
import { formatMoneyInput, formatMoneyValue, parseMoneyInput } from '../../utils/money';
import { CrudDialog } from '../../components/common/CrudDialog'; import { giftsService } from '../../services/gifts.service'; import { storeCategoriesService } from '../../services/storeCategories.service'; import type { GiftInput, StoreCategory } from '../../types/api';

const blank: GiftInput = { name: '', description: '', price: 0, categoryId: '', image: '', images: [], storeUrl: '', order: 0, active: true };
const MAX_IMAGES = 10;
const validStoreUrl = (value: string) => !value || /^https?:\/\/\S+$/i.test(value);
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export function GiftForm({ id, onClose, onSaved }: { id?: string; onClose: () => void; onSaved: (notice: string) => void }) {
  const [form, setForm] = useState<GiftInput>(blank); const [loadFailed, setLoadFailed] = useState(false);
  const [priceText, setPriceText] = useState('');
  const [categories, setCategories] = useState<StoreCategory[] | null>(null); const [legacyCategory, setLegacyCategory] = useState('');
  const [savedCategoryId, setSavedCategoryId] = useState('');
  useEffect(() => { storeCategoriesService.listAll().then(setCategories).catch(() => setCategories([])); }, []);
  const [loading, setLoading] = useState(Boolean(id)); const [saving, setSaving] = useState(false); const [uploading, setUploading] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!id) return;
    let active = true;
    giftsService.getById(id).then(item => { if (active) { setForm({ name: item.name, description: item.description, price: item.price, categoryId: item.categoryId || '', image: item.image, images: item.images || [], storeUrl: item.storeUrl || '', order: item.order, active: item.active }); setPriceText(formatMoneyValue(item.price)); setSavedCategoryId(item.categoryId || ''); setLegacyCategory(item.legacyCategory || ''); } }).catch(() => {
      if (active) { setLoadFailed(true); setError('Não foi possível carregar o presente.'); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  const change = <K extends keyof GiftInput>(key: K, value: GiftInput[K]) => setForm(current => ({ ...current, [key]: value }));
  // A primeira foto e a principal (card e capa da galeria); as demais vao para images.
  const photos = [form.image, ...form.images].filter(Boolean);
  const setPhotos = (images: string[]) => setForm(current => ({ ...current, image: images[0] || '', images: images.slice(1) }));
  const changePrice = (value: string) => { const masked = formatMoneyInput(value); setPriceText(masked); change('price', parseMoneyInput(masked)); };
  const submit = async (event: FormEvent) => { event.preventDefault(); if (saving || uploading || loading || loadFailed) return; if (!form.name.trim() || !Number.isFinite(form.price) || form.price <= 0 || !form.categoryId || !Number.isSafeInteger(form.order) || form.order < 0) { setError('Revise nome, preço, categoria e ordem.'); return; } if (!validStoreUrl(form.storeUrl.trim())) { setError('Informe o link da loja começando com http:// ou https://.'); return; } setSaving(true); setError(''); try { if (id) await giftsService.update(id, form); else await giftsService.create(form); onSaved(id ? 'Presente atualizado com sucesso.' : 'Presente cadastrado com sucesso.'); } catch (reason) { const message = axios.isAxiosError<{ errors?: Record<string, string[]> }>(reason) ? (reason.response?.data?.errors?.categoryId || reason.response?.data?.errors?.storeUrl || reason.response?.data?.errors?.images)?.[0] : undefined; setError(message || 'Não foi possível salvar o presente.'); } finally { setSaving(false); } };
  return <CrudDialog busy={saving} onClose={onClose} title={id ? 'Editar presente' : 'Adicionar presente'}>
    {loading ? <CircularProgress aria-label="Carregando cadastro" /> : loadFailed ? <Alert severity="error">{error}</Alert> : <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 2fr) minmax(200px, 1fr)' }, gap: 3 }}><Paper component="form" onSubmit={submit} elevation={0} sx={{ py: 1 }}><Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <TextField autoFocus label="Nome" required value={form.name} onChange={e => change('name', e.target.value)} slotProps={{ htmlInput: { maxLength: 120 } }} />
        <TextField label="Preço (R$)" required type="text" value={priceText} onChange={e => changePrice(e.target.value)} slotProps={{ htmlInput: { inputMode: 'decimal', placeholder: '0,00' } }} />
        {/* Categorias inativas ficam visiveis mas so podem continuar no produto que ja as usa. */}
        <TextField select label="Categoria" required value={categories ? form.categoryId : ''} onChange={e => change('categoryId', e.target.value)} disabled={!categories} error={categories?.length === 0} helperText={!categories ? 'Carregando categorias...' : categories.length === 0 ? 'Cadastre uma categoria em Categorias da loja.' : legacyCategory && !form.categoryId ? `Categoria anterior: ${legacyCategory}` : undefined}>
          {(categories || []).map(category => <MenuItem key={category._id} value={category._id} disabled={!category.active && category._id !== savedCategoryId}>{category.name}{category.active ? '' : ' (inativa)'}</MenuItem>)}
        </TextField>
        <TextField label="Ordem" type="number" value={form.order} onChange={e => change('order', Number(e.target.value))} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
      </Box>
      <TextField label="Link do produto na loja" type="url" value={form.storeUrl} onChange={e => change('storeUrl', e.target.value)} error={!validStoreUrl(form.storeUrl.trim())} helperText={validStoreUrl(form.storeUrl.trim()) ? 'Opcional: exibe o botão “Ver produto na loja” no presente.' : 'O link deve começar com http:// ou https://.'} placeholder="https://www.loja.com.br/produto" slotProps={{ htmlInput: { maxLength: 2048 } }} />
      <Box><Typography variant="subtitle2">Imagens</Typography><Typography variant="caption" color="text.secondary">Até {MAX_IMAGES}, por upload ou por link. A principal (primeira) aparece no card; todas aparecem na galeria do “Ver presente”.</Typography></Box>
      <ImageUpload value={photos} category="gift" maxImages={MAX_IMAGES} allowUrls reorderable disabled={saving} onBusyChange={setUploading} onChange={setPhotos} />
      <TextField label="Descrição" multiline minRows={3} value={form.description} onChange={e => change('description', e.target.value)} slotProps={{ htmlInput: { maxLength: 1000 } }} />
      <FormControlLabel control={<Switch checked={form.active} onChange={e => change('active', e.target.checked)} />} label="Ativo" />
      <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end', pt: 2 }}><Button onClick={onClose} disabled={saving || uploading}>Cancelar</Button><Button type="submit" variant="contained" startIcon={<SaveOutlined />} disabled={saving || uploading}>{saving ? 'Salvando...' : 'Salvar'}</Button></Stack>
    </Stack></Paper><Card sx={{ alignSelf: 'start' }}><Typography sx={{ p: 2, fontWeight: 600 }}>Prévia do card público</Typography>{form.image && !form.image.startsWith('/api/images/') && <CardMedia component="img" image={resolveImageUrl(form.image)} alt={form.name || 'Imagem do presente'} sx={{ height: 180, objectFit: 'cover' }} />}<CardContent><Typography variant="h6">{form.name || 'Nome do presente'}</Typography><Typography color="primary.main" sx={{ fontWeight: 700 }}>{currency(Number.isFinite(form.price) ? form.price : 0)}</Typography></CardContent></Card></Box>}</CrudDialog>;
}
