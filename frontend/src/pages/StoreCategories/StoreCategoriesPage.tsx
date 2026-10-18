import { StoreCategoryForm } from './StoreCategoryForm';
import axios from 'axios';
import { useCallback, useEffect, useState } from 'react'; import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Link, MenuItem, Paper, Snackbar, Stack, TextField, Tooltip, useMediaQuery } from '@mui/material'; import { useTheme } from '@mui/material/styles';
import { DataGrid, type GridColDef, type GridPaginationModel, type GridSortModel } from '@mui/x-data-grid';
import Add from '@mui/icons-material/Add'; import EditOutlined from '@mui/icons-material/EditOutlined'; import DeleteOutline from '@mui/icons-material/DeleteOutlined';
import { PageHeader } from '../../components/common/PageHeader'; import { ConfirmDialog } from '../../components/common/ConfirmDialog'; import { EmptyState } from '../../components/common/EmptyState';
import { storeCategoriesService } from '../../services/storeCategories.service'; import type { ListFilters, StoreCategory } from '../../types/api';
import { resolveImageUrl } from '../../services/images.service';
import { Link as RouterLink } from 'react-router-dom';
const products = (total: number) => `${total} ${total === 1 ? 'produto' : 'produtos'}`;
export function StoreCategoriesPage() {
  const { id } = useParams(); const navigate = useNavigate(); const location = useLocation(); const mobile = useMediaQuery(useTheme().breakpoints.down('sm'));
  const [filters, setFilters] = useState<ListFilters>({ name: '', active: '' });
  const [pagination, setPagination] = useState<GridPaginationModel>({ page: 0, pageSize: 20 }); const [sort, setSort] = useState<GridSortModel>([{ field: 'order', sort: 'asc' }]);
  const [rows, setRows] = useState<StoreCategory[]>([]); const [total, setTotal] = useState(0); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<StoreCategory | null>(null); const [blocked, setBlocked] = useState<StoreCategory | null>(null); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState<string>(location.state?.notice || ''); const [refresh, setRefresh] = useState(0);
  const load = useCallback(() => { setLoading(true); setError(''); storeCategoriesService.list({ ...filters, page: pagination.page + 1, limit: pagination.pageSize, sortBy: sort[0]?.field || 'order', sortOrder: sort[0]?.sort || 'asc' }).then(data => { setRows(data.data); setTotal(data.pagination.total); }).catch(() => setError('Não foi possível carregar as categorias.')).finally(() => setLoading(false)); }, [filters, pagination, sort, refresh]);
  useEffect(load, [load]);
  const changeFilter = (patch: ListFilters) => { setPagination(current => ({ ...current, page: 0 })); setFilters(current => ({ ...current, ...patch })); };
  // Categoria com produtos nao e excluida (o backend tambem bloqueia com 409): mostramos o aviso no lugar da confirmacao.
  const askRemove = (row: StoreCategory) => row.productCount > 0 ? setBlocked(row) : setDeleting(row);
  const remove = async () => {
    if (!deleting) return; setBusy(true);
    try { await storeCategoriesService.remove(deleting._id); setNotice('Categoria excluída com sucesso.'); setDeleting(null); setRefresh(value => value + 1); }
    catch (reason) {
      const productCount = axios.isAxiosError<{ data?: { productCount?: number } }>(reason) && reason.response?.status === 409 ? reason.response.data?.data?.productCount : undefined;
      if (productCount) { setBlocked({ ...deleting, productCount }); setDeleting(null); setRefresh(value => value + 1); } else setError('Não foi possível excluir a categoria.');
    } finally { setBusy(false); }
  };
  const columns: GridColDef<StoreCategory>[] = [
    { field: 'image', headerName: 'Imagem', width: 80, sortable: false, renderCell: params => <Box component="img" src={resolveImageUrl(String(params.value))} loading="lazy" alt="" sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: '50%', border: '1px solid #e7ddc4', verticalAlign: 'middle' }} /> },
    { field: 'name', headerName: 'Nome', width: 170 },
    { field: 'description', headerName: 'Descrição', flex: 1, minWidth: 200, sortable: false },
    { field: 'productCount', headerName: 'Produtos', width: 120, sortable: false, renderCell: params => params.row.productCount ? <Link component={RouterLink} to={`/presentes?categoryId=${params.row._id}`} underline="hover">{products(params.row.productCount)}</Link> : <Box component="span" sx={{ color: 'text.secondary' }}>Nenhum</Box> },
    { field: 'active', headerName: 'Status', width: 95, valueFormatter: value => value ? 'Ativa' : 'Inativa' },
    { field: 'order', headerName: 'Ordem', width: 85 },
    { field: 'createdAt', headerName: 'Cadastro', width: 120, valueFormatter: value => new Date(String(value)).toLocaleDateString('pt-BR') },
    { field: 'actions', headerName: 'Ações', width: 110, sortable: false, renderCell: params => <><Tooltip title="Editar"><IconButton aria-label={`Editar ${params.row.name}`} onClick={() => navigate(`/categorias-loja/${params.row._id}/editar`)}><EditOutlined fontSize="small" /></IconButton></Tooltip><Tooltip title="Excluir"><IconButton aria-label={`Excluir ${params.row.name}`} onClick={() => askRemove(params.row)}><DeleteOutline fontSize="small" /></IconButton></Tooltip></> }
  ];
  const formOpen = location.pathname === '/categorias-loja/nova' || Boolean(id);
  const closeForm = () => navigate('/categorias-loja');
  return <><PageHeader title="Categorias da loja" subtitle="Gerencie as categorias exibidas na seção “Lista na loja”." action={<Button variant="contained" startIcon={<Add />} onClick={() => navigate('/categorias-loja/nova')}>Adicionar categoria</Button>} />
    {error && <Alert severity="error" action={<Button onClick={() => setRefresh(v => v + 1)}>Tentar novamente</Button>} sx={{ mb: 2 }}>{error}</Alert>}
    <Paper sx={{ p: 2, mb: 2 }}><Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}><TextField label="Nome" size="small" value={filters.name} onChange={e => changeFilter({ name: e.target.value })} /><TextField select label="Status" size="small" value={filters.active === '' ? '' : String(filters.active)} onChange={e => changeFilter({ active: e.target.value === '' ? '' : e.target.value === 'true' })} sx={{ minWidth: 120 }}><MenuItem value="">Todas</MenuItem><MenuItem value="true">Ativa</MenuItem><MenuItem value="false">Inativa</MenuItem></TextField></Stack></Paper>
    <Paper sx={{ minHeight: 360 }}>{!loading && rows.length === 0 && !error ? <EmptyState title="Nenhuma categoria cadastrada." action={<Button onClick={() => navigate('/categorias-loja/nova')}>Adicionar categoria</Button>} /> : <Box sx={{ height: 550, width: '100%' }}><DataGrid rows={rows} columns={columns} getRowId={row => row._id} rowCount={total} loading={loading} paginationMode="server" sortingMode="server" paginationModel={pagination} onPaginationModelChange={setPagination} sortModel={sort} onSortModelChange={setSort} pageSizeOptions={[10, 20, 50]} columnVisibilityModel={mobile ? { image: false, description: false, productCount: false, order: false, createdAt: false } : {}} disableRowSelectionOnClick /></Box>}</Paper>
    {formOpen && <StoreCategoryForm key={id || 'new'} id={id} onClose={closeForm} onSaved={message => { setNotice(message); setRefresh(value => value + 1); closeForm(); }} />}
    <Dialog open={Boolean(blocked)} onClose={() => setBlocked(null)} aria-labelledby="blocked-title"><DialogTitle id="blocked-title">Não é possível excluir</DialogTitle><DialogContent><DialogContentText>Esta categoria possui {products(blocked?.productCount || 0)} vinculados. Não é possível excluir esta categoria enquanto houver produtos vinculados a ela. Mova os produtos para outra categoria ou desative a categoria.</DialogContentText></DialogContent><DialogActions><Button onClick={() => setBlocked(null)}>Cancelar</Button><Button variant="contained" onClick={() => navigate(`/presentes?categoryId=${blocked?._id}`)}>Ver produtos</Button></DialogActions></Dialog>
    <ConfirmDialog open={Boolean(deleting)} title="Excluir categoria?" description="A categoria deixará de aparecer na seção “Lista na loja”. Esta ação não poderá ser desfeita." busy={busy} onCancel={() => setDeleting(null)} onConfirm={remove} />
    <Snackbar open={Boolean(notice)} autoHideDuration={4000} onClose={() => setNotice('')}><Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert></Snackbar>
  </>;
}
