// Porta de ConviteCasamento (convite.js + folha-a4.js) do design system Botânica Aquarela,
// com só os layouts usados no gerenciador: 5, 9 e 10. Mesma marcação do original, para
// que convite.css se aplique sem mudanças.
import qrcode from './qrcode.js';

export type InviteLayout = 5 | 9 | 10;
export const INVITE_LAYOUTS: { layout: InviteLayout; name: string }[] = [
  { layout: 5, name: 'Monograma clássico' },
  { layout: 9, name: 'Foto do casal' },
  { layout: 10, name: 'Calendário' }
];

export interface InviteData {
  convidado: string; saudacao: string; link: string;
  noiva: string; noivo: string; intro: string;
  data: { dia: number; mes: number; ano: number }; hora: string;
  local: string; endereco: string; qrTexto: string; foto: string;
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

const esc = (t: string) => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function qrSvg(link: string) {
  const q = qrcode(0, 'M'); q.addData(link); q.make();
  return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}

function calendario(d: InviteData['data']) {
  const primeiro = new Date(d.ano, d.mes - 1, 1).getDay(), dias = new Date(d.ano, d.mes, 0).getDate();
  let h = '<div class="cal"><div class="mes">' + MESES[d.mes - 1] + ' ' + d.ano + '</div><table><tr>' +
    ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => '<th>' + x + '</th>').join('') + '</tr><tr>';
  for (let i = 0; i < primeiro; i++) h += '<td></td>';
  for (let n = 1; n <= dias; n++) {
    h += '<td' + (n === d.dia ? ' class="dia-casamento"' : '') + '><span>' + n + '</span></td>';
    if ((primeiro + n) % 7 === 0 && n < dias) h += '</tr><tr>';
  }
  return h + '</tr></table></div>';
}

function partes(d: InviteData) {
  return {
    pessoal: '<p class="pessoal">' + esc(d.saudacao) + ' <b>' + esc(d.convidado) + '</b></p>',
    intro: '<p class="intro">' + esc(d.intro) + '</p>',
    dataCurta: ('0' + d.data.dia).slice(-2) + ' · ' + ('0' + d.data.mes).slice(-2) + ' · ' + d.data.ano + ' · <span class="h">' + esc(d.hora) + '</span>',
    local: '<p class="local">' + esc(d.local) + '<br>' + esc(d.endereco) + '</p>',
    qr: '<div class="qr"><div class="cod">' + qrSvg(d.link) + '</div><small>' + esc(d.qrTexto) + '</small></div>'
  };
}
type Partes = ReturnType<typeof partes>;

const nomes = (d: InviteData, cls: string, sep: string) => '<h1 class="nomes' + (cls ? ' ' + cls : '') + '">' + esc(d.noiva) + ' <span class="e">' + sep + '</span> ' + esc(d.noivo) + '</h1>';
const lateral = (p: Partes, extra = '') => '<div class="lateral">' + extra + p.qr + '</div>';
const data = (p: Partes) => '<p class="data">' + p.dataCurta + '</p>';

const T: Record<InviteLayout, (d: InviteData, p: Partes) => string> = {
  5: (d, p) => '<div class="moldura"></div><i class="divisor"></i><div class="miolo">' + p.pessoal + p.intro + nomes(d, '', 'e') + data(p) + p.local + '</div>' +
    lateral(p, '<div class="mono">' + esc(d.noiva.charAt(0)) + '<i>&amp;</i>' + esc(d.noivo.charAt(0)) + '</div>'),
  9: (d, p) => '<div class="foto' + (d.foto ? '' : ' sem-foto') + '"' + (d.foto ? ' style="background-image:url(\'' + esc(d.foto) + '\')"' : '') + '></div>' +
    '<div class="miolo">' + nomes(d, 'script', '&amp;') + p.pessoal + p.intro + data(p) + p.local + p.qr + '</div>',
  10: (d, p) => '<i class="divisor"></i><div class="miolo">' + p.pessoal + nomes(d, 'script', '&amp;') + p.intro + p.local + p.qr + '</div>' +
    '<div class="lateral">' + calendario(d.data) + '<p class="hora">' + esc(d.hora) + '</p></div>'
};

export const renderInvite = (layout: InviteLayout, d: InviteData) => '<article class="cv cv-' + layout + '">' + T[layout](d, partes(d)) + '</article>';

// Folha A4 em pé com 2 convites deitados, um em cima do outro, e a linha de corte no meio.
export const SHEET_CSS = '@page { size: A4; margin: 0; }' +
  '.folha-cv { position: relative; width: 210mm; height: 297mm; overflow: hidden; background: #fff; display: flex; flex-direction: column; justify-content: center; page-break-after: always; break-after: page; }' +
  '.folha-cv:last-child { page-break-after: auto; break-after: auto; }' +
  '.folha-cv .vazio { width: 210mm; height: 148mm; }' +
  '.folha-cv .corte { position: absolute; top: 148.35mm; left: 0; right: 0; border-top: .3mm dashed #9a9a9a; z-index: 2; }';

export function renderSheets(layout: InviteLayout, list: InviteData[]) {
  let html = '';
  for (let i = 0; i < list.length; i += 2) {
    html += '<section class="folha-cv">' + renderInvite(layout, list[i]) +
      (list[i + 1] ? renderInvite(layout, list[i + 1]) : '<div class="vazio"></div>') +
      '<i class="corte"></i></section>';
  }
  return html;
}
