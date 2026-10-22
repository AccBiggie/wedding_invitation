import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { Alert, Box, Button, DialogActions, Stack, TextField, Typography } from '@mui/material';
import { CrudDialog } from '../../components/common/CrudDialog';
import { ImageUpload } from '../../components/common/ImageUpload';
import api from '../../services/api';
import type { InvitationCard } from '../../invite-print/inviteData';

type Editable = Pick<InvitationCard, 'siteUrl' | 'greeting' | 'intro' | 'place' | 'address' | 'qrText' | 'photo'>;
const FIELDS: { key: Exclude<keyof Editable, 'photo'>; label: string; max: number; help?: string; multiline?: boolean }[] = [
  { key: 'siteUrl', label: 'Endereço do site', max: 200, help: 'Domínio usado nos links e QR codes dos convites, como https://seu-site.com.br. Um link já impresso usa o domínio da época da impressão.' },
  { key: 'greeting', label: 'Saudação', max: 60, help: 'Vem antes do nome do convite, como "Querido(a) Família Silva".' },
  { key: 'intro', label: 'Texto do convite', max: 400, multiline: true },
  { key: 'place', label: 'Local', max: 120 },
  { key: 'address', label: 'Endereço do local', max: 160 },
  { key: 'qrText', label: 'Texto junto do QR code', max: 120 }
];

export function InvitationCardSettingsDialog({ card, onClose, onSaved }: { card: InvitationCard; onClose: () => void; onSaved: (card: InvitationCard) => void }) {
  const [form, setForm] = useState<Editable>({ siteUrl: card.siteUrl, greeting: card.greeting, intro: card.intro, place: card.place, address: card.address, qrText: card.qrText, photo: card.photo });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const date = `${String(card.date.dia).padStart(2, '0')}/${String(card.date.mes).padStart(2, '0')}/${card.date.ano}`;

  const submit = async (event: FormEvent) => {
    event.preventDefault(); if (saving || uploading) return;
    setSaving(true); setError(''); setFieldErrors({});
    try {
      const response = await api.put<{ data: InvitationCard }>('/invitation-card', form);
      onSaved(response.data.data);
    } catch (reason) {
      const data = axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(reason) ? reason.response?.data : undefined;
      setError(data?.message || 'Não foi possível salvar as configurações do convite.');
      setFieldErrors(data?.errors || {});
    } finally { setSaving(false); }
  };

  return <CrudDialog title="Configurações do convite" busy={saving} onClose={onClose}>
    <Box component="form" onSubmit={submit}><Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <Alert severity="info">Noivos, data e horário vêm do cadastro do casamento: {card.bride} & {card.groom} · {date} · {card.time}.</Alert>
      {FIELDS.map(field => <TextField key={field.key} required fullWidth label={field.label} value={form[field.key]} multiline={field.multiline} minRows={field.multiline ? 3 : undefined}
        onChange={event => setForm({ ...form, [field.key]: event.target.value })} slotProps={{ htmlInput: { maxLength: field.max } }}
        error={Boolean(fieldErrors[field.key])} helperText={fieldErrors[field.key]?.[0] || field.help} />)}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: .5 }}>Foto do casal (modelo "Foto do casal")</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Sem foto enviada, o convite usa a foto da abertura do site.</Typography>
        <ImageUpload value={form.photo ? [form.photo] : []} category="invitationCard" onChange={images => setForm({ ...form, photo: images[0] || '' })} onBusyChange={setUploading} disabled={saving} />
        {fieldErrors.photo && <Alert severity="error" sx={{ mt: 1 }}>{fieldErrors.photo[0]}</Alert>}
      </Box>
    </Stack>
    <DialogActions sx={{ mt: 2, px: 0 }}><Button disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving || uploading}>{saving ? 'Salvando...' : 'Salvar configurações'}</Button></DialogActions></Box>
  </CrudDialog>;
}
