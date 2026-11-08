import { useEffect, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, LinearProgress, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { PageHeader } from '../../components/common/PageHeader';
import api from '../../services/api';
import { invitationsService } from '../../services/invitations.service';
import { godparentsService } from '../../services/godparents.service';
import { giftsService } from '../../services/gifts.service';

interface Resumo {
  convites: number; pessoas: number; confirmadas: number; pendentes: number;
  padrinhos: number; presentes: number; dias: number | null;
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

// Dias até a data do casamento (cadastro do convite), contados pelo calendário local.
function diasAte(date?: { dia: number; mes: number; ano: number }) {
  if (!date) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(date.ano, date.mes - 1, date.dia).getTime() - hoje.getTime()) / 86400000);
}

// O que os noivos querem saber ao abrir o painel: quantas pessoas já confirmaram,
// quantas faltam e quanto tempo resta. Os totais do resto ficam como atalhos.
export function DashboardPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([
      invitationsService.list({ page: 1, limit: 1 }),
      godparentsService.list({ page: 1, limit: 1 }),
      giftsService.list({ page: 1, limit: 1 }),
      api.get('/invitation-card').then(r => r.data.data).catch(() => null)
    ]).then(([convites, padrinhos, presentes, card]) => setResumo({
      convites: convites.summary.total, pessoas: convites.summary.people, confirmadas: convites.summary.confirmed,
      pendentes: convites.summary.unconfirmed, padrinhos: padrinhos.pagination.total, presentes: presentes.pagination.total,
      dias: diasAte(card?.date)
    })).catch(() => setError('Não foi possível carregar o resumo do casamento.'));
  }, []);

  const pct = resumo && resumo.pessoas ? Math.round(resumo.confirmadas / resumo.pessoas * 100) : 0;
  const prazo = resumo?.dias == null ? '' : resumo.dias > 0 ? `Faltam ${plural(resumo.dias, 'dia', 'dias')} para o casamento.` : resumo.dias === 0 ? 'O casamento é hoje!' : 'O casamento já aconteceu.';
  const atalhos = resumo ? [
    { to: '/convites', titulo: 'Convites', texto: `${plural(resumo.convites, 'convite enviado', 'convites enviados')} para ${plural(resumo.pessoas, 'pessoa', 'pessoas')}` },
    { to: '/padrinhos', titulo: 'Padrinhos', texto: `${plural(resumo.padrinhos, 'padrinho cadastrado', 'padrinhos cadastrados')}` },
    { to: '/presentes', titulo: 'Presentes', texto: `${plural(resumo.presentes, 'presente na lista', 'presentes na lista')}` }
  ] : [];

  return <>
    <PageHeader title="Dashboard" subtitle="Resumo do casamento." />
    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
    <Paper sx={{ p: { xs: 2.5, md: 3.5 }, mb: 2 }}>
      {resumo ? <>
        <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
          {resumo.confirmadas} de {plural(resumo.pessoas, 'pessoa confirmada', 'pessoas confirmadas')}
        </Typography>
        <LinearProgress variant="determinate" value={pct} aria-label={`${pct}% das pessoas confirmadas`} sx={{ height: 10, borderRadius: 5, my: 2, maxWidth: 640 }} />
        <Typography color="text.secondary">
          {resumo.pendentes ? `${plural(resumo.pendentes, 'pessoa ainda não confirmou', 'pessoas ainda não confirmaram')}. ` : 'Todo mundo já confirmou. '}{prazo}
        </Typography>
        <Button component={RouterLink} to="/convites" variant="contained" sx={{ mt: 2.5 }}>Ver convites</Button>
      </> : !error && <><Skeleton variant="text" width={320} height={48} /><Skeleton variant="rounded" width="60%" height={10} sx={{ my: 2 }} /><Skeleton variant="text" width={360} /></>}
    </Paper>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
      {atalhos.map(item => <Paper key={item.to} component={RouterLink} to={item.to} variant="outlined"
        sx={{ p: 2.5, textDecoration: 'none', color: 'inherit', transition: 'border-color .15s', '&:hover, &:focus-visible': { borderColor: 'primary.main' } }}>
        <Stack spacing={.5}><Typography sx={{ fontWeight: 700 }}>{item.titulo}</Typography><Typography color="text.secondary">{item.texto}</Typography></Stack>
      </Paper>)}
    </Box>
  </>;
}
