import { lazy, Suspense, type ComponentType } from 'react'; import { Navigate, Route, Routes } from 'react-router-dom'; import { CssBaseline, ThemeProvider } from '@mui/material';
import { theme } from '../theme/theme'; import { AdminLayout } from '../components/layout/AdminLayout';
const DashboardPage = lazy(() => import('../pages/Dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })));
const GodparentsPage = lazy(() => import('../pages/Godparents/GodparentsPage').then(m => ({ default: m.GodparentsPage })));
const GodparentForm = lazy(() => import('../pages/Godparents/GodparentForm').then(m => ({ default: m.GodparentForm })));
const GiftsPage = lazy(() => import('../pages/Gifts/GiftsPage').then(m => ({ default: m.GiftsPage })));
const GiftForm = lazy(() => import('../pages/Gifts/GiftForm').then(m => ({ default: m.GiftForm })));
const PixPage = lazy(() => import('../pages/Pix/PixPage').then(m => ({ default: m.PixPage })));
export function AdminApp({ user, onLogout, InvitationsPage }: { user: { email: string }; onLogout: () => void; InvitationsPage: ComponentType }) {
  return <ThemeProvider theme={theme}><CssBaseline /><Suspense fallback={<div role="status">Carregando...</div>}><Routes><Route element={<AdminLayout email={user.email} onLogout={onLogout} />}>
    <Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/convites" element={<InvitationsPage />} /><Route path="/convites/novo" element={<InvitationsPage />} /><Route path="/convites/:id/editar" element={<InvitationsPage />} />
    <Route path="/padrinhos" element={<GodparentsPage />} /><Route path="/padrinhos/novo" element={<GodparentForm />} /><Route path="/padrinhos/:id/editar" element={<GodparentForm />} />
    <Route path="/presentes" element={<GiftsPage />} /><Route path="/presentes/novo" element={<GiftForm />} /><Route path="/presentes/:id/editar" element={<GiftForm />} />
    <Route path="/pix" element={<PixPage />} /><Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Route></Routes></Suspense></ThemeProvider>;
}
