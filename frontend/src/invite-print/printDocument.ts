import conviteCss from './convite.css?raw';
import { renderSheets, SHEET_CSS, type InviteData, type InviteLayout } from './convite';

const FONTS_URL = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Great+Vibes&family=Jost:wght@300;400;500&family=Cinzel:wght@400;600&display=swap';
const FACES = ['400 16px "Cormorant Garamond"', '600 16px "Cormorant Garamond"', 'italic 400 16px "Cormorant Garamond"', '400 16px "Great Vibes"', '300 16px Jost', '500 16px Jost', '600 16px Jost', '400 16px Cinzel'];
const MIN_NAME_PX = 9;

// Na tela, as folhas aparecem separadas e com sombra; na impressao, coladas e sem margem.
const PAGE_CSS = 'html { -webkit-print-color-adjust: exact; print-color-adjust: exact; } html, body { margin: 0; }' +
  '.cv .pessoal { white-space: nowrap; max-width: 100%; overflow: hidden; }' +
  // A caixa-alta da linha da data viraria "16H00".
  '.cv .data .h, .cv-10 .hora { text-transform: none; }' +
  '@media screen { body { background: #e7e3da; padding: 24px; } .folha-cv { margin: 0 auto 24px; box-shadow: 0 4px 24px rgba(36,65,47,.18); } }' +
  '@media print { body { background: none; padding: 0; } .folha-cv { margin: 0; box-shadow: none; } }';

export const SHEET_SCREEN_PADDING = 24;

const escTitle = (value: string) => value.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);

export const inviteDocument = (title: string, layout: InviteLayout, list: InviteData[]) =>
  `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${escTitle(title)}</title>` +
  `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="${FONTS_URL}">` +
  `<style>${conviteCss}${SHEET_CSS}${PAGE_CSS}</style></head><body>${renderSheets(layout, list)}</body></html>`;

const loadImage = (win: Window, src: string) => new Promise<boolean>(resolve => {
  const image = new (win as Window & typeof globalThis).Image();
  image.onload = () => resolve(true);
  image.onerror = () => resolve(false);
  image.src = src;
});

// Espera fontes e foto e so entao ajusta os nomes longos: o PDF so pode sair depois disso.
export async function prepareInviteFrame(frame: HTMLIFrameElement, photo: string) {
  const doc = frame.contentDocument, win = frame.contentWindow;
  if (!doc || !win) throw new Error('Prévia indisponível.');
  void doc.body.offsetHeight;
  const [photoOk] = await Promise.all([photo ? loadImage(win, photo) : Promise.resolve(true), ...FACES.map(face => doc.fonts.load(face, 'Querido(a) Stéfani & André ç ã é'))]);
  await doc.fonts.ready;
  doc.querySelectorAll<HTMLElement>('.cv .pessoal').forEach(line => {
    let size = parseFloat(win.getComputedStyle(line).fontSize);
    while (line.scrollWidth > line.clientWidth + .5 && size > MIN_NAME_PX) { size -= .25; line.style.fontSize = `${size}px`; }
  });
  return { photoOk, height: doc.documentElement.scrollHeight };
}
