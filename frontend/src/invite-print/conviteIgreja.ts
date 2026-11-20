import { qrSvg, type InviteData } from './convite';

export const IGREJA_FUNDO = '/fundo-convite.png';
export const IGREJA_TEXTOS = '/textos-convite-ouro.svg?v=2';

// Cantoneiras cinza de textos-convite.svg, anteriores a eabe19d,
// com os vértices alinhados à antiga borda interna.
const CHANFRO_GUIAS = `<svg class="cv-camada" viewBox="0 0 234.9 177.4" preserveAspectRatio="none" aria-hidden="true">
  <path fill="none" stroke="#e0dfe0" stroke-width=".264"
    d="M 10.626 9.8 H 9.8 v .814
       M 224.274 9.8 H 225.1 v .814
       M 10.626 167.6 H 9.8 v -.814
       M 224.274 167.6 H 225.1 v -.814"/>
</svg>`;

export const renderIgrejaSheets = (list: InviteData[]) => list.map(d =>
  '<section class="folha"><div class="cv">' +
  '<img class="cv-camada" src="' + IGREJA_TEXTOS + '" alt="Convite de casamento de Stéfani e André">' +
  CHANFRO_GUIAS +
  '<div class="cv-qr">' + qrSvg(d.link) + '</div></div></section>').join('');
