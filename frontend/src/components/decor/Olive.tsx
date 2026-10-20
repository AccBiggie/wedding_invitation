import { useId, useMemo, useState } from 'react';
import { COLORS, Palette, between, clusterPieces, createRng, dressBranch, paintCluster, paintLoosePetal, paintStem, paintTendril, pathLength, pointAt, smoothPath, sortPieces, spiralBranch, tendrilPoints, type Piece, type Point, type Rng, type Spot } from './botanica';
import { useStacked } from './FloralFrame';

// Ramos do tema "Nossa historia" (Botanica Aquarela), gerados de forma procedural com
// semente fixa: galhos que terminam em espiral, folhas em aquarela e florzinhas de
// jasmim, com os mesmos pintores dos raminhos das fotos circulares (FloralFrame).

const sign = (rng: Rng) => (rng() < .5 ? -1 : 1);
const int = (rng: Rng, min: number, max: number) => Math.floor(between(rng, min, max + 1));
const cleanId = (id: string) => id.replace(/[^a-zA-Z0-9]/g, '');

// Uma camada so (um filtro de aquarela): fios dourados -> caules -> folhas -> botoes -> flores.
const artMarkup = (ctx: Palette, stems: string[], pieces: Piece[], tendrils: string[] = []) =>
  `<defs>${ctx.defs()}</defs>${tendrils.join('')}${ctx.layer(stems.join('') + sortPieces(pieces).map(p => p.svg).join(''))}`;

// Desenho estatico (cabecalhos, raminhos e cantos): a mesma semente desenha sempre o mesmo.
const useArt = (seed: number, draw: (ctx: Palette, rng: Rng) => string) => {
  const id = cleanId(useId());
  return useMemo(() => draw(new Palette(`ol${id}`, true, seed % 997), createRng(seed)), [id, seed, draw]);
};

// ---- Cabecalho dos titulos --------------------------------------------------
// Metade esquerda: galho que nasce perto do titulo, segue para fora com folhas e
// flores pequenas e enrola ~0,8 volta para cima; buque pequeno junto ao texto. A
// metade direita e o espelho exato (mesma semente + scaleX(-1) no CSS).
const HALF_W = 200, HALF_H = 42;
const drawGarland = (ctx: Palette, rng: Rng) => {
  const x0 = HALF_W - 18, cy = HALF_H * .62, length = x0 - 16;
  // Nada encosta no titulo: 12 px livres na borda interna (mais o gap do flex).
  const allowed = (x: number, _y: number, r: number) => x + r < HALF_W - 12;
  const branch = spiralBranch(x0, cy, 184, length, 1, .8);
  const pieces = dressBranch(ctx, branch.pts, rng, { step: 13, leaf: 17, free: .22, flowerChance: .25, flowerGap: 38, flowerScale: .9, allowed });
  pieces.push(...clusterPieces(paintCluster(ctx, x0 - 10, cy - 2, -150, rng, { flowers: 3, buds: 2, leaves: 2, scale: .62, allowed }), 0));
  const tendril = tendrilPoints(x0 - length * .35, cy, 160, length * .5, rng);
  return artMarkup(ctx, [paintStem(branch.pts, 1.5, .45, COLORS.stem, .1)], pieces, tendril.every(p => allowed(p[0], p[1], 0)) ? [paintTendril(tendril)] : []);
};
export const OliveGarland = ({ flip = false, seed = 41 }: { flip?: boolean; seed?: number }) => {
  const html = useArt(seed, drawGarland);
  return <svg className={`wed-olive wed-olive-garland${flip ? ' is-flip' : ''}`} viewBox={`0 0 ${HALF_W} ${HALF_H}`} preserveAspectRatio="xMaxYMid meet" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: html }} />;
};

// Raminho pequeno dos titulos de card: o mesmo galho em miniatura.
const drawSprig = (ctx: Palette, rng: Rng) => {
  const branch = spiralBranch(44, 21, 192, 38, 1, .7);
  const pieces = dressBranch(ctx, branch.pts, rng, { step: 7, leaf: 10, free: .25, flowerChance: .35, flowerGap: 14, flowerScale: .55, allowed: x => x < 46 });
  return artMarkup(ctx, [paintStem(branch.pts, 1.1, .4, COLORS.stem, .1)], pieces);
};
export const OliveSprig = ({ flip = false, seed = 17 }: { flip?: boolean; seed?: number }) => {
  const html = useArt(seed, drawSprig);
  return <svg className="wed-olive wed-olive-sprig" width="48" height="32" viewBox="0 0 48 32" aria-hidden="true" focusable="false" style={flip ? { transform: 'scaleX(-1)' } : undefined} dangerouslySetInnerHTML={{ __html: html }} />;
};

// Canto da secao "Nossa historia": um galho em espiral com um cachinho no meio.
const drawCorner = (ctx: Palette, rng: Rng) => {
  const branch = spiralBranch(6, 76, -38, 125, 1, 1.1);
  const pieces = dressBranch(ctx, branch.pts, rng, { step: 14, leaf: 19, free: .3, flowerChance: .22 });
  const q = pointAt(branch.pts, 125 * .5);
  pieces.push(...clusterPieces(paintCluster(ctx, q.x, q.y, q.angle - 70, rng, { flowers: int(rng, 2, 3), buds: 1, scale: .62 }), 0));
  return artMarkup(ctx, [paintStem(branch.pts, 1.4, .4, COLORS.stem, .1)], pieces);
};
export const OliveCorner = ({ className = '', seed = 23 }: { className?: string; seed?: number }) => {
  const html = useArt(seed, drawCorner);
  return <svg className={`wed-olive ${className}`} viewBox="0 0 120 80" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: html }} />;
};

// ---- Jardim lateral --------------------------------------------------------
// Cada coluna e um jardim denso em camadas: tres hastes que nascem no canto externo
// (a esquerda no topo, descendo; a direita no pe, subindo) e se abrem pela coluna
// oscilando em seno com fase propria, uma delas ao fundo (80% do tamanho, 55% de
// opacidade); galhos em espiral em direcoes sorteadas; buques nas hastes da frente e
// petalas soltas caindo. Desenho em unidades de viewBox (1000 = altura da tela), com a
// borda externa em x = 0; a coluna da direita e espelhada no CSS. Cada visita sorteia
// uma semente nova; dentro da visita o desenho fica estavel.
//
// Efeito de desenho a mao (ao virar papel): os caules ficam num SVG proprio, como
// tracos que vao sendo desenhados (poucas linhas, barato de redesenhar); folhas e
// flores ficam em faixas horizontais, cada uma num SVG que o navegador compoe sem
// redesenhar, e cada faixa aparece logo depois que o traco passa por ela.
const COL_W = 300, INVADE = 90, VINE_W = COL_W + INVADE, VINE_H = 1000, BANDS = 10, GROW = 3.2;
interface DrawnStem { d: string; width: number; delay: number; duration: number; back: boolean }
interface Leafage { piece: Piece; back: boolean }

function growGarden(seed: number, ctx: Palette, mobile: boolean, fromTop: boolean) {
  const rng = createRng(seed), stems: DrawnStem[] = [], leafage: Leafage[] = [];
  const tendrils: { svg: string; y: number }[] = [], petals: { svg: string; y: number }[] = [], bouquets: Spot[] = [];
  const allowed = (x: number, y: number, r: number) => x > r && x < VINE_W - r && y > r && y < VINE_H - r;
  // Distancia (em tempo) do ponto de partida ate a altura y: o traco desce ou sobe a coluna.
  const timeAt = (y: number) => (fromTop ? y : VINE_H - y) / VINE_H * GROW;
  // Haste que nasce no canto externo (x0) e se abre ate o centro da sua faixa (cx) no primeiro quinto.
  const strand = (phase: number, amp: number, cx: number, x0: number) => {
    const pts: Point[] = [], N = Math.round((VINE_H + 24) / 4);
    for (let i = 0; i <= N; i++) {
      const t = i / N, y = fromTop ? -12 + t * (VINE_H + 24) : VINE_H + 12 - t * (VINE_H + 24);
      const u = Math.min(1, t / .2), ramp = u * u * (3 - 2 * u);
      pts.push([x0 + (cx - x0) * ramp + ramp * (amp * Math.sin(y * .0105 + phase) + 6 * Math.sin(y * .031 + phase * 2)), y]);
    }
    return pts;
  };
  // Fundo + duas da frente (amplitudes de 17% a 24% da coluna); no celular, so o fundo e uma da frente.
  const strands = [
    { pts: strand(between(rng, 0, 6.28), COL_W * between(rng, .17, .22), COL_W * between(rng, .38, .46), between(rng, 8, 30)), back: true, scale: .8 },
    { pts: strand(between(rng, 0, 6.28), COL_W * between(rng, .2, .24), COL_W * between(rng, .46, .54), between(rng, 14, 40)), back: false, scale: 1 },
    { pts: strand(between(rng, 0, 6.28), COL_W * between(rng, .17, .21), COL_W * between(rng, .54, .62), between(rng, 20, 50)), back: false, scale: .9 }
  ].slice(0, mobile ? 2 : 3);
  strands.forEach(({ pts, back, scale }, index) => {
    const L = pathLength(pts), add = (pieces: Piece[]) => pieces.forEach(piece => leafage.push({ piece, back }));
    stems.push({ d: smoothPath(pts), width: 1.45 * scale, delay: index * .12, duration: GROW, back });
    add(dressBranch(ctx, pts, rng, { step: 16, leaf: 22 * scale, free: 0, flowerChance: .24, flowerGap: 38, flowerScale: scale, allowed }));
    // Galhos em direcoes sorteadas: para o conteudo (55%) ou para a borda, subindo ou
    // descendo ate 75 graus, enrolando para um lado sorteado.
    for (let s = between(rng, 30, 70); s < L - 30; s += between(rng, 58, 92)) {
      const b = pointAt(pts, s), inward = rng() < .55;
      const angle = (inward ? 0 : 180) + between(rng, -75, 75);
      const length = inward ? between(rng, 90, 90 + INVADE * 1.4) : between(rng, 60, 120);
      const branch = spiralBranch(b.x, b.y, angle, length, sign(rng), between(rng, .6, 1.5));
      stems.push({ d: smoothPath(branch.pts), width: .75 * scale, delay: timeAt(b.y) + index * .12, duration: between(rng, .8, 1.3), back });
      add(dressBranch(ctx, branch.pts, rng, { step: 13, leaf: 18 * scale, free: .28, flowerChance: .3, flowerGap: 34, flowerScale: .95 * scale, allowed }));
    }
    // Buques nas hastes da frente, abrindo em direcoes sorteadas, sem sobrepor.
    if (!back) for (let s = between(rng, 60, 140) + index * 70; s < L - 40; s += between(rng, 150, 210)) {
      const q = pointAt(pts, s), opens = between(rng, -180, 180), bscale = between(rng, .85, 1.05) * scale;
      add(clusterPieces(paintCluster(ctx, q.x, q.y, opens, rng, { flowers: int(rng, 4, 6), buds: int(rng, 2, 3), leaves: 2, scale: bscale, taken: bouquets, allowed }), s, q.y));
      if (rng() < .3) {
        const tp = tendrilPoints(q.x, q.y, opens + 180 + sign(rng) * between(rng, 35, 60), between(rng, 70, 100) * bscale, rng);
        if (tp.every(p => allowed(p[0], p[1], 0))) tendrils.push({ svg: paintTendril(tp), y: q.y });
      }
    }
  });
  // Petalas soltas caindo, mais para o lado do conteudo (metade no celular).
  for (let i = 0; i < (mobile ? 7 : 14); i++) {
    const y = between(rng, 20, VINE_H - 20);
    petals.push({ svg: paintLoosePetal(ctx, between(rng, .1, 1.1) * COL_W, y, between(rng, 0, 360), between(rng, 6, 10), rng), y });
  }
  return { stems, leafage, tendrils, petals, timeAt };
}

function gardenMarkup(seed: number, ctx: Palette, mobile: boolean, fromTop: boolean) {
  const { stems, leafage, tendrils, petals, timeAt } = growGarden(seed, ctx, mobile, fromTop);
  const t = (v: number) => `${v.toFixed(2)}s`, bandH = VINE_H / BANDS;
  const band = (y: number) => Math.max(0, Math.min(BANDS - 1, Math.floor(y / bandH)));
  const stroke = (st: DrawnStem) => `<path d="${st.d}" pathLength="1" stroke-width="${st.width.toFixed(2)}" style="--d:${t(st.delay)};--dur:${t(st.duration)}"/>`;
  // Caules: fundo (55%) por baixo dos da frente; os gradientes das folhas ficam aqui, uma vez por coluna.
  const stemSvg = `<svg class="wed-garden-stems" viewBox="0 0 ${VINE_W} ${VINE_H}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs>${ctx.defs()}</defs>` +
    `<g fill="none" stroke="${COLORS.stem}" stroke-linecap="round"><g opacity=".55">${stems.filter(st => st.back).map(stroke).join('')}</g>${stems.filter(st => !st.back).map(stroke).join('')}</g></svg>`;
  // Faixas: cada uma com o seu fundo (55%), fios dourados, folhagem da frente e petalas soltas.
  const bands = Array.from({ length: BANDS }, (_, k) => {
    const of = (back: boolean) => sortPieces(leafage.filter(l => l.back === back && band(l.piece.y) === k).map(l => l.piece)).map(p => p.svg).join('');
    const y0 = k * bandH, delay = timeAt(y0 + bandH * .5) + .25;
    return `<svg class="wed-garden-band" viewBox="0 ${y0} ${VINE_W} ${bandH}" style="top:${k * 100 / BANDS}%;height:${100 / BANDS}%;--d:${t(delay)}" aria-hidden="true" focusable="false">` +
      `<g opacity=".55">${of(true)}</g>${tendrils.filter(x => band(x.y) === k).map(x => x.svg).join('')}${of(false)}${petals.filter(x => band(x.y) === k).map(x => x.svg).join('')}</svg>`;
  }).join('');
  return stemSvg + bands;
}

const newSeed = () => Math.floor(Math.random() * 2 ** 31);

export const OliveVine = ({ className = '', from = 'bottom' }: { className?: string; from?: 'top' | 'bottom' }) => {
  const id = cleanId(useId()), mobile = useStacked();
  const [seed] = useState(newSeed);
  // Gerado uma vez por coluna e por visita; so muda ao cruzar o corte do celular. Sem o
  // filtro de aquarela: no jardim (fixo e grande) ele repinta a coluna a cada quadro da
  // rolagem; o estilo vem dos degrades. Fotos e cabecalhos continuam com o filtro.
  const html = useMemo(() => gardenMarkup(seed, new Palette(`ov${id}`, false), mobile, from === 'top'), [id, seed, mobile, from]);
  return <div className={`wed-olive wed-olive-vine ${className}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
};
