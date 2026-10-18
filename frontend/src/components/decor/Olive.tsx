import { useId, useMemo } from 'react';
import { COLORS, Palette, between, clusterPieces, createRng, dressBranch, paintCluster, paintStem, paintTendril, pathLength, pointAt, smoothPath, sortPieces, spiralBranch, tendrilPoints, walk, wobble, type Piece, type Rng } from './botanica';

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

// ---- Ramo lateral em espiral -----------------------------------------------
// Haste ondulando do pe ao topo (o angulo volta sempre para a vertical) que enrola
// numa espiral de ~1 volta; galhos alternados a cada 55-80 px que fecham a curva
// ate virar espiral, com galhinhos secundarios; folhas de 19-24 px e flores de
// 12-18 px. Cresce quando a pagina vira papel: os caules sao revelados por mascara
// e as pecas brotam em sequencia.
const VINE_W = 260, VINE_H = 1000, GROW = 2.4;
interface Stem { svg: string; d: string; delay: number; duration: number }
// Densidade da folhagem: passo entre folhas e chances de flor e de cachinho.
const DENSE = { stalkStep: 13, branchStep: 11, stalkFlower: .26, branchFlower: .34, flowerGap: 32, cluster: .8, twig: .7 };

function growVine(seed: number, ctx: Palette) {
  const rng = createRng(seed), stems: Stem[] = [], pieces: (Piece & { delay: number })[] = [];
  const main = walk(VINE_W * .42, VINE_H + 10, -90, VINE_H * .93, 4, wobble(rng, .22, .012, -90, .01));
  const top = main.pts[main.pts.length - 1];
  const stalk = main.pts.concat(spiralBranch(top[0], top[1], main.angle, 70, sign(rng), 1.1).pts.slice(1));
  const Ls = pathLength(stalk);
  stems.push({ svg: paintStem(stalk, 1.8, .5, COLORS.stem), d: smoothPath(stalk), delay: 0, duration: GROW });
  dressBranch(ctx, stalk, rng, { step: DENSE.stalkStep, leaf: 24, free: .06, flowerChance: DENSE.stalkFlower, flowerGap: DENSE.flowerGap }).forEach(p => pieces.push({ ...p, delay: p.s / Ls * GROW }));
  // Galho em espiral vestido de folhas, flores e (as vezes) um cachinho no meio.
  const grow = (x: number, y: number, angle: number, length: number, side: number, turns: number, width: number, start: number, duration: number, leaf: number) => {
    // Enrola para o lado oposto ao que saiu do caule (para dentro).
    const branch = spiralBranch(x, y, angle, length, -side, turns);
    stems.push({ svg: paintStem(branch.pts, width, .4, COLORS.stem), d: smoothPath(branch.pts), delay: start, duration });
    dressBranch(ctx, branch.pts, rng, { step: DENSE.branchStep, leaf, free: .3, flowerChance: DENSE.branchFlower, flowerGap: DENSE.flowerGap }).forEach(p => pieces.push({ ...p, delay: start + p.s / length * duration }));
    if (rng() < DENSE.cluster) {
      const at = length * between(rng, .45, .6), q = pointAt(branch.pts, at);
      clusterPieces(paintCluster(ctx, q.x, q.y, q.angle - side * 70, rng, { flowers: int(rng, 2, 3), buds: 1, scale: .62 }), at).forEach(p => pieces.push({ ...p, delay: start + at / length * duration + .1 }));
    }
    return branch.pts;
  };
  const Lp = pathLength(main.pts);
  let side = sign(rng);
  for (let s = between(rng, 45, 70); s < Lp - 40; s += between(rng, 55, 80)) {
    const b = pointAt(main.pts, s), length = between(rng, 105, 175), start = s / Ls * GROW, duration = .9;
    side = -side;
    const pts = grow(b.x, b.y, b.angle + side * between(rng, 38, 55), length, side, between(rng, .9, 1.4), 1.1, start, duration, 19);
    // Galhinho secundario saindo do terco inicial, para o outro lado, menor e mais fechado.
    if (rng() < DENSE.twig) {
      const at = length * between(rng, .22, .4), q = pointAt(pts, at), twig = between(rng, 55, 85);
      grow(q.x, q.y, q.angle - side * between(rng, 35, 50), twig, -side, between(rng, .8, 1.2), .8, start + at / length * duration, .6, 15);
    }
  }
  return { stems, pieces: sortPieces(pieces) };
}

function vineMarkup(seed: number, ctx: Palette) {
  const { stems, pieces } = growVine(seed, ctx);
  const t = (v: number) => `${v.toFixed(2)}s`;
  const masks = stems.map((stem, i) => `<mask id="${ctx.id}-m${i}"><path class="grow" d="${stem.d}" pathLength="1" fill="none" stroke="#fff" stroke-width="7" style="--grow-delay:${t(stem.delay)};--grow-duration:${t(stem.duration)}"/></mask>`).join('');
  const body = stems.map((stem, i) => `<g mask="url(#${ctx.id}-m${i})">${stem.svg}</g>`).join('') +
    pieces.map(p => `<g class="bloom is-${p.kind}" style="--grow-delay:${t(p.delay + .15)}">${p.svg}</g>`).join('');
  return `<defs>${ctx.defs()}${masks}</defs>${ctx.layer(body)}`;
}

export const OliveVine = ({ className = '', seed }: { className?: string; seed: number }) => {
  const id = cleanId(useId());
  const html = useMemo(() => vineMarkup(seed, new Palette(`ov${id}`, true, seed % 997)), [id, seed]);
  return <svg className={`wed-olive wed-olive-vine ${className}`} viewBox={`0 0 ${VINE_W} ${VINE_H}`} preserveAspectRatio="xMinYMid meet" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: html }} />;
};
