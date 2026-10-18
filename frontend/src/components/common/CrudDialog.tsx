import { useId, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Close from '@mui/icons-material/Close';

export function CrudDialog({ title, open = true, busy = false, onClose, children }: { title: string; open?: boolean; busy?: boolean; onClose: () => void; children: ReactNode }) {
  const titleId = useId();
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  return <Dialog open={open} onClose={busy ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="md" aria-labelledby={titleId}>
    <DialogTitle id={titleId} sx={{ pr: 7 }}>{title}<IconButton aria-label="Fechar" disabled={busy} onClick={onClose} sx={{ position: 'absolute', right: 12, top: 12 }}><Close /></IconButton></DialogTitle>
    <DialogContent dividers>{children}</DialogContent>
  </Dialog>;
}
