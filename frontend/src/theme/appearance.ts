export const accentColors = {
  wedding: '#1f4536', blue: '#066fd1', azure: '#4299e1', indigo: '#4263eb', purple: '#ae3ec9', pink: '#d6336c', red: '#d63939', orange: '#f76707', yellow: '#f59f00', lime: '#74b816', green: '#2fb344', teal: '#0ca678', cyan: '#17a2b8', white: '#f5f5f5'
} as const;
export const baseColors = {
  slate: { light: '#f8fafc', paper: '#fff', dark: '#0f172a', darkPaper: '#1e293b' },
  gray: { light: '#f9fafb', paper: '#fff', dark: '#111827', darkPaper: '#1f2937' },
  zinc: { light: '#fafafa', paper: '#fff', dark: '#18181b', darkPaper: '#27272a' },
  neutral: { light: '#fbf8f1', paper: '#fffdf9', dark: '#171717', darkPaper: '#262626' },
  stone: { light: '#fafaf9', paper: '#fff', dark: '#1c1917', darkPaper: '#292524' }
} as const;
export type Appearance = {
  scheme: 'auto' | 'light' | 'dark' | 'dark-nav' | 'colored';
  accent: keyof typeof accentColors;
  font: 'sans-serif' | 'serif' | 'monospace' | 'comic' | 'playfair' | 'lora' | 'baskerville' | 'montserrat' | 'poppins' | 'nunito' | 'cinzel' | 'marcellus' | 'great-vibes' | 'parisienne';
  fontSize: 'small' | 'normal' | 'large' | 'extra-large';
  base: keyof typeof baseColors;
  radius: '0' | '0.5' | '1' | '1.5' | '2';
  navigation: 'navbar' | 'sidebar';
  container: 'default' | 'fluid' | 'boxed';
  navbarBehavior: 'default' | 'sticky';
  navigationStyle: 'attached' | 'floating';
  offcanvasStyle: 'attached' | 'floating';
};
export const defaultAppearance: Appearance = {
  scheme: 'light', accent: 'wedding', font: 'serif', fontSize: 'normal', base: 'neutral', radius: '1', navigation: 'navbar', container: 'default', navbarBehavior: 'default', navigationStyle: 'attached', offcanvasStyle: 'attached'
};
export const landingFont = {
  'sans-serif': 'Arial, sans-serif', serif: "'Cormorant Garamond', Georgia, serif", monospace: 'ui-monospace, Consolas, monospace', comic: 'Comic Sans MS, cursive',
  playfair: "'Playfair Display', Georgia, serif", lora: "'Lora', Georgia, serif", baskerville: "'Libre Baskerville', Georgia, serif",
  montserrat: "'Montserrat', Arial, sans-serif", poppins: "'Poppins', Arial, sans-serif", nunito: "'Nunito', Arial, sans-serif",
  cinzel: "'Cinzel', Georgia, serif", marcellus: "'Marcellus', Georgia, serif",
  'great-vibes': "'Cormorant Garamond', Georgia, serif", parisienne: "'Cormorant Garamond', Georgia, serif"
};
export const weddingDisplayFonts = {
  'great-vibes': "'Great Vibes', cursive", parisienne: "'Parisienne', cursive"
};
export const fontSizeScale = { small: .9, normal: 1, large: 1.1, 'extra-large': 1.2 };
