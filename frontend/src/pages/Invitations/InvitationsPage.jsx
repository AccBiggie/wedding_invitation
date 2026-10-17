import { Fragment, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, Chip, CircularProgress, Collapse, DialogActions, IconButton, MenuItem, Paper, Snackbar, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField, Tooltip, Typography } from '@mui/material';
import Add from '@mui/icons-material/Add';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutlined from '@mui/icons-material/DeleteOutlined';
import VisibilityOutlined from '@mui/icons-material/VisibilityOutlined';
import { PageHeader } from '../../components/common/PageHeader';
import { CrudDialog } from '../../components/common/CrudDialog';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import api from '../../services/api';

const statusLabel = status => status === 'confirmed' ? 'Confirmado' : 'Não confirmado';
const typeLabel = type => type === 'virtual' ? 'Virtual' : 'Presencial';
const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const monthStart = () => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10); };
const monthEnd = () => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10); };

function InvitationUrlModal({ invitation, onClose, notify }) {
  if (!invitation) return null;
  const url = `${location.origin}/invitation/${invitation._id}/${slug(invitation.name)}?token=${invitation.publicToken}`;
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
  const [summary, setSummary] = useState({ total: 0, people: 0, confirmed: 0, unconfirmed: 0 });
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
      else { setViewing(response.data.data); notify('success', 'Convite criado com sucesso.'); }
    } catch (error) { setFormError(error.response?.data?.message || 'N\u00e3o foi poss\u00edvel salvar o convite.'); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    setSaving(true);
    try { await api.delete('/invitations/' + deleting._id); setDeleting(null); load(); notify('success', 'Convite exclu\u00eddo com sucesso.'); }
    catch { notify('danger', 'N\u00e3o foi poss\u00edvel excluir o convite.'); }
    finally { setSaving(false); }
  };

  const closeForm = () => { setFormOpen(false); navigate('/convites'); };
  return <>
    <Snackbar open={Boolean(notification)} autoHideDuration={4500} onClose={() => setNotification(null)}><Alert severity={notification?.type === 'danger' ? 'error' : 'success'} onClose={() => setNotification(null)}>{notification?.message}</Alert></Snackbar>
    <InvitationUrlModal invitation={viewing} onClose={() => setViewing(null)} notify={notify} />
    <PageHeader title="Convites" subtitle="Gerencie os convites e confirmações de presença." action={<Button variant="contained" startIcon={<Add />} onClick={() => navigate('/convites/novo')}>Novo convite</Button>} />
    <Paper sx={{ p: 2, mb: 2 }}><Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: '2fr repeat(4, 1fr)' }, gap: 2 }}>
      <TextField label="Nome" size="small" value={filters.name || ''} onChange={event => applyFilter({ name: event.target.value })} />
      <TextField select label="Status" size="small" value={filters.status || ''} onChange={event => applyFilter({ status: event.target.value })}><MenuItem value="">Todos</MenuItem><MenuItem value="unconfirmed">Não confirmado</MenuItem><MenuItem value="confirmed">Confirmado</MenuItem></TextField>
      <TextField select label="Tipo" size="small" value={filters.type || ''} onChange={event => applyFilter({ type: event.target.value })}><MenuItem value="">Todos</MenuItem><MenuItem value="in_person">Presencial</MenuItem><MenuItem value="virtual">Virtual</MenuItem></TextField>
      <TextField type="date" size="small" label="Data inicial" value={filters.startDate} onChange={event => applyFilter({ startDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
      <TextField type="date" size="small" label="Data final" value={filters.endDate} onChange={event => applyFilter({ endDate: event.target.value })} slotProps={{ inputLabel: { shrink: true } }} />
    </Box></Paper>
    <Paper><TableContainer><Table aria-label="Convites"><TableHead><TableRow>{['Código', 'Nome', 'Tipo', 'Descrição', 'Data de criação', 'Status', 'Data de confirmação', 'Ações'].map(label => <TableCell key={label}>{label}</TableCell>)}</TableRow></TableHead><TableBody>
      {loading ? <TableRow><TableCell colSpan={8} align="center"><CircularProgress size={28} aria-label="Carregando convites" /></TableCell></TableRow> : !items.length ? <TableRow><TableCell colSpan={8} align="center" sx={{ py: 6 }}>Nenhum convite encontrado.</TableCell></TableRow> : items.map(item => <Fragment key={item._id}>
        <TableRow hover><TableCell>{item._id.slice(-6)}</TableCell><TableCell>{item.name}</TableCell><TableCell>{typeLabel(item.type)}</TableCell><TableCell>{item.description || '-'}</TableCell><TableCell>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</TableCell>
          <TableCell><Chip size="small" color={item.status === 'confirmed' ? 'success' : 'warning'} label={statusLabel(item.status)} onClick={item.status === 'confirmed' ? () => setExpandedId(expandedId === item._id ? null : item._id) : undefined} aria-expanded={item.status === 'confirmed' ? expandedId === item._id : undefined} /></TableCell>
          <TableCell>{item.confirmedAt ? new Date(item.confirmedAt).toLocaleString('pt-BR') : '-'}</TableCell>
          <TableCell sx={{ whiteSpace: 'nowrap' }}><Tooltip title="Visualizar"><IconButton aria-label={`Visualizar ${item.name}`} onClick={() => setViewing(item)}><VisibilityOutlined fontSize="small" /></IconButton></Tooltip><Tooltip title="Editar"><IconButton aria-label={`Editar ${item.name}`} onClick={() => navigate(`/convites/${item._id}/editar`)}><EditOutlined fontSize="small" /></IconButton></Tooltip><Tooltip title="Excluir"><IconButton color="error" aria-label={`Excluir ${item.name}`} onClick={() => setDeleting(item)}><DeleteOutlined fontSize="small" /></IconButton></Tooltip></TableCell>
        </TableRow>
        <TableRow><TableCell colSpan={8} sx={{ py: 0, borderBottom: expandedId === item._id ? undefined : 0 }}><Collapse in={expandedId === item._id} unmountOnExit><Box sx={{ p: 2 }}><Typography variant="h6">Pessoas do convite</Typography><Table size="small" aria-label={`Pessoas de ${item.name}`}><TableHead><TableRow><TableCell>Pessoa</TableCell><TableCell>Confirmado em</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>{(item.guests || []).map(guest => <TableRow key={guest._id}><TableCell>{guest.name}</TableCell><TableCell>{guest.confirmedAt ? new Date(guest.confirmedAt).toLocaleString('pt-BR') : '-'}</TableCell><TableCell><Chip size="small" color={guest.confirmed ? 'success' : 'warning'} label={guest.confirmed ? 'Confirmado' : 'Não confirmado'} /></TableCell></TableRow>)}{!item.guests?.length && <TableRow><TableCell colSpan={3}>Nenhuma pessoa cadastrada.</TableCell></TableRow>}</TableBody></Table></Box></Collapse></TableCell></TableRow>
      </Fragment>)}
    </TableBody></Table></TableContainer>
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', px: 2, pt: 2 }}>{[[summary.total, 'Convites'], [summary.people, 'Pessoas'], [summary.confirmed, 'Confirmados'], [summary.unconfirmed, 'Não confirmados']].map(([value, label]) => <Chip key={label} variant="outlined" label={`${label}: ${value}`} />)}</Stack>
    <TablePagination component="div" count={pagination.total} page={pagination.page - 1} rowsPerPage={pagination.limit} onPageChange={(_, page) => setPagination(current => ({ ...current, page: page + 1 }))} onRowsPerPageChange={event => setPagination(current => ({ ...current, limit: Number(event.target.value), page: 1 }))} rowsPerPageOptions={[10, 20, 50, 100, 200]} labelRowsPerPage="Por página:" labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`} getItemAriaLabel={type => type === 'next' ? 'Próxima página' : 'Página anterior'} />
    </Paper>
    {editLoading && <CrudDialog title="Carregando convite" onClose={closeForm}><CircularProgress aria-label="Carregando convite" /></CrudDialog>}
    {formOpen && <InvitationFormModal editing={editing} form={form} setForm={setForm} saving={saving} error={formError} onClose={closeForm} onSubmit={submit} />}
    <ConfirmDialog open={Boolean(deleting)} title="Excluir convite?" description={`Deseja realmente excluir ${deleting?.name || ''}?`} busy={saving} onCancel={() => setDeleting(null)} onConfirm={remove} />
  </>;
}
