import { useId, useMemo } from 'react';
import { COLORS, Palette, between, blendAngle, clusterPieces, createRng, dressBranch, paintCluster, paintLoosePetal, paintStem, paintTendril, pathLength, pointAt, smoothPath, sortPieces, spiralBranch, tendrilPoints, type Piece, type Point, type Rng, type Spot } from './botanica';
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
// Cada coluna e um jardim denso em camadas: tres hastes que sobem a coluna inteira
// oscilando em seno com fase propria (cruzam como uma tranca), uma delas ao fundo
// (80% do tamanho, 55% de opacidade); galhos em espiral a cada 58-92 px, 55% deles
// para o lado do conteudo, longos o bastante para entrar ate 90 px por baixo do card;
// buques nas hastes da frente e petalas soltas caindo. Desenho em unidades de
// viewBox (1000 = altura da tela), com o lado do conteudo a direita; a coluna da
// direita e espelhada no CSS. Cresce quando a pagina vira papel: os caules sao
// revelados por mascara e as pecas brotam em sequencia.
const COL_W = 300, INVADE = 90, VINE_W = COL_W + INVADE, VINE_H = 1000, GROW = 2.4;
interface Stem { svg: string; d: string; delay: number; duration: number }
interface Layer { stems: Stem[]; pieces: (Piece & { delay: number })[] }

function growGarden(seed: number, ctx: Palette, mobile: boolean) {
  const rng = createRng(seed), back: Layer = { stems: [], pieces: [] }, front: Layer = { stems: [], pieces: [] };
  const tendrils: { svg: string; delay: number }[] = [], petals: { svg: string; delay: number }[] = [], bouquets: Spot[] = [];
  const allowed = (x: number, y: number, r: number) => x > r && x < VINE_W - r && y > r && y < VINE_H - r;
  const strand = (phase: number, amp: number, cx: number) => {
    const pts: Point[] = [];
    for (let y = VINE_H + 12; y >= -12; y -= 4) pts.push([cx + amp * Math.sin(y * .0105 + phase) + 6 * Math.sin(y * .031 + phase * 2), y]);
    return pts;
  };
  // Fundo + duas da frente; no celular, so o fundo e uma da frente.
  const strands = [
    { pts: strand(between(rng, 0, 6.28), COL_W * .2, COL_W * .42), layer: back, scale: .8 },
    { pts: strand(between(rng, 0, 6.28), COL_W * .24, COL_W * .5), layer: front, scale: 1 },
    { pts: strand(between(rng, 0, 6.28), COL_W * .17, COL_W * .58), layer: front, scale: .9 }
  ].slice(0, mobile ? 2 : 3);
  strands.forEach(({ pts, layer, scale }, index) => {
    const L = pathLength(pts), at = (s: number) => s / L * GROW;
    layer.stems.push({ svg: paintStem(pts, 1.7 * scale, 1.1 * scale, COLORS.stem), d: smoothPath(pts), delay: 0, duration: GROW });
    dressBranch(ctx, pts, rng, { step: 16, leaf: 22 * scale, free: 0, flowerChance: .24, flowerGap: 38, flowerScale: scale, allowed }).forEach(p => layer.pieces.push({ ...p, delay: at(p.s) }));
    for (let s = between(rng, 30, 70); s < L - 30; s += between(rng, 58, 92)) {
      const b = pointAt(pts, s), inward = rng() < .55, side = inward ? 1 : -1;
      const length = inward ? between(rng, 110, 90 + INVADE * 1.4) : between(rng, 70, 120), duration = .9;
      const branch = spiralBranch(b.x, b.y, blendAngle(b.angle, inward ? 0 : 180, between(rng, .55, .8)), length, -side, between(rng, .8, 1.5));
      layer.stems.push({ svg: paintStem(branch.pts, 1.1 * scale, .35, COLORS.stem), d: smoothPath(branch.pts), delay: at(s), duration });
      dressBranch(ctx, branch.pts, rng, { step: 13, leaf: 18 * scale, free: .28, flowerChance: .3, flowerGap: 34, flowerScale: .95 * scale, allowed }).forEach(p => layer.pieces.push({ ...p, delay: at(s) + p.s / length * duration }));
    }
    // Buques nas hastes da frente, abrindo ora para fora, ora para dentro, sem sobrepor.
    if (layer === front) for (let s = between(rng, 60, 140) + index * 70; s < L - 40; s += between(rng, 150, 210)) {
      const q = pointAt(pts, s), opens = (rng() < .6 ? -20 : -160) + between(rng, -25, 25), bscale = between(rng, .85, 1.05) * scale;
      const cluster = paintCluster(ctx, q.x, q.y, opens, rng, { flowers: int(rng, 4, 6), buds: int(rng, 2, 3), leaves: 2, scale: bscale, taken: bouquets, allowed });
      clusterPieces(cluster, s).forEach(p => layer.pieces.push({ ...p, delay: at(s) + .2 }));
      if (rng() < .3) {
        const tp = tendrilPoints(q.x, q.y, opens + 180 + sign(rng) * between(rng, 35, 60), between(rng, 70, 100) * bscale, rng);
        if (tp.every(p => allowed(p[0], p[1], 0))) tendrils.push({ svg: paintTendril(tp), delay: at(s) + .2 });
      }
    }
  });
  // Petalas soltas caindo, mais para o lado do conteudo (metade no celular).
  for (let i = 0; i < (mobile ? 7 : 14); i++) petals.push({ svg: paintLoosePetal(ctx, between(rng, .1, 1.1) * COL_W, between(rng, 20, VINE_H - 20), between(rng, 0, 360), between(rng, 6, 10), rng), delay: GROW * .6 + between(rng, 0, 1.2) });
  back.pieces = sortPieces(back.pieces); front.pieces = sortPieces(front.pieces);
  return { back, front, tendrils, petals };
}

function gardenMarkup(seed: number, ctx: Palette, mobile: boolean) {
  const { back, front, tendrils, petals } = growGarden(seed, ctx, mobile);
  const t = (v: number) => `${v.toFixed(2)}s`;
  const bloom = (kind: string, svg: string, delay: number) => `<g class="bloom is-${kind}" style="--grow-delay:${t(delay + .15)}">${svg}</g>`;
  let masks = '', m = 0;
  const layer = (l: Layer) => l.stems.map(stem => {
    const id = `${ctx.id}-m${m++}`;
    masks += `<mask id="${id}"><path class="grow" d="${stem.d}" pathLength="1" fill="none" stroke="#fff" stroke-width="7" style="--grow-delay:${t(stem.delay)};--grow-duration:${t(stem.duration)}"/></mask>`;
    return `<g mask="url(#${id})">${stem.svg}</g>`;
  }).join('') + l.pieces.map(p => bloom(p.kind, p.svg, p.delay)).join('');
  // Ordem: fundo -> fios dourados -> caules -> folhas -> botoes -> flores -> petalas soltas.
  const body = `<g opacity=".55">${ctx.layer(layer(back))}</g>` + tendrils.map(x => bloom('stem', x.svg, x.delay)).join('') +
    ctx.layer(layer(front) + petals.map(x => bloom('petal', x.svg, x.delay)).join(''));
  return `<defs>${ctx.defs()}${masks}</defs>${body}`;
}

export const OliveVine = ({ className = '', seed }: { className?: string; seed: number }) => {
  const id = cleanId(useId()), mobile = useStacked();
  // Gerado uma vez por coluna (semente fixa); so muda ao cruzar o corte do celular. Sem o
  // filtro de aquarela: no jardim (fixo e grande) ele repinta a coluna a cada quadro da
  // rolagem; o estilo vem dos degrades. Fotos e cabecalhos continuam com o filtro.
  const html = useMemo(() => gardenMarkup(seed, new Palette(`ov${id}`, false), mobile), [id, seed, mobile]);
  return <svg className={`wed-olive wed-olive-vine ${className}`} viewBox={`0 0 ${VINE_W} ${VINE_H}`} preserveAspectRatio="xMinYMid meet" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: html }} />;
};
