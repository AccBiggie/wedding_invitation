import { useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Alert, Box, Button, CircularProgress, LinearProgress, Stack, Typography } from '@mui/material';
import CloudUploadOutlined from '@mui/icons-material/CloudUploadOutlined';
import { imagesService, resolveImageUrl, type ImageCategory } from '../../services/images.service';

interface ImageUploadProps {
  value: string[];
  category: ImageCategory;
  maxImages?: number;
  disabled?: boolean;
  onChange: (images: string[]) => void;
  onBusyChange?: (busy: boolean) => void;
}

export function ImageUpload({ value, category, maxImages = 1, disabled = false, onChange, onBusyChange }: ImageUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [preview, setPreview] = useState<Record<string, string>>({});
  const previews = useRef<string[]>([]);
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
  const onInput = (event: ChangeEvent<HTMLInputElement>) => { void select(Array.from(event.target.files || [])); event.target.value = ''; };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); void select(Array.from(event.dataTransfer.files)); };
  return <Stack spacing={1}>
    <Box onDragOver={event => event.preventDefault()} onDrop={onDrop} role="button" tabIndex={disabled ? -1 : 0} aria-label="Selecionar imagens" onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); input.current?.click(); } }} onClick={() => input.current?.click()} sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 2, textAlign: 'center', cursor: disabled ? 'default' : 'pointer' }}>
      <CloudUploadOutlined color="primary" /><Typography>Arraste imagens ou clique para selecionar</Typography><Typography variant="caption" color="text.secondary">JPG, PNG ou WebP • até {maxSize} MB • máximo {maxImages}</Typography>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={maxImages > 1} disabled={disabled || busy} onChange={onInput} style={{ display: 'none' }} />
    </Box>
    {busy && <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><CircularProgress size={18} /><Box sx={{ flex: 1 }}><LinearProgress variant="determinate" value={progress} aria-label="Progresso do envio" /></Box><Typography variant="caption">{progress}%</Typography></Stack>}
    {error && <Alert severity="error" role="alert">{error}</Alert>}{success && <Alert severity="success" role="status">{success}</Alert>}
    {value.length > 0 && <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>{value.map((url, index) => <Box key={`${index}-${url.slice(0, 50)}`} sx={{ width: 120 }}><Box component="img" src={preview[url] || resolveImageUrl(url)} loading="lazy" alt={`Imagem ${index + 1}`} sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2 }} /><Typography variant="caption" sx={{ display: 'block' }}>{index === 0 ? 'Principal' : `Imagem ${index + 1}`}</Typography><Button size="small" disabled={disabled || busy} onClick={() => onChange(value.filter((_, position) => position !== index))}>Remover</Button></Box>)}</Box>}
  </Stack>;
}
