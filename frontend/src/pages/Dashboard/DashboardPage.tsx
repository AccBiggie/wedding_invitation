import { useEffect, useState, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Paper, Skeleton, Stack, Typography } from '@mui/material';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import CancelRounded from '@mui/icons-material/CancelRounded';
import HelpRounded from '@mui/icons-material/HelpRounded';
import ScheduleRounded from '@mui/icons-material/ScheduleRounded';
import MailOutlineRounded from '@mui/icons-material/MailOutlineRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import HowToRegRounded from '@mui/icons-material/HowToRegRounded';
import EventRounded from '@mui/icons-material/EventRounded';
import VisibilityOffRounded from '@mui/icons-material/VisibilityOffRounded';
import PendingRounded from '@mui/icons-material/PendingRounded';
import TimelapseRounded from '@mui/icons-material/TimelapseRounded';
import { PageHeader } from '../../components/common/PageHeader';
import api from '../../services/api';
import { invitationsService } from '../../services/invitations.service';
import { godparentsService } from '../../services/godparents.service';
import { giftsService } from '../../services/gifts.service';
import type { InvitationStats } from '../../types/api';
import { CATEGORY_COLORS, ChartCard, ColumnChart, DonutChart, INK, LineChart, SegmentedBar, StatTile, STATUS_COLORS, VIZ, formatNumber, type Part } from './charts';

interface Resumo { stats: InvitationStats; padrinhos: number; presentes: number; dias: number | null; data: string }

const plural = (n: number, um: string, varios: string) => `${formatNumber(n)} ${n === 1 ? um : varios}`;
const pct = (value: number, total: number) => total ? Math.round(value / total * 100) : 0;

// Rotulos iguais aos do gerenciador de convites.
const SIDES: [string, string][] = [['groom', 'Noivo'], ['bride', 'Noiva']];
const RELATIONSHIPS: [string, string][] = [['relative', 'Parente'], ['friends', 'Amigos'], ['family', 'Família'], ['parents', 'Pais'], ['organization', 'Organização']];
// Status do convite com as mesmas cores dos selos do gerenciador, sempre com icone e nome.
const STATUSES = [
  { key: 'not_viewed', label: 'Não visualizado', color: '#9aa39d', Icon: VisibilityOffRounded },
  { key: 'unconfirmed', label: 'Não confirmado', color: '#ed6c02', Icon: PendingRounded },
  { key: 'partial', label: 'Confirmado parcial', color: '#0288d1', Icon: TimelapseRounded },
  { key: 'confirmed', label: 'Confirmado', color: STATUS_COLORS.good, Icon: CheckCircleRounded },
  { key: 'declined', label: 'Não vai', color: STATUS_COLORS.critical, Icon: CancelRounded }
];
const CATEGORIES: [string, string][] = [['man', 'Homens'], ['woman', 'Mulheres'], ['girl_0_5', 'Menina até 5 anos'], ['boy_0_5', 'Menino até 5 anos'], ['girl_6_10', 'Menina de 6 a 10 anos'], ['boy_6_10', 'Menino de 6 a 10 anos'], ['over_10', 'Maior de 10 anos']];
const CHILDREN = ['girl_0_5', 'boy_0_5', 'girl_6_10', 'boy_6_10', 'over_10'];

// Dias até a data do casamento (cadastro do convite), contados pelo calendário local.
function diasAte(date?: { dia: number; mes: number; ano: number }) {
  if (!date) return null;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  return Math.round((new Date(date.ano, date.mes - 1, date.dia).getTime() - hoje.getTime()) / 86400000);
}

// Linha do tempo acumulada: todos os dias do primeiro registro ate hoje (ou ate o ultimo registro, se for depois).
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
function timeline(invited: Record<string, number>, confirmed: Record<string, number>) {
  const known = [...Object.keys(invited), ...Object.keys(confirmed)].sort();
  if (!known.length) return { days: [] as string[], invited: [] as number[], confirmed: [] as number[] };
  const end = [known[known.length - 1], today()].sort()[1];
  const days: string[] = [];
  for (const day = new Date(`${known[0]}T12:00:00Z`); day.toISOString().slice(0, 10) <= end && days.length < 800; day.setUTCDate(day.getUTCDate() + 1)) days.push(day.toISOString().slice(0, 10));
  const cumulative = (counts: Record<string, number>) => { let sum = 0; return days.map(day => (sum += counts[day] || 0)); };
  return { days, invited: cumulative(invited), confirmed: cumulative(confirmed) };
}

// Um dos donuts do resumo, com o nome do grupo da planilha acima.
function SummaryDonut({ title, children }: { title: string; children: ReactNode }) {
  return <Box sx={{ minWidth: 0 }}><Typography variant="overline" color="text.secondary" component="h3" sx={{ fontWeight: 700, letterSpacing: .6, display: 'block', textAlign: 'center', mb: 1 }}>{title}</Typography>{children}</Box>;
}

// O que os noivos querem saber ao abrir o painel: quem vai, quem falta responder e os numeros
// de cada coluna do gerenciador de convites (parte, parentesco, tipo, mesa, status e datas).
export function DashboardPage() {
  const [resumo, setResumo] = useState<Resumo | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([
      invitationsService.stats(),
      godparentsService.list({ page: 1, limit: 1 }),
      giftsService.list({ page: 1, limit: 1 }),
      api.get('/invitation-card').then(r => r.data.data).catch(() => null)
    ]).then(([stats, padrinhos, presentes, card]) => setResumo({
      stats, padrinhos: padrinhos.pagination.total, presentes: presentes.pagination.total, dias: diasAte(card?.date),
      data: card?.date ? `${String(card.date.dia).padStart(2, '0')}/${String(card.date.mes).padStart(2, '0')}/${card.date.ano}` : ''
    })).catch(() => setError('Não foi possível carregar o resumo do casamento.'));
  }, []);

  if (!resumo) return <>
    <PageHeader title="Dashboard" subtitle="Resumo do casamento." />
    {error ? <Alert severity="error">{error}</Alert> : <Stack spacing={2}><Skeleton variant="rounded" height={180} /><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>{[0, 1, 2, 3].map(key => <Skeleton key={key} variant="rounded" height={96} />)}</Box><Skeleton variant="rounded" height={260} /></Stack>}
  </>;

  const { stats } = resumo;
  const people = stats.people;
  const responses = people.byResponse;
  const category = (key: string) => people.byCategory[key] || { total: 0, yes: 0 };
  const sum = (keys: string[], field: 'total' | 'yes') => keys.reduce((total, key) => total + category(key)[field], 0);
  const adults = sum(['man', 'woman'], 'total');
  const children = sum(CHILDREN, 'total');
  const prazo = resumo.dias == null ? '' : resumo.dias > 0 ? `Faltam ${plural(resumo.dias, 'dia', 'dias')} para o casamento.` : resumo.dias === 0 ? 'O casamento é hoje!' : 'O casamento já aconteceu.';

  // Respostas de cada pessoa: cores de status, sempre com icone e texto.
  const answers = [
    { key: 'yes', label: 'Confirmados', value: responses.yes, color: STATUS_COLORS.good, ink: INK.light, icon: <CheckCircleRounded sx={{ fontSize: 18, color: STATUS_COLORS.good }} /> },
    { key: 'maybe', label: 'Não sabem', value: responses.maybe, color: STATUS_COLORS.warning, ink: INK.dark, icon: <HelpRounded sx={{ fontSize: 18, color: '#a87400' }} /> },
    { key: 'none', label: 'Sem resposta', value: responses.none, color: STATUS_COLORS.neutral, ink: INK.dark, icon: <ScheduleRounded sx={{ fontSize: 18, color: '#7b8580' }} /> },
    { key: 'no', label: 'Não vão', value: responses.no, color: STATUS_COLORS.critical, ink: INK.light, icon: <CancelRounded sx={{ fontSize: 18, color: STATUS_COLORS.critical }} /> }
  ];

  const withOther = (entries: [string, string][], counts: Record<string, number>) => [...entries, ['none', 'Não informado'] as [string, string]].filter(([key]) => key !== 'none' || counts.none);
  const sideParts: Part[] = withOther(SIDES, Object.fromEntries(Object.entries(people.bySide).map(([key, value]) => [key, value.total]))).map(([key, label], index) => ({
    key, label, value: people.bySide[key]?.total || 0, color: key === 'none' ? VIZ.other : [VIZ.green, VIZ.gold][index], ink: key === 'none' ? INK.dark : INK.light,
    detail: `${plural(stats.invitations.bySide[key] || 0, 'convite', 'convites')} · ${formatNumber(people.bySide[key]?.yes || 0)} confirmados`
  }));
  const typeParts: Part[] = [['in_person', 'Presencial', VIZ.green, INK.light], ['virtual', 'Virtual', VIZ.gold, INK.light]].map(([key, label, color, ink]) => ({ key, label, value: stats.invitations.byType[key] || 0, color, ink }));
  // A cor segue o parentesco (ordem fixa do cadastro), nunca a posicao.
  const relationshipParts: Part[] = withOther(RELATIONSHIPS, Object.fromEntries(Object.entries(people.byRelationship).map(([key, value]) => [key, value.total])))
    .map(([key, label], index) => ({
      key, label, value: people.byRelationship[key]?.total || 0, color: key === 'none' ? VIZ.other : CATEGORY_COLORS[index],
      detail: `${plural(stats.invitations.byRelationship[key] || 0, 'convite', 'convites')} · ${formatNumber(people.byRelationship[key]?.yes || 0)} confirmados`
    }));
  // Resumo no formato da planilha: convidados por faixa e quem vai, por tipo de pessoa.
  const unknown = category('unknown');
  const guestParts: Part[] = [
    { key: 'adults', label: 'Adultos', value: adults, color: CATEGORY_COLORS[0] },
    { key: 'kids_0_5', label: 'Crianças até 5 anos', value: sum(['girl_0_5', 'boy_0_5'], 'total'), color: CATEGORY_COLORS[2] },
    { key: 'kids_6_10', label: 'Crianças de 6 a 10 anos', value: sum(['girl_6_10', 'boy_6_10'], 'total'), color: CATEGORY_COLORS[3] },
    { key: 'over_10', label: 'Maiores de 10 anos', value: category('over_10').total, color: CATEGORY_COLORS[6] },
    ...(unknown.total ? [{ key: 'unknown', label: 'Tipo não informado', value: unknown.total, color: VIZ.other }] : [])
  ];
  const goingParts: Part[] = [
    { key: 'woman', label: 'Mulheres', value: category('woman').yes, color: CATEGORY_COLORS[1] },
    { key: 'man', label: 'Homens', value: category('man').yes, color: CATEGORY_COLORS[0] },
    { key: 'children', label: 'Crianças', value: sum(CHILDREN, 'yes'), color: CATEGORY_COLORS[2] },
    ...(unknown.yes ? [{ key: 'unknown', label: 'Tipo não informado', value: unknown.yes, color: VIZ.other }] : [])
  ];
  const summaryRows: (string | number)[][] = [
    ...guestParts.map(part => [`Convidados: ${part.label}`, part.value]), ['Total de convidados', people.total],
    ...goingParts.map(part => [`Vão: ${part.label}`, part.value]),
    ['Convites digitais', stats.invitations.byType.virtual || 0], ['Convites físicos', stats.invitations.byType.in_person || 0], ['Total que vão', responses.yes]
  ];
  const statusParts: Part[] = STATUSES.map(({ key, label, color, Icon }) => ({ key, label, color, value: stats.invitations.byStatus[key] || 0, icon: <Icon aria-hidden sx={{ fontSize: 16, color }} /> }));
  const categoryParts: Part[] = [...CATEGORIES.map(([key, label], index) => ({ key, label, color: CATEGORY_COLORS[index] })), ...(category('unknown').total ? [{ key: 'unknown', label: 'Tipo não informado', color: VIZ.other }] : [])]
    .map(part => ({ ...part, value: category(part.key).total, detail: `${formatNumber(category(part.key).yes)} confirmados` }));
  const tableColumns = stats.tables.map(row => ({ key: row.table || '-', label: row.table ? `Mesa ${row.table}` : 'Sem mesa', done: row.yes, total: row.people, detail: plural(row.invitations, 'convite', 'convites') }));
  const line = timeline(stats.timeline.invited, stats.timeline.confirmed);
  const atalhos = [
    { to: '/convites', titulo: 'Convites', texto: `${plural(stats.invitations.total, 'convite enviado', 'convites enviados')} para ${plural(people.total, 'pessoa', 'pessoas')}` },
    { to: '/padrinhos', titulo: 'Padrinhos', texto: plural(resumo.padrinhos, 'padrinho cadastrado', 'padrinhos cadastrados') },
    { to: '/presentes', titulo: 'Presentes', texto: plural(resumo.presentes, 'presente na lista', 'presentes na lista') }
  ];

  return <>
    <PageHeader title="Dashboard" subtitle="Resumo do casamento." />
    <Stack spacing={2}>
      <Paper sx={{ p: { xs: 2.5, md: 3.5 }, borderRadius: 3 }}>
        <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>{formatNumber(responses.yes)} de {plural(people.total, 'pessoa confirmada', 'pessoas confirmadas')}</Typography>
        <Typography color="text.secondary" sx={{ mt: .5 }}>{responses.none + responses.maybe ? `${plural(responses.none + responses.maybe, 'pessoa ainda não confirmou', 'pessoas ainda não confirmaram')}. ` : 'Todo mundo já respondeu. '}{prazo}</Typography>
        <Box sx={{ my: 2.5, maxWidth: 720 }}><SegmentedBar tall={false} label="Respostas das pessoas convidadas" parts={answers} /></Box>
        <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, auto)' }, justifyContent: 'start', columnGap: 4, rowGap: 1.5 }}>
          {answers.map(answer => <Box component="li" key={answer.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {answer.icon}
            <Box><Typography sx={{ fontWeight: 700, lineHeight: 1.2 }}>{formatNumber(answer.value)} <Box component="span" sx={{ fontWeight: 400, color: 'text.secondary', fontSize: 13 }}>· {pct(answer.value, people.total)}%</Box></Typography><Typography variant="body2" color="text.secondary">{answer.label}</Typography></Box>
          </Box>)}
        </Box>
        <Button component={RouterLink} to="/convites" variant="contained" sx={{ mt: 3 }}>Ver convites</Button>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <StatTile icon={<MailOutlineRounded />} label="Convites" value={stats.invitations.total} hint={`${formatNumber(stats.invitations.byType.in_person || 0)} presenciais · ${formatNumber(stats.invitations.byType.virtual || 0)} virtuais`} />
        <StatTile icon={<GroupsRounded />} label="Convidados" value={people.total} hint={`${formatNumber(adults)} adultos · ${formatNumber(children)} crianças`} />
        <StatTile icon={<HowToRegRounded />} label="Vão ao casamento" value={responses.yes} hint={`${pct(responses.yes, people.total)}% dos convidados`} />
        <StatTile icon={<EventRounded />} label="Dias para o casamento" value={resumo.dias == null ? '-' : Math.max(0, resumo.dias)} hint={resumo.data || undefined} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <ChartCard title="Status dos convites" subtitle="Quantos convites estão em cada etapa." table={{ columns: ['Status', 'Convites'], rows: statusParts.map(part => [part.label, part.value]) }}>
          <DonutChart parts={statusParts} label="Convites por status" centerLabel="convites" unit={['convite', 'convites']} />
        </ChartCard>
        <ChartCard title="Convidados por tipo" subtitle="Total de pessoas e quantas já confirmaram." table={{ columns: ['Tipo', 'Pessoas', 'Confirmados'], rows: categoryParts.map(part => [part.label, part.value, category(part.key).yes]) }}>
          <DonutChart parts={categoryParts} label="Pessoas por tipo" centerLabel="convidados" unit={['pessoa', 'pessoas']} />
        </ChartCard>
        <ChartCard title="Parte" subtitle="Pessoas convidadas pelo noivo e pela noiva." table={{ columns: ['Parte', 'Convites', 'Pessoas', 'Confirmados'], rows: sideParts.map(part => [part.label, stats.invitations.bySide[part.key] || 0, part.value, people.bySide[part.key]?.yes || 0]) }}>
          <DonutChart parts={sideParts} label="Pessoas por parte" centerLabel="convidados" unit={['pessoa', 'pessoas']} />
        </ChartCard>
        <ChartCard title="Tipo do convite" subtitle="Convites presenciais e virtuais." table={{ columns: ['Tipo', 'Convites'], rows: typeParts.map(part => [part.label, part.value]) }}>
          <DonutChart parts={typeParts} label="Convites por tipo" centerLabel="convites" unit={['convite', 'convites']} />
        </ChartCard>
        <ChartCard title="Parentesco" subtitle="Pessoas convidadas por parentesco." table={{ columns: ['Parentesco', 'Convites', 'Pessoas', 'Confirmados'], rows: relationshipParts.map(part => [part.label, stats.invitations.byRelationship[part.key] || 0, part.value, people.byRelationship[part.key]?.yes || 0]) }}>
          <DonutChart parts={relationshipParts} label="Pessoas por parentesco" centerLabel="convidados" unit={['pessoa', 'pessoas']} />
        </ChartCard>
        <ChartCard title="Resumo de convidados" subtitle="Os números da planilha, calculados pelos convites." table={{ columns: ['Item', 'Pessoas'], rows: summaryRows }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr', lg: '1fr 1fr' }, gap: 3 }}>
            <SummaryDonut title="Convidados"><DonutChart stacked parts={guestParts} label="Convidados por faixa" centerLabel="convidados" unit={['pessoa', 'pessoas']} /></SummaryDonut>
            <SummaryDonut title="Vão ao casamento"><DonutChart stacked parts={goingParts} label="Pessoas que vão ao casamento" centerLabel="vão" unit={['pessoa', 'pessoas']} /></SummaryDonut>
          </Box>
        </ChartCard>
      </Box>

      <ChartCard title="Pessoas por mesa" subtitle="Total de pessoas em cada mesa e quantas já confirmaram." table={{ columns: ['Mesa', 'Convites', 'Pessoas', 'Confirmados'], rows: stats.tables.map(row => [row.table ? `Mesa ${row.table}` : 'Sem mesa', row.invitations, row.people, row.yes]) }}>
        <ColumnChart columns={tableColumns} label="Pessoas por mesa" doneLabel="Confirmados" restLabel="Ainda não confirmados" />
      </ChartCard>

      <ChartCard title="Convites e confirmações no tempo" subtitle="Pessoas convidadas (pela data de criação do convite) e pessoas confirmadas (pela data de confirmação), acumuladas." table={{ columns: ['Data', 'Pessoas convidadas', 'Pessoas confirmadas'], rows: line.days.filter((_, index) => index === line.days.length - 1 || line.invited[index] !== line.invited[index + 1] || line.confirmed[index] !== line.confirmed[index + 1]).map(day => { const index = line.days.indexOf(day); return [day.split('-').reverse().join('/'), line.invited[index], line.confirmed[index]]; }) }}>
        <LineChart label="Pessoas convidadas e confirmadas por dia, acumulado" days={line.days} series={[{ key: 'invited', label: 'Pessoas convidadas', color: VIZ.green, values: line.invited }, { key: 'confirmed', label: 'Pessoas confirmadas', color: VIZ.gold, values: line.confirmed }]} />
      </ChartCard>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {atalhos.map(item => <Paper key={item.to} component={RouterLink} to={item.to} variant="outlined"
          sx={{ p: 2.5, borderRadius: 3, textDecoration: 'none', color: 'inherit', transition: 'border-color .15s', '&:hover, &:focus-visible': { borderColor: 'primary.main' } }}>
          <Stack spacing={.5}><Typography sx={{ fontWeight: 700 }}>{item.titulo}</Typography><Typography color="text.secondary">{item.texto}</Typography></Stack>
        </Paper>)}
      </Box>
    </Stack>
  </>;
}
