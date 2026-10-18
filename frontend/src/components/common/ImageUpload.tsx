import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from 'react';
import { Alert, Box, Button, CircularProgress, IconButton, LinearProgress, Stack, TextField, Tooltip, Typography } from '@mui/material';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import StarBorderOutlined from '@mui/icons-material/StarBorderOutlined';
import AddLink from '@mui/icons-material/AddLink';
import BrokenImageOutlined from '@mui/icons-material/BrokenImageOutlined';
import { imagesService, resolveImageUrl, type ImageCategory } from '../../services/images.service';

interface ImageUploadProps {
  value: string[];
  category: ImageCategory;
  maxImages?: number;
  disabled?: boolean;
  onChange: (images: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
  /** Permite incluir imagens por URL publica (uma ou varias, uma por linha). */
  allowUrls?: boolean;
  /** Mostra os controles para mover as imagens e escolher a principal (a primeira). */
  reorderable?: boolean;
}
const validUrl = (value: string) => value.length <= 2048 && /^https?:\/\/\S+$/i.test(value);

export function ImageUpload({ value, category, maxImages = 1, disabled = false, onChange, onBusyChange, allowUrls = false, reorderable = false }: ImageUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState<Record<string, string>>({});
  const previews = useRef<string[]>([]);
  const [urlText, setUrlText] = useState(''); const [broken, setBroken] = useState<Record<string, boolean>>({});
  useEffect(() => () => { previews.current.forEach(URL.revokeObjectURL); }, []);
  const maxSize = category === 'gallery' ? 10 : 5;
  const select = async (files: File[]) => {
    if (busy || disabled || !files.length) return;
    if (value.length + files.length > maxImages && !(maxImages === 1 && files.length === 1)) { setError(`Selecione no máximo ${maxImages} imagem(ns).`); return; }
    setError(''); setSuccess(''); setBusy(true); onBusyChange?.(true);
    let next = maxImages === 1 ? [] : [...value];
    try {
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size === 0 || file.size > maxSize * 1024 * 1024) throw new Error(`Escolha JPG, PNG ou WebP de até ${maxSize} MB.`);
        const image = await imagesService.upload(file, category, setProgress);
        const local = URL.createObjectURL(file);
        previews.current.push(local);
        setPreview(current => ({ ...current, [image.url]: local }));
        next = [...next, image.url]; onChange(next);
      }
      setSuccess('Imagem enviada. Salve o cadastro para concluir.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Não foi possível enviar a imagem.');
    } finally { setBusy(false); onBusyChange?.(false); setProgress(0); }
  };
  const addUrls = () => {
    const urls = urlText.split(/\s+/).map(item => item.trim()).filter(Boolean);
    if (!urls.length) return;
    const invalid = urls.filter(url => !validUrl(url));
    if (invalid.length) { setSuccess(''); setError(`Link inválido: ${invalid[0].slice(0, 80)}. Use endereços começando com http:// ou https://.`); return; }
    const fresh = urls.filter((url, index) => !value.includes(url) && urls.indexOf(url) === index);
    if (maxImages === 1) { onChange(fresh.length ? [fresh[0]] : value); setUrlText(''); setError(''); return; }
    if (value.length + fresh.length > maxImages) { setSuccess(''); setError(`Selecione no máximo ${maxImages} imagem(ns). Restam ${Math.max(0, maxImages - value.length)}.`); return; }
    onChange([...value, ...fresh]); setUrlText(''); setError('');
    setSuccess(fresh.length ? `${fresh.length} imagem(ns) adicionada(s). Salve o cadastro para concluir.` : 'Essas imagens já estavam na lista.');
  };
  const onUrlKey = (event: KeyboardEvent) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); addUrls(); } };
  const move = (from: number, to: number) => { if (to < 0 || to >= value.length) return; const next = [...value]; const [item] = next.splice(from, 1); next.splice(to, 0, item); onChange(next); };
  const onInput = (event: ChangeEvent<HTMLInputElement>) => { void select(Array.from(event.target.files || [])); event.target.value = ''; };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); void select(Array.from(event.dataTransfer.files)); };
  return <Stack spacing={1}>
    <Box onDragOver={event => event.preventDefault()} onDrop={onDrop} role="button" tabIndex={disabled ? -1 : 0} aria-label="Selecionar imagens" onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.current?.click(); } }} onClick={() => input.current?.click()} sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 2, textAlign: 'center', cursor: disabled ? 'default' : 'pointer' }}>
      <CloudUploadOutlined color="primary" /><Typography>Arraste imagens ou clique para selecionar</Typography><Typography variant="caption" color="text.secondary">JPG, PNG ou WebP • até {maxSize} MB • máximo {maxImages}{maxImages > 1 ? ` • ${value.length} de ${maxImages}` : ''}</Typography>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={maxImages > 1} disabled={disabled || busy} onChange={onInput} style={{ display: 'none' }} />
    </Box>
    {allowUrls && <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ alignItems: { sm: 'flex-start' } }}>
      <TextField size="small" fullWidth multiline maxRows={4} label="Adicionar imagem por URL" placeholder="https://… (cole um ou vários links, um por linha)" value={urlText} onChange={event => setUrlText(event.target.value)} onKeyDown={onUrlKey} disabled={disabled || busy || (maxImages > 1 && value.length >= maxImages)} helperText="Enter adiciona; Shift+Enter quebra a linha." />
      <Button variant="outlined" startIcon={<AddLink />} onClick={addUrls} disabled={disabled || busy || !urlText.trim()} sx={{ flexShrink: 0, height: 40 }}>Adicionar</Button>
    </Stack>}
    {busy && <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={18} /><Box sx={{ flex: 1 }}><LinearProgress variant="determinate" value={progress} aria-label="Progresso do envio" /></Box><Typography variant="caption">{progress}%</Typography></Stack>}
    {error && <Alert severity="error" role="alert">{error}</Alert>}{success && <Alert severity="success" role="status">{success}</Alert>}
    {value.length > 0 && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>{value.map((url, index) => <Box key={`${index}-${url.slice(0, 50)}`} sx={{ width: 120 }}>{broken[url] ? <Box role="img" aria-label={`Imagem ${index + 1} não carregou`} title={url} sx={{ width: 120, height: 120, borderRadius: 2, bgcolor: 'action.hover', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: .5, color: 'text.secondary', textAlign: 'center', p: 1 }}><BrokenImageOutlined /><Typography variant="caption">Não carregou</Typography></Box> : <Box component="img" src={preview[url] || resolveImageUrl(url)} loading="lazy" alt={`Imagem ${index + 1}`} onError={() => setBroken(current => ({ ...current, [url]: true }))} sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2, outline: reorderable && index === 0 ? '2px solid' : 'none', outlineColor: 'primary.main', outlineOffset: 2 }} />}<Typography variant="caption" sx={{ display: 'block', fontWeight: index === 0 ? 600 : 400 }}>{index === 0 ? 'Principal' : `Imagem ${index + 1}`}</Typography>
      {reorderable && value.length > 1 && <Stack direction="row" sx={{ alignItems: 'center' }}><Tooltip title="Mover para a esquerda"><span><IconButton size="small" aria-label={`Mover imagem ${index + 1} para a esquerda`} disabled={disabled || busy || index === 0} onClick={() => move(index, index - 1)}><ChevronLeft fontSize="small" /></IconButton></span></Tooltip><Tooltip title="Tornar principal"><span><IconButton size="small" aria-label={`Tornar a imagem ${index + 1} principal`} disabled={disabled || busy || index === 0} onClick={() => move(index, 0)}><StarBorderOutlined fontSize="small" /></IconButton></span></Tooltip><Tooltip title="Mover para a direita"><span><IconButton size="small" aria-label={`Mover imagem ${index + 1} para a direita`} disabled={disabled || busy || index === value.length - 1} onClick={() => move(index, index + 1)}><ChevronRight fontSize="small" /></IconButton></span></Tooltip></Stack>}
      <Button size="small" disabled={disabled || busy} onClick={() => onChange(value.filter((_, position) => position !== index))}>Remover</Button></Box>)}</Box>}
  </Stack>;
}
