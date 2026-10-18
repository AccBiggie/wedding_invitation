import { lazy, Suspense, useEffect, useState } from 'react'; import { pixService } from '../../services/pix.service';
const GravataModal = lazy(() => import('./GravataModal').then(module => ({ default: module.GravataModal })));
// Configuracao PIX do painel: a action "Gravata" so aparece com o PIX ativo e o
// card "Chave PIX" mostra a mesma chave usada no QR Code. loaded evita piscar a chave.
export type PixStatus = { loaded: boolean; active: boolean; pixKey: string | null };
export function usePixStatus() { const [status, setStatus] = useState<PixStatus>({ loaded: false, active: false, pixKey: null }); useEffect(() => { pixService.getStatus().then(value => setStatus({ loaded: true, active: value.active, pixKey: value.pixKey })).catch(() => setStatus({ loaded: true, active: false, pixKey: null })); }, []); return status; }
const PixKeyQrModal = lazy(() => import('./PixKeyQrModal').then(module => ({ default: module.PixKeyQrModal })));
export function PixQrDialog({ open, onClose }: { open: boolean; onClose: () => void }) { if (!open) return null; return <Suspense fallback={null}><PixKeyQrModal open={open} onClose={onClose} /></Suspense>; }
export function GravataDialog({ open, onClose }: { open: boolean; onClose: () => void }) { if (!open) return null; return <Suspense fallback={null}><GravataModal open={open} onClose={onClose} /></Suspense>; }
