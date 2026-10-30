import { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Checkbox, Chip, CircularProgress, Collapse, DialogActions, Divider, ListItemIcon, ListItemText, Menu, MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import ExpandMore from '@mui/icons-material/ExpandMore';
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
const monthStart = () => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10); };
const monthEnd = () => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10); };

function InvitationUrlModal({ url, onClose, notify }) {
  if (!url) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); notify('success', 'URL do convite copiada com sucesso.'); }
    catch { notify('danger', 'Não foi possível copiar a URL.'); }
  };
  return <CrudDialog title="Visualizar convite" onClose={onClose}>
    <TextField fullWidth label="URL pública do convite" value={url} slotProps={{ input: { readOnly: true } }} sx={{ mt: 1 }} />
    <DialogActions sx={{ flexWrap: 'wrap', gap: 1, mt: 2 }}><Button onClick={onClose}>Fechar</Button><Button onClick={copy}>Copiar URL</Button><Button variant="contained" component="a" target="_blank" rel="noreferrer" href={url}>Abrir convite</Button></DialogActions>
  </CrudDialog>;
}

function InvitationFormModal({ editing, form, setForm, saving, error, onClose, onSubmit }) {
  return <CrudDialog title={editing ? 'Editar convite' : 'Novo convite'} busy={saving} onClose={onClose}>
    <Box component="form" onSubmit={onSubmit}><Stack spacing={2} sx={{ pt: 1 }}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField autoFocus required fullWidth label="Nome dos convidados" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} slotProps={{ htmlInput: { maxLength: 255 } }} helperText="Para informar mais de um convidado, separe os nomes com ponto e vírgula (;). Ex.: Stéfani; André;" />
      <TextField select label="Tipo do convite" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><MenuItem value="in_person">Presencial</MenuItem><MenuItem value="virtual">Virtual</MenuItem></TextField>
      <TextField type="date" label="Data limite para confirmação" value={form.confirmationDeadline} onChange={event => setForm({ ...form, confirmationDeadline: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField label="Descrição" multiline minRows={3} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} slotProps={{ htmlInput: { maxLength: 1000 } }} />
    </Stack><DialogActions sx={{ mt: 2 }}><Button disabled={saving} onClick={onClose}>Cancelar</Button><Button type="submit" variant="contained" disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Gerar convite'}</Button></DialogActions></Box>
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
  const [form, setForm] = useState({ name: '', description: '', type: 'in_person', confirmationDeadline: '' });
  const [notification, setNotification] = useState(null);
  const notify = (type, message) => setNotification({ type, message });
  const [card, setCard] = useState(null);
  const [cardOpen, setCardOpen] = useState(false);
  const [printJob, setPrintJob] = useState(null);
  const [rowMenu, setRowMenu] = useState(null);
  const [batchMenu, setBatchMenu] = useState(null);
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
  const openNew = () => { setEditing(null); setForm({ name: '', description: '', type: 'in_person', confirmationDeadline: '' }); setFormError(''); setFormOpen(true); };
  const openEdit = item => { setEditing(item); setForm({ name: item.name, description: item.description || '', type: item.type || 'in_person', confirmationDeadline: item.confirmationDeadline ? item.confirmationDeadline.slice(0, 10) : '' }); setFormError(''); setFormOpen(true); };
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
    event.preventDefault(); if (saving) return; setSaving(true); setFormError('');
    try {
      const response = editing ? await api.put('/invitations/' + editing._id, form) : await api.post('/invitations', form);
      setFormOpen(false); setEditing(null); navigate('/convites'); load();
      if (editing) notify('success', 'Convite atualizado com sucesso.');
      else { if (card) setViewing(inviteLink(card, response.data.data.code)); notify('success', 'Convite criado com sucesso.'); }
    } catch (error) { setFormError(error.response?.data?.message || 'N\u00e3o foi poss\u00edvel salvar o convite.'); }
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
      <Button variant="contained" startIcon={preparing ? <CircularProgress size={16} color="inherit" /> : <PrintOutlined />} endIcon={<ExpandMore />} disabled={preparing} aria-haspopup="menu" aria-expanded={Boolean(batchMenu)} onClick={event => setBatchMenu(event.currentTarget)}>Imprimir em lote</Button>
      <Menu anchorEl={batchMenu} open={Boolean(batchMenu)} onClose={() => setBatchMenu(null)}>{INVITE_LAYOUTS.map(({ layout, name }) => <MenuItem key={layout} onClick={() => { setBatchMenu(null); void startPrint(layout, selectedInOrder()); }}><ListItemIcon><PrintOutlined fontSize="small" /></ListItemIcon><ListItemText>Imprimir — {name}</ListItemText></MenuItem>)}</Menu>
    </Paper>}
    <Paper><TableContainer><Table aria-label="Convites"><TableHead><TableRow><TableCell padding="checkbox"><Checkbox checked={pageSelected} indeterminate={!pageSelected && items.some(item => selected.has(item._id))} disabled={!items.length} onChange={togglePage} slotProps={{ input: { 'aria-label': 'Selecionar os convites desta página' } }} /></TableCell>{['Código', 'Nome', 'Tipo', 'Descrição', 'Data de criação', 'Status', 'Data de confirmação', 'Ações'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>
      {loading ? <TableRow><TableCell colSpan={9} align="center"><CircularProgress size={28} aria-label="Carregando convites" /></TableCell></TableRow> : !items.length ? <TableRow><TableCell colSpan={9} align="center" sx={{ py: 6 }}>Nenhum convite encontrado.</TableCell></TableRow> : items.map(item => <Fragment key={item._id}>
        <TableRow hover selected={selected.has(item._id)}><TableCell padding="checkbox"><Checkbox checked={selected.has(item._id)} onChange={() => toggle(item)} slotProps={{ input: { 'aria-label': `Selecionar ${item.name}` } }} /></TableCell><TableCell>{item._id.slice(-6)}</TableCell><TableCell>{item.name}</TableCell><TableCell>{typeLabel(item.type)}</TableCell><TableCell>{item.description || '-'}</TableCell><TableCell>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</TableCell>
          <TableCell><Chip size="small" color={item.status === 'confirmed' ? 'success' : 'warning'} label={statusLabel(item.status)} onClick={item.status === 'confirmed' ? () => setExpandedId(expandedId === item._id ? null : item._id) : undefined} aria-expanded={item.status === 'confirmed' ? expandedId === item._id : undefined} /></TableCell>
          <TableCell>{item.confirmedAt ? new Date(item.confirmedAt).toLocaleString('pt-BR') : '-'}</TableCell>
          <TableCell sx={{ whiteSpace: 'nowrap' }}><Button size="small" variant="outlined" endIcon={<ExpandMore />} aria-haspopup="menu" aria-expanded={rowMenu?.item._id === item._id} aria-label={`Ações de ${item.name}`} onClick={event => setRowMenu({ anchor: event.currentTarget, item })}>Ações</Button></TableCell>
        </TableRow>
        <TableRow><TableCell colSpan={9} sx={{ py: 0, borderBottom: expandedId === item._id ? undefined : 0 }}><Collapse in={expandedId === item._id} unmountOnExit><Box sx={{ p: 2 }}><Typography variant="h6">Pessoas do convite</Typography><Table size="small" aria-label={`Pessoas de ${item.name}`}><TableHead><TableRow><TableCell>Pessoa</TableCell><TableCell>Confirmado em</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{(item.guests || []).map(guest => <TableRow key={guest._id}><TableCell>{guest.name}</TableCell><TableCell>{guest.confirmedAt ? new Date(guest.confirmedAt).toLocaleString('pt-BR') : '-'}</TableCell><TableCell><Chip size="small" color={guest.confirmed ? 'success' : 'warning'} label={guest.confirmed ? 'Confirmado' : 'Não confirmado'} /></TableCell></TableRow>)}{!item.guests?.length && <TableRow><TableCell colSpan={3}>Nenhuma pessoa cadastrada.</TableCell></TableRow>}</TableBody></Table></Box></Collapse></TableCell></TableRow>
      </Fragment>)}
    </TableBody></Table></TableContainer>
    <Menu anchorEl={rowMenu?.anchor} open={Boolean(rowMenu)} onClose={() => setRowMenu(null)}>
      <MenuItem onClick={() => rowAction(viewLink)}><ListItemIcon><VisibilityOutlined fontSize="small" /></ListItemIcon><ListItemText>Visualizar link</ListItemText></MenuItem>
      <MenuItem onClick={() => rowAction(copyLink)}><ListItemIcon><ContentCopyOutlined fontSize="small" /></ListItemIcon><ListItemText>Copiar link</ListItemText></MenuItem>
      <MenuItem onClick={() => rowAction(item => navigate(`/convites/${item._id}/editar`))}><ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon><ListItemText>Editar</ListItemText></MenuItem>
      <MenuItem onClick={() => rowAction(setDeleting)} sx={{ color: 'error.main' }}><ListItemIcon><DeleteOutlined fontSize="small" color="error" /></ListItemIcon><ListItemText>Excluir</ListItemText></MenuItem>
      <Divider />
      {INVITE_LAYOUTS.map(({ layout, name }) => <MenuItem key={layout} disabled={preparing} onClick={() => rowAction(item => void startPrint(layout, [item]))}><ListItemIcon><PrintOutlined fontSize="small" /></ListItemIcon><ListItemText>Imprimir — {name}</ListItemText></MenuItem>)}
    </Menu>
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', px: 2, pt: 2 }}>{[[summary.total, 'Convites'], [summary.inPerson, 'Presenciais'], [summary.virtual, 'Online'], [summary.people, 'Pessoas'], [summary.confirmed, 'Confirmados'], [summary.unconfirmed, 'Não confirmados']].map(([value, label]) => <Chip key={label} variant="outlined" label={`${label}: ${value}`} />)}</Stack>
    <TablePagination component="div" count={pagination.total} page={pagination.page - 1} rowsPerPage={pagination.limit} onPageChange={(_, page) => setPagination(current => ({ ...current, page: page + 1 }))} onRowsPerPageChange={event => setPagination(current => ({ ...current, limit: Number(event.target.value), page: 1 }))} rowsPerPageOptions={[10, 20, 50, 100, 200]} labelRowsPerPage="Por página:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`} getItemAriaLabel={type => type === 'next' ? 'Próxima página' : 'Página anterior'} />
    </Paper>
    {editLoading && <CrudDialog title="Carregando convite" onClose={closeForm}><CircularProgress aria-label="Carregando convite" /></CrudDialog>}
    {formOpen && <InvitationFormModal editing={editing} form={form} setForm={setForm} saving={saving} error={formError} onClose={closeForm} onSubmit={submit} />}
    {cardOpen && card && <InvitationCardSettingsDialog card={card} onClose={() => setCardOpen(false)} onSaved={next => { setCard(next); setCardOpen(false); notify('success', 'Configurações do convite salvas.'); }} />}
    <InvitationPrintDialog job={printJob} card={card} onClose={() => setPrintJob(null)} />
    <ConfirmDialog open={Boolean(deleting)} title="Excluir convite?" description={`Deseja realmente excluir ${deleting?.name || ''}?`} busy={saving} onCancel={() => setDeleting(null)} onConfirm={remove} />
  </>;
}
