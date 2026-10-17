import { GodparentForm } from './GodparentForm';
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, IconButton, MenuItem, Paper, Snackbar, Stack, TextField, Tooltip, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DataGrid, type GridColDef, type GridPaginationModel, type GridSortModel } from '@mui/x-data-grid';
import Add from '@mui/icons-material/Add'; import EditOutlined from '@mui/icons-material/EditOutlined'; import DeleteOutline from '@mui/icons-material/DeleteOutlined';
import { PageHeader } from '../../components/common/PageHeader'; import { ConfirmDialog } from '../../components/common/ConfirmDialog'; import { EmptyState } from '../../components/common/EmptyState';
import { godparentsService, type GodparentFilters } from '../../services/godparents.service'; import type { Godparent } from '../../types/api';

const roleName: Record<Godparent['role'], string> = { groomsman: 'Padrinho', bridesmaid: 'Madrinha', mother: 'Mãe', father: 'Pai', other: 'Outro' };
export function GodparentsPage() {
  const { id } = useParams(); const navigate = useNavigate(); const location = useLocation(); const mobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [filters, setFilters] = useState<GodparentFilters>({ name: '', role: '', active: '' });
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 }); const [sort, setSort] = useState<GridSortModel>([{ field: 'order', sort: 'asc' }]);
  const [rows, setRows] = useState<Godparent[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<Godparent | null>(null); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string>(location.state?.notice || ''); const [refresh, setRefresh] = useState(0);
  const load = useCallback(() => { setLoading(true); setError(''); godparentsService.list({ ...filters, page: pagination.page + 1, limit: pagination.pageSize, sortBy: sort[0]?.field || 'order', sortOrder: sort[0]?.sort || 'asc' }).then(data => { setRows(data.data); setTotal(data.pagination.total); }).catch(() => setError('Não foi possível carregar os padrinhos.')).finally(() => setLoading(false)); }, [filters, pagination, sort, refresh]);
  useEffect(load, [load]);
  const changeFilter = (patch: GodparentFilters) => { setPagination(current => ({ ...current, page: 0 })); setFilters(current => ({ ...current, ...patch })); };
  const remove = async () => { if (!deleting) return; setBusy(true); try { await godparentsService.remove(deleting._id); setNotice('Padrinho excluído com sucesso.'); setDeleting(null); setRefresh(value => value + 1); } catch { setError('Não foi possível excluir o padrinho.'); } finally { setBusy(false); } };
  const columns: GridColDef<Godparent>[] = [
    { field: '_id', headerName: 'Código', width: 100, sortable: false, valueFormatter: value => String(value).slice(-6) },
    { field: 'name', headerName: 'Nome', flex: 1, minWidth: 170 },
    { field: 'role', headerName: 'Função', width: 130, valueFormatter: value => roleName[value as Godparent['role']] },
    { field: 'phone', headerName: 'Telefone', width: 145, sortable: false },
    { field: 'active', headerName: 'Status', width: 100, valueFormatter: value => value ? 'Ativo' : 'Inativo' },
    { field: 'order', headerName: 'Ordem', width: 90 },
    { field: 'createdAt', headerName: 'Cadastro', width: 125, valueFormatter: value => new Date(String(value)).toLocaleDateString('pt-BR') },
    { field: 'actions', headerName: 'Ações', width: 110, sortable: false, renderCell: params => <><Tooltip title="Editar"><IconButton aria-label={`Editar ${params.row.name}`} onClick={() => navigate(`/padrinhos/${params.row._id}/editar`)}><EditOutlined fontSize="small" /></IconButton></Tooltip><Tooltip title="Excluir"><IconButton aria-label={`Excluir ${params.row.name}`} onClick={() => setDeleting(params.row)}><DeleteOutline fontSize="small" /></IconButton></Tooltip></> }
  ];
  const formOpen = location.pathname === '/padrinhos/novo' || Boolean(id);
  const closeForm = () => navigate('/padrinhos');
  return <><PageHeader title="Padrinhos" subtitle="Gerencie as pessoas especiais que farão parte do casamento." action={<Button variant="contained" startIcon={<Add />} onClick={() => navigate('/padrinhos/novo')}>Adicionar padrinho</Button>} />
    {error && <Alert severity="error" action={<Button onClick={() => setRefresh(v => v + 1)}>Tentar novamente</Button>} sx={{ mb: 2 }}>{error}</Alert>}
    <Paper sx={{ p: 2, mb: 2 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Nome" size="small" value={filters.name} onChange={e => changeFilter({ name: e.target.value })} /><TextField select label="Função" size="small" value={filters.role} onChange={e => changeFilter({ role: e.target.value })} sx={{ minWidth: 145 }}><MenuItem value="">Todas</MenuItem>{Object.entries(roleName).map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField><TextField select label="Status" size="small" value={filters.active === '' ? '' : String(filters.active)} onChange={e => changeFilter({ active: e.target.value === '' ? '' : e.target.value === 'true' })} sx={{ minWidth: 120 }}><MenuItem value="">Todos</MenuItem><MenuItem value="true">Ativo</MenuItem><MenuItem value="false">Inativo</MenuItem></TextField></Stack></Paper>
    <Paper sx={{ minHeight: 360 }}>{!loading && rows.length === 0 && !error ? <EmptyState title="Nenhum padrinho cadastrado." action={<Button onClick={() => navigate('/padrinhos/novo')}>Adicionar padrinho</Button>} /> : <Box sx={{ height: 550, width: '100%' }}><DataGrid rows={rows} columns={columns} getRowId={row => row._id} rowCount={total} loading={loading} paginationMode="server" sortingMode="server" paginationModel={pagination} onPaginationModelChange={setPagination} sortModel={sort} onSortModelChange={setSort} pageSizeOptions={[10, 20, 50]} columnVisibilityModel={mobile ? { _id: false, phone: false, order: false, createdAt: false } : {}} disableRowSelectionOnClick /></Box>}</Paper>
    {formOpen && <GodparentForm key={id || 'new'} id={id} onClose={closeForm} onSaved={message => { setNotice(message); setRefresh(value => value + 1); closeForm(); }} />}
    <ConfirmDialog open={Boolean(deleting)} title="Excluir padrinho?" description="Esta ação não poderá ser desfeita." busy={busy} onCancel={() => setDeleting(null)} onConfirm={remove} />
    <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
  </>;
}
