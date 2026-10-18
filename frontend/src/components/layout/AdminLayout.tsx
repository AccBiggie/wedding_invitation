import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppBar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Tooltip, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import MailOutline from '@mui/icons-material/MailOutlined';
import PeopleAltOutlined from '@mui/icons-material/PeopleAltOutlined';
import CardGiftcardOutlined from '@mui/icons-material/CardGiftcardOutlined';
import CategoryOutlined from '@mui/icons-material/CategoryOutlined';
import QrCode2Outlined from '@mui/icons-material/QrCode2Outlined';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeft from '@mui/icons-material/ChevronLeft';
import ChevronRight from '@mui/icons-material/ChevronRight';
import LogoutOutlined from '@mui/icons-material/LogoutOutlined';
import BrushOutlined from '@mui/icons-material/BrushOutlined';

const nav = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlined /> },
  { label: 'Convites', path: '/convites', icon: <MailOutline /> },
  { label: 'Padrinhos', path: '/padrinhos', icon: <PeopleAltOutlined /> },
  { label: 'Presentes', path: '/presentes', icon: <CardGiftcardOutlined /> },
  { label: 'Categorias da loja', path: '/categorias-loja', icon: <CategoryOutlined /> },
  { label: 'PIX / Gravata Online', path: '/pix', icon: <QrCode2Outlined /> }
];

export function AdminLayout({ email, onLogout, onCustomize }: { email: string; onLogout: () => void; onCustomize: () => void }) {
  const theme = useTheme();
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expanded, setExpanded] = useState(() => localStorage.getItem('wedding.sidebar.expanded') !== 'false');
  const location = useLocation();
  const width = expanded ? 260 : 72;
  const current = nav.find(item => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))?.label || 'Casamento';
  const toggleExpanded = () => setExpanded(value => { localStorage.setItem('wedding.sidebar.expanded', String(!value)); return !value; });
  const menu = (showLabels: boolean) => <><Toolbar sx={{ px: 2, justifyContent: showLabels ? 'space-between' : 'center' }}>
    {showLabels && <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>Casamento</Typography>}
    {!mobile && <IconButton aria-label={expanded ? 'Recolher menu' : 'Expandir menu'} onClick={toggleExpanded}>{expanded ? <ChevronLeft /> : <ChevronRight />}</IconButton>}
  </Toolbar><Divider /><List sx={{ px: 1, pt: 2 }}>{nav.map(item => {
    const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    return <Tooltip key={item.path} title={showLabels ? '' : item.label} placement="right"><ListItemButton component={NavLink} to={item.path} onClick={() => setMobileOpen(false)} selected={active} sx={{ minHeight: 48, borderRadius: 2, mb: .5, justifyContent: showLabels ? 'initial' : 'center', '&.Mui-selected': { bgcolor: '#e5efe9', color: 'primary.main' } }}>
      <ListItemIcon sx={{ minWidth: showLabels ? 40 : 0, color: active ? 'primary.main' : 'text.secondary' }}>{item.icon}</ListItemIcon>{showLabels && <ListItemText primary={item.label} />}
    </ListItemButton></Tooltip>;
  })}</List></>;
  return <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
    <AppBar position="fixed" elevation={0} color="inherit" sx={{ borderBottom: '1px solid #e6ebe6', width: { md: `calc(100% - ${width}px)` }, ml: { md: `${width}px` }, transition: theme.transitions.create(['width', 'margin']) }}><Toolbar sx={{ gap: 1 }}>
      {mobile && <IconButton aria-label="Abrir menu" onClick={() => setMobileOpen(true)}><MenuIcon /></IconButton>}
      <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>{current}</Typography>
      <Button startIcon={<BrushOutlined />} onClick={onCustomize} aria-label="Personalizar site público" sx={{ whiteSpace: 'nowrap' }}><Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Personalizar site</Box></Button>
      <Typography color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' }, fontSize: 14 }}>{email}</Typography>
      <Tooltip title="Sair"><IconButton aria-label="Sair" onClick={onLogout}><LogoutOutlined /></IconButton></Tooltip>
    </Toolbar></AppBar>
    <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: 260 } }}>{menu(true)}</Drawer>
    <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, width, flexShrink: 0, '& .MuiDrawer-paper': { width, overflowX: 'hidden', transition: theme.transitions.create('width'), borderRightColor: '#e6ebe6' } }}>{menu(expanded)}</Drawer>
    <Box component="main" sx={{ flexGrow: 1, minWidth: 0, px: { xs: 2, sm: 3 }, py: 3, mt: 8 }}><Outlet /></Box>
  </Box>;
}
