import { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Collapse, Divider, IconButton, InputAdornment, Link, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Menu, MenuItem, Pagination, Paper, Popover, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TextField, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import PersonAddAlt1Outlined from '@mui/icons-material/PersonAddAlt1Outlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import WhatsApp from '@mui/icons-material/WhatsApp';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ArrowUpwardRounded from '@mui/icons-material/ArrowUpwardRounded';
import UnfoldMoreRounded from '@mui/icons-material/UnfoldMoreRounded';
import RestoreRounded from '@mui/icons-material/RestoreRounded';
import DragIndicatorRounded from '@mui/icons-material/DragIndicatorRounded';
import ViewColumnRounded from '@mui/icons-material/ViewColumnRounded';
import SortByAlphaRounded from '@mui/icons-material/SortByAlphaRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import { PageHeader } from '../../components/common/PageHeader';
import { CrudDialog } from '../../components/common/CrudDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { DateField } from '../../components/common/DateField';
import api from '../../services/api';
import { INVITE_LAYOUTS } from '../../invite-print/convite';
import { inviteLink } from '../../invite-print/inviteData';
import { InvitationPrintDialog } from './InvitationPrintDialog';
import { InvitationCardSettingsDialog } from './InvitationCardSettingsDialog';

const typeLabel = type => type === 'virtual' ? 'Virtual' : 'Presencial';
// WhatsApp: guardado so com digitos; na tela, (44) 99883-3731 (a mascara vai se formando ao digitar).
const whatsappMask = value => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : '';
  const rest = digits.slice(2), split = digits.length === 11 ? 5 : 4;
  return `(${digits.slice(0, 2)}) ${rest.length > split ? `${rest.slice(0, split)}-${rest.slice(split)}` : rest}`;
};
const whatsappValid = value => { const digits = String(value || '').replace(/\D/g, ''); return !digits || /^[1-9]{2}9?\d{8}$/.test(digits); };
// Tipos de pessoa do convite (mesmos valores do backend: GUEST_CATEGORIES).
const ADULT_CATEGORIES = [{ value: 'man', label: 'Homem' }, { value: 'woman', label: 'Mulher' }];
const CHILD_CATEGORIES = [{ value: 'girl_0_5', label: 'Menina até 5 anos' }, { value: 'boy_0_5', label: 'Menino até 5 anos' }, { value: 'girl_6_10', label: 'Menina de 6 a 10 anos' }, { value: 'boy_6_10', label: 'Menino de 6 a 10 anos' }, { value: 'over_10', label: 'Maior de 10 anos' }];
// Parte do casal e parentesco do convite (mesmos valores do backend: INVITATION_SIDES e INVITATION_RELATIONSHIPS).
const SIDES = [{ value: 'groom', label: 'Noivo' }, { value: 'bride', label: 'Noiva' }];
const RELATIONSHIPS = [{ value: 'relative', label: 'Parente' }, { value: 'friends', label: 'Amigos' }, { value: 'family', label: 'Família' }, { value: 'parents', label: 'Pais' }, { value: 'organization', label: 'Organização' }];
const optionLabel = (options, value) => options.find(item => item.value === value)?.label || '-';
const categoryLabel = category => [...ADULT_CATEGORIES, ...CHILD_CATEGORIES].find(item => item.value === category)?.label || 'Não informado';
const isChild = category => CHILD_CATEGORIES.some(item => item.value === category);

// Status do convite (backend: INVITATION_STATUSES), calculado pelas respostas de cada pessoa.
const STATUSES = {
  not_viewed: { label: 'Não visualizado', color: 'grey' },
  unconfirmed: { label: 'Não confirmado', color: 'warning' },
  partial: { label: 'Confirmado parcial', color: 'info' },
  confirmed: { label: 'Confirmado', color: 'success' },
  declined: { label: 'Não vai', color: 'error' }
};
// Status de cada pessoa: as mesmas palavras do convite, mais "Não sabe".
const GUEST_STATUSES = { yes: { label: 'Confirmado', color: 'success' }, no: { label: 'Não vai', color: 'error' }, maybe: { label: 'Não sabe', color: 'secondary' } };
// Convidados confirmados antes da resposta Sim/Não/Não sei existir contam como "sim".
const guestResponse = guest => guest.response || (guest.confirmed ? 'yes' : null);
const guestStatus = (guest, viewed) => GUEST_STATUSES[guestResponse(guest)] || (viewed ? STATUSES.unconfirmed : STATUSES.not_viewed);
// Selo de status: fundo suave na cor do status, texto escuro e borda fina.
const tonal = color => {
  const main = theme => color === 'grey' ? theme.palette.text.secondary : theme.palette[color].main;
  return {
    height: 24, maxWidth: '100%', borderRadius: 999, border: 1, fontWeight: 600, fontSize: 12, letterSpacing: .2,
    bgcolor: theme => alpha(main(theme), color === 'grey' ? .07 : .1), borderColor: theme => alpha(main(theme), .25),
    color: color === 'grey' ? 'text.secondary' : `${color}.dark`, '& .MuiChip-label': { px: 1.25 }
  };
};
function StatusChip({ status, onClick, expanded, label }) {
  return <Chip size="small" label={status.label} sx={tonal(status.color)} onClick={onClick} aria-expanded={expanded} aria-label={label} />;
}

// Totais por tipo: homens, mulheres e uma contagem por opcao de idade das criancas, com o mesmo texto do campo Idade.
const countsOf = guests => {
  const count = category => guests.filter(guest => guest.category === category).length;
  return [[count('man'), 'Homens'], [count('woman'), 'Mulheres'], ...CHILD_CATEGORIES.map(item => [count(item.value), item.label])];
};
let guestKey = 0;
const guestRow = (group, guest = {}) => ({ key: ++guestKey, group, _id: guest._id, name: guest.name || '', category: guest.category || '', response: guestResponse(guest) });
// Convites antigos podem nao ter a lista de pessoas: ela sai do nome ("Maria; João").
const guestRows = item => (item.guests?.length ? item.guests : item.name.split(';').map(name => ({ name: name.trim() })).filter(guest => guest.name)).map(guest => guestRow(isChild(guest.category) ? 'child' : 'adult', guest));
// Chips da listagem: totais por tipo vindos do backend (summary.categories).
const categoryTotals = (categories = {}) => {
  const total = key => categories[key] || 0;
  return [[total('man'), 'Homens'], [total('woman'), 'Mulheres'], ...CHILD_CATEGORIES.map(item => [total(item.value), item.label]), ...(categories.unknown ? [[categories.unknown, 'Tipo não informado']] : [])];
};
const brDate = value => value ? value.split('-').reverse().join('/') : '';
const yearStart = () => `${new Date().getFullYear()}-01-01`;

// Colunas configuraveis da listagem (o id tambem e o campo de ordenacao do backend, SORT_FIELDS).
// hidden: comeca desmarcada no seletor de colunas. Selecao e Acoes ficam fixas nas pontas.
const COLUMNS = [
  { id: 'side', label: 'Parte', render: item => optionLabel(SIDES, item.side) },
  { id: 'relationship', label: 'Parentesco', render: item => optionLabel(RELATIONSHIPS, item.relationship) },
  { id: 'name', label: 'Nomes', render: (item, row) => <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, ml: -1 }}>
    <IconButton size="small" aria-label={`${row.expanded ? 'Ocultar' : 'Ver'} as pessoas de ${item.name}`} aria-expanded={row.expanded} onClick={row.toggle} sx={{ color: 'text.secondary', transition: 'transform .2s', transform: row.expanded ? 'rotate(180deg)' : 'none' }}><KeyboardArrowDownRounded fontSize="small" /></IconButton>
    <span>{item.name}</span>
  </Box> },
  { id: 'type', label: 'Tipo', render: item => typeLabel(item.type) },
  { id: 'table', label: 'Mesa', render: item => item.table || '-' },
  { id: 'whatsapp', label: 'WhatsApp', hidden: true, render: item => item.whatsapp ? <Link href={`https://wa.me/55${item.whatsapp}`} target="_blank" rel="noopener noreferrer" underline="hover">{whatsappMask(item.whatsapp)}</Link> : '-' },
  { id: 'description', label: 'Descrição', render: item => item.description || '-' },
  { id: 'createdAt', label: 'Data de criação', hidden: true, render: item => new Date(item.createdAt).toLocaleDateString('pt-BR') },
  { id: 'status', label: 'Status', hidden: true, render: (item, row) => <StatusChip status={STATUSES[item.status] || STATUSES.not_viewed} onClick={row.toggle} expanded={row.expanded} label={`${(STATUSES[item.status] || STATUSES.not_viewed).label}: ${row.expanded ? 'ocultar' : 'ver'} as pessoas de ${item.name}`} /> },
  { id: 'confirmedAt', label: 'Data de confirmação', hidden: true, render: item => item.confirmedAt ? new Date(item.confirmedAt).toLocaleString('pt-BR') : '-' }
];
const COLUMN_IDS = COLUMNS.map(column => column.id);
const columnOf = id => COLUMNS.find(column => column.id === id);
// Ordem e colunas ocultas ficam no navegador de quem usa o painel (so conveniencia: sem storage, vale o padrao).
const COLUMNS_KEY = 'painel.convites.colunas';
const defaultColumns = () => ({ order: [...COLUMN_IDS], hidden: COLUMNS.filter(column => column.hidden).map(column => column.id) });
function loadColumns() {
  try {
    const saved = JSON.parse(localStorage.getItem(COLUMNS_KEY) || 'null');
    if (!saved || !Array.isArray(saved.order) || !Array.isArray(saved.hidden)) return defaultColumns();
    const known = [...new Set(saved.order)].filter(id => COLUMN_IDS.includes(id));
    // Coluna criada depois do que foi salvo entra no fim, com a visibilidade padrao.
    const added = COLUMN_IDS.filter(id => !known.includes(id));
    const order = [...known, ...added];
    const hidden = [...new Set([...saved.hidden.filter(id => known.includes(id)), ...added.filter(id => columnOf(id).hidden)])];
    return hidden.length < order.length ? { order, hidden } : defaultColumns();
  } catch { return defaultColumns(); }
}
function saveColumns(columns) {
  try { localStorage.setItem(COLUMNS_KEY, JSON.stringify(columns)); } catch { /* sem storage: vale so nesta visita */ }
}

// Icone de ordenacao no fim da coluna, sempre visivel e bem suave; um pouco mais forte na coluna ordenada.
const sortLabel = {
  flex: 1, justifyContent: 'space-between', gap: 1,
  '& .MuiTableSortLabel-icon': { fontSize: 16, mx: 0, opacity: .3, color: 'text.secondary' },
  '&:hover .MuiTableSortLabel-icon': { opacity: .55 },
  '&.Mui-active .MuiTableSortLabel-icon': { opacity: .6, color: 'text.secondary' }
};
// A–Z / Z–A no cabecalho da tabela: controle segmentado em pilula.
const segmented = {
  p: .25, gap: .25, borderRadius: 999, bgcolor: 'action.hover',
  '& .MuiToggleButtonGroup-grouped': { border: 0, borderRadius: '999px !important', m: 0, px: 1.5, py: .25, fontWeight: 600, fontSize: 13, textTransform: 'none', color: 'text.secondary' },
  '& .MuiToggleButtonGroup-grouped.Mui-selected, & .MuiToggleButtonGroup-grouped.Mui-selected:hover': { bgcolor: 'background.paper', color: 'primary.main', boxShadow: '0 1px 3px rgba(20, 35, 28, .14)' }
};
// Cursor de arrastar (maozinha) na cor do tema, com contorno branco; sem suporte a cursor em SVG, usa o grab do sistema.
const HAND_PATH = 'M21.5 4c-.83 0-1.5.67-1.5 1.5v5c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-8c0-.83-.67-1.5-1.5-1.5S16 1.67 16 2.5v8c0 .28-.22.5-.5.5s-.5-.22-.5-.5v-9c0-.83-.67-1.5-1.5-1.5S12 .67 12 1.5v8.99c0 .28-.22.5-.5.5s-.5-.22-.5-.5V4.5c0-.83-.67-1.5-1.5-1.5S8 3.67 8 4.5v11.41l-4.12-2.35c-.58-.33-1.3-.24-1.78.22-.6.58-.62 1.54-.03 2.13l6.78 6.89c.75.77 1.77 1.2 2.85 1.2H19c2.21 0 4-1.79 4-4V5.5c0-.83-.67-1.5-1.5-1.5';
const handCursor = `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="-1.5 -1.5 27 27"><path d="${HAND_PATH}" fill="#214938" stroke="#fff" stroke-width="1.6" paint-order="stroke" stroke-linejoin="round"/></svg>`)}") 12 12, grab`;
// Paginacao: botoes arredondados, pagina atual na cor do tema e seletor de tamanho em pilula.
const pager = {
  '& .MuiPaginationItem-root': { borderRadius: 2, fontWeight: 600, color: 'text.secondary', minWidth: 34, height: 34 },
  '& .MuiPaginationItem-root:not(.Mui-selected):hover': { bgcolor: theme => alpha(theme.palette.primary.main, .08), color: 'primary.main' },
  '& .MuiPaginationItem-root.Mui-selected': { color: 'primary.contrastText', boxShadow: '0 2px 6px rgba(20, 35, 28, .2)' }
};
const pageSize = { minWidth: 150, '& .MuiOutlinedInput-root': { borderRadius: 999, fontSize: 14, bgcolor: 'action.hover' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' } };
const softPaper = { mt: 1, borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: '0 16px 40px rgba(20, 35, 28, .14)' };

function InvitationUrlModal({ url, onClose, notify }) {
  if (!url) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); notify('success', 'URL do convite copiada com sucesso.'); }
    catch { notify('danger', 'Não foi possível copiar a URL.'); }
  };
  return <CrudDialog title="Visualizar convite" onClose={onClose} actions={<><Button onClick={onClose}>Fechar</Button><Button onClick={copy}>Copiar URL</Button><Button variant="contained" component="a" target="_blank" rel="noreferrer" href={url}>Abrir convite</Button></>}>
    <TextField fullWidth label="URL pública do convite" value={url} slotProps={{ input: { readOnly: true } }} sx={{ mt: 1 }} />
  </CrudDialog>;
}

// Texto so para leitor de tela. Medidas em 'px': no sx, numeros ate 1 viram porcentagem (1 = 100%).
const visuallyHidden = { position: 'absolute', width: '1px', height: '1px', m: '-1px', p: 0, border: 0, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' };

// Campos da tabela sem sublinhado e no mesmo tamanho de texto das celulas, alinhados com o cabecalho.
const cellField = { '& .MuiInputBase-root': { fontSize: '.875rem' }, '& .MuiInputBase-input': { py: .5 } };
const cellInput = { disableUnderline: true };
// Tabela de adultos ou de criancas do convite, com o botao de adicionar embaixo.
function GuestTable({ title, group, categories, typeLabel, addLabel, form, setForm, saving, onRemove }) {
  const rows = form.guests.filter(guest => guest.group === group);
  const change = (key, values) => setForm(current => ({ ...current, guests: current.guests.map(guest => guest.key === key ? { ...guest, ...values } : guest) }));
  const add = () => setForm(current => ({ ...current, guests: [...current.guests, guestRow(group)] }));
  return <Box>
    <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, mb: 1 }}>{title}</Typography>
    {/* Sem scroll proprio: layout fixo cabe na largura do modal e so o modal rola. */}
    <TableContainer sx={{ border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'visible' }}><Table size="small" aria-label={title} sx={{ tableLayout: 'fixed' }}>
      <TableHead><TableRow><TableCell>Nome</TableCell><TableCell sx={{ width: { xs: '32%', sm: 220 } }}>{typeLabel}</TableCell><TableCell sx={{ width: { xs: '30%', sm: 170 } }}>Presença</TableCell><TableCell sx={{ width: 48 }}><Box component="span" sx={visuallyHidden}>Remover</Box></TableCell></TableRow></TableHead>
      <TableBody>
        {rows.map((guest, index) => <TableRow key={guest.key}>
          <TableCell><TextField required fullWidth size="small" variant="standard" sx={cellField} placeholder="Nome" value={guest.name} disabled={saving} onChange={event => change(guest.key, { name: event.target.value })} slotProps={{ input: cellInput, htmlInput: { maxLength: 120, 'aria-label': `Nome — ${title} ${index + 1}` } }} /></TableCell>
          <TableCell><TextField select required fullWidth size="small" variant="standard" sx={cellField} value={guest.category} disabled={saving} onChange={event => change(guest.key, { category: event.target.value })} slotProps={{ input: cellInput, select: { displayEmpty: true, SelectDisplayProps: { 'aria-label': `${typeLabel} — ${title} ${index + 1}` } } }}><MenuItem value="" disabled>Selecione</MenuItem>{categories.map(item => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField></TableCell>
          <TableCell><StatusChip status={guestStatus(guest, form.viewed)} /></TableCell>
          <TableCell padding="checkbox"><IconButton size="small" aria-label={`Remover ${guest.name || `${title} ${index + 1}`}`} disabled={saving} onClick={() => onRemove(guest, title)}><DeleteOutlined fontSize="small" /></IconButton></TableCell>
        </TableRow>)}
        {!rows.length && <TableRow><TableCell colSpan={4} sx={{ color: 'text.secondary' }}>Ninguém cadastrado.</TableCell></TableRow>}
      </TableBody>
    </Table></TableContainer>
    <Button variant="outlined" size="small" startIcon={<PersonAddAlt1Outlined />} disabled={saving} onClick={add} sx={{ mt: 1.5 }}>{addLabel}</Button>
  </Box>;
}

function InvitationFormModal({ editing, form, setForm, saving, error, deadlineLimit, onClose, onSubmit }) {
  // Quem ja esta salvo no banco (tem _id) so sai com confirmacao e entra em form.removed para o "Desfazer",
  // que devolve o ultimo na mesma posicao. Linha nova, ainda nao salva, sai direto.
  const [removing, setRemoving] = useState(null);
  const requestRemove = (guest, table) => {
    if (guest._id) setRemoving({ guest, table });
    else setForm(current => ({ ...current, guests: current.guests.filter(item => item.key !== guest.key) }));
  };
  const confirmRemove = () => {
    const key = removing.guest.key;
    setForm(current => {
      const index = current.guests.findIndex(guest => guest.key === key);
      if (index < 0) return current;
      return { ...current, guests: current.guests.filter(guest => guest.key !== key), removed: [...current.removed, { guest: current.guests[index], index }] };
    });
    setRemoving(null);
  };
  const undo = () => setForm(current => {
    const last = current.removed[current.removed.length - 1];
    if (!last) return current;
    const guests = [...current.guests];
    guests.splice(Math.min(last.index, guests.length), 0, last.guest);
    return { ...current, guests, removed: current.removed.slice(0, -1) };
  });
  const removingName = removing?.guest.name.trim();
  const removingAnswer = removing && GUEST_STATUSES[removing.guest.response];
  return <CrudDialog title={editing ? 'Editar convite' : 'Novo convite'} busy={saving} onClose={onClose} onSubmit={onSubmit}
    headerAction={form.removed.length > 0 && <Button size="small" variant="contained" color="error" startIcon={<RestoreRounded />} disabled={saving} onClick={undo}>Desfazer</Button>}
    actions={<><Button disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Gerar convite'}</Button></>}>
    <Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <GuestTable title="Adultos" group="adult" categories={ADULT_CATEGORIES} typeLabel="Sexo" addLabel="Adicionar pessoa" form={form} setForm={setForm} saving={saving} onRemove={requestRemove} />
      <GuestTable title="Crianças" group="child" categories={CHILD_CATEGORIES} typeLabel="Idade" addLabel="Adicionar criança" form={form} setForm={setForm} saving={saving} onRemove={requestRemove} />
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }} aria-label="Total de convidados por tipo">{countsOf(form.guests).map(([value, label]) => <Chip key={label} size="small" variant="outlined" label={`${label}: ${value}`} />)}</Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
        <TextField select required label="Parte" value={form.side} disabled={saving} onChange={event => setForm({ ...form, side: event.target.value })}>{SIDES.map(item => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField>
        <TextField select required label="Parentesco" value={form.relationship} disabled={saving} onChange={event => setForm({ ...form, relationship: event.target.value })}>{RELATIONSHIPS.map(item => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField>
        <TextField label="Mesa" value={form.table} disabled={saving} onChange={event => setForm({ ...form, table: event.target.value })} placeholder="Ex.: 12" slotProps={{ htmlInput: { maxLength: 50 } }} />
      </Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <TextField select label="Tipo do convite" value={form.type} disabled={saving} onChange={event => setForm({ ...form, type: event.target.value })}><MenuItem value="in_person">Presencial</MenuItem><MenuItem value="virtual">Virtual</MenuItem></TextField>
        <TextField label="WhatsApp" value={form.whatsapp} disabled={saving} onChange={event => setForm({ ...form, whatsapp: whatsappMask(event.target.value) })} placeholder="(44) 99883-3731"
          error={!whatsappValid(form.whatsapp)} helperText={whatsappValid(form.whatsapp) ? undefined : 'Informe o número com DDD.'}
          slotProps={{ htmlInput: { inputMode: 'tel', autoComplete: 'tel-national', maxLength: 15 }, input: { startAdornment: <InputAdornment position="start"><WhatsApp fontSize="small" sx={{ color: '#25d366' }} /></InputAdornment> } }} />
      </Box>
      <DateField label="Data limite para confirmação" value={form.confirmationDeadline} maxDate={deadlineLimit || undefined} disabled={saving} onChange={value => setForm(current => ({ ...current, confirmationDeadline: value }))}
        helperText={deadlineLimit ? `Aparece no convite para os convidados. Deve ser até ${brDate(deadlineLimit)}; em branco, usa ${brDate(deadlineLimit)}.` : 'Aparece no convite para os convidados.'} />
      <TextField label="Descrição" multiline minRows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} slotProps={{ htmlInput: { maxLength: 1000 } }} />
    </Stack>
    <ConfirmDialog open={Boolean(removing)} title="Remover convidado?" confirmLabel="Remover" description={`Deseja remover ${removingName || `esta linha de ${removing?.table.toLowerCase() || ''}`} do convite?${removingAnswer ? ` Essa pessoa já respondeu: ${removingAnswer.label}.` : ''} A alteração só vale depois de salvar, e você pode desfazer pelo botão Desfazer.`} onCancel={() => setRemoving(null)} onConfirm={confirmRemove} />
  </CrudDialog>;
}

const emptyForm = deadline => ({ side: '', relationship: '', table: '', whatsapp: '', guests: [guestRow('adult')], removed: [], viewed: false, description: '', type: 'in_person', confirmationDeadline: deadline });

export function InvitationsPage() {
  const route = useLocation(); const navigate = useNavigate();
  const [items, setItems] = useState([]);
  // Periodo padrao: do inicio do ano ate a data do casamento (que chega com /public/wedding).
  const [filters, setFilters] = useState({ startDate: yearStart(), endDate: '' });
  const [filtersReady, setFiltersReady] = useState(false);
  // Mais novos primeiro, como antes da ordenacao por coluna.
  const [sort, setSort] = useState({ by: 'createdAt', order: 'desc' });
  const [columns, setColumns] = useState(loadColumns);
  const [columnsMenu, setColumnsMenu] = useState(null);
  const [drag, setDrag] = useState(null);
  const [dropAt, setDropAt] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ total: 0, inPerson: 0, virtual: 0, people: 0, confirmed: 0, declined: 0, maybe: 0, unconfirmed: 0 });
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(() => ({ ...emptyForm(''), guests: [] }));
  // Ultimo dia para confirmar (wedding.rsvpDeadline no backend): limite e valor inicial do campo.
  const [deadlineLimit, setDeadlineLimit] = useState('');
  useEffect(() => {
    api.get('/public/wedding').then(response => {
      const wedding = response.data.data;
      setDeadlineLimit(wedding.rsvpDeadline || '');
      const weddingDate = typeof wedding.datetime === 'string' ? wedding.datetime.slice(0, 10) : '';
      if (weddingDate) setFilters(current => current.endDate ? current : { ...current, endDate: weddingDate });
    }).catch(() => {}).finally(() => setFiltersReady(true));
  }, []);
  const [notification, setNotification] = useState(null);
  const notify = (type, message) => setNotification({ type, message });
  const [card, setCard] = useState(null);
  // Modelo padrao escolhido em "Configuracoes do convite": vale para imprimir e para o link.
  const layoutName = INVITE_LAYOUTS.find(item => item.layout === card?.layout)?.name || '';
  const [cardOpen, setCardOpen] = useState(false);
  const [printJob, setPrintJob] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
  const [selected, setSelected] = useState(() => new Map());
  const [preparing, setPreparing] = useState(false);
  useEffect(() => { api.get('/invitation-card').then(response => setCard(response.data.data)).catch(() => notify('danger', 'Não foi possível carregar as configurações do convite.')); }, []);
  // Convites criados antes do link impresso ganham o codigo aqui, uma unica vez.
  const withCodes = async list => {
    const missing = list.filter(item => !item.code).map(item => item._id);
    if (!missing.length) return list;
    const codes = (await api.post('/invitations/codes', { ids: missing })).data.data;
    const update = item => codes[item._id] ? { ...item, code: codes[item._id] } : item;
    setItems(current => current.map(update));
    setSelected(current => new Map([...current].map(([id, item]) => [id, update(item)])));
    return list.map(update);
  };
  const startPrint = async (layout, list) => {
    if (!card) { notify('danger', 'As configurações do convite ainda não carregaram.'); return; }
    setPreparing(true);
    try { setPrintJob({ layout, invitations: await withCodes(list) }); }
    catch { notify('danger', 'Não foi possível gerar o link dos convites.'); }
    finally { setPreparing(false); }
  };
  const linkOf = async item => card ? inviteLink(card, (await withCodes([item]))[0].code) : null;
  const viewLink = async item => { try { setViewing(await linkOf(item)); } catch { notify('danger', 'Não foi possível gerar o link do convite.'); } };
  const copyLink = async item => {
    try { await navigator.clipboard.writeText(await linkOf(item)); notify('success', 'Link do convite copiado.'); }
    catch { notify('danger', 'Não foi possível copiar o link.'); }
  };
  const toggle = item => setSelected(current => { const next = new Map(current); if (next.has(item._id)) next.delete(item._id); else next.set(item._id, item); return next; });
  const pageSelected = items.length > 0 && items.every(item => selected.has(item._id));
  const togglePage = () => setSelected(current => { const next = new Map(current); items.forEach(item => pageSelected ? next.delete(item._id) : next.set(item._id, item)); return next; });
  // Ordem da lista (mais novos primeiro), mesmo com convites marcados em paginas diferentes.
  const selectedInOrder = () => [...selected.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const rowAction = action => { const item = rowMenu.item; setRowMenu(null); action(item); };

  // Colunas: visibilidade pelo seletor, ordem por arrastar e soltar (no cabecalho ou no seletor).
  useEffect(() => saveColumns(columns), [columns]);
  const visibleColumns = columns.order.filter(id => !columns.hidden.includes(id)).map(columnOf);
  const toggleColumn = id => setColumns(current => current.hidden.includes(id)
    ? { ...current, hidden: current.hidden.filter(item => item !== id) }
    : current.order.length - current.hidden.length > 1 ? { ...current, hidden: [...current.hidden, id] } : current);
  const moveColumn = (from, to, after) => setColumns(current => {
    if (from === to) return current;
    const order = current.order.filter(id => id !== from);
    order.splice(order.indexOf(to) + (after ? 1 : 0), 0, from);
    return { ...current, order };
  });
  const endDrag = () => { setDrag(null); setDropAt(null); };
  // axis 'x' = cabecalho da tabela (solta antes/depois pela metade da largura); 'y' = lista do seletor.
  const dragProps = (id, axis) => ({
    draggable: true,
    onDragStart: event => { setDrag(id); event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', id); },
    onDragOver: event => {
      if (!drag || drag === id) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const box = event.currentTarget.getBoundingClientRect();
      const after = axis === 'x' ? event.clientX > box.left + box.width / 2 : event.clientY > box.top + box.height / 2;
      setDropAt(current => current?.id === id && current.after === after ? current : { id, after });
    },
    onDragLeave: event => { if (!event.currentTarget.contains(event.relatedTarget)) setDropAt(current => current?.id === id ? null : current); },
    onDrop: event => { event.preventDefault(); if (drag && drag !== id) moveColumn(drag, id, dropAt?.id === id && dropAt.after); endDrag(); },
    onDragEnd: endDrag
  });
  // Linha na cor do tema mostrando onde a coluna vai entrar.
  const dropMark = (id, axis) => dropAt?.id === id
    ? { boxShadow: theme => axis === 'x' ? `inset ${dropAt.after ? -3 : 3}px 0 0 ${theme.palette.primary.main}` : `inset 0 ${dropAt.after ? -2 : 2}px 0 ${theme.palette.primary.main}` }
    : {};

  useEffect(() => { if (!notification) return; const id = setTimeout(() => setNotification(null), 4500); return () => clearTimeout(id); }, [notification]);
  const load = () => {
    setLoading(true);
    api.get('/invitations', { params: { ...filters, page: pagination.page, limit: pagination.limit, sortBy: sort.by, sortOrder: sort.order } })
      .then(response => { setItems(response.data.data.data); setPagination(current => ({ ...current, ...response.data.data.pagination })); setSummary(response.data.data.summary); })
      .catch(() => notify('danger', 'Não foi possível carregar os convites.'))
      .finally(() => setLoading(false));
  };
  // So busca depois de saber a data do casamento (fim do periodo padrao).
  useEffect(() => { if (filtersReady) load(); }, [filtersReady, filters, pagination.page, pagination.limit, sort]);
  // Clicar na coluna ordenada inverte a direcao; outra coluna comeca crescente. Volta para a primeira pagina.
  const sortBy = key => { setPagination(current => ({ ...current, page: 1 })); setSort(current => ({ by: key, order: current.by === key && current.order === 'asc' ? 'desc' : 'asc' })); };
  // A–Z / Z–A ordena pelos nomes; desmarcar volta para os mais novos primeiro.
  const alphabetical = sort.by === 'name' ? sort.order : null;
  const setAlphabetical = order => { setPagination(current => ({ ...current, page: 1 })); setSort(order ? { by: 'name', order } : { by: 'createdAt', order: 'desc' }); };
  const applyFilter = values => { setPagination(current => ({ ...current, page: 1 })); setFilters(current => ({ ...current, ...values })); };
  const openNew = () => { setEditing(null); setForm(emptyForm(deadlineLimit)); setFormError(''); setFormOpen(true); };
  const openEdit = item => { setEditing(item); setForm({ side: item.side || '', relationship: item.relationship || '', table: item.table || '', whatsapp: whatsappMask(item.whatsapp), guests: guestRows(item), removed: [], viewed: Boolean(item.status) && item.status !== 'not_viewed', description: item.description || '', type: item.type || 'in_person', confirmationDeadline: item.confirmationDeadline ? item.confirmationDeadline.slice(0, 10) : deadlineLimit }); setFormError(''); setFormOpen(true); };
  // Convite novo ou antigo sem data: o campo vem com a data padrao, mesmo que ela chegue depois do formulario abrir.
  useEffect(() => { if (deadlineLimit && formOpen) setForm(current => current.confirmationDeadline ? current : { ...current, confirmationDeadline: deadlineLimit }); }, [deadlineLimit]);
  useEffect(() => {
    let active = true;
    setEditLoading(false);
    if (route.pathname === '/convites/novo') openNew();
    else if (/^\/convites\/[^/]+\/editar$/.test(route.pathname)) {
      const id = route.pathname.split('/')[2];
      setEditLoading(true); setFormOpen(false);
      api.get('/invitations/' + id).then(response => { if (active) openEdit(response.data.data); }).catch(() => { if (active) { notify('danger', 'Não foi possível carregar o convite.'); navigate('/convites', { replace: true }); } }).finally(() => { if (active) setEditLoading(false); });
    } else setFormOpen(false);
    return () => { active = false; };
  }, [route.pathname]);
  const submit = async event => {
    event.preventDefault(); if (saving) return;
    if (!form.side || !form.relationship) { setFormError('Selecione a parte e o parentesco do convite.'); return; }
    if (!form.guests.length) { setFormError('Adicione pelo menos uma pessoa ao convite.'); return; }
    if (form.guests.some(guest => !guest.name.trim() || !guest.category)) { setFormError('Informe o nome e o tipo de cada convidado.'); return; }
    if (!whatsappValid(form.whatsapp)) { setFormError('Informe o WhatsApp com DDD, ex.: (44) 99883-3731.'); return; }
    if (deadlineLimit && form.confirmationDeadline > deadlineLimit) { setFormError(`A data limite deve ser até ${brDate(deadlineLimit)}.`); return; }
    setSaving(true); setFormError('');
    // Adultos primeiro e depois os filhos: e a ordem dos nomes no convite.
    const guests = ['adult', 'child'].flatMap(group => form.guests.filter(guest => guest.group === group)).map(({ _id, name, category }) => ({ ...(_id && { _id }), name: name.trim(), category }));
    const payload = { side: form.side, relationship: form.relationship, table: form.table.trim(), whatsapp: form.whatsapp.replace(/\D/g, ''), guests, description: form.description, type: form.type, confirmationDeadline: form.confirmationDeadline };
    try {
      const response = editing ? await api.put('/invitations/' + editing._id, payload) : await api.post('/invitations', payload);
      setFormOpen(false); setEditing(null); navigate('/convites'); load();
      if (editing) notify('success', 'Convite atualizado com sucesso.');
      else { if (card) setViewing(inviteLink(card, response.data.data.code)); notify('success', 'Convite criado com sucesso.'); }
    } catch (error) { const data = error.response?.data; setFormError(Object.values(data?.errors || {}).flat()[0] || data?.message || 'Não foi possível salvar o convite.'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    setSaving(true);
    try { await api.delete('/invitations/' + deleting._id); setSelected(current => { const next = new Map(current); next.delete(deleting._id); return next; }); setDeleting(null); load(); notify('success', 'Convite excluído com sucesso.'); }
    catch { notify('danger', 'Não foi possível excluir o convite.'); }
    finally { setSaving(false); }
  };

  const closeForm = () => { setFormOpen(false); navigate('/convites'); };
  const span = visibleColumns.length + 2;
  const visibleCount = columns.order.length - columns.hidden.length;
  return <>
    <Snackbar open={Boolean(notification)} autoHideDuration={4500} onClose={() => setNotification(null)}><Alert severity={notification?.type === 'danger' ? 'error' : 'success'} onClose={() => setNotification(null)}>{notification?.message}</Alert></Snackbar>
    <InvitationUrlModal url={viewing} onClose={() => setViewing(null)} notify={notify} />
    <PageHeader title="Convites" subtitle="Gerencie os convites e confirmações de presença." action={<Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}><Button variant="outlined" startIcon={<SettingsOutlined />} disabled={!card} onClick={() => setCardOpen(true)}>Configurações do convite</Button><Button variant="contained" startIcon={<Add />} onClick={() => navigate('/convites/novo')}>Novo convite</Button></Stack>} />
    <Paper sx={{ p: 2, mb: 2 }}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: '2fr repeat(4, 1fr)' }, gap: 2 }}>
      <TextField label="Nome" size="small" value={filters.name || ''} onChange={event => applyFilter({ name: event.target.value })} />
      <TextField select label="Status" size="small" value={filters.status || ''} onChange={event => applyFilter({ status: event.target.value })}><MenuItem value="">Todos</MenuItem>{Object.entries(STATUSES).map(([value, status]) => <MenuItem key={value} value={value}>{status.label}</MenuItem>)}</TextField>
      <TextField select label="Tipo" size="small" value={filters.type || ''} onChange={event => applyFilter({ type: event.target.value })}><MenuItem value="">Todos</MenuItem><MenuItem value="in_person">Presencial</MenuItem><MenuItem value="virtual">Virtual</MenuItem></TextField>
      <DateField size="small" label="Data inicial" value={filters.startDate} maxDate={filters.endDate || undefined} onChange={value => applyFilter({ startDate: value })} />
      <DateField size="small" label="Data final" value={filters.endDate} minDate={filters.startDate || undefined} onChange={value => applyFilter({ endDate: value })} />
    </Box></Paper>
    {selected.size > 0 && <Paper sx={{ p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }} role="region" aria-label="Convites selecionados">
      <Typography sx={{ mr: 'auto' }}>{selected.size === 1 ? '1 convite selecionado' : `${selected.size} convites selecionados`}</Typography>
      <Button onClick={() => setSelected(new Map())}>Limpar seleção</Button>
      <Button variant="contained" startIcon={preparing ? <CircularProgress size={16} color="inherit" /> : <PrintOutlined />} disabled={preparing || !card} onClick={() => void startPrint(card.layout, selectedInOrder())}>Imprimir em lote{layoutName ? ` — ${layoutName}` : ''}</Button>
    </Paper>}
    <Paper>
      {/* Cabecalho da tabela: total, ordem alfabetica e seletor de colunas. */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ mr: 'auto' }}>
          <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700, lineHeight: 1.3 }}>Lista de convites</Typography>
          <Typography variant="body2" color="text.secondary">{pagination.total === 1 ? '1 convite no período' : `${pagination.total} convites no período`}</Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <SortByAlphaRounded fontSize="small" sx={{ color: 'text.secondary' }} aria-hidden />
          <Typography id="ordem-alfabetica" variant="body2" color="text.secondary">Ordem alfabética</Typography>
          <ToggleButtonGroup size="small" exclusive value={alphabetical} onChange={(_, value) => setAlphabetical(value)} aria-labelledby="ordem-alfabetica" sx={segmented}>
            <ToggleButton value="asc" aria-label="Nomes de A a Z">A–Z</ToggleButton>
            <ToggleButton value="desc" aria-label="Nomes de Z a A">Z–A</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Button variant="outlined" size="small" startIcon={<ViewColumnRounded />} aria-haspopup="dialog" aria-expanded={Boolean(columnsMenu)} onClick={event => setColumnsMenu(event.currentTarget)}>Colunas</Button>
      </Box>
      <TableContainer><Table aria-label="Convites"><TableHead><TableRow>
        <TableCell padding="checkbox"><Checkbox checked={pageSelected} indeterminate={!pageSelected && items.some(item => selected.has(item._id))} disabled={!items.length} onChange={togglePage} slotProps={{ input: { 'aria-label': 'Selecionar os convites desta página' } }} /></TableCell>
        {visibleColumns.map(column => <TableCell key={column.id} {...dragProps(column.id, 'x')} sortDirection={sort.by === column.id ? sort.order : false} title="Arraste para mudar a coluna de lugar"
          sx={{ whiteSpace: 'nowrap', cursor: handCursor, userSelect: 'none', opacity: drag === column.id ? .45 : 1, ...dropMark(column.id, 'x'), '&:hover .arrastar': { opacity: .45 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: .25 }}>
            <DragIndicatorRounded className="arrastar" aria-hidden sx={{ fontSize: 16, ml: -1, color: 'text.secondary', opacity: 0, transition: 'opacity .15s' }} />
            <TableSortLabel active={sort.by === column.id} direction={sort.by === column.id ? sort.order : 'asc'} IconComponent={sort.by === column.id ? ArrowUpwardRounded : UnfoldMoreRounded} onClick={() => sortBy(column.id)} sx={sortLabel}>{column.label}</TableSortLabel>
          </Box>
        </TableCell>)}
        <TableCell sx={{ whiteSpace: 'nowrap' }}>Ações</TableCell>
      </TableRow></TableHead><TableBody>
        {loading ? <TableRow><TableCell colSpan={span} align="center"><CircularProgress size={28} aria-label="Carregando convites" /></TableCell></TableRow> : !items.length ? <TableRow><TableCell colSpan={span} align="center" sx={{ py: 6 }}>Nenhum convite encontrado.</TableCell></TableRow> : items.map(item => {
          const expanded = expandedId === item._id;
          const row = { expanded, toggle: () => setExpandedId(expanded ? null : item._id) };
          const viewed = item.status !== 'not_viewed';
          return <Fragment key={item._id}>
            <TableRow hover selected={selected.has(item._id)}>
              <TableCell padding="checkbox"><Checkbox checked={selected.has(item._id)} onChange={() => toggle(item)} slotProps={{ input: { 'aria-label': `Selecionar ${item.name}` } }} /></TableCell>
              {visibleColumns.map(column => <TableCell key={column.id}>{column.render(item, row)}</TableCell>)}
              <TableCell sx={{ whiteSpace: 'nowrap' }}><Button size="small" variant="outlined" endIcon={<ExpandMore />} aria-haspopup="menu" aria-expanded={rowMenu?.item._id === item._id} aria-label={`Ações de ${item.name}`} onClick={event => setRowMenu({ anchor: event.currentTarget, item })}>Ações</Button></TableCell>
            </TableRow>
            <TableRow><TableCell colSpan={span} sx={{ py: 0, borderBottom: expanded ? undefined : 0 }}><Collapse in={expanded} unmountOnExit><Box sx={{ p: 2 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', mb: 1 }}><Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>Pessoas do convite</Typography><StatusChip status={STATUSES[item.status] || STATUSES.not_viewed} /></Stack>
              <Table size="small" aria-label={`Pessoas de ${item.name}`}><TableHead><TableRow><TableCell>Pessoa</TableCell><TableCell>Tipo</TableCell><TableCell>Respondido em</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>
                {(item.guests || []).map(guest => { const answeredAt = guest.respondedAt || guest.confirmedAt; return <TableRow key={guest._id}><TableCell>{guest.name}</TableCell><TableCell>{categoryLabel(guest.category)}</TableCell><TableCell>{answeredAt ? new Date(answeredAt).toLocaleString('pt-BR') : '-'}</TableCell><TableCell><StatusChip status={guestStatus(guest, viewed)} /></TableCell></TableRow>; })}
                {!item.guests?.length && <TableRow><TableCell colSpan={4}>Nenhuma pessoa cadastrada.</TableCell></TableRow>}
              </TableBody></Table>
            </Box></Collapse></TableCell></TableRow>
          </Fragment>;
        })}
      </TableBody></Table></TableContainer>
      <Popover open={Boolean(columnsMenu)} anchorEl={columnsMenu} onClose={() => { setColumnsMenu(null); endDrag(); }} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }} slotProps={{ paper: { sx: { ...softPaper, width: 290 } } }}>
        <Box sx={{ px: 2, pt: 1.75, pb: 1 }}>
          <Typography variant="subtitle2" component="h2" sx={{ fontWeight: 700 }}>Colunas</Typography>
          <Typography variant="caption" color="text.secondary">Marque para exibir e arraste para mudar a ordem.</Typography>
        </Box>
        <List dense disablePadding aria-label="Colunas da tabela">
          {columns.order.map(id => {
            const column = columnOf(id);
            const visible = !columns.hidden.includes(id);
            const locked = visible && visibleCount === 1;
            return <ListItem key={id} disablePadding {...dragProps(id, 'y')} sx={{ opacity: drag === id ? .45 : 1, ...dropMark(id, 'y') }}>
              <ListItemButton onClick={() => toggleColumn(id)} disabled={locked} sx={{ py: .25, pl: 1, borderRadius: 2, mx: .5 }}>
                <ListItemIcon sx={{ minWidth: 24, cursor: handCursor, color: 'text.disabled' }}><DragIndicatorRounded fontSize="small" /></ListItemIcon>
                <Checkbox edge="start" size="small" checked={visible} tabIndex={-1} disableRipple slotProps={{ input: { 'aria-labelledby': `coluna-${id}` } }} />
                <ListItemText id={`coluna-${id}`} primary={column.label} secondary={locked ? 'Pelo menos uma coluna fica visível' : undefined} />
              </ListItemButton>
            </ListItem>;
          })}
        </List>
        <Divider sx={{ mt: .5 }} />
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'flex-end' }}><Button size="small" startIcon={<RestartAltRounded />} onClick={() => setColumns(defaultColumns())}>Restaurar padrão</Button></Box>
      </Popover>
      <Menu anchorEl={rowMenu?.anchor} open={Boolean(rowMenu)} onClose={() => setRowMenu(null)}>
        <MenuItem onClick={() => rowAction(viewLink)}><ListItemIcon><VisibilityOutlined fontSize="small" /></ListItemIcon><ListItemText>Visualizar link</ListItemText></MenuItem>
        <MenuItem onClick={() => rowAction(copyLink)}><ListItemIcon><ContentCopyOutlined fontSize="small" /></ListItemIcon><ListItemText>Copiar link</ListItemText></MenuItem>
        <MenuItem onClick={() => rowAction(item => navigate(`/convites/${item._id}/editar`))}><ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon><ListItemText>Editar</ListItemText></MenuItem>
        <MenuItem onClick={() => rowAction(setDeleting)} sx={{ color: 'error.main' }}><ListItemIcon><DeleteOutlined fontSize="small" color="error" /></ListItemIcon><ListItemText>Excluir</ListItemText></MenuItem>
        <Divider />
        <MenuItem disabled={preparing || !card} onClick={() => rowAction(item => void startPrint(card.layout, [item]))}><ListItemIcon><PrintOutlined fontSize="small" /></ListItemIcon><ListItemText secondary={layoutName ? `Modelo ${layoutName}` : undefined}>Imprimir convite</ListItemText></MenuItem>
      </Menu>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', px: 2, pt: 2 }}>{[[summary.total, 'Convites'], [summary.inPerson, 'Presenciais'], [summary.virtual, 'Online'], [summary.people, 'Pessoas'], [summary.confirmed, 'Confirmados'], [summary.declined || 0, 'Não vão'], [summary.maybe || 0, 'Não sabem'], [Math.max(0, summary.people - summary.confirmed - (summary.declined || 0) - (summary.maybe || 0)), 'Sem resposta'], ...categoryTotals(summary.categories)].map(([value, label]) => <Chip key={label} variant="outlined" label={`${label}: ${value}`} />)}</Stack>
      {/* Rodape da tabela: quantos convites aparecem, convites por pagina e paginas numeradas. */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, px: 2, py: 1.5, mt: 2, borderTop: 1, borderColor: 'divider' }}>
        <Typography variant="body2" color="text.secondary" role="status">{pagination.total ? <>Mostrando <Box component="strong" sx={{ color: 'text.primary' }}>{(pagination.page - 1) * pagination.limit + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)}</Box> de <Box component="strong" sx={{ color: 'text.primary' }}>{pagination.total}</Box> {pagination.total === 1 ? 'convite' : 'convites'}</> : 'Nenhum convite para mostrar'}</Typography>
        <Stack direction="row" spacing={2} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField select size="small" value={pagination.limit} onChange={event => setPagination(current => ({ ...current, limit: Number(event.target.value), page: 1 }))} slotProps={{ select: { SelectDisplayProps: { 'aria-label': 'Convites por página' } } }} sx={pageSize}>{[10, 20, 50, 100, 200].map(size => <MenuItem key={size} value={size}>{size} por página</MenuItem>)}</TextField>
          <Pagination count={Math.max(1, pagination.totalPages)} page={pagination.page} onChange={(_, page) => setPagination(current => ({ ...current, page }))} shape="rounded" color="primary" siblingCount={1} sx={pager}
            getItemAriaLabel={(type, page, selectedPage) => type === 'page' ? `${selectedPage ? 'Página atual, ' : 'Ir para a página '}${page}` : { first: 'Primeira página', last: 'Última página', next: 'Próxima página', previous: 'Página anterior' }[type]} />
        </Stack>
      </Box>
    </Paper>
    {editLoading && <CrudDialog title="Carregando convite" onClose={closeForm}><CircularProgress aria-label="Carregando convite" /></CrudDialog>}
    {formOpen && <InvitationFormModal editing={editing} form={form} setForm={setForm} saving={saving} error={formError} deadlineLimit={deadlineLimit} onClose={closeForm} onSubmit={submit} />}
    {cardOpen && card && <InvitationCardSettingsDialog card={card} onClose={() => setCardOpen(false)} onSaved={next => { setCard(next); setCardOpen(false); notify('success', 'Configurações do convite salvas.'); }} />}
    <InvitationPrintDialog job={printJob} card={card} onClose={() => setPrintJob(null)} />
    <ConfirmDialog open={Boolean(deleting)} title="Excluir convite?" description={`Deseja realmente excluir ${deleting?.name || ''}?`} busy={saving} onCancel={() => setDeleting(null)} onConfirm={remove} />
  </>;
}
