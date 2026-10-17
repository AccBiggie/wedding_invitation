import { createTheme, type Shadows } from '@mui/material/styles';

export const theme = createTheme({
  palette: { primary: { main: '#214938' }, secondary: { main: '#ae8a47' }, background: { default: '#f7f8f5', paper: '#fff' }, success: { main: '#2e7d53' }, error: { main: '#b74445' } },
  typography: { fontFamily: 'Inter, Arial, sans-serif', h4: { fontWeight: 700 }, h5: { fontWeight: 700 }, button: { textTransform: 'none', fontWeight: 600 } },
  shape: { borderRadius: 10 },
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  shadows: ['none', '0 2px 8px rgba(18,44,31,.08)', ...Array(23).fill('0 6px 24px rgba(18,44,31,.10)')] as Shadows,
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 8, minHeight: 38 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
    MuiCard: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: '1px solid #e6ebe6' } } }
  }
});
