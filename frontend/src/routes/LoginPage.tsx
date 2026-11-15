import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, CircularProgress, CssBaseline, Paper, TextField, ThemeProvider, Typography } from '@mui/material';
import api, { tokenStore } from '../services/api';
import { TITLE_FONT, theme } from '../theme/theme';

interface LoginUser { email: string }

// Entrada do painel dos noivos, no mesmo tema rose do painel.
export function LoginPage({ onSuccess }: { onSuccess: (user: LoginUser) => void }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSending(true); setError('');
    try {
      const response = await api.post('/auth/login', form);
      tokenStore.set(response.data.data.accessToken);
      onSuccess(response.data.data.user);
    } catch (requestError) {
      const message = (requestError as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(message || 'Não foi possível entrar. Tente novamente.');
    } finally { setSending(false); }
  };
  return <ThemeProvider theme={theme}><CssBaseline />
    <Box component="main" sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', px: 2, py: 4, bgcolor: 'background.default' }}>
      <Paper component="form" onSubmit={submit} elevation={3} sx={{ width: '100%', maxWidth: 400, p: { xs: 3, sm: 4.5 }, borderRadius: '24px', border: 1, borderColor: 'divider', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography component="h1" sx={{ fontFamily: TITLE_FONT, fontWeight: 700, fontSize: 26, color: 'primary.main' }}>Casamento</Typography>
          <Typography color="text.secondary">Entre no painel dos noivos</Typography>
        </Box>
        <TextField fullWidth type="email" label="E-mail" required autoFocus autoComplete="username" placeholder="seu@email.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
        <TextField fullWidth type="password" label="Senha" required autoComplete="current-password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} sx={{ mt: 2 }} />
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
        <Button type="submit" fullWidth variant="contained" size="large" disabled={sending} startIcon={sending ? <CircularProgress size={18} color="inherit" /> : undefined} sx={{ mt: 3 }}>{sending ? 'Entrando...' : 'Entrar'}</Button>
      </Paper>
    </Box>
  </ThemeProvider>;
}
