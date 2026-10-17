import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
export function ConfirmDialog({ open, title, description, busy, onCancel, onConfirm }: { open: boolean; title: string; description: string; busy?: boolean; onCancel: () => void; onConfirm: () => void }) {
  return <Dialog open={open} onClose={onCancel} aria-labelledby="confirm-title"><DialogTitle id="confirm-title">{title}</DialogTitle><DialogContent><DialogContentText>{description}</DialogContentText></DialogContent><DialogActions><Button onClick={onCancel} disabled={busy}>Cancelar</Button><Button color="error" variant="contained" onClick={onConfirm} disabled={busy}>{busy ? 'Excluindo...' : 'Excluir'}</Button></DialogActions></Dialog>;
}
