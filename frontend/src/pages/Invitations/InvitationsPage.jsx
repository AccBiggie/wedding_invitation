import { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Collapse, Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import PersonAddAlt1Outlined from '@mui/icons-material/PersonAddAlt1Outlined';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import RestoreRounded from '@mui/icons-material/RestoreRounded';
import { PageHeader } from '../../components/common/PageHeader';
import { CrudDialog } from '../../components/common/CrudDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { INVITE_LAYOUTS } from '../../invite-print/convite';
import { inviteLink } from '../../invite-print/inviteData';
import { InvitationPrintDialog } from './InvitationPrintDialog';
import { InvitationCardSettingsDialog } from './InvitationCardSettingsDialog';

const statusLabel = status => status === 'confirmed' ? 'Confirmado' : 'Não confirmado';
const typeLabel = type => type === 'virtual' ? 'Virtual' : 'Presencial';
// Tipos de pessoa do convite (mesmos valores do backend: GUEST_CATEGORIES).
const ADULT_CATEGORIES = [{ value: 'man', label: 'Homem' }, { value: 'woman', label: 'Mulher' }];
const CHILD_CATEGORIES = [{ value: 'girl_0_5', label: 'Menina até 5 anos' }, { value: 'boy_0_5', label: 'Menino até 5 anos' }, { value: 'girl_6_10', label: 'Menina de 6 a 10 anos' }, { value: 'boy_6_10', label: 'Menino de 6 a 10 anos' }, { value: 'over_10', label: 'Maior de 10 anos' }];
// Parte do casal e parentesco do convite (mesmos valores do backend: INVITATION_SIDES e INVITATION_RELATIONSHIPS).
const SIDES = [{ value: 'groom', label: 'Noivo' }, { value: 'bride', label: 'Noiva' }];
const RELATIONSHIPS = [{ value: 'relative', label: 'Parente' }, { value: 'friends', label: 'Amigos' }, { value: 'family', label: 'Família' }, { value: 'parents', label: 'Pais' }, { value: 'organization', label: 'Organização' }];
const categoryLabel = category => [...ADULT_CATEGORIES, ...CHILD_CATEGORIES].find(item => item.value === category)?.label || 'Não informado';
const isChild = category => CHILD_CATEGORIES.some(item => item.value === category);
// Totais por tipo: homens, mulheres e uma contagem por opcao de idade das criancas, com o mesmo texto do campo Idade.
const countsOf = guests => {
  const count = category => guests.filter(guest => guest.category === category).length;
  return [[count('man'), 'Homens'], [count('woman'), 'Mulheres'], ...CHILD_CATEGORIES.map(item => [count(item.value), item.label])];
};
let guestKey = 0;
const guestRow = (group, guest = {}) => ({ key: ++guestKey, group, _id: guest._id, name: guest.name || '', category: guest.category || '', confirmed: Boolean(guest.confirmed) });
// Convites antigos podem nao ter a lista de pessoas: ela sai do nome ("Maria; João").
const guestRows = item => (item.guests?.length ? item.guests : item.name.split(';').map(name => ({ name: name.trim() })).filter(guest => guest.name)).map(guest => guestRow(isChild(guest.category) ? 'child' : 'adult', guest));
// Chips da listagem: totais por tipo vindos do backend (summary.categories).
const categoryTotals = (categories = {}) => {
  const total = key => categories[key] || 0;
  return [[total('man'), 'Homens'], [total('woman'), 'Mulheres'], ...CHILD_CATEGORIES.map(item => [total(item.value), item.label]), ...(categories.unknown ? [[categories.unknown, 'Tipo não informado']] : [])];
};
const brDate = value => value ? value.split('-').reverse().join('/') : '';
const monthStart = () => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10); };
const monthEnd = () => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10); };

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

// Selo de quem ja confirmou: verde claro com texto verde escuro, icone e texto lado a lado numa linha.
const presenceChip = {
  display: 'inline-flex', alignItems: 'center', maxWidth: '100%', height: 26, px: .25,
  bgcolor: theme => alpha(theme.palette.success.main, .1), color: 'success.dark', border: 1, borderColor: theme => alpha(theme.palette.success.main, .25),
  borderRadius: 999, fontWeight: 600, fontSize: 12, letterSpacing: .2,
  '& .MuiChip-icon': { color: 'success.main', fontSize: 16, ml: .75 }, '& .MuiChip-label': { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', pl: .75, pr: 1.25 }
};
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
      <TableHead><TableRow><TableCell>Nome</TableCell><TableCell sx={{ width: { xs: '32%', sm: 220 } }}>{typeLabel}</TableCell><TableCell sx={{ width: { xs: '30%', sm: 190 } }}>Presença</TableCell><TableCell sx={{ width: 48 }}><Box component="span" sx={visuallyHidden}>Remover</Box></TableCell></TableRow></TableHead>
      <TableBody>
        {rows.map((guest, index) => <TableRow key={guest.key}>
          <TableCell><TextField required fullWidth size="small" variant="standard" sx={cellField} placeholder="Nome" value={guest.name} disabled={saving} onChange={event => change(guest.key, { name: event.target.value })} slotProps={{ input: cellInput, htmlInput: { maxLength: 120, 'aria-label': `Nome — ${title} ${index + 1}` } }} /></TableCell>
          <TableCell><TextField select required fullWidth size="small" variant="standard" sx={cellField} value={guest.category} disabled={saving} onChange={event => change(guest.key, { category: event.target.value })} slotProps={{ input: cellInput, select: { displayEmpty: true, SelectDisplayProps: { 'aria-label': `${typeLabel} — ${title} ${index + 1}` } } }}><MenuItem value="" disabled>Selecione</MenuItem>{categories.map(item => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</TextField></TableCell>
          <TableCell>{guest.confirmed ? <Chip size="small" icon={<CheckCircleRounded />} label="Presença confirmada" sx={presenceChip} /> : <Typography variant="body2" color="text.secondary" noWrap>Aguardando confirmação</Typography>}</TableCell>
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
      <TextField select label="Tipo do convite" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><MenuItem value="in_person">Presencial</MenuItem><MenuItem value="virtual">Virtual</MenuItem></TextField>
      <TextField type="date" label="Data limite para confirmação" value={form.confirmationDeadline} onChange={event => setForm({ ...form, confirmationDeadline: event.target.value })} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: deadlineLimit || undefined } }} helperText={deadlineLimit ? `Aparece no convite para os convidados. Deve ser até ${brDate(deadlineLimit)}; em branco, usa ${brDate(deadlineLimit)}.` : 'Aparece no convite para os convidados.'} />
      <TextField label="Descrição" multiline minRows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} slotProps={{ htmlInput: { maxLength: 1000 } }} />
    </Stack>
    <ConfirmDialog open={Boolean(removing)} title="Remover convidado?" confirmLabel="Remover" description={`Deseja remover ${removingName || `esta linha de ${removing?.table.toLowerCase() || ''}`} do convite?${removing?.guest.confirmed ? ' Essa pessoa já confirmou presença.' : ''} A alteração só vale depois de salvar, e você pode desfazer pelo botão Desfazer.`} onCancel={() => setRemoving(null)} onConfirm={confirmRemove} />
  </CrudDialog>;
}

export function InvitationsPage() {
  const route = useLocation(); const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ startDate: monthStart(), endDate: monthEnd() });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ total: 0, inPerson: 0, virtual: 0, people: 0, confirmed: 0, unconfirmed: 0 });
  const [loading, setLoading] = useState(true);
  const [editLoading, setEditLoading] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ side: '', relationship: '', table: '', guests: [], removed: [], description: '', type: 'in_person', confirmationDeadline: '' });
  // Ultimo dia para confirmar (wedding.rsvpDeadline no backend): limite e valor inicial do campo.
  const [deadlineLimit, setDeadlineLimit] = useState('');
  useEffect(() => { api.get('/public/wedding').then(response => setDeadlineLimit(response.data.data.rsvpDeadline || '')).catch(() => {}); }, []);
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

  useEffect(() => { if (!notification) return; const id = setTimeout(() => setNotification(null), 4500); return () => clearTimeout(id); }, [notification]);
  const load = () => {
    setLoading(true);
    api.get('/invitations', { params: { ...filters, page: pagination.page, limit: pagination.limit, sortBy: 'createdAt', sortOrder: 'desc' } })
      .then(response => { setItems(response.data.data.data); setPagination(current => ({ ...current, ...response.data.data.pagination })); setSummary(response.data.data.summary); })
      .catch(() => notify('danger', 'N\u00e3o foi poss\u00edvel carregar os convites.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, [filters, pagination.page, pagination.limit]);
  const applyFilter = values => { setPagination(current => ({ ...current, page: 1 })); setFilters({ ...filters, ...values }); };
  const openNew = () => { setEditing(null); setForm({ side: '', relationship: '', table: '', guests: [guestRow('adult')], removed: [], description: '', type: 'in_person', confirmationDeadline: deadlineLimit }); setFormError(''); setFormOpen(true); };
  const openEdit = item => { setEditing(item); setForm({ side: item.side || '', relationship: item.relationship || '', table: item.table || '', guests: guestRows(item), removed: [], description: item.description || '', type: item.type || 'in_person', confirmationDeadline: item.confirmationDeadline ? item.confirmationDeadline.slice(0, 10) : deadlineLimit }); setFormError(''); setFormOpen(true); };
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
    if (deadlineLimit && form.confirmationDeadline > deadlineLimit) { setFormError(`A data limite deve ser até ${brDate(deadlineLimit)}.`); return; }
    setSaving(true); setFormError('');
    // Adultos primeiro e depois os filhos: e a ordem dos nomes no convite.
    const guests = ['adult', 'child'].flatMap(group => form.guests.filter(guest => guest.group === group)).map(({ _id, name, category }) => ({ ...(_id && { _id }), name: name.trim(), category }));
    const payload = { side: form.side, relationship: form.relationship, table: form.table.trim(), guests, description: form.description, type: form.type, confirmationDeadline: form.confirmationDeadline };
    try {
      const response = editing ? await api.put('/invitations/' + editing._id, payload) : await api.post('/invitations', payload);
      setFormOpen(false); setEditing(null); navigate('/convites'); load();
      if (editing) notify('success', 'Convite atualizado com sucesso.');
      else { if (card) setViewing(inviteLink(card, response.data.data.code)); notify('success', 'Convite criado com sucesso.'); }
    } catch (error) { const data = error.response?.data; setFormError(Object.values(data?.errors || {}).flat()[0] || data?.message || 'N\u00e3o foi poss\u00edvel salvar o convite.'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    setSaving(true);
    try { await api.delete('/invitations/' + deleting._id); setSelected(current => { const next = new Map(current); next.delete(deleting._id); return next; }); setDeleting(null); load(); notify('success', 'Convite exclu\u00eddo com sucesso.'); }
    catch { notify('danger', 'N\u00e3o foi poss\u00edvel excluir o convite.'); }
    finally { setSaving(false); }
  };

  const closeForm = () => { setFormOpen(false); navigate('/convites'); };
  return <>
    <Snackbar open={Boolean(notification)} autoHideDuration={4500} onClose={() => setNotification(null)}><Alert severity={notification?.type === 'danger' ? 'error' : 'success'} onClose={() => setNotification(null)}>{notification?.message}</Alert></Snackbar>
    <InvitationUrlModal url={viewing} onClose={() => setViewing(null)} notify={notify} />
    <PageHeader title="Convites" subtitle="Gerencie os convites e confirmações de presença." action={<Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}><Button variant="outlined" startIcon={<SettingsOutlined />} disabled={!card} onClick={() => setCardOpen(true)}>Configurações do convite</Button><Button variant="contained" startIcon={<Add />} onClick={() => navigate('/convites/novo')}>Novo convite</Button></Stack>} />
    <Paper sx={{ p: 2, mb: 2 }}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: '2fr repeat(4, 1fr)' }, gap: 2 }}>
      <TextField label="Nome" size="small" value={filters.name || ''} onChange={event => applyFilter({ name: event.target.value })} />
      <TextField select label="Status" size="small" value={filters.status || ''} onChange={event => applyFilter({ status: event.target.value })}><MenuItem value="">Todos</MenuItem><MenuItem value="unconfirmed">Não confirmado</MenuItem><MenuItem value="confirmed">Confirmado</MenuItem></TextField>
      <TextField select label="Tipo" size="small" value={filters.type || ''} onChange={event => applyFilter({ type: event.target.value })}><MenuItem value="">Todos</MenuItem><MenuItem value="in_person">Presencial</MenuItem><MenuItem value="virtual">Virtual</MenuItem></TextField>
      <TextField type="date" size="small" label="Data inicial" value={filters.startDate} onChange={event => applyFilter({ startDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField type="date" size="small" label="Data final" value={filters.endDate} onChange={event => applyFilter({ endDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
    </Box></Paper>
    {selected.size > 0 && <Paper sx={{ p: 1.5, mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }} role="region" aria-label="Convites selecionados">
      <Typography sx={{ mr: 'auto' }}>{selected.size === 1 ? '1 convite selecionado' : `${selected.size} convites selecionados`}</Typography>
      <Button onClick={() => setSelected(new Map())}>Limpar seleção</Button>
      <Button variant="contained" startIcon={preparing ? <CircularProgress size={16} color="inherit" /> : <PrintOutlined />} disabled={preparing || !card} onClick={() => void startPrint(card.layout, selectedInOrder())}>Imprimir em lote{layoutName ? ` — ${layoutName}` : ''}</Button>
    </Paper>}
    <Paper><TableContainer><Table aria-label="Convites"><TableHead><TableRow><TableCell padding="checkbox"><Checkbox checked={pageSelected} indeterminate={!pageSelected && items.some(item => selected.has(item._id))} disabled={!items.length} onChange={togglePage} slotProps={{ input: { 'aria-label': 'Selecionar os convites desta página' } }} /></TableCell>{['Código', 'Nome', 'Tipo', 'Descrição', 'Data de criação', 'Status', 'Data de confirmação', 'Ações'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>
      {loading ? <TableRow><TableCell colSpan={9} align="center"><CircularProgress size={28} aria-label="Carregando convites" /></TableCell></TableRow> : !items.length ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>Nenhum convite encontrado.</TableCell></TableRow> : items.map(item => <Fragment key={item._id}>
        <TableRow hover selected={selected.has(item._id)}><TableCell padding="checkbox"><Checkbox checked={selected.has(item._id)} onChange={() => toggle(item)} slotProps={{ input: { 'aria-label': `Selecionar ${item.name}` } }} /></TableCell><TableCell>{item._id.slice(-6)}</TableCell><TableCell>{item.name}</TableCell><TableCell>{typeLabel(item.type)}</TableCell><TableCell>{item.description || '-'}</TableCell><TableCell>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</TableCell>
          <TableCell><Chip size="small" color={item.status === 'confirmed' ? 'success' : 'warning'} label={statusLabel(item.status)} onClick={item.status === 'confirmed' ? () => setExpandedId(expandedId === item._id ? null : item._id) : undefined} aria-expanded={item.status === 'confirmed' ? expandedId === item._id : undefined} /></TableCell>
          <TableCell>{item.confirmedAt ? new Date(item.confirmedAt).toLocaleString('pt-BR') : '-'}</TableCell>
          <TableCell sx={{ whiteSpace: 'nowrap' }}><Button size="small" variant="outlined" endIcon={<ExpandMore />} aria-haspopup="menu" aria-expanded={rowMenu?.item._id === item._id} aria-label={`Ações de ${item.name}`} onClick={event => setRowMenu({ anchor: event.currentTarget, item })}>Ações</Button></TableCell>
        </TableRow>
        <TableRow><TableCell colSpan={9} sx={{ py: 0, borderBottom: expandedId === item._id ? undefined : 0 }}><Collapse in={expandedId === item._id} unmountOnExit><Box sx={{ p: 2 }}><Typography variant="h6">Pessoas do convite</Typography><Table size="small" aria-label={`Pessoas de ${item.name}`}><TableHead><TableRow><TableCell>Pessoa</TableCell><TableCell>Tipo</TableCell><TableCell>Confirmado em</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{(item.guests || []).map(guest => <TableRow key={guest._id}><TableCell>{guest.name}</TableCell><TableCell>{categoryLabel(guest.category)}</TableCell><TableCell>{guest.confirmedAt ? new Date(guest.confirmedAt).toLocaleString('pt-BR') : '-'}</TableCell><TableCell><Chip size="small" color={guest.confirmed ? 'success' : 'warning'} label={guest.confirmed ? 'Confirmado' : 'Não confirmado'} /></TableCell></TableRow>)}{!item.guests?.length && <TableRow><TableCell colSpan={4}>Nenhuma pessoa cadastrada.</TableCell></TableRow>}</TableBody></Table></Box></Collapse></TableCell></TableRow>
      </Fragment>)}
    </TableBody></Table></TableContainer>
    <Menu anchorEl={rowMenu?.anchor} open={Boolean(rowMenu)} onClose={() => setRowMenu(null)}>
      <MenuItem onClick={() => rowAction(viewLink)}><ListItemIcon><VisibilityOutlined fontSize="small" /></ListItemIcon><ListItemText>Visualizar link</ListItemText></MenuItem>
      <MenuItem onClick={() => rowAction(copyLink)}><ListItemIcon><ContentCopyOutlined fontSize="small" /></ListItemIcon><ListItemText>Copiar link</ListItemText></MenuItem>
      <MenuItem onClick={() => rowAction(item => navigate(`/convites/${item._id}/editar`))}><ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon><ListItemText>Editar</ListItemText></MenuItem>
      <MenuItem onClick={() => rowAction(setDeleting)} sx={{ color: 'error.main' }}><ListItemIcon><DeleteOutlined fontSize="small" color="error" /></ListItemIcon><ListItemText>Excluir</ListItemText></MenuItem>
      <Divider />
      <MenuItem disabled={preparing || !card} onClick={() => rowAction(item => void startPrint(card.layout, [item]))}><ListItemIcon><PrintOutlined fontSize="small" /></ListItemIcon><ListItemText secondary={layoutName ? `Modelo ${layoutName}` : undefined}>Imprimir convite</ListItemText></MenuItem>
    </Menu>
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', px: 2, pt: 2 }}>{[[summary.total, 'Convites'], [summary.inPerson, 'Presenciais'], [summary.virtual, 'Online'], [summary.people, 'Pessoas'], [summary.confirmed, 'Confirmados'], [summary.unconfirmed, 'Não confirmados'], ...categoryTotals(summary.categories)].map(([value, label]) => <Chip key={label} variant="outlined" label={`${label}: ${value}`} />)}</Stack>
    <TablePagination component="div" count={pagination.total} page={pagination.page - 1} rowsPerPage={pagination.limit} onPageChange={(_, page) => setPagination(current => ({ ...current, page: page + 1 }))} onRowsPerPageChange={event => setPagination(current => ({ ...current, limit: Number(event.target.value), page: 1 }))} rowsPerPageOptions={[10, 20, 50, 100, 200]} labelRowsPerPage="Por página:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`} getItemAriaLabel={type => type === 'next' ? 'Próxima página' : 'Página anterior'} />
    </Paper>
    {editLoading && <CrudDialog title="Carregando convite" onClose={closeForm}><CircularProgress aria-label="Carregando convite" /></CrudDialog>}
    {formOpen && <InvitationFormModal editing={editing} form={form} setForm={setForm} saving={saving} error={formError} deadlineLimit={deadlineLimit} onClose={closeForm} onSubmit={submit} />}
    {cardOpen && card && <InvitationCardSettingsDialog card={card} onClose={() => setCardOpen(false)} onSaved={next => { setCard(next); setCardOpen(false); notify('success', 'Configurações do convite salvas.'); }} />}
    <InvitationPrintDialog job={printJob} card={card} onClose={() => setPrintJob(null)} />
    <ConfirmDialog open={Boolean(deleting)} title="Excluir convite?" description={`Deseja realmente excluir ${deleting?.name || ''}?`} busy={saving} onCancel={() => setDeleting(null)} onConfirm={remove} />
  </>;
}
