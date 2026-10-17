import { lazy, Suspense } from 'react'; import { Navigate, Route, Routes } from 'react-router-dom'; import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '../theme/theme'; import { AdminLayout } from '../components/layout/AdminLayout';
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const GodparentsPage = lazy(() => import('../pages/Godparents/GodparentsPage').then(m => ({ default: m.GodparentsPage })));
const GiftsPage = lazy(() => import('../pages/Gifts/GiftsPage').then(m => ({ default: m.GiftsPage })));
const PixPage = lazy(() => import('../pages/Pix/PixPage').then(m => ({ default: m.PixPage })));
const InvitationsPage = lazy(() => import('../pages/Invitations/InvitationsPage').then(m => ({ default: m.InvitationsPage })));
export function AdminApp({ user, onLogout }: { user: { email: string }; onLogout: () => void }) {
  return <ThemeProvider theme={theme}><CssBaseline /><Suspense fallback={<div role="status">Carregando...</div>}><Routes><Route element={<AdminLayout email={user.email} onLogout={onLogout} />}>
    <Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<DashboardPage />} />
    <Route element={<InvitationsPage />}><Route path="/convites" /><Route path="/convites/novo" /><Route path="/convites/:id/editar" /></Route>
    <Route element={<GodparentsPage />}><Route path="/padrinhos" /><Route path="/padrinhos/novo" /><Route path="/padrinhos/:id/editar" /></Route>
    <Route element={<GiftsPage />}><Route path="/presentes" /><Route path="/presentes/novo" /><Route path="/presentes/:id/editar" /></Route>
    <Route path="/pix" element={<PixPage />} /><Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Route></Routes></Suspense></ThemeProvider>;
}
