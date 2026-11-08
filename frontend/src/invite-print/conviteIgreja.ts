import { qrSvg, type InviteData } from './convite';

// Mesmas camadas do convite online (EnvelopeOpening): fundo + textos com os nomes em ouro + borda dupla metálica.
export const IGREJA_FUNDO = '/fundo-convite.png';
export const IGREJA_TEXTOS = '/textos-convite-ouro.svg';
export const IGREJA_BORDA = '/borda-dupla-ouro.svg';

export const renderIgrejaSheets = (list: InviteData[]) => list.map(d =>
  '<section class="folha"><div class="cv">' +
  '<img class="cv-camada cv-brilho cv-brilho-superior" src="' + IGREJA_TEXTOS + '" alt="" aria-hidden="true">' +
  '<img class="cv-camada cv-brilho cv-brilho-inferior" src="' + IGREJA_TEXTOS + '" alt="" aria-hidden="true">' +
  '<img class="cv-camada" src="' + IGREJA_TEXTOS + '" alt="Convite de casamento de Stéfani e André">' +
  '<img class="cv-camada" src="' + IGREJA_BORDA + '" alt="" aria-hidden="true">' +
  '<div class="cv-qr">' + qrSvg(d.link) + '</div></div></section>').join('');
