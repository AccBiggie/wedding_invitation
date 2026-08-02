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

const WEDDING = {
  couple: ['Stéfani', 'André'],
  verse: 'Com a bênção de Deus e a alegria de nossos corações, convidamos você para o nosso grande dia.',
  photo: '/casal.jpg',
  date: ['10 de abril', 'de 2027'],
  time: ['17h00'],
  party: {
    lines: ['Igreja Luterana', 'de Sussuí'],
    map: 'https://maps.app.goo.gl/PjsrKNU3og4HTd738'
  },
  ceremony: {
    lines: ['R. Minas Gerais, 762-862', 'Eng. Beltrão/PR'],
    name: 'Igreja de Ivailândia',
    fullAddress: 'R. Minas Gerais, 762-862 - Ivailândia, Eng. Beltrão - PR, 87270-000',
    query: 'Paróquia São Gabriel Arcanjo e São Sebastião, R. Minas Gerais, 762-862, Ivailândia, Engenheiro Beltrão - PR, 87270-000',
    map: 'https://maps.app.goo.gl/R8X3S2GSwEqQ1ehn7'
  }
};
const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(WEDDING.ceremony.query)}&z=16&output=embed`;

const Svg = ({ children, size = 24, viewBox = '0 0 24 24', ...props }) => <svg width={size} height={size} viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{children}</svg>;
const IconCalendar = props => <Svg {...props}><path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2z" /><path d="M16 3v4M8 3v4M4 11h16M8 15h2v2h-2z" /></Svg>;
const IconClock = props => <Svg {...props}><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 7v5l3 3" /></Svg>;
const IconFlower = props => <Svg {...props}><path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M12 18m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M18 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /></Svg>;
const IconMapPin = props => <Svg {...props}><path d="M12 11m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" /></Svg>;
const IconHeart = props => <Svg {...props} fill="currentColor" strokeWidth="0"><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.566z" /></Svg>;
const IconCheck = props => <Svg {...props} strokeWidth="2.4"><path d="M5 12l5 5l10 -10" /></Svg>;
const IconPhotoOff = props => <Svg {...props}><path d="M15 8h.01" /><path d="M6 3h12a3 3 0 0 1 3 3v12a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-12a3 3 0 0 1 3 -3z" /><path d="M4 15l4 -4c.9 -.9 2 -.9 2.9 0l5.1 5" /><path d="M14 14l1 -1c.9 -.9 2 -.9 2.9 0l3.1 3" /><path d="M3 3l18 18" /></Svg>;

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

function WeddingShell({ children }) {
  return <div className="wed">
    <header className="wed-topbar"><span className="wed-brand"><IconFlower size={26} />Convites de casamento</span></header>
    {children}
    <footer className="wed-footer"><i /><IconHeart size={15} /><i /></footer>
  </div>;
}

function Public() {
  const [, , id, name] = location.pathname.split('/');
  const [item, setItem] = useState(); const [error, setError] = useState(false); const [confirming, setConfirming] = useState(false); const [notification, setNotification] = useState(null); const [selectedGuestIds, setSelectedGuestIds] = useState([]); const [photoFailed, setPhotoFailed] = useState(false);
  const notify = (type, message) => setNotification({ type, message });
  useEffect(() => { if (!notification) return; const timer = setTimeout(() => setNotification(null), 4500); return () => clearTimeout(timer); }, [notification]);
  useEffect(() => { api.get('/public/invitations/' + id + '/' + name, { params: { token: new URLSearchParams(location.search).get('token') } }).then(response => setItem(response.data.data)).catch(() => setError(true)); }, [id, name]);
  useEffect(() => { if (item?.guests) setSelectedGuestIds(item.guests.filter(guest => guest.confirmed).map(guest => String(guest._id))); }, [item?._id]);
  const confirm = async () => { setConfirming(true); try { const response = await api.post('/public/invitations/' + id + '/confirm', { guestIds: selectedGuestIds }); setItem(response.data.data); notify('success', response.data.message); } catch { notify('danger', 'N\u00e3o foi poss\u00edvel confirmar a presen\u00e7a.'); } finally { setConfirming(false); } };
  if (error) return <WeddingShell><div className="wed-state">{'Convite não encontrado'}</div></WeddingShell>;
  if (!item) return <WeddingShell><div className="wed-state">Carregando...</div></WeddingShell>;
  const toggleGuest = guestId => setSelectedGuestIds(current => current.includes(guestId) ? current.filter(idValue => idValue !== guestId) : [...current, guestId]);
  const guests = item.guests || [];
  const deadline = item.confirmationDeadline ? new Date(item.confirmationDeadline).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : null;
  return <WeddingShell>
    <Toast notification={notification} onClose={() => setNotification(null)} />
    <div className="wed-main">
      <section className="wed-hero">
        <Branch className="wed-branch wed-branch-start" /><Branch className="wed-branch wed-branch-end" />
        <div className="wed-hero-photo">
          {photoFailed
            ? <div className="wed-photo-empty"><IconPhotoOff size={56} /><span>Imagem do casal</span></div>
            : <img src={WEDDING.photo} alt={`${WEDDING.couple[0]} e ${WEDDING.couple[1]}`} onError={() => setPhotoFailed(true)} />}
        </div>
        <div className="wed-hero-content">
          <h1 className="wed-names">{WEDDING.couple[0]} <span className="wed-amp">&amp;</span> {WEDDING.couple[1]}</h1>
          <div className="wed-rule"><i /><IconHeart size={14} /><i /></div>
          <p className="wed-verse">{WEDDING.verse}</p>
        </div>
      </section>
      <section className="wed-panel">
        <div className="wed-info-grid">
          <InfoCard icon={<IconCalendar size={28} />} label="Data" lines={WEDDING.date} />
          <InfoCard icon={<IconClock size={28} />} label={'Horário'} lines={WEDDING.time} />
          <InfoCard icon={<IconFlower size={28} />} label="Local da Festa" lines={WEDDING.party.lines} href={WEDDING.party.map} />
          <InfoCard icon={<IconMapPin size={28} />} label={'Local Celebração'} lines={WEDDING.ceremony.lines} href={WEDDING.ceremony.map} />
        </div>
        <div className="wed-cols">
          <div className="wed-card">
            <h2 className="wed-card-title wed-card-title-start"><Sprig />{'Selecione as pessoas que confirmam presença:'}</h2>
            <div className="wed-guests">{guests.map(guest => <label className="wed-guest" key={guest._id}>
              <input type="checkbox" checked={selectedGuestIds.includes(String(guest._id))} onChange={() => toggleGuest(String(guest._id))} />
              <span className="wed-check"><IconCheck size={13} /></span><span className="wed-guest-name">{guest.name}</span>
              {guest.confirmed && <span className="wed-badge"><IconCheck size={12} />Confirmado</span>}
            </label>)}</div>
            <button className="wed-btn" disabled={confirming} onClick={confirm}><IconHeart size={20} />{confirming ? 'Atualizando...' : 'Atualizar confirmação'}</button>
          </div>
          <div className="wed-card">
            <h2 className="wed-card-title"><Sprig />Como chegar<Sprig flip /></h2>
            <div className="wed-map-frame">
              <div className="wed-map-canvas">
                <MapArt /><iframe title="Local da cerimônia" src={MAP_EMBED} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
                <a className="wed-map-tap" href={WEDDING.ceremony.map} target="_blank" rel="noreferrer" aria-label="Abrir no Google Maps" />
              </div>
              <a className="wed-map-foot" href={WEDDING.ceremony.map} target="_blank" rel="noreferrer">
                <IconMapPin size={18} /><div><strong>{WEDDING.ceremony.name}</strong><span>{WEDDING.ceremony.fullAddress}</span></div>
              </a>
            </div>
          </div>
        </div>
        {deadline && <div className="wed-card wed-deadline">
          <span className="wed-deadline-icon"><IconCalendar size={22} /></span>
          <p>{'Confirme sua presença até '}{deadline}</p><Flourish className="wed-flourish" />
        </div>}
      </section>
    </div>
  </WeddingShell>;
}

function App() { return location.pathname.startsWith('/invitation/') ? <Public /> : <Layout><Home /></Layout>; }
createRoot(document.getElementById('root')).render(<BrowserRouter><App /></BrowserRouter>);
