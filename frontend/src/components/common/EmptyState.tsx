import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
export function EmptyState({ title, action }: { title: string; action?: ReactNode }) {
  return <Box sx={{ py: 6, textAlign: 'center' }}><Typography color="text.secondary" sx={{ mb: 2 }}>{title}</Typography>{action}</Box>;
}
