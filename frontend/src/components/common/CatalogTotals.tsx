import type { ReactNode } from 'react';
import { Box } from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RemoveCircleOutlineRounded from '@mui/icons-material/RemoveCircleOutlineRounded';
import type { CatalogSummary } from '../../types/api';
import { StatTile } from './StatTile';

export function CatalogTotals({ summary, loading, label, icon, feminine }: {
  summary: CatalogSummary | null;
  loading: boolean;
  label: string;
  icon: ReactNode;
  feminine?: boolean;
}) {
  const totals = loading ? null : summary;
  return <Box role="region" aria-label="Totais da listagem" aria-busy={loading}
    sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2, mb: 2 }}>
    <StatTile label={label} value={totals?.total ?? '—'} icon={icon} />
    <StatTile label={feminine ? 'Ativas' : 'Ativos'} value={totals?.active ?? '—'} icon={<CheckCircleRounded />} />
    <StatTile label={feminine ? 'Inativas' : 'Inativos'} value={totals?.inactive ?? '—'} icon={<RemoveCircleOutlineRounded />} />
  </Box>;
}
