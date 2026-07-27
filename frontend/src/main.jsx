import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link } from 'react-router-dom';
import api from './services/api';
import '@tabler/core/dist/css/tabler.min.css';
import './style.css';

const statusLabel = status => status === 'confirmed' ? 'Confirmado' : 'N\u00e3o confirmado';
const typeLabel = type => type === 'virtual' ? 'Virtual' : 'Presencial';
const slug = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const monthStart = () => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().slice(0, 10); };
const monthEnd = () => { const date = new Date(); return new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().slice(0, 10); };

function Toast({ notification, onClose }) {
  if (!notification) return null;
  return <div className={`alert alert-${notification.type} position-fixed top-0 end-0 m-3 shadow`} style={{ zIndex: 2000, minWidth: 300 }} role="alert">
    {notification.message}<button className="btn-close float-end" onClick={onClose} />
  </div>;
}

function Layout({ children }) {
  return <div className="page"><header className="navbar d-print-none"><div className="container-xl"><Link className="navbar-brand" to="/">Convites de casamento</Link></div></header><main className="container-xl py-4">{children}</main></div>;
}

function InvitationUrlModal({ invitation, onClose, notify }) {
  if (!invitation) return null;
  const url = `${location.origin}/invitation/${invitation._id}/${slug(invitation.name)}?token=${invitation.publicToken}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); notify('success', 'URL do convite copiada com sucesso.'); }
    catch { notify('danger', 'N\u00e3o foi poss\u00edvel copiar a URL.'); }
  };
  return <div className="modal modal-blur show d-block"><div className="modal-dialog modal-dialog-centered"><div className="modal-content">
    <div className="modal-header"><h3 className="modal-title">Visualizar convite</h3><button className="btn-close" onClick={onClose} /></div>
    <div className="modal-body"><p>URL p\u00fablica do convite:</p><input className="form-control" readOnly value={url} /></div>
    <div className="modal-footer"><button className="btn" onClick={copy}>Copiar URL</button><a className="btn btn-primary" target="_blank" rel="noreferrer" href={url}>Abrir convite</a><button className="btn" onClick={onClose}>Fechar</button></div>
  </div></div></div>;
}

function InvitationFormModal({ editing, form, setForm, saving, error, onClose, onSubmit }) {
  return <div className="modal modal-blur show d-block"><div className="modal-dialog modal-dialog-centered"><div className="modal-content">
    <div className="modal-header"><h3 className="modal-title">{editing ? 'Editar convite' : 'Novo convite'}</h3><button className="btn-close" onClick={onClose} /></div>
    <form onSubmit={onSubmit}><div className="modal-body">
      <label className="form-label">Nome dos convidados</label><input required maxLength="255" className="form-control" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
      <small className="text-muted d-block mt-1">{'Para informar mais de um convidado, separe os nomes com ponto e vírgula (;). Ex.: Stefani; Andre;'}</small>
      <label className="form-label mt-3">Tipo do convite</label><select className="form-select" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><option value="in_person">Presencial</option><option value="virtual">Virtual</option></select>
      <label className="form-label mt-3">{'Descrição'}</label><textarea className="form-control" maxLength="1000" value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
      {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
    </div><div className="modal-footer"><button type="button" className="btn" onClick={onClose}>Cancelar</button><button disabled={saving} className="btn btn-primary">{saving ? 'Salvando...' : editing ? 'Salvar altera\u00e7\u00f5es' : 'Gerar convite'}</button></div></form>
  </div></div></div>;
}

function Home() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ startDate: monthStart(), endDate: monthEnd() });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [summary, setSummary] = useState({ total: 0, people: 0, confirmed: 0, unconfirmed: 0 });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ name: '', description: '', type: 'in_person' });
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
  const openNew = () => { setEditing(null); setForm({ name: '', description: '', type: 'in_person' }); setFormError(''); setFormOpen(true); };
  const openEdit = item => { setEditing(item); setForm({ name: item.name, description: item.description || '', type: item.type || 'in_person' }); setFormError(''); setFormOpen(true); };
  const submit = async event => {
    event.preventDefault(); setSaving(true); setFormError('');
    try {
      const response = editing ? await api.put('/invitations/' + editing._id, form) : await api.post('/invitations', form);
      setFormOpen(false); setEditing(null); load();
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

  return <>
    <Toast notification={notification} onClose={() => setNotification(null)} />
    <InvitationUrlModal invitation={viewing} onClose={() => setViewing(null)} notify={notify} />
    <div className="d-flex justify-content-between align-items-center mb-3"><h1>Convites</h1><button className="btn btn-primary" onClick={openNew}>Novo convite</button></div>
    <div className="card mb-3"><div className="card-body row g-2">
      <div className="col-md-3"><label className="form-label">Nome</label><input className="form-control" onChange={event => applyFilter({ name: event.target.value })} /></div>
      <div className="col-md-2"><label className="form-label">Status</label><select className="form-select" onChange={event => applyFilter({ status: event.target.value })}><option value="">Todos</option><option value="unconfirmed">{'Não confirmado'}</option><option value="confirmed">Confirmado</option></select></div>
      <div className="col-md-2"><label className="form-label">Tipo</label><select className="form-select" onChange={event => applyFilter({ type: event.target.value })}><option value="">Todos</option><option value="in_person">Presencial</option><option value="virtual">Virtual</option></select></div>
      <div className="col-md-2"><label className="form-label">Data inicial</label><input type="date" className="form-control" value={filters.startDate} onChange={event => applyFilter({ startDate: event.target.value })} /></div>
      <div className="col-md-2"><label className="form-label">Data final</label><input type="date" className="form-control" value={filters.endDate} onChange={event => applyFilter({ endDate: event.target.value })} /></div>
    </div></div>
    <div className="card"><div className="table-responsive"><table className="table card-table table-vcenter"><thead><tr><th>{'Código'}</th><th>Nome</th><th>Tipo</th><th>{'Descrição'}</th><th>{'Data Criação'}</th><th>Status</th><th>{'Data Confirmação'}</th><th>{'Ações'}</th></tr></thead><tbody>
      {loading ? <tr><td colSpan="8">Carregando...</td></tr> : items.length === 0 ? <tr><td colSpan="8" className="text-center py-4">Nenhum convite encontrado.</td></tr> : items.flatMap(item => { const confirmedGuests = (item.guests || []).filter(guest => guest.confirmed); const expanded = expandedId === item._id; return [<tr key={item._id}><td>{item._id.slice(-6)}</td><td>{item.name}</td><td>{typeLabel(item.type)}</td><td>{item.description || '-'}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td>{item.status === 'confirmed' ? <button className="btn btn-sm p-0 border-0 bg-transparent" onClick={() => setExpandedId(expanded ? null : item._id)}><span className="badge bg-success-lt text-success"><span className="status-dot bg-success me-1" />{statusLabel(item.status)}</span></button> : <span className="badge bg-warning-lt text-warning"><span className="status-dot bg-warning me-1" />{statusLabel(item.status)}</span>}</td><td>{item.confirmedAt ? new Date(item.confirmedAt).toLocaleString() : '-'}</td><td><button className="btn btn-sm" onClick={() => setViewing(item)}>Visualizar</button> <button className="btn btn-sm" onClick={() => openEdit(item)}>Editar</button> <button className="btn btn-sm btn-danger" onClick={() => setDeleting(item)}>Excluir</button></td></tr>, expanded && <tr key={`${item._id}-guests`}><td colSpan="8" className="bg-light"><div className="p-2"><strong>Pessoas confirmadas</strong>{confirmedGuests.length ? <ul className="list-group list-group-flush mt-2">{confirmedGuests.map(guest => <li className="list-group-item bg-transparent d-flex justify-content-between" key={guest._id}><span>{guest.name}</span><span className="text-success">Confirmado</span></li>)}</ul> : <p className="text-secondary mb-0 mt-2">Nenhuma pessoa confirmada.</p>}</div></td></tr>].filter(Boolean); })}
    </tbody></table></div>
    <div className="card-footer d-flex align-items-center"><span>Total: {summary.total} | Confirmados: {summary.confirmed} | {'Não confirmado'}s: {summary.unconfirmed}</span><label className="ms-3 me-2">{'Por página:'}</label><select className="form-select form-select-sm w-auto" value={pagination.limit} onChange={event => setPagination(current => ({ ...current, limit: Number(event.target.value), page: 1 }))}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="200">200</option></select><ul className="pagination ms-auto m-0"><li className={`page-item ${pagination.page <= 1 ? 'disabled' : ''}`}><button className="page-link" disabled={pagination.page <= 1} onClick={() => setPagination(current => ({ ...current, page: current.page - 1 }))}>Anterior</button></li>{Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map(page => <li key={page} className={`page-item ${page === pagination.page ? 'active' : ''}`}><button className="page-link" onClick={() => setPagination(current => ({ ...current, page }))}>{page}</button></li>)}<li className={`page-item ${pagination.page >= pagination.totalPages ? 'disabled' : ''}`}><button className="page-link" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(current => ({ ...current, page: current.page + 1 }))}>{'Próxima'}</button></li></ul></div></div>
    {formOpen && <InvitationFormModal editing={editing} form={form} setForm={setForm} saving={saving} error={formError} onClose={() => setFormOpen(false)} onSubmit={submit} />}
    {deleting && <div className="modal modal-blur show d-block"><div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h3 className="modal-title">Excluir convite</h3><button className="btn-close" onClick={() => setDeleting(null)} /></div><div className="modal-body">Deseja realmente excluir <strong>{deleting.name}</strong>?</div><div className="modal-footer"><button className="btn" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn btn-danger" disabled={saving} onClick={remove}>{saving ? 'Excluindo...' : 'Excluir'}</button></div></div></div></div>}
  </>;
}

function Public() {
  const [, , id, name] = location.pathname.split('/');
  const [item, setItem] = useState(); const [error, setError] = useState(false); const [confirming, setConfirming] = useState(false); const [notification, setNotification] = useState(null); const [selectedGuestIds, setSelectedGuestIds] = useState([]);
  const notify = (type, message) => setNotification({ type, message });
  useEffect(() => { if (!notification) return; const timer = setTimeout(() => setNotification(null), 4500); return () => clearTimeout(timer); }, [notification]);
  useEffect(() => { api.get('/public/invitations/' + id + '/' + name, { params: { token: new URLSearchParams(location.search).get('token') } }).then(response => setItem(response.data.data)).catch(() => setError(true)); }, [id, name]);
  useEffect(() => { if (item?.guests) setSelectedGuestIds(item.guests.filter(guest => guest.confirmed).map(guest => String(guest._id))); }, [item?._id]);
  const confirm = async () => { setConfirming(true); try { const response = await api.post('/public/invitations/' + id + '/confirm', { guestIds: selectedGuestIds }); setItem(response.data.data); notify('success', response.data.message); } catch { notify('danger', 'N\u00e3o foi poss\u00edvel confirmar a presen\u00e7a.'); } finally { setConfirming(false); } };
  if (error) return <Layout><div className="empty"><h1>{'Convite não encontrado'}</h1></div></Layout>;
  if (!item) return <Layout><p>Carregando...</p></Layout>;
  const toggleGuest = guestId => setSelectedGuestIds(current => current.includes(guestId) ? current.filter(idValue => idValue !== guestId) : [...current, guestId]);
  const guests = item.guests || [];
  return <Layout><Toast notification={notification} onClose={() => setNotification(null)} /><div className="card mx-auto invitation-card"><div className="card-body text-center"><div className="mb-3"><img className="img-fluid rounded" src="/tricotlg.png" alt="Convite de casamento" /></div><p className="text-secondary">Selecione as pessoas que confirmam presença:</p><div className="list-group text-start mb-3">{guests.map(guest => <label className="list-group-item d-flex gap-3 align-items-center" key={guest._id}><input className="form-check-input flex-shrink-0" type="checkbox" checked={selectedGuestIds.includes(String(guest._id))} onChange={() => toggleGuest(String(guest._id))} /><span>{guest.name}</span>{guest.confirmed && <span className="badge bg-success-lt text-success ms-auto">Confirmado</span>}</label>)}</div><button className="btn btn-primary" disabled={confirming} onClick={confirm}>{confirming ? 'Atualizando...' : 'Atualizar confirmação'}</button></div></div></Layout>;
}

function App() { return location.pathname.startsWith('/invitation/') ? <Public /> : <Layout><Home /></Layout>; }
createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);
