import { Alert, Box, Button, ButtonBase, Divider, Drawer, IconButton, Stack, Typography } from '@mui/material';
import Close from '@mui/icons-material/Close';
import RestartAlt from '@mui/icons-material/RestartAlt';
import Check from '@mui/icons-material/Check';
import { accentColors, baseColors, defaultAppearance, landingFont, weddingDisplayFonts, type Appearance } from '../../theme/appearance';

type Choice<K extends keyof Appearance> = { value: Appearance[K]; label: string };
const schemes: Choice<'scheme'>[] = [
  { value: 'auto', label: 'Auto' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }, { value: 'dark-nav', label: 'Menu escuro' }, { value: 'colored', label: 'Colorido' }
];
const fonts: Choice<'font'>[] = [
  { value: 'sans-serif', label: 'Arial' }, { value: 'serif', label: 'Cormorant' }, { value: 'playfair', label: 'Playfair' },
  { value: 'lora', label: 'Lora' }, { value: 'baskerville', label: 'Baskerville' }, { value: 'montserrat', label: 'Montserrat' },
  { value: 'poppins', label: 'Poppins' }, { value: 'nunito', label: 'Nunito' }, { value: 'monospace', label: 'Monoespaçada' }, { value: 'comic', label: 'Comic' }
];
const weddingFonts: Choice<'font'>[] = [
  { value: 'cinzel', label: 'Cinzel' }, { value: 'marcellus', label: 'Marcellus' },
  { value: 'great-vibes', label: 'Great Vibes' }, { value: 'parisienne', label: 'Parisienne' }
];
const fontPreviews = { ...landingFont, ...weddingDisplayFonts };
const fontSizes: Choice<'fontSize'>[] = [
  { value: 'small', label: 'Pequena' }, { value: 'normal', label: 'Padrão' }, { value: 'large', label: 'Grande' }, { value: 'extra-large', label: 'Muito grande' }
];
const bases: Choice<'base'>[] = [
  { value: 'slate', label: 'Slate' }, { value: 'gray', label: 'Gray' }, { value: 'zinc', label: 'Zinc' }, { value: 'neutral', label: 'Neutral' }, { value: 'stone', label: 'Stone' }
];
const radii: Choice<'radius'>[] = ['0', '0.5', '1', '1.5', '2'].map(value => ({ value: value as Appearance['radius'], label: value }));
const navigation: Choice<'navigation'>[] = [{ value: 'navbar', label: 'Barra superior' }, { value: 'sidebar', label: 'Menu lateral' }];
const containers: Choice<'container'>[] = [{ value: 'default', label: 'Padrão' }, { value: 'fluid', label: 'Fluido' }, { value: 'boxed', label: 'Centralizado' }];
const navbarBehaviors: Choice<'navbarBehavior'>[] = [{ value: 'default', label: 'Padrão' }, { value: 'sticky', label: 'Fixa' }];
const styles: Choice<'navigationStyle'>[] = [{ value: 'attached', label: 'Anexado' }, { value: 'floating', label: 'Flutuante' }];

function Miniature({ kind, value, accent }: { kind: keyof Appearance; value: string; accent: string }) {
  if (kind === 'font') return <Box sx={{ height: 49, fontSize: 36, lineHeight: '49px', fontFamily: fontPreviews[value as Appearance['font']], textAlign: 'center' }}>Aa</Box>;
  if (kind === 'fontSize') return <Box sx={{ height: 49, display: 'grid', placeItems: 'center', fontSize: { small: 20, normal: 25, large: 30, 'extra-large': 36 }[value] }}>Aa</Box>;
  if (kind === 'base') return <Box sx={{ height: 49, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: .4 }}>{['light', 'paper', 'darkPaper', 'dark'].map(key => <Box key={key} sx={{ width: 13, height: 18, borderRadius: .5, bgcolor: baseColors[value as Appearance['base']][key as 'light' | 'paper' | 'darkPaper' | 'dark'], border: '1px solid #8885' }} />)}</Box>;
  if (kind === 'radius') return <Box sx={{ height: 49, display: 'grid', placeItems: 'center' }}><Box sx={{ width: 42, height: 38, bgcolor: accent, borderRadius: `${Number(value) * 15}px` }} /></Box>;
  const dark = value === 'dark' || value === 'dark-nav';
  const colored = value === 'colored';
  const sidebar = kind === 'navigation' && value === 'sidebar';
  const floated = (kind === 'navigationStyle' || kind === 'offcanvasStyle') && value === 'floating';
  return <Box sx={{ height: 49, p: floated ? .6 : 0, bgcolor: dark ? '#222' : '#ddd', borderRadius: 1, overflow: 'hidden' }}>
    <Box sx={{ display: 'flex', height: '100%', bgcolor: dark ? '#1c1c1c' : '#f5f5f5', borderRadius: floated ? 1 : 0 }}>
      {sidebar && <Box sx={{ width: '23%', bgcolor: accent }} />}
      <Box sx={{ flex: 1 }}>
        <Box sx={{ height: 12, bgcolor: dark && value !== 'dark-nav' ? '#333' : colored || kind !== 'scheme' ? accent : '#777' }} />
        <Box sx={{ width: '64%', height: 5, mt: 1, ml: 1, bgcolor: '#8887', borderRadius: 2 }} />
        <Box sx={{ width: '48%', height: 5, mt: .5, ml: 1, bgcolor: '#8887', borderRadius: 2 }} />
      </Box>
    </Box>
  </Box>;
}

function ChoiceGroup<K extends keyof Appearance>({ title, hint, kind, choices, settings, change }: { title: string; hint: string; kind: K; choices: Choice<K>[]; settings: Appearance; change: (next: Appearance) => void }) {
  return <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>{hint}</Typography>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1 }}>
      {choices.map(choice => {
        const selected = settings[kind] === choice.value;
        return <ButtonBase key={choice.value} type="button" aria-pressed={selected} onClick={() => change({ ...settings, [kind]: choice.value })} sx={{ display: 'block', minWidth: 0, p: .6, border: '1px solid', borderColor: selected ? 'primary.main' : 'divider', borderRadius: 1, textAlign: 'left', position: 'relative', '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main' } }}>
          <Miniature kind={kind} value={choice.value} accent={accentColors[settings.accent]} />
          <Box sx={{ position: 'absolute', top: 8, left: 8, width: 20, height: 20, borderRadius: '50%', bgcolor: selected ? 'primary.main' : 'background.paper', border: '1px solid', borderColor: selected ? 'primary.main' : 'divider', display: 'grid', placeItems: 'center', color: 'primary.contrastText' }}>{selected && <Check sx={{ fontSize: 13 }} />}</Box>
          <Typography variant="caption" sx={{ display: 'block', pt: .5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{choice.label}</Typography>
        </ButtonBase>;
      })}
    </Box>
  </Box>;
}

export function AppearanceDrawer({ open, settings, onChange, onClose, onSave, busy, ready, error, savedNotice }: { open: boolean; settings: Appearance; onChange: (next: Appearance) => void; onClose: () => void; onSave: () => void; busy: boolean; ready: boolean; error: string; savedNotice: boolean }) {
  return <Drawer anchor="right" open={open} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: '100%', sm: 400 }, overflow: 'hidden' } } }}>
    <Stack direction="row" sx={{ px: 2.5, py: 2, alignItems: 'center' }}><Typography variant="h6" sx={{ flex: 1 }}>Personalizar site público</Typography><IconButton aria-label="Fechar personalização" onClick={onClose} disabled={busy}><Close /></IconButton></Stack>
    <Divider />
    <Box sx={{ px: 2.5, py: 2, overflowY: 'auto', flex: 1, pointerEvents: busy || !ready ? 'none' : 'auto', opacity: busy || !ready ? .6 : 1 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {savedNotice && <Alert severity="success" sx={{ mb: 2 }}>Aparência salva.</Alert>}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>As opções salvas aparecem na página de casamento e nos convites.</Typography>
      <Typography variant="overline" color="text.secondary">Aparência</Typography>
      <ChoiceGroup title="Esquema de cores" hint="Cores da página e da navegação." kind="scheme" choices={schemes} settings={settings} change={onChange} />
      <Box sx={{ mb: 3 }}><Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Cor de destaque</Typography><Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>Cor usada nos títulos e botões do site público.</Typography><Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{Object.entries(accentColors).map(([name, color]) => <ButtonBase key={name} type="button" title={name === 'wedding' ? 'Casamento' : name} aria-label={`Cor ${name}`} aria-pressed={settings.accent === name} onClick={() => onChange({ ...settings, accent: name as Appearance['accent'] })} sx={{ width: 25, height: 25, borderRadius: .7, bgcolor: color, color: name === 'white' ? '#171717' : '#fff', border: name === 'white' ? '1px solid #aaa' : 'none', '&:focus-visible': { outline: '2px solid', outlineOffset: 2, outlineColor: 'primary.main' } }}>{settings.accent === name && <Check sx={{ fontSize: 17 }} />}</ButtonBase>)}</Box></Box>
      <ChoiceGroup title="Fonte" hint="Tipografia usada nas páginas públicas." kind="font" choices={fonts} settings={settings} change={onChange} />
      <ChoiceGroup title="Fontes para casamento" hint="Estilos formais e caligráficos. Nas opções caligráficas, os textos continuam legíveis." kind="font" choices={weddingFonts} settings={settings} change={onChange} />
      <ChoiceGroup title="Tamanho da fonte" hint="Escala dos textos nas páginas públicas." kind="fontSize" choices={fontSizes} settings={settings} change={onChange} />
      <ChoiceGroup title="Base do tema" hint="Paleta neutra dos fundos e superfícies." kind="base" choices={bases} settings={settings} change={onChange} />
      <ChoiceGroup title="Arredondamento" hint="Formato dos cantos dos componentes." kind="radius" choices={radii} settings={settings} change={onChange} />
      <Divider sx={{ my: 2 }} /><Typography variant="overline" color="text.secondary">Layout</Typography>
      <ChoiceGroup title="Navegação" hint="Onde fica o menu principal." kind="navigation" choices={navigation} settings={settings} change={onChange} />
      <ChoiceGroup title="Largura do conteúdo" hint="Largura do conteúdo das páginas públicas." kind="container" choices={containers} settings={settings} change={onChange} />
      <ChoiceGroup title="Comportamento da barra" hint="A barra pode acompanhar a rolagem." kind="navbarBehavior" choices={navbarBehaviors} settings={settings} change={onChange} />
      <ChoiceGroup title="Estilo da navegação" hint="Navegação anexada ou flutuante." kind="navigationStyle" choices={styles} settings={settings} change={onChange} />
      <ChoiceGroup title="Estilo do menu móvel" hint="Menu móvel anexado ou flutuante." kind="offcanvasStyle" choices={styles} settings={settings} change={onChange} />
    </Box>
    <Divider /><Stack spacing={1} sx={{ p: 2.5 }}><Button variant="outlined" startIcon={<RestartAlt />} disabled={busy || !ready} onClick={() => onChange({ ...defaultAppearance })}>Restaurar padrão</Button><Button variant="contained" disabled={busy || !ready} onClick={onSave}>{busy ? 'Carregando...' : 'Salvar'}</Button><Button component="a" href="/casamento" target="_blank" rel="noreferrer">Ver página de casamento</Button></Stack>
  </Drawer>;
}
