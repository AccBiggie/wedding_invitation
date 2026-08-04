import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Link } from 'react-router-dom';
import api, { tokenStore } from './services/api';
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

function Layout({ user, onLogout, children }) {
  return <div className="page"><header className="navbar d-print-none"><div className="container-xl">
    <Link className="navbar-brand" to="/">Convites de casamento</Link>
    <div className="ms-auto d-flex align-items-center gap-3">
      <span className="text-secondary d-none d-sm-inline">{user.email}</span>
      <button className="btn btn-sm" onClick={onLogout}>Sair</button>
    </div>
  </div></header><main className="container-xl py-4">{children}</main></div>;
}

function Login({ onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async event => {
    event.preventDefault(); setSending(true); setError('');
    try {
      const response = await api.post('/auth/login', form);
      tokenStore.set(response.data.data.accessToken);
      onSuccess(response.data.data.user);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Não foi possível entrar. Tente novamente.'); }
    finally { setSending(false); }
  };
  return <div className="page page-center"><div className="container container-tight py-4">
    <div className="text-center mb-4"><h1 className="navbar-brand navbar-brand-autodark">Convites de casamento</h1></div>
    <form className="card card-md" onSubmit={submit}>
      <div className="card-body">
        <h2 className="card-title text-center mb-4">Entre na sua conta</h2>
        <label className="form-label">E-mail</label>
        <input type="email" required autoFocus autoComplete="username" className="form-control" placeholder="seu@email.com" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
        <label className="form-label mt-3">Senha</label>
        <input type="password" required autoComplete="current-password" className="form-control" placeholder="Sua senha" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
        {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}
        <div className="form-footer"><button className="btn btn-primary w-100" disabled={sending}>{sending ? 'Entrando...' : 'Entrar'}</button></div>
      </div>
    </form>
  </div></div>;
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
      <small className="text-muted d-block mt-1">{'Para informar mais de um convidado, separe os nomes com ponto e vírgula (;). Ex.: Stéfani; André;'}</small>
      <label className="form-label mt-3">Tipo do convite</label><select className="form-select" value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><option value="in_person">Presencial</option><option value="virtual">Virtual</option></select>
      <label className="form-label mt-3">Data limite para confirmação</label><input type="date" className="form-control" value={form.confirmationDeadline} onChange={event => setForm({ ...form, confirmationDeadline: event.target.value })} />
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
      {loading ? <tr><td colSpan="8">Carregando...</td></tr> : items.length === 0 ? <tr><td colSpan="8" className="text-center py-4">Nenhum convite encontrado.</td></tr> : items.flatMap(item => { const guests = item.guests || []; const expanded = expandedId === item._id; return [<tr key={item._id}><td>{item._id.slice(-6)}</td><td>{item.name}</td><td>{typeLabel(item.type)}</td><td>{item.description || '-'}</td><td>{new Date(item.createdAt).toLocaleDateString()}</td><td>{item.status === 'confirmed' ? <button className="btn btn-sm p-0 border-0 bg-transparent" onClick={() => setExpandedId(expanded ? null : item._id)}><span className="badge bg-success-lt text-success"><span className="status-dot bg-success me-1" />{statusLabel(item.status)}</span></button> : <span className="badge bg-warning-lt text-warning"><span className="status-dot bg-warning me-1" />{statusLabel(item.status)}</span>}</td><td>{item.confirmedAt ? new Date(item.confirmedAt).toLocaleString() : '-'}</td><td><button className="btn btn-sm" onClick={() => setViewing(item)}>Visualizar</button> <button className="btn btn-sm" onClick={() => openEdit(item)}>Editar</button> <button className="btn btn-sm btn-danger" onClick={() => setDeleting(item)}>Excluir</button></td></tr>, expanded && <tr key={`${item._id}-guests`}><td colSpan="8" className="bg-light"><div className="p-3"><strong>Pessoas do convite</strong>{guests.length ? <div className="mt-2"><div className="row text-secondary small fw-bold border-bottom pb-2"><div className="col-5">Pessoa</div><div className="col-4">Confirmado em</div><div className="col-3 text-end">Status</div></div>{guests.map(guest => <div className="row align-items-center py-2 border-bottom" key={guest._id}><div className="col-5">{guest.name}</div><div className="col-4 text-secondary">{guest.confirmedAt ? new Date(guest.confirmedAt).toLocaleString('pt-BR') : '-'}</div><div className={`col-3 text-end ${guest.confirmed ? 'text-success' : 'text-warning'}`}>{guest.confirmed ? 'Confirmado' : 'Não confirmado'}</div></div>)}</div> : <p className="text-secondary mb-0 mt-2">Nenhuma pessoa cadastrada.</p>}</div></td></tr>].filter(Boolean); })}
    </tbody></table></div>
    <div className="card-footer d-flex align-items-center"><span>Total Itens: {summary.total} | Total Pessoas: {summary.people} | Confirmados: {summary.confirmed} | Não confirmados: {summary.unconfirmed}</span><label className="ms-3 me-2">{'Por página:'}</label><select className="form-select form-select-sm w-auto" value={pagination.limit} onChange={event => setPagination(current => ({ ...current, limit: Number(event.target.value), page: 1 }))}><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="200">200</option></select><ul className="pagination ms-auto m-0"><li className={`page-item ${pagination.page <= 1 ? 'disabled' : ''}`}><button className="page-link" disabled={pagination.page <= 1} onClick={() => setPagination(current => ({ ...current, page: current.page - 1 }))}>Anterior</button></li>{Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map(page => <li key={page} className={`page-item ${page === pagination.page ? 'active' : ''}`}><button className="page-link" onClick={() => setPagination(current => ({ ...current, page }))}>{page}</button></li>)}<li className={`page-item ${pagination.page >= pagination.totalPages ? 'disabled' : ''}`}><button className="page-link" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(current => ({ ...current, page: current.page + 1 }))}>{'Próxima'}</button></li></ul></div></div>
    {formOpen && <InvitationFormModal editing={editing} form={form} setForm={setForm} saving={saving} error={formError} onClose={() => setFormOpen(false)} onSubmit={submit} />}
    {deleting && <div className="modal modal-blur show d-block"><div className="modal-dialog modal-dialog-centered"><div className="modal-content"><div className="modal-header"><h3 className="modal-title">Excluir convite</h3><button className="btn-close" onClick={() => setDeleting(null)} /></div><div className="modal-body">Deseja realmente excluir <strong>{deleting.name}</strong>?</div><div className="modal-footer"><button className="btn" onClick={() => setDeleting(null)}>Cancelar</button><button className="btn btn-danger" disabled={saving} onClick={remove}>{saving ? 'Excluindo...' : 'Excluir'}</button></div></div></div></div>}
  </>;
}

// Todo o conteudo do casamento vem de /public/wedding (backend/src/config/wedding.js).
function useWedding() {
  const [wedding, setWedding] = useState(null);
  useEffect(() => { api.get('/public/wedding').then(response => setWedding(response.data.data)).catch(() => setWedding(false)); }, []);
  return wedding;
}
const mapEmbed = query => `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`;

const Svg = ({ children, size = 24, viewBox = '0 0 24 24', ...props }) => <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
const IconCalendar = props => <Svg {...props}><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M16 3v4M8 3v4M4 11h16M8 15h2v2h-2z" /></Svg>;
const IconClock = props => <Svg {...props}><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></Svg>;
const IconFlower = props => <Svg {...props}><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M18 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /></Svg>;
const IconMapPin = props => <Svg {...props}><path d="M12 11m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" /></Svg>;
const IconHeart = props => <Svg {...props} fill="currentColor" strokeWidth="0"><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.566z" /></Svg>;
const IconCheck = props => <Svg {...props} strokeWidth="2.4"><path d="M5 12l5 5l10 -10" /></Svg>;
const IconPhotoOff = props => <Svg {...props}><path d="M15 8h.01" /><path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3z" /><path d="M4 15l4 -4c.9 -.9 2 -.9 2.9 0l5.1 5" /><path d="M14 14l1 -1c.9 -.9 2 -.9 2.9 0l3.1 3" /><path d="M3 3l18 18" /></Svg>;
const IconUsers = props => <Svg {...props}><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></Svg>;
const IconGift = props => <Svg {...props}><path d="M3 8m0 1a1 1 0 0 1 1 -1h16a1 1 0 0 1 1 1v2a1 1 0 0 1 -1 1h-16a1 1 0 0 1 -1 -1z" /><path d="M12 8l0 13" /><path d="M19 12v7a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-7" /><path d="M7.5 8a2.5 2.5 0 0 1 0 -5a4.8 8 0 0 1 4.5 5a4.8 8 0 0 1 4.5 -5a2.5 2.5 0 0 1 0 5" /></Svg>;
const IconMessage = props => <Svg {...props}><path d="M8 9h8" /><path d="M8 13h6" /><path d="M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3z" /></Svg>;
const IconMenu = props => <Svg {...props} strokeWidth="1.8"><path d="M4 6h16M4 12h16M4 18h16" /></Svg>;
const IconClose = props => <Svg {...props} strokeWidth="1.8"><path d="M18 6l-12 12M6 6l12 12" /></Svg>;
const IconCopy = props => <Svg {...props}><path d="M8 8m0 2a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v8a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2z" /><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" /></Svg>;
const IconChevronLeft = props => <Svg {...props} strokeWidth="1.8"><path d="M15 6l-6 6l6 6" /></Svg>;
const IconChevronRight = props => <Svg {...props} strokeWidth="1.8"><path d="M9 6l6 6l-6 6" /></Svg>;
const IconInstagram = props => <Svg {...props}><path d="M4 4m0 4a4 4 0 0 1 4 -4h8a4 4 0 0 1 4 4v8a4 4 0 0 1 -4 4h-8a4 4 0 0 1 -4 -4z" /><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M16.5 7.5v.01" /></Svg>;
const IconFacebook = props => <Svg {...props}><path d="M7 10v4h3v7h4v-7h3l1 -4h-4v-2a1 1 0 0 1 1 -1h3v-4h-3a5 5 0 0 0 -5 5v2h-3" /></Svg>;
const IconWhatsapp = props => <Svg {...props}><path d="M3 21l1.65 -3.8a9 9 0 1 1 3.4 2.9l-5.05 .9" /><path d="M9 10a.5 .5 0 0 0 1 0v-1a.5 .5 0 0 0 -1 0v1a5 5 0 0 0 5 5h1a.5 .5 0 0 0 0 -1h-1a.5 .5 0 0 0 0 1" /></Svg>;
const IconMail = props => <Svg {...props}><path d="M3 7a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /><path d="M3 7l9 6l9 -6" /></Svg>;

// Logo da Fetech (ProjetoLogoFetech2.svg) inline para herdar a cor do rodape.
const FetechLogo = ({ height = 26 }) => <svg height={height} viewBox="0 0 200 55" fill="currentColor" role="img" aria-label="Fetech"><g transform="translate(0,55) scale(0.1,-0.1)" stroke="none">
  <path d="M112 528 c-6 -8 -7 -19 -3 -26 14 -23 -6 -134 -27 -151 -11 -9 -23 -34 -27 -59 -4 -26 -15 -48 -28 -58 -17 -13 -18 -15 -4 -10 10 3 20 6 22 6 2 0 9 17 17 38 12 34 13 27 18 -113 4 -124 8 -150 20 -150 12 0 16 18 18 88 l3 87 59 0 c53 0 60 2 60 20 0 18 -7 20 -60 20 l-60 0 0 35 0 35 80 0 c73 0 80 2 80 20 0 18 -7 20 -62 20 l-63 0 0 38 c1 20 4 44 8 53 5 9 7 38 5 65 -2 41 -6 49 -24 52 -11 2 -26 -3 -32 -10z" />
  <path d="M380 165 l0 -166 97 3 c84 3 98 6 101 21 3 15 -6 17 -77 17 l-81 0 0 55 0 55 40 0 c29 0 40 4 40 15 0 11 -11 15 -40 15 l-40 0 0 55 0 55 81 0 c71 0 80 2 77 18 -3 14 -17 17 -101 20 l-97 3 0 -166z" />
  <path d="M682 293 c3 -41 26 -57 35 -24 3 12 13 21 24 21 17 0 19 -11 21 -142 3 -119 5 -143 18 -143 13 0 15 24 18 143 2 136 3 142 23 142 13 0 23 -8 26 -20 9 -32 28 -17 31 23 l3 37 -101 0 -101 0 3 -37z" />
  <path d="M980 165 l0 -165 100 0 c93 0 100 1 100 20 0 18 -7 20 -80 20 l-80 0 0 55 0 55 40 0 c29 0 40 4 40 15 0 11 -11 15 -40 15 l-40 0 0 55 0 55 80 0 c73 0 80 2 80 20 0 19 -7 20 -100 20 l-100 0 0 -165z" />
  <path d="M1359 320 c-9 -5 -30 -41 -49 -80 l-32 -72 28 -70 c15 -38 37 -76 48 -84 11 -8 44 -14 73 -14 46 0 53 3 53 19 0 17 -8 20 -52 23 -52 3 -53 4 -80 53 -15 28 -28 59 -28 70 0 11 13 43 28 70 27 49 28 50 80 53 44 3 52 6 52 23 0 16 -7 19 -52 19 -29 0 -60 -5 -69 -10z" />
  <path d="M1585 318 c-3 -8 -4 -81 -3 -163 3 -125 5 -150 18 -150 11 0 16 17 20 70 l5 70 60 0 60 0 3 -73 c2 -55 6 -72 17 -72 13 0 15 27 15 165 0 138 -2 165 -15 165 -11 0 -15 -17 -17 -72 l-3 -73 -62 -3 -62 -3 -3 72 c-2 47 -7 74 -15 77 -7 2 -15 -3 -18 -10z" />
  <path d="M1822 299 c-11 -17 -11 -23 -2 -29 16 -10 4 -47 -18 -54 -9 -3 -5 -4 10 -2 15 2 25 -1 22 -6 -3 -4 4 -23 15 -42 11 -18 18 -36 14 -39 -3 -4 0 -7 9 -7 8 0 38 -26 66 -57 54 -60 70 -61 27 -2 -13 19 -33 50 -44 70 -11 19 -27 41 -35 48 -9 8 -16 21 -16 30 0 9 -6 23 -12 29 -10 10 -10 15 0 21 18 11 11 55 -8 59 -8 1 -21 -7 -28 -19z" />
  <path d="M1831 127 c-8 -10 -7 -26 5 -62 14 -40 14 -49 3 -56 -16 -10 -8 -12 14 -3 11 4 12 14 6 49 -4 24 -6 53 -4 64 4 24 -7 27 -24 8z" />
</g></svg>;

const LEAF = 'M0 0c9 -3.6 16.5 -1.2 20.5 7c-9.3 3.6 -16.6 1.2 -20.5 -7z';
const Sprig = ({ flip }) => <svg width="26" height="16" viewBox="0 0 26 16" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}>
  <path d="M2 14c5 0 11.5 -3 15.5 -9.5" /><path d="M6.4 12.4c-1 -2 -.3 -3.9 1.9 -4.8c.7 2 0 3.9 -1.9 4.8z" /><path d="M10.6 9.2c-1.1 -1.9 -.6 -3.8 1.4 -5c.9 1.9 .4 3.9 -1.4 5z" /><path d="M14.6 5.6c-1.3 -1.7 -1.1 -3.7 .5 -5.1c1.2 1.7 1 3.7 -.5 5.1z" />
</svg>;
const Branch = ({ className }) => <svg className={className} viewBox="0 0 110 320" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <path d="M12 316c24 -48 40 -102 46 -158c5 -50 0 -102 -14 -152" />
  {[[62, 106, -42], [58, 150, -26], [55, 196, -10], [50, 244, 8], [46, 62, -54]].map(([x, y, angle]) => <g key={`${x}-${y}`}>
    <path d={LEAF} transform={`translate(${x} ${y}) rotate(${angle})`} /><path d={LEAF} transform={`translate(${x} ${y}) rotate(${180 - angle})`} />
  </g>)}
  <path d="M44 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" /><path d="M30 34m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0" />
</svg>;
const Flourish = ({ className }) => <svg className={className} viewBox="0 0 240 60" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
  <path d="M4 54c46 0 92 -8 130 -26c34 -16 70 -22 102 -20" />
  {[[40, 50, 200], [78, 45, 210], [116, 35, 220], [154, 24, 235], [192, 16, 250]].map(([x, y, angle]) => <g key={`${x}-${y}`}>
    <path d={LEAF} transform={`translate(${x} ${y}) rotate(${angle})`} /><path d={LEAF} transform={`translate(${x} ${y}) rotate(${angle - 110})`} />
  </g>)}
  <path d="M120 26m-5 0a5 5 0 1 0 10 0a5 5 0 1 0 -10 0" /><path d="M62 44m-3.5 0a3.5 3.5 0 1 0 7 0a3.5 3.5 0 1 0 -7 0" /><path d="M198 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
</svg>;
const MapArt = () => <svg className="wed-map-art" viewBox="0 0 400 190" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <rect width="400" height="190" fill="#f1efe6" />
  <g fill="#dde7d7"><rect x="12" y="18" width="92" height="50" rx="6" /><rect x="298" y="112" width="90" height="62" rx="6" /><rect x="146" y="140" width="72" height="42" rx="6" /><rect x="286" y="10" width="60" height="34" rx="6" /></g>
  <g fill="none" stroke="#e5e0d1" strokeWidth="3"><path d="M0 38h400M0 116h400M58 0v190M188 0v190M330 0v190" /></g>
  <g fill="none" stroke="#fff" strokeWidth="9" strokeLinecap="round"><path d="M0 80h400M0 152h400M118 0v190M262 0v190M338 0l-130 190" /></g>
  <g transform="translate(178 34) scale(1.9)"><path d="M12 2a7.4 7.4 0 0 0 -7.4 7.4c0 5 6.5 11.6 7.4 11.6s7.4 -6.6 7.4 -11.6a7.4 7.4 0 0 0 -7.4 -7.4z" fill="#1f4536" /><g fill="none" stroke="#fdfaf2" strokeWidth="1.1"><path d="M12 9m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0" /><path d="M12 5.8m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0" /><path d="M12 12.2m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0" /><path d="M8.8 9m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0" /><path d="M15.2 9m-1.6 0a1.6 1.6 0 1 0 3.2 0a1.6 1.6 0 1 0 -3.2 0" /></g></g>
</svg>;

const InfoCard = ({ icon, label, lines, href }) => {
  const Tag = href ? 'a' : 'div';
  const linkProps = href ? { href, target: '_blank', rel: 'noreferrer' } : {};
  return <Tag className={`wed-info${href ? ' wed-info-link' : ''}`} {...linkProps}>
    <span className="wed-info-icon">{icon}</span><span className="wed-info-label">{label}</span>
    <span className="wed-info-value">{lines.map(line => <span key={line}>{line}</span>)}</span>
    {href && <span className="wed-info-hint">ver no mapa</span>}
  </Tag>;
};

const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'sobre', label: 'Sobre nós' },
  { id: 'padrinhos', label: 'Padrinhos' },
  { id: 'cerimonia', label: 'Cerimônia' },
  { id: 'presentes', label: 'Lista de presentes' },
  { id: 'recados', label: 'Recados' },
  { id: 'confirmar', label: 'Confirme sua presença' }
];
// O convidado chega na landing pelo link pessoal; guardamos o caminho para que
// "Confirme sua presenca" saiba para qual convite voltar.
const INVITE_KEY = 'wedding.invite';
const inviteStore = {
  get: () => { try { return localStorage.getItem(INVITE_KEY); } catch { return null; } },
  set: path => { try { localStorage.setItem(INVITE_KEY, path); } catch { /* modo privado */ } }
};

const pad = value => String(value).padStart(2, '0');
function Countdown({ target }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const left = target - now;
  if (!Number.isFinite(target)) return null;
  if (left <= 0) return <p className="wed-count-done"><IconHeart size={18} />{'O grande dia chegou!'}</p>;
  const seconds = Math.floor(left / 1000);
  const parts = [[Math.floor(seconds / 86400), 'dias'], [Math.floor(seconds / 3600) % 24, 'horas'], [Math.floor(seconds / 60) % 60, 'min'], [seconds % 60, 'seg']];
  return <div className="wed-count" role="timer" aria-label={`Faltam ${parts[0][0]} dias para o casamento`}>
    {parts.map(([value, label]) => <div className="wed-count-box" key={label}><strong>{pad(value)}</strong><span>{label}</span></div>)}
  </div>;
}

const scrollToSection = (event, id) => { event.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

// Marca no menu a secao que esta sendo lida. Le a posicao direto no scroll (em
// vez de IntersectionObserver) porque comparar area de intersecao elegia a
// secao mais alta, e nao a que esta na tela. A linha de leitura muda conforme a
// direcao: descendo a proxima secao assume mais cedo, subindo devolve mais
// cedo. Essa histerese evita o menu piscar entre dois itens na fronteira.
const READ_LINE_DOWN = .45;
const READ_LINE_UP = .55;
function useActiveSection(ready) {
  const [active, setActive] = useState(NAV[0].id);
  useEffect(() => {
    if (!ready) return;
    let previousY = window.scrollY;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const y = window.scrollY;
      const goingDown = y >= previousY;
      previousY = y;
      // No fim da pagina a ultima secao pode nunca alcancar a linha de leitura.
      if (Math.ceil(y + window.innerHeight) >= document.documentElement.scrollHeight) return setActive(NAV[NAV.length - 1].id);
      const line = window.innerHeight * (goingDown ? READ_LINE_DOWN : READ_LINE_UP);
      let current = NAV[0].id;
      NAV.forEach(item => { const node = document.getElementById(item.id); if (node && node.getBoundingClientRect().top <= line) current = item.id; });
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(measure); };
    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [ready]);
  return active;
}

function LandingNav({ couple }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const active = useActiveSection(true);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const go = (event, id) => { setOpen(false); scrollToSection(event, id); };
  return <header className={`wed-nav${scrolled ? ' is-scrolled' : ''}`}>
    <div className="wed-nav-inner">
      <a className="wed-nav-brand" href="#home" onClick={event => go(event, 'home')}><IconFlower size={22} />{couple[0]}<span>&amp;</span>{couple[1]}</a>
      <button className="wed-nav-toggle" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Fechar menu' : 'Abrir menu'}>{open ? <IconClose size={24} /> : <IconMenu size={24} />}</button>
      <nav className={`wed-nav-links${open ? ' is-open' : ''}`}>
        {NAV.map(item => <a key={item.id} href={`#${item.id}`} className={active === item.id ? 'is-active' : ''} onClick={event => go(event, item.id)}>{item.label}</a>)}
      </nav>
    </div>
  </header>;
}

function SiteFooter({ wedding, onLanding }) {
  const contact = wedding.contact || {};
  // Fora da landing as secoes nao existem: o menu vira link para /casamento.
  const sectionHref = id => onLanding ? `#${id}` : `/casamento#${id}`;
  const socials = [
    contact.facebook && { href: contact.facebook, icon: <IconFacebook size={18} />, label: 'Facebook' },
    contact.instagram && { href: contact.instagram, icon: <IconInstagram size={18} />, label: 'Instagram' },
    contact.whatsapp && { href: contact.whatsapp, icon: <IconWhatsapp size={18} />, label: 'WhatsApp' },
    contact.email && { href: `mailto:${contact.email}`, icon: <IconMail size={18} />, label: 'E-mail' }
  ].filter(Boolean);
  return <footer className="wed-foot">
    <div className="wed-foot-top">
      <div className="wed-foot-brand">
        <span className="wed-foot-logo"><IconFlower size={30} /><em>{wedding.couple[0]} &amp; {wedding.couple[1]}</em></span>
        {socials.length > 0 && <div className="wed-foot-social">{socials.map(social => <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>{social.icon}</a>)}</div>}
      </div>
      <div className="wed-foot-col">
        <h3>Menu</h3>
        <ul>{NAV.slice(1).map(item => <li key={item.id}><a href={sectionHref(item.id)} onClick={onLanding ? event => scrollToSection(event, item.id) : undefined}>{item.label}</a></li>)}</ul>
      </div>
      <div className="wed-foot-col">
        <h3>Contato</h3>
        <ul>
          {contact.phone && <li><a href={contact.whatsapp || `tel:${contact.phone.replace(/\D/g, '')}`}><IconWhatsapp size={16} />{contact.phone}</a></li>}
          {contact.email && <li><a href={`mailto:${contact.email}`}><IconMail size={16} />{contact.email}</a></li>}
        </ul>
      </div>
      <div className="wed-foot-col">
        <h3>Endereço</h3>
        <ul>
          <li><a href={wedding.ceremony.map} target="_blank" rel="noreferrer"><IconMapPin size={16} />{wedding.ceremony.fullAddress}</a></li>
          <li className="wed-foot-plain">{wedding.date.join(' ')} {'•'} {wedding.time.join('')}</li>
        </ul>
      </div>
    </div>
    <div className="wed-foot-bar"><div className="wed-foot-bar-inner">
      <span>{'©'} {new Date().getFullYear()} Todos os direitos reservados.</span>
      <span className="wed-foot-fetech" role="img" aria-label="Fetech"><FetechLogo height={24} /></span>
    </div></div>
  </footer>;
}

// Carrossel sobre scroll-snap nativo: o swipe no celular e a rolagem por
// teclado vem de graca do navegador, e a transicao suave e o proprio
// scroll-behavior.
const CAROUSEL_INTERVAL = 4500;
function Carousel({ label, children }) {
  const trackRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: true, scrollable: false });
  const total = React.Children.count(children);

  // Mexe SO no scroll do trilho. Nada de scrollIntoView aqui: ele rola os
  // ancestrais para trazer o card ao campo de visao e, com a secao parcialmente
  // na tela, arrasta a pagina inteira junto.
  const goTo = useCallback(position => {
    const track = trackRef.current;
    const card = track?.children[Math.max(0, Math.min(position, total - 1))];
    if (!card) return;
    const padding = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    const delta = card.getBoundingClientRect().left - track.getBoundingClientRect().left - padding;
    const limite = track.scrollWidth - track.clientWidth;
    track.scrollTo({ left: Math.max(0, Math.min(track.scrollLeft + delta, limite)), behavior: 'smooth' });
  }, [total]);

  // Descobre o card em foco lendo o scroll: vale tanto para os botoes quanto
  // para o arrasto do dedo.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const read = () => {
      frame = 0;
      const left = track.getBoundingClientRect().left;
      let closest = 0; let best = Infinity;
      Array.from(track.children).forEach((card, position) => {
        const distance = Math.abs(card.getBoundingClientRect().left - left);
        if (distance < best) { best = distance; closest = position; }
      });
      setIndex(closest);
      setEdges({
        start: track.scrollLeft <= 1,
        end: track.scrollLeft + track.clientWidth >= track.scrollWidth - 1,
        scrollable: track.scrollWidth > track.clientWidth + 1
      });
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(read); };
    read();
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { track.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [total]);

  // Anda sozinho, mas para enquanto o visitante esta mexendo ou lendo o card.
  useEffect(() => {
    if (paused || !edges.scrollable || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => goTo(edges.end ? 0 : index + 1), CAROUSEL_INTERVAL);
    return () => clearInterval(timer);
  }, [paused, index, edges.scrollable, edges.end, goTo]);

  const hold = () => setPaused(true);
  const release = () => setPaused(false);
  return <div className="wed-carousel" onMouseEnter={hold} onMouseLeave={release} onFocusCapture={hold} onBlurCapture={release} onTouchStart={hold} onTouchEnd={release}>
    <div className="wed-carousel-track" ref={trackRef} tabIndex="0" role="group" aria-label={label}>{children}</div>
    {edges.scrollable && <>
      <button type="button" className="wed-carousel-arrow wed-carousel-prev" onClick={() => goTo(index - 1)} disabled={edges.start} aria-label="Anterior"><IconChevronLeft size={22} /></button>
      <button type="button" className="wed-carousel-arrow wed-carousel-next" onClick={() => goTo(edges.end ? 0 : index + 1)} aria-label="Próximo"><IconChevronRight size={22} /></button>
      <div className="wed-carousel-dots">
        {Array.from({ length: total }, (_, position) => <button type="button" key={position} className={position === index ? 'is-active' : ''} onClick={() => goTo(position)} aria-label={`Ir para o item ${position + 1}`} aria-current={position === index} />)}
      </div>
    </>}
  </div>;
}

function GodparentCard({ couple }) {
  const [failed, setFailed] = useState(false);
  const initials = couple.names.map(name => name.trim().charAt(0)).join('');
  return <div className="wed-card wed-pad">
    <span className="wed-pad-photo">
      {couple.photo && !failed
        ? <img src={couple.photo} alt={couple.names.join(' e ')} loading="lazy" onError={() => setFailed(true)} />
        : <span className="wed-pad-initials">{initials}</span>}
    </span>
    <span className="wed-pad-icon"><IconUsers size={24} /></span>
    <strong>{couple.names.join(' & ')}</strong>
    <span className="wed-pad-role">{couple.role}</span>
  </div>;
}

function Guestbook() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: '', message: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  useEffect(() => { api.get('/public/messages').then(response => setItems(response.data.data)).catch(() => setItems([])); }, []);
  const submit = async event => {
    event.preventDefault(); setSending(true); setError('');
    try {
      const response = await api.post('/public/messages', form);
      setItems(current => [response.data.data, ...current]); setForm({ name: '', message: '' }); setSent(true);
    } catch (requestError) { setError(requestError.response?.data?.message || 'Não foi possível enviar o seu recado.'); }
    finally { setSending(false); }
  };
  return <div className="wed-recados">
    <form className="wed-card wed-recado-form" onSubmit={submit}>
      <label className="wed-field"><span>Seu nome</span><input required maxLength="120" value={form.name} onChange={event => { setSent(false); setForm({ ...form, name: event.target.value }); }} placeholder="Como podemos te chamar?" /></label>
      <label className="wed-field"><span>Seu recado</span><textarea required rows="4" maxLength="800" value={form.message} onChange={event => { setSent(false); setForm({ ...form, message: event.target.value }); }} placeholder="Escreva um carinho para os noivos..." /></label>
      {error && <p className="wed-form-error">{error}</p>}
      {sent && !error && <p className="wed-form-ok"><IconCheck size={15} />Recado enviado. Obrigado!</p>}
      <button className="wed-btn" disabled={sending}><IconMessage size={20} />{sending ? 'Enviando...' : 'Deixar recado'}</button>
    </form>
    <div className="wed-recado-list">
      {items.length === 0
        ? <p className="wed-empty">Nenhum recado ainda. Seja o primeiro a escrever!</p>
        : items.map(item => <blockquote className="wed-card wed-recado" key={item._id}>
          <p>{item.message}</p>
          <footer><strong>{item.name}</strong><time>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</time></footer>
        </blockquote>)}
    </div>
  </div>;
}

function Landing() {
  const wedding = useWedding();
  const [photoFailed, setPhotoFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  // Deep link (/casamento#presentes): a secao so existe depois que os dados chegam.
  useEffect(() => {
    if (!wedding || !location.hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView());
    return () => cancelAnimationFrame(frame);
  }, [Boolean(wedding)]);
  const invitePath = inviteStore.get();
  if (wedding === false) return <div className="wed wed-plain"><div className="wed-state">Não foi possível carregar os dados do casamento.</div></div>;
  if (!wedding) return <div className="wed wed-plain"><div className="wed-state">Carregando...</div></div>;
  const target = new Date(wedding.datetime).getTime();
  const copyPix = async () => { try { await navigator.clipboard.writeText(wedding.gifts.pix.value); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch { /* sem clipboard */ } };
  return <div className="wed wed-lp">
    <div className="wed-lp-bg" aria-hidden="true">
      {photoFailed ? <div className="wed-lp-bg-empty" /> : <img src={wedding.photo} alt="" onError={() => setPhotoFailed(true)} />}
    </div>
    <LandingNav couple={wedding.couple} />
    <main className="wed-lp-body">
      <section className="wed-lp-hero" id="home">
        <p className="wed-lp-kicker">Vamos nos casar</p>
        <h1 className="wed-names">{wedding.couple[0]} <span className="wed-amp">&amp;</span> {wedding.couple[1]}</h1>
        <div className="wed-rule"><i /><IconHeart size={14} /><i /></div>
        <p className="wed-lp-date">{wedding.date.join(' ')} {'•'} {wedding.time.join('')}</p>
        <Countdown target={target} />
        <a className="wed-lp-scroll" href="#sobre" onClick={event => scrollToSection(event, 'sobre')}>conheça nossa história</a>
      </section>

      <div className="wed-lp-sheet">
        <section className="wed-sec" id="sobre">
          <h2 className="wed-sec-title"><Sprig />{wedding.about.title}<Sprig flip /></h2>
          <div className="wed-prose">{wedding.about.paragraphs.map(paragraph => <p key={paragraph.slice(0, 24)}>{paragraph}</p>)}</div>
        </section>

        <section className="wed-sec" id="padrinhos">
          <h2 className="wed-sec-title"><Sprig />{wedding.godparents.title}<Sprig flip /></h2>
          <p className="wed-sec-intro">{wedding.godparents.intro}</p>
          <Carousel label="Padrinhos">{wedding.godparents.couples.map(couple => <GodparentCard key={couple.names.join()} couple={couple} />)}</Carousel>
        </section>

        <section className="wed-sec" id="cerimonia">
          <h2 className="wed-sec-title"><Sprig />Cerimônia<Sprig flip /></h2>
          <div className="wed-info-grid">
            <InfoCard icon={<IconCalendar size={28} />} label="Data" lines={wedding.date} />
            <InfoCard icon={<IconClock size={28} />} label={'Horário'} lines={wedding.time} />
            <InfoCard icon={<IconFlower size={28} />} label={wedding.party.label} lines={wedding.party.lines} href={wedding.party.map} />
            <InfoCard icon={<IconMapPin size={28} />} label={wedding.ceremony.label} lines={wedding.ceremony.lines} href={wedding.ceremony.map} />
          </div>
          <div className="wed-card wed-map-card">
            <h3 className="wed-card-title"><Sprig />Como chegar<Sprig flip /></h3>
            <div className="wed-map-frame">
              <div className="wed-map-canvas">
                <MapArt /><iframe title="Local da cerimônia" src={mapEmbed(wedding.ceremony.query)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                <a className="wed-map-tap" href={wedding.ceremony.map} target="_blank" rel="noreferrer" aria-label="Abrir no Google Maps" />
              </div>
              <a className="wed-map-foot" href={wedding.ceremony.map} target="_blank" rel="noreferrer">
                <IconMapPin size={18} /><div><strong>{wedding.ceremony.name}</strong><span>{wedding.ceremony.fullAddress}</span></div>
              </a>
            </div>
          </div>
        </section>

        <section className="wed-sec" id="presentes">
          <h2 className="wed-sec-title"><Sprig />{wedding.gifts.title}<Sprig flip /></h2>
          <p className="wed-sec-intro">{wedding.gifts.intro}</p>
          <div className="wed-card wed-pix">
            <span className="wed-pad-icon"><IconGift size={24} /></span>
            <div className="wed-pix-body">
              <strong>{wedding.gifts.pix.label}</strong>
              <code>{wedding.gifts.pix.value}</code>
              <span>{wedding.gifts.pix.hint}</span>
            </div>
            <button className="wed-btn wed-btn-ghost" onClick={copyPix}><IconCopy size={18} />{copied ? 'Copiado!' : 'Copiar chave'}</button>
          </div>
          <div className="wed-grid-2">{wedding.gifts.stores.map(store => {
            const Tag = store.url ? 'a' : 'div';
            const props = store.url ? { href: store.url, target: '_blank', rel: 'noreferrer' } : {};
            return <Tag className={`wed-card wed-store${store.url ? ' wed-info-link' : ''}`} key={store.name} {...props}>
              <strong>{store.name}</strong><span>{store.description}</span>
              {store.url ? <span className="wed-info-hint">abrir lista</span> : <span className="wed-soon">em breve</span>}
            </Tag>;
          })}</div>
        </section>

        <section className="wed-sec" id="recados">
          <h2 className="wed-sec-title"><Sprig />Recados<Sprig flip /></h2>
          <p className="wed-sec-intro">Deixe uma mensagem para os noivos. Ela aparece aqui no mural para todo mundo ver.</p>
          <Guestbook />
        </section>

        <section className="wed-sec wed-sec-cta" id="confirmar">
          <h2 className="wed-sec-title"><Sprig />Confirme sua presença<Sprig flip /></h2>
          {invitePath
            ? <div className="wed-card wed-cta">
              <p>Seu convite pessoal está a um clique. Lá você marca quem da sua família vai com você.</p>
              <a className="wed-btn" href={invitePath}><IconHeart size={20} />Ir para o meu convite</a>
            </div>
            : <div className="wed-card wed-cta">
              <p>A confirmação é feita pelo link pessoal que você recebeu dos noivos — é ele que identifica quem foi convidado.</p>
              <p className="wed-cta-hint">Procure a mensagem com o seu convite e abra o link por ali. Perdeu o link? Fale com os noivos pelo contato no rodapé.</p>
            </div>}
        </section>
      </div>
    </main>
    <SiteFooter wedding={wedding} onLanding />
  </div>;
}

function WeddingShell({ children, wedding }) {
  return <div className="wed">
    <header className="wed-topbar"><span className="wed-brand"><IconFlower size={26} />Convites de casamento</span></header>
    {children}
    {wedding ? <SiteFooter wedding={wedding} /> : <footer className="wed-footer"><i /><IconHeart size={15} /><i /></footer>}
  </div>;
}

// Tela do link pessoal: apenas a acao de confirmar presenca. Data, horario,
// locais e mapa passaram a viver na landing (/casamento).
function Public() {
  const [, , id, name] = location.pathname.split('/');
  const wedding = useWedding();
  const [item, setItem] = useState(); const [error, setError] = useState(false); const [confirming, setConfirming] = useState(false); const [notification, setNotification] = useState(null); const [selectedGuestIds, setSelectedGuestIds] = useState([]); const [photoFailed, setPhotoFailed] = useState(false);
  const notify = (type, message) => setNotification({ type, message });
  useEffect(() => { if (!notification) return; const timer = setTimeout(() => setNotification(null), 4500); return () => clearTimeout(timer); }, [notification]);
  useEffect(() => { api.get('/public/invitations/' + id + '/' + name, { params: { token: new URLSearchParams(location.search).get('token') } }).then(response => setItem(response.data.data)).catch(() => setError(true)); }, [id, name]);
  useEffect(() => { if (item?.guests) setSelectedGuestIds(item.guests.filter(guest => guest.confirmed).map(guest => String(guest._id))); }, [item?._id]);
  // Convite valido: guarda o caminho para a landing saber a qual convite voltar.
  useEffect(() => { if (item) inviteStore.set(location.pathname + location.search); }, [item?._id]);
  const confirm = async () => { setConfirming(true); try { const response = await api.post('/public/invitations/' + id + '/confirm', { guestIds: selectedGuestIds }); setItem(response.data.data); notify('success', response.data.message); } catch { notify('danger', 'N\u00e3o foi poss\u00edvel confirmar a presen\u00e7a.'); } finally { setConfirming(false); } };
  if (error) return <WeddingShell><div className="wed-state">{'Convite não encontrado'}</div></WeddingShell>;
  if (!item || !wedding) return <WeddingShell><div className="wed-state">Carregando...</div></WeddingShell>;
  const toggleGuest = guestId => setSelectedGuestIds(current => current.includes(guestId) ? current.filter(idValue => idValue !== guestId) : [...current, guestId]);
  const guests = item.guests || [];
  const deadline = item.confirmationDeadline ? new Date(item.confirmationDeadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null;
  return <WeddingShell wedding={wedding}>
    <Toast notification={notification} onClose={() => setNotification(null)} />
    <div className="wed-main">
      <section className="wed-hero">
        <Branch className="wed-branch wed-branch-start" /><Branch className="wed-branch wed-branch-end" />
        <div className="wed-hero-photo">
          {photoFailed
            ? <div className="wed-photo-empty"><IconPhotoOff size={56} /><span>Imagem do casal</span></div>
            : <img src={wedding.photo} alt={`${wedding.couple[0]} e ${wedding.couple[1]}`} onError={() => setPhotoFailed(true)} />}
        </div>
        <div className="wed-hero-content">
          <h1 className="wed-names">{wedding.couple[0]} <span className="wed-amp">&amp;</span> {wedding.couple[1]}</h1>
          <div className="wed-rule"><i /><IconHeart size={14} /><i /></div>
          <p className="wed-verse">{wedding.verse}</p>
        </div>
      </section>
      <section className="wed-panel wed-panel-confirm">
        <div className="wed-card">
          <h2 className="wed-card-title wed-card-title-start"><Sprig />{'Selecione as pessoas que confirmam presença:'}</h2>
          <div className="wed-guests">{guests.map(guest => <label className="wed-guest" key={guest._id}>
            <input type="checkbox" checked={selectedGuestIds.includes(String(guest._id))} onChange={() => toggleGuest(String(guest._id))} />
            <span className="wed-check"><IconCheck size={13} /></span><span className="wed-guest-name">{guest.name}</span>
            {guest.confirmed && <span className="wed-badge"><IconCheck size={12} />Confirmado</span>}
          </label>)}</div>
          <button className="wed-btn" disabled={confirming} onClick={confirm}><IconHeart size={20} />{confirming ? 'Atualizando...' : 'Atualizar confirmação'}</button>
        </div>
        {deadline && <div className="wed-card wed-deadline">
          <span className="wed-deadline-icon"><IconCalendar size={22} /></span>
          <p>{'Confirme sua presença até '}{deadline}</p><Flourish className="wed-flourish" />
        </div>}
        <a className="wed-card wed-info-link wed-details" href="/casamento">
          <span className="wed-details-icon"><IconMapPin size={26} /></span>
          <span className="wed-details-text"><strong>{'Data, horário, local e lista de presentes'}</strong><span>Veja todos os detalhes do casamento</span></span>
          <span className="wed-info-hint">abrir</span>
        </a>
      </section>
    </div>
  </WeddingShell>;
}

function Admin() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(Boolean(tokenStore.get()));
  // Revalida o token guardado antes de liberar a tela principal.
  useEffect(() => { if (!tokenStore.get()) return; api.get('/auth/me').then(response => setUser(response.data.data)).catch(() => tokenStore.clear()).finally(() => setChecking(false)); }, []);
  useEffect(() => { const expire = () => setUser(null); window.addEventListener('auth:expired', expire); return () => window.removeEventListener('auth:expired', expire); }, []);
  const logout = () => { tokenStore.clear(); setUser(null); };
  if (checking) return <div className="page page-center"><div className="text-secondary">Carregando...</div></div>;
  if (!user) return <Login onSuccess={setUser} />;
  return <Layout user={user} onLogout={logout}><Home /></Layout>;
}

function App() {
  if (location.pathname.startsWith('/invitation/')) return <Public />;
  if (location.pathname.startsWith('/casamento')) return <Landing />;
  return <Admin />;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);
