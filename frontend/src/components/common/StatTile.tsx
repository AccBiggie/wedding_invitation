import type { ReactNode } from 'react';
import { Box, Paper, Typography } from '@mui/material';

// Numero de destaque com rotulo e uma linha de apoio.
export function StatTile({ label, value, hint, icon }: { label: string; value: number | string; hint?: string; icon?: ReactNode }) {
  return <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', gap: 1.5, alignItems: 'flex-start', minWidth: 0 }}>
    {icon && <Box aria-hidden sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#f6e8ee', color: '#9e3f63', flex: 'none' }}>{icon}</Box>}
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>{label}</Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{typeof value === 'number' ? value.toLocaleString('pt-BR') : value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Box>
  </Paper>;
}
