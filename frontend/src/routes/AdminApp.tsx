import { lazy, Suspense, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import api from '../services/api';
import { theme } from '../theme/theme';
import { defaultAppearance, type Appearance } from '../theme/appearance';
import { AdminLayout } from '../components/layout/AdminLayout';
import { AppearanceDrawer } from '../components/layout/AppearanceDrawer';
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const GodparentsPage = lazy(() => import('../pages/Godparents/GodparentsPage').then(m => ({ default: m.GodparentsPage })));
const GiftsPage = lazy(() => import('../pages/Gifts/GiftsPage').then(m => ({ default: m.GiftsPage })));
const PixPage = lazy(() => import('../pages/Pix/PixPage').then(m => ({ default: m.PixPage })));
const InvitationsPage = lazy(() => import('../pages/Invitations/InvitationsPage').then(m => ({ default: m.InvitationsPage })));
export function AdminApp({ user, onLogout }: { user: { email: string }; onLogout: () => void }) {
  const [saved, setSaved] = useState<Appearance>(defaultAppearance);
  const [draft, setDraft] = useState<Appearance>(defaultAppearance);
  const [customizing, setCustomizing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);
  const open = async () => {
    setCustomizing(true); setBusy(true); setReady(false); setError(''); setSavedNotice(false);
    try {
      const response = await api.get<{ data: Appearance }>('/appearance');
      setSaved(response.data.data); setDraft(response.data.data); setReady(true);
    } catch { setError('Não foi possível carregar a aparência do site público.'); }
    finally { setBusy(false); }
  };
  const close = () => { if (busy) return; setDraft(saved); setSavedNotice(false); setCustomizing(false); };
  const change = (next: Appearance) => { setDraft(next); setSavedNotice(false); };
  const save = async () => {
    setBusy(true); setError(''); setSavedNotice(false);
    try {
      await api.put('/appearance', draft);
      setSaved(draft); setSavedNotice(true);
    } catch { setError('Não foi possível salvar a aparência do site público.'); }
    finally { setBusy(false); }
  };
  return <ThemeProvider theme={theme}><CssBaseline /><Suspense fallback={<div role="status">Carregando...</div>}><Routes><Route element={<AdminLayout email={user.email} onLogout={onLogout} onCustomize={open} />}>
    <Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<DashboardPage />} />
    <Route element={<InvitationsPage />}><Route path="/convites" /><Route path="/convites/novo" /><Route path="/convites/:id/editar" /></Route>
    <Route element={<GodparentsPage />}><Route path="/padrinhos" /><Route path="/padrinhos/novo" /><Route path="/padrinhos/:id/editar" /></Route>
    <Route element={<GiftsPage />}><Route path="/presentes" /><Route path="/presentes/novo" /><Route path="/presentes/:id/editar" /></Route>
    <Route path="/pix" element={<PixPage />} /><Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Route></Routes></Suspense><AppearanceDrawer open={customizing} settings={draft} onChange={change} onClose={close} onSave={save} busy={busy} ready={ready} error={error} savedNotice={savedNotice} /></ThemeProvider>;
}
