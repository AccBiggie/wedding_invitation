import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { qrSvg, type InviteData, type InviteLayout, type SheetLayout } from '../../invite-print/convite';
import { inviteCardDocument, prepareInviteFrame } from '../../invite-print/printDocument';
import './abertura-envelope.css';

// Abertura do convite online (componente ConviteOnline do design system): envelope vertical
// marfim com a logo do casal e laco de cetim -> .aberto (laco se desfaz, aba vira, convite
// sobe) -> .saiu (convite no centro e botao). So apresentacao: o convite ja vem carregado.

const ALT = 'Convite de casamento de Stéfani e André: sábado, 10 de abril de 2027, Paróquia São Gabriel Arcanjo e São Sebastião';
const TEMPO_ABERTURA = 2900;

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

export interface OnlineInvite { layout: InviteLayout; data: InviteData }

// Modelo Igreja em tres camadas: fundo-convite.png (no CSS) + nomes em ouro + borda dupla metalica.
// O QR code do convidado fica no mesmo ponto do impresso (conviteIgreja.css): centro, 395 pt do topo, 42,5 pt.
function ConviteIgreja({ link }: { link?: string }) {
  const qr = useMemo(() => link ? qrSvg(link) : '', [link]);
  return <div className="cv-ouro">
    <img className="cv-brilho cv-brilho-superior" src="/textos-convite-ouro.svg" alt="" />
    <img className="cv-brilho cv-brilho-inferior" src="/textos-convite-ouro.svg" alt="" />
    <img src="/textos-convite-ouro.svg" alt="" /><img src="/borda-dupla-ouro.svg" alt="" />
    {qr && <div className="cv-qr" dangerouslySetInnerHTML={{ __html: qr }} />}</div>;
}

// Modelos 5, 9 e 10: o mesmo convite da impressao (210 x 148 mm, com o nome e o QR code do
// convidado), num iframe para o CSS de impressao nao vazar para o site, escalado para a largura da caixa.
const FOLHA_PX = 210 * 96 / 25.4;
function ConviteFolha({ layout, data }: { layout: SheetLayout; data: InviteData }) {
  const box = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0);
  const [ready, setReady] = useState(false);
  const key = JSON.stringify(data);
  const html = useMemo(() => inviteCardDocument(layout, data), [layout, key]);
  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / FOLHA_PX));
    observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  // Espera fontes e foto (e ajusta nomes longos) antes de mostrar.
  const onLoad = () => { if (frame.current) void prepareInviteFrame(frame.current, layout === 9 && data.foto ? [data.foto] : []).catch(() => undefined).finally(() => setReady(true)); };
  return <div ref={box} className="cv-folha">
    <iframe ref={frame} title="Convite" aria-hidden="true" tabIndex={-1} srcDoc={html} onLoad={onLoad}
      style={{ width: FOLHA_PX, height: FOLHA_PX * 148 / 210, transform: `scale(${scale})`, opacity: ready ? 1 : 0 }} />
  </div>;
}

const Convite = ({ invite }: { invite?: OnlineInvite | null }) =>
  !invite || invite.layout === 'igreja' ? <ConviteIgreja link={invite?.data.link} /> : <ConviteFolha layout={invite.layout} data={invite.data} />;

const descricao = (invite?: OnlineInvite | null) => {
  if (!invite) return ALT;
  const { noiva, noivo, data, hora, local } = invite.data;
  return `Convite de casamento de ${noiva} e ${noivo}: ${String(data.dia).padStart(2, '0')}/${String(data.mes).padStart(2, '0')}/${data.ano}, às ${hora}, ${local}`;
};

// laco-cetim.svg inline: alcas, no e pontas sao grupos animados pelo CSS.
const Laco = () => <svg viewBox="0 0 300 260" aria-hidden="true">
  <defs>
    <linearGradient id="bE" x1="1" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#d8c7a3" /><stop offset=".25" stopColor="#f1e6d0" /><stop offset=".5" stopColor="#fffbf3" /><stop offset=".7" stopColor="#f3e9d5" /><stop offset=".88" stopColor="#fffcf7" /><stop offset="1" stopColor="#e6d8bc" /></linearGradient>
    <linearGradient id="bD" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#d8c7a3" /><stop offset=".25" stopColor="#f1e6d0" /><stop offset=".5" stopColor="#fffbf3" /><stop offset=".7" stopColor="#f1e6d1" /><stop offset=".88" stopColor="#fffcf7" /><stop offset="1" stopColor="#e3d4b6" /></linearGradient>
    <linearGradient id="bT" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e0d1b3" /><stop offset=".35" stopColor="#fffaf2" /><stop offset=".6" stopColor="#f2e8d4" /><stop offset=".85" stopColor="#fffbf5" /><stop offset="1" stopColor="#d5c4a0" /></linearGradient>
    <radialGradient id="bN" cx=".4" cy=".35" r=".75"><stop offset="0" stopColor="#fffdf8" /><stop offset=".65" stopColor="#efe4cd" /><stop offset="1" stopColor="#cfbd98" /></radialGradient>
    <filter id="bS" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="1" dy="4" stdDeviation="3.5" floodColor="#5a4520" floodOpacity=".25" /></filter>
    <filter id="bB"><feGaussianBlur stdDeviation="1.4" /></filter>
  </defs>
  <g filter="url(#bS)">
    <g className="ponta ponta-e"><path d="M144,104 C128,142 100,190 66,238 L92,232 L98,258 C128,206 150,154 158,108Z" fill="url(#bT)" /><path d="M150,112 C136,150 116,192 90,234" stroke="#fffdf8" strokeWidth="4" fill="none" opacity=".8" filter="url(#bB)" /><path d="M155,114 C146,150 130,190 106,236" stroke="#cdbb96" strokeWidth="1.5" fill="none" opacity=".6" filter="url(#bB)" /></g>
    <g className="ponta ponta-d"><path d="M156,104 C170,140 192,182 222,226 L232,208 L252,220 C224,176 190,130 164,100Z" fill="url(#bT)" /><path d="M162,108 C184,148 208,186 236,214" stroke="#fffdf8" strokeWidth="4" fill="none" opacity=".8" filter="url(#bB)" /><path d="M158,114 C176,150 198,184 224,218" stroke="#cdbb96" strokeWidth="1.5" fill="none" opacity=".55" filter="url(#bB)" /></g>
    <g className="alca alca-e"><path d="M146,94 C128,80 100,52 68,40 C50,34 34,40 34,56 C34,74 50,92 76,102 C102,110 130,108 146,102Z" fill="url(#bE)" /><path d="M146,99 C122,104 94,104 74,98 C90,113 122,115 146,104Z" fill="#d4c29d" opacity=".6" filter="url(#bB)" /><path d="M138,84 C118,64 90,48 64,44" stroke="#fffdf8" strokeWidth="5" fill="none" opacity=".9" filter="url(#bB)" strokeLinecap="round" /><path d="M40,64 C48,82 74,96 120,100" stroke="#d6c5a2" strokeWidth="2.5" fill="none" opacity=".45" filter="url(#bB)" /></g>
    <g className="alca alca-d"><path d="M154,94 C172,78 202,50 234,40 C252,34 268,40 268,56 C268,74 252,92 226,102 C200,110 170,108 154,102Z" fill="url(#bD)" /><path d="M154,99 C178,104 206,104 228,98 C210,113 178,115 154,104Z" fill="#d4c29d" opacity=".6" filter="url(#bB)" /><path d="M162,84 C182,64 210,48 238,44" stroke="#fffdf8" strokeWidth="5" fill="none" opacity=".9" filter="url(#bB)" strokeLinecap="round" /><path d="M262,64 C254,82 228,96 182,100" stroke="#d6c5a2" strokeWidth="2.5" fill="none" opacity=".45" filter="url(#bB)" /></g>
    <g className="no"><path d="M139,86 C144,80 156,80 161,86 C166,94 166,106 161,112 C156,118 144,118 139,112 C134,106 134,94 139,86Z" fill="url(#bN)" /><path d="M142,88 C148,96 148,106 143,112" stroke="#cdbb96" strokeWidth="1.4" fill="none" opacity=".8" /><path d="M152,86 C156,94 156,104 153,113" stroke="#fffdf8" strokeWidth="1.8" fill="none" opacity=".9" /></g>
  </g>
</svg>;

const Coracao = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.4 3 5 6.4 5c2.1 0 3.6 1.2 4.6 2.7h2C14 6.2 15.5 5 17.6 5 21 5 23.1 8.4 21.6 11.7 19.5 16.4 12 21 12 21z" /></svg>;

export function EnvelopeOpening({ invite, autoOpen, onConfirm }: { invite?: OnlineInvite | null; autoOpen?: boolean; onConfirm: () => void }) {
  const [stage, setStage] = useState<'fechado' | 'aberto' | 'saiu'>('fechado');
  const [leaving, setLeaving] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  // Abertura em tela cheia: a pagina por baixo nao rola enquanto ela esta na tela.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  // Vindo de "Visualizar convite": mostra o envelope fechado por um instante e abre sozinho.
  useEffect(() => {
    if (!autoOpen) return;
    const timer = setTimeout(() => setStage(current => current === 'fechado' ? 'aberto' : current), reducedMotion() ? 0 : 600);
    return () => clearTimeout(timer);
  }, [autoOpen]);
  useEffect(() => {
    if (stage === 'aberto') { const timer = setTimeout(() => setStage('saiu'), reducedMotion() ? 50 : TEMPO_ABERTURA); return () => clearTimeout(timer); }
    if (stage === 'saiu') button.current?.focus({ preventScroll: true });
  }, [stage]);
  // "Confirmar presenca": fade de 0,3 s e troca para a tela de confirmacao.
  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(onConfirm, reducedMotion() ? 0 : 300);
    return () => clearTimeout(timer);
  }, [leaving, onConfirm]);

  const open = () => { if (stage === 'fechado') setStage('aberto'); };
  const openByKey = (event: KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } };

  // Proporcao do convite: Igreja (665,8 x 502,9 pt) ou folha dos outros modelos (210 x 148 mm).
  const ratio = { '--ar': !invite || invite.layout === 'igreja' ? 665.8 / 502.9 : 210 / 148 } as CSSProperties;
  return <main className={`ec${stage !== 'fechado' ? ' aberto' : ''}${stage === 'saiu' ? ' saiu' : ''}${leaving ? ' saindo' : ''}`} style={ratio}>
    <div className="env" role="button" tabIndex={stage === 'fechado' ? 0 : -1} aria-label="Abrir o convite de Stéfani e André"
      aria-hidden={stage === 'saiu' || undefined} onClick={open} onKeyDown={openByKey}>
      <div className="costas" />
      <div className="carta"><Convite invite={invite} /></div>
      <div className="frente" />
      <div className="sombra-aba" />
      <div className="aba"><div className="face f1" /><div className="face f2" /></div>
      <div className="logo"><img src="/logo-casal.svg" alt="" /></div>
      <div className="clique" aria-hidden="true">CLIQUE PARA<br />ABRIR<div className="tr"><Coracao /></div></div>
      <div className="laco"><Laco /></div>
    </div>
    <div className="final" aria-hidden={stage !== 'saiu' || undefined}>
      <div className="conv" role="img" aria-label={descricao(invite)}><Convite invite={invite} /></div>
      <button ref={button} type="button" className="bt" tabIndex={stage === 'saiu' ? 0 : -1} onClick={() => setLeaving(true)}>
        <span aria-hidden="true">♥</span>Confirmar presença
      </button>
    </div>
  </main>;
}
