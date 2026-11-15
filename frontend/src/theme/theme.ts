import { createElement } from 'react';
import { alpha, createTheme, type Shadows } from '@mui/material/styles';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import { ptBR as coreptBR } from '@mui/material/locale';
import { ptBR as dataGridptBR } from '@mui/x-data-grid/locales';

// Painel com toque feminino: rosé (cor principal), champanhe (apoio), fundo blush bem claro,
// titulos em Inter/Arial negrito (como antes); texto em Nunito (carregada no index.html).
export const PANEL = {
  rose: '#9e3f63', // branco sobre ele: 6,6:1
  roseLight: '#c98aa3',
  roseDark: '#7a2c4b',
  blush: '#f7f8f5', // fundo das paginas (o mesmo de antes do tema rose)
  blushDeep: '#f6e8ee', // realces suaves (item ativo, cabecalho de tabela)
  champagne: '#b08a55',
  ink: '#3b2a32', // texto principal
  muted: '#7d6870', // texto secundario
  line: '#efe1e7', // bordas e divisores
  shadow: 'rgba(122, 44, 75, .14)'
};

export const TITLE_FONT = 'Inter, Arial, sans-serif';

export const theme = createTheme({
  palette: {
    primary: { main: PANEL.rose, light: PANEL.roseLight, dark: PANEL.roseDark, contrastText: '#fff' },
    secondary: { main: PANEL.champagne, contrastText: '#fff' },
    background: { default: PANEL.blush, paper: '#fff' },
    text: { primary: PANEL.ink, secondary: PANEL.muted },
    divider: PANEL.line,
    success: { main: '#2e7d53' },
    error: { main: '#b74445' }
  },
  typography: {
    fontFamily: '"Nunito", "Segoe UI", Arial, sans-serif',
    // Titulos com a fonte de antes do tema rose (Inter/Arial em negrito).
    h4: { fontFamily: TITLE_FONT, fontWeight: 700 },
    h5: { fontFamily: TITLE_FONT, fontWeight: 700 },
    h6: { fontFamily: TITLE_FONT },
    button: { textTransform: 'none', fontWeight: 600, letterSpacing: .1 }
  },
  // Base 10: os sx do painel usam borderRadius 2 e 3 (20px e 30px).
  shape: { borderRadius: 10 },
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  shadows: ['none', '0 2px 10px rgba(122, 44, 75, .06)', ...Array(23).fill('0 10px 30px rgba(122, 44, 75, .10)')] as Shadows,
  components: {
    MuiCssBaseline: { styleOverrides: { body: { WebkitFontSmoothing: 'antialiased' }, '::selection': { background: alpha(PANEL.rose, .18) } } },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, minHeight: 38, paddingInline: 18 },
        outlined: { borderColor: alpha(PANEL.rose, .35), '&:hover': { borderColor: PANEL.rose, backgroundColor: alpha(PANEL.rose, .05) } }
      },
      // Botao principal com degrade rose e sombra rosada.
      variants: [{ props: { variant: 'contained', color: 'primary' }, style: { background: `linear-gradient(135deg, #b0547a 0%, ${PANEL.rose} 55%, ${PANEL.roseDark} 100%)`, boxShadow: `0 6px 16px ${alpha(PANEL.rose, .28)}`, '&:hover': { boxShadow: `0 8px 22px ${alpha(PANEL.rose, .36)}` }, '&.Mui-disabled': { background: 'none' } } }]
    },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: PANEL.line }, rounded: { borderRadius: 18 } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: `1px solid ${PANEL.line}` } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 22 } } },
    MuiPopover: { styleOverrides: { paper: { borderRadius: 16 } } },
    MuiMenu: { styleOverrides: { paper: { borderRadius: 14, border: `1px solid ${PANEL.line}`, boxShadow: `0 16px 40px ${PANEL.shadow}` } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 12, '&:hover:not(.Mui-focused):not(.Mui-error) .MuiOutlinedInput-notchedOutline': { borderColor: PANEL.roseLight } }, notchedOutline: { borderColor: '#e6d3db' } } },
    // Todos os combos com a mesma seta fina arredondada (a do "ver pessoas" da lista), que gira ao abrir.
    MuiSelect: { defaultProps: { IconComponent: KeyboardArrowDownRounded }, styleOverrides: { icon: { fontSize: '1.3rem', color: PANEL.muted, transition: 'transform .2s' } } },
    MuiNativeSelect: { defaultProps: { IconComponent: KeyboardArrowDownRounded }, styleOverrides: { icon: { fontSize: '1.3rem', color: PANEL.muted } } },
    MuiAutocomplete: { defaultProps: { popupIcon: createElement(KeyboardArrowDownRounded) }, styleOverrides: { popupIndicator: { color: PANEL.muted } } },
    MuiChip: { styleOverrides: { outlined: { borderColor: PANEL.line, backgroundColor: '#fff' } } },
    MuiTableCell: { styleOverrides: { root: { borderColor: PANEL.line }, head: { fontWeight: 700, color: PANEL.muted, backgroundColor: '#fdf8fa' } } },
    MuiTableRow: { styleOverrides: { root: { '&.MuiTableRow-hover:hover': { backgroundColor: alpha(PANEL.rose, .035) }, '&.Mui-selected, &.Mui-selected:hover': { backgroundColor: alpha(PANEL.rose, .07) } } } },
    MuiTooltip: { styleOverrides: { tooltip: { backgroundColor: PANEL.ink, borderRadius: 8, fontSize: 12 }, arrow: { color: PANEL.ink } } },
    MuiAlert: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiPaginationItem: { styleOverrides: { root: { borderRadius: 10 } } }
  }
}, dataGridptBR, coreptBR);
