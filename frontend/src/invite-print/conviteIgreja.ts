import { qrSvg, type InviteData } from './convite';

export const IGREJA_FUNDO = '/fundo-convite.png';
export const IGREJA_TEXTOS = '/textos-convite.svg';

// Os textos, a borda e as cantoneiras são desenhos exportados do PDF original.
export const renderIgrejaSheets = (list: InviteData[]) => list.map(d =>
  '<section class="folha"><div class="cv">' +
  '<img class="cv-textos cv-brilho cv-brilho-superior" src="' + IGREJA_TEXTOS + '" alt="" aria-hidden="true">' +
  '<img class="cv-textos cv-brilho cv-brilho-inferior" src="' + IGREJA_TEXTOS + '" alt="" aria-hidden="true">' +
  '<img class="cv-textos" src="' + IGREJA_TEXTOS + '" alt="Convite de casamento de Stéfani e André">' +
  '<div class="cv-qr">' + qrSvg(d.link) + '</div></div></section>').join('');
