import { GiftForm } from './GiftForm';
import { useCallback, useEffect, useState } from 'react'; import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, IconButton, MenuItem, Paper, Snackbar, Stack, TextField, Tooltip, useMediaQuery } from '@mui/material'; import { useTheme } from '@mui/material/styles';
import { DataGrid, type GridColDef, type GridPaginationModel, type GridSortModel } from '@mui/x-data-grid';
import Add from '@mui/icons-material/Add'; import EditOutlined from '@mui/icons-material/EditOutlined'; import DeleteOutline from '@mui/icons-material/DeleteOutlined';
import { PageHeader } from '../../components/common/PageHeader'; import { ConfirmDialog } from '../../components/common/ConfirmDialog'; import { EmptyState } from '../../components/common/EmptyState';
import { giftsService, type GiftFilters } from '../../services/gifts.service'; import type { GiftProduct } from '../../types/api';
import { resolveImageUrl } from '../../services/images.service';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export function GiftsPage() {
  const { id } = useParams(); const navigate = useNavigate(); const location = useLocation(); const mobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [filters, setFilters] = useState<GiftFilters>({ name: '', category: '', active: '' });
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 }); const [sort, setSort] = useState<GridSortModel>([{ field: 'order', sort: 'asc' }]);
  const [rows, setRows] = useState<GiftProduct[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<GiftProduct | null>(null); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string>(location.state?.notice || ''); const [refresh, setRefresh] = useState(0);
  const load = useCallback(() => { setLoading(true); setError(''); giftsService.list({ ...filters, page: pagination.page + 1, limit: pagination.pageSize, sortBy: sort[0]?.field || 'order', sortOrder: sort[0]?.sort || 'asc' }).then(data => { setRows(data.data); setTotal(data.pagination.total); }).catch(() => setError('Não foi possível carregar os presentes.')).finally(() => setLoading(false)); }, [filters, pagination, sort, refresh]);
  useEffect(load, [load]);
  const changeFilter = (patch: GiftFilters) => { setPagination(current => ({ ...current, page: 0 })); setFilters(current => ({ ...current, ...patch })); };
  const remove = async () => { if (!deleting) return; setBusy(true); try { await giftsService.remove(deleting._id); setNotice('Presente excluído com sucesso.'); setDeleting(null); setRefresh(value => value + 1); } catch { setError('Não foi possível excluir o presente.'); } finally { setBusy(false); } };
  const columns: GridColDef<GiftProduct>[] = [
    { field: 'image', headerName: 'Imagem', width: 80, sortable: false, renderCell: params => params.value ? <Box component="img" src={resolveImageUrl(String(params.value))} loading="lazy" alt="" sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1 }} /> : <Box aria-label="Sem imagem" sx={{ width: 44, height: 44, borderRadius: 1, bgcolor: 'action.hover' }} /> },
    { field: 'name', headerName: 'Nome', flex: 1, minWidth: 160 },
    { field: 'category', headerName: 'Categoria', width: 145 },
    { field: 'price', headerName: 'Valor', width: 130, valueFormatter: value => currency(Number(value)) },
    { field: 'active', headerName: 'Status', width: 95, valueFormatter: value => value ? 'Ativo' : 'Inativo' },
    { field: 'order', headerName: 'Ordem', width: 85 },
    { field: 'createdAt', headerName: 'Cadastro', width: 120, valueFormatter: value => new Date(String(value)).toLocaleDateString('pt-BR') },
    { field: 'actions', headerName: 'Ações', width: 110, sortable: false, renderCell: params => <><Tooltip title="Editar"><IconButton aria-label={`Editar ${params.row.name}`} onClick={() => navigate(`/presentes/${params.row._id}/editar`)}><EditOutlined fontSize="small" /></IconButton></Tooltip><Tooltip title="Excluir"><IconButton aria-label={`Excluir ${params.row.name}`} onClick={() => setDeleting(params.row)}><DeleteOutline fontSize="small" /></IconButton></Tooltip></> }
  ];
  const formOpen = location.pathname === '/presentes/novo' || Boolean(id);
  const closeForm = () => navigate('/presentes');
  return <><PageHeader title="Presentes" subtitle="Gerencie os produtos disponíveis na lista de presentes." action={<Button variant="contained" startIcon={<Add />} onClick={() => navigate('/presentes/novo')}>Adicionar presente</Button>} />
    {error && <Alert severity="error" action={<Button onClick={() => setRefresh(v => v + 1)}>Tentar novamente</Button>} sx={{ mb: 2 }}>{error}</Alert>}
    <Paper sx={{ p: 2, mb: 2 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Nome" size="small" value={filters.name} onChange={e => changeFilter({ name: e.target.value })} /><TextField label="Categoria" size="small" value={filters.category} onChange={e => changeFilter({ category: e.target.value })} /><TextField select label="Status" size="small" value={filters.active === '' ? '' : String(filters.active)} onChange={e => changeFilter({ active: e.target.value === '' ? '' : e.target.value === 'true' })} sx={{ minWidth: 120 }}><MenuItem value="">Todos</MenuItem><MenuItem value="true">Ativo</MenuItem><MenuItem value="false">Inativo</MenuItem></TextField></Stack></Paper>
    <Paper sx={{ minHeight: 360 }}>{!loading && rows.length === 0 && !error ? <EmptyState title="Nenhum presente cadastrado." action={<Button onClick={() => navigate('/presentes/novo')}>Adicionar presente</Button>} /> : <Box sx={{ height: 550, width: '100%' }}><DataGrid rows={rows} columns={columns} getRowId={row => row._id} rowCount={total} loading={loading} paginationMode="server" sortingMode="server" paginationModel={pagination} onPaginationModelChange={setPagination} sortModel={sort} onSortModelChange={setSort} pageSizeOptions={[10, 20, 50]} columnVisibilityModel={mobile ? { image: false, category: false, order: false, createdAt: false } : {}} disableRowSelectionOnClick /></Box>}</Paper>
    {formOpen && <GiftForm key={id || 'new'} id={id} onClose={closeForm} onSaved={message => { setNotice(message); setRefresh(value => value + 1); closeForm(); }} />}
    <ConfirmDialog open={Boolean(deleting)} title="Excluir presente?" description="Esta ação não poderá ser desfeita." busy={busy} onCancel={() => setDeleting(null)} onConfirm={remove} />
    <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
  </>;
}
