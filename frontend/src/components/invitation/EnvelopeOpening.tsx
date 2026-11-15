import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent } from 'react';
import { qrSvg, type InviteData, type InviteLayout, type SheetLayout } from '../../invite-print/convite';
import { inviteCardDocument, prepareInviteFrame } from '../../invite-print/printDocument';
import './abertura-envelope.css';

// Abertura do convite online (componente ConviteOnline do design system, etapa 19): envelope
// off-white texturado com a logo do casal em ouro e fita larga de cetim azul-marinho com laco
// -> .aberto (fita desliza, laco se desfaz, aba vira, convite sobe) -> .saiu (convite no centro
// e botao). So apresentacao: o convite ja vem carregado.

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

// Fita e laco: imagens 900 x 900 com fundo transparente, todas no mesmo enquadramento (no em
// 50% x 36,67%), empilhadas na ordem abaixo. Nao recortar nem redimensionar: o CSS so posiciona.
const FITA = [['g-fita-e', '/fita-esquerda.webp'], ['g-fita-d', '/fita-direita.webp']];
const LACO = [['g-ponta-e', '/laco-ponta-esquerda.webp'], ['g-ponta-d', '/laco-ponta-direita.webp'], ['g-alca-e', '/laco-alca-esquerda.webp'], ['g-alca-d', '/laco-alca-direita.webp'], ['g-no', '/laco-no.webp']];
// Pre-carregadas antes de mostrar o envelope (para ele nao aparecer sem a fita). Imagem que falhar
// nao trava a abertura, e depois de 6 s o envelope aparece de qualquer jeito.
const PRECARREGAR = [...FITA, ...LACO].map(([, src]) => src).concat('/logo-casal.svg', '/papel-algodao.svg');
const carregar = (src: string) => new Promise<void>(resolve => { const image = new Image(); image.onload = image.onerror = () => resolve(); image.src = src; });

const Coracao = () => <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.4 3 5 6.4 5c2.1 0 3.6 1.2 4.6 2.7h2C14 6.2 15.5 5 17.6 5 21 5 23.1 8.4 21.6 11.7 19.5 16.4 12 21 12 21z" /></svg>;

export function EnvelopeOpening({ invite, autoOpen, onConfirm }: { invite?: OnlineInvite | null; autoOpen?: boolean; onConfirm: () => void }) {
  const [stage, setStage] = useState<'fechado' | 'aberto' | 'saiu'>('fechado');
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  // Abertura em tela cheia: a pagina por baixo nao rola enquanto ela esta na tela.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => { if (active) setReady(true); }, 6000);
    void Promise.all(PRECARREGAR.map(carregar)).then(() => { if (active) setReady(true); });
    return () => { active = false; clearTimeout(timer); };
  }, []);
  // Vindo de "Visualizar convite": mostra o envelope fechado por um instante e abre sozinho.
  useEffect(() => {
    if (!autoOpen || !ready) return;
    const timer = setTimeout(() => setStage(current => current === 'fechado' ? 'aberto' : current), reducedMotion() ? 0 : 600);
    return () => clearTimeout(timer);
  }, [autoOpen, ready]);
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

  const open = () => { if (ready && stage === 'fechado') setStage('aberto'); };
  const openByKey = (event: KeyboardEvent) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } };

  // Proporcao do convite: Igreja (665,8 x 502,9 pt) ou folha dos outros modelos (210 x 148 mm).
  const ratio = { '--ar': !invite || invite.layout === 'igreja' ? 665.8 / 502.9 : 210 / 148 } as CSSProperties;
  return <main aria-busy={!ready || undefined} className={`ec${ready ? '' : ' carregando'}${stage !== 'fechado' ? ' aberto' : ''}${stage === 'saiu' ? ' saiu' : ''}${leaving ? ' saindo' : ''}`} style={ratio}>
    <div className="env" role="button" tabIndex={stage === 'fechado' ? 0 : -1} aria-label="Abrir o convite de Stéfani e André"
      aria-hidden={stage === 'saiu' || undefined} onClick={open} onKeyDown={openByKey}>
      <div className="costas" />
      <div className="carta"><Convite invite={invite} /></div>
      <div className="frente" />
      <div className="sombra-aba" />
      <div className="aba"><div className="face f1" /><div className="face f2" /></div>
      <div className="logo"><img src="/logo-casal.svg" alt="" /></div>
      <div className="clique" aria-hidden="true">CLIQUE PARA<br />ABRIR<div className="tr"><Coracao /></div></div>
      <div className="fita-wrap">{FITA.map(([name, src]) => <img key={name} className={name} src={src} alt="" aria-hidden="true" />)}</div>
      <div className="laco">{LACO.map(([name, src]) => <img key={name} className={name} src={src} alt="" aria-hidden="true" />)}</div>
    </div>
    <div className="final" aria-hidden={stage !== 'saiu' || undefined}>
      <div className="conv" role="img" aria-label={descricao(invite)}><Convite invite={invite} /></div>
      <button ref={button} type="button" className="bt" tabIndex={stage === 'saiu' ? 0 : -1} onClick={() => setLeaving(true)}>
        <span aria-hidden="true">♥</span>Confirmar presença
      </button>
    </div>
  </main>;
}
