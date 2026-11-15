import { useId, type FormEvent, type ReactNode } from 'react';
import { Box, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Close from '@mui/icons-material/Close';

// Modal padrao do painel: cabecalho e rodape fixos, so o corpo rola.
// headerAction: botao no fim do cabecalho, antes do fechar. actions: botoes do rodape. onSubmit: o formulario envolve corpo e rodape (Enter e o botao type="submit" enviam).
export function CrudDialog({ title, open = true, busy = false, onClose, onSubmit, noValidate, headerAction, actions, children }: {
  title: string; open?: boolean; busy?: boolean; onClose: () => void; headerAction?: ReactNode;
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void; noValidate?: boolean; actions?: ReactNode; children: ReactNode;
}) {
  const titleId = useId();
  const fullScreen = useMediaQuery(useTheme().breakpoints.down('sm'));
  const body = <>
    <DialogContent dividers>{children}</DialogContent>
    {actions && <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, py: 1.5, '& > :not(style) ~ :not(style)': { ml: 0 } }}>{actions}</DialogActions>}
  </>;
  return <Dialog open={open} onClose={busy ? undefined : onClose} fullScreen={fullScreen} fullWidth maxWidth="md" aria-labelledby={titleId}>
    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 1.5 }}>
      <Box component="span" id={titleId} sx={{ flex: 1, minWidth: 0 }}>{title}</Box>
      {headerAction}
      <IconButton aria-label="Fechar" disabled={busy} onClick={onClose}><Close /></IconButton>
    </DialogTitle>
    {onSubmit
      ? <Box component="form" onSubmit={onSubmit} noValidate={noValidate} sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>{body}</Box>
      : body}
  </Dialog>;
}
