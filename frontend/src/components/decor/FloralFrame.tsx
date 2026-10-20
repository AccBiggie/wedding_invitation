import { useEffect, useId, useMemo, useState } from 'react';
import { COLORS, Palette, between, blendAngle, createRng, emptyLayers, layersMarkup, mergeLayers, paintCluster, paintLeaf, paintStem, paintTendril, pathLength, pointAt, tendrilPoints, walk, type Layers, type Point, type Spot } from './botanica';

// Raminhos floridos que abracam as fotos circulares (tema Botanica Aquarela): um
// entre 8 e 11 horas e outro entre 2 e 5, com folhas em aquarela alternadas, uma
// flor no meio do arco e um buque na ponta. Desenhado na escala de uma foto de
// 230 px; o SVG acompanha o tamanho real da foto pelo CSS (.wed-floral-frame).

const PHOTO = 230, MARGIN = 74, SIZE = PHOTO + MARGIN * 2, C = SIZE / 2;
const RING = PHOTO / 2 + 6;  // anel dourado externo (box-shadow da foto)
const STEM_R = RING + 8;     // caule a 8 px do anel
const LIMIT = RING - 3;      // nada (alem de pontas de folha) entra neste circulo
const D2R = Math.PI / 180;

// Areas proibidas em volta da foto (coordenadas relativas ao centro): texto ao lado e
// borda do card no desktop, texto embaixo no celular, notas manuscritas a esquerda
// nos capitulos da direita.
type Box = [number, number, number, number];
const BOXES = {
  side: [[138, -Infinity, Infinity, Infinity], [-Infinity, -Infinity, -150, Infinity]] as Box[],
  sideAside: [[138, -Infinity, Infinity, Infinity], [-Infinity, -100, -125, 100]] as Box[],
  // no celular, o caminho tracejado chega pelo topo, no centro
  stack: [[-Infinity, 109, Infinity, Infinity], [-12, -Infinity, 12, -118]] as Box[]
};

function sprig(ctx: Palette, rng: () => number, a0: number, a1: number, allowed: (x: number, y: number, r: number) => boolean, out: Layers, tendrils: string[], taken: Spot[]) {
  const N = 36, phase = between(rng, 0, 6.28);
  let pts: Point[] = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, a = (a0 + (a1 - a0) * t) * D2R, r = STEM_R + 2.4 * Math.sin(t * Math.PI * 1.6 + phase) + t * 5;
    pts.push([C + Math.cos(a) * r, C + Math.sin(a) * r]);
  }
  const dir = a1 > a0 ? 1 : -1, u = pts[N], pu = pts[N - 1];
  const ext = walk(u[0], u[1], Math.atan2(u[1] - pu[1], u[0] - pu[0]) / D2R - dir * 10, 10, 2, () => -dir * .8);
  pts = pts.concat(ext.pts.slice(1));
  out.stems.push(paintStem(pts, 1.9, .8, COLORS.stem, .16));
  const L = pathLength(pts);
  const radial = (q: { x: number; y: number }) => Math.atan2(q.y - C, q.x - C) / D2R;
  const tipOk = (x: number, y: number, ang: number, len: number) => {
    const tx = x + Math.cos(ang * D2R) * len, ty = y + Math.sin(ang * D2R) * len;
    return Math.hypot(tx - C, ty - C) > LIMIT && allowed(tx, ty, 4) && allowed((x + tx) / 2, (y + ty) / 2, len * .2);
  };
  // Seis folhas alternadas: as de fora maiores, apontando para fora; as de dentro quase tangentes.
  [.08, .2, .33, .46, .6, .72].forEach((tf, k) => {
    const q = pointAt(pts, L * (tf + between(rng, -.025, .025))), outward = k % 2 === 0;
    let ang = outward ? blendAngle(q.angle, radial(q), .55) : blendAngle(q.angle, radial(q) + 180, .22);
    let len = outward ? between(rng, 30, 40) : between(rng, 20, 26);
    if (!tipOk(q.x, q.y, ang, len)) { ang = blendAngle(q.angle, radial(q), .35); len = between(rng, 20, 26); }
    if (tipOk(q.x, q.y, ang, len)) out.leaves.push(paintLeaf(ctx, q.x, q.y, ang, len, rng));
  });
  // Uma ou duas flores e um botao a 40% do arco, virados para fora.
  const mid = pointAt(pts, L * .4);
  mergeLayers(out, paintCluster(ctx, mid.x, mid.y, blendAngle(mid.angle, radial(mid), .75), rng, { flowers: Math.floor(between(rng, 1, 3)), buds: 1, scale: 1.15, taken, allowed }));
  // Buque na ponta: 3 a 5 flores, 2 a 3 botoes e 2 folhas, abrindo para fora da foto.
  const end = pts[pts.length - 1], endQ = { x: end[0], y: end[1] };
  mergeLayers(out, paintCluster(ctx, end[0], end[1], blendAngle(ext.angle, radial(endQ), .5), rng, { flowers: Math.floor(between(rng, 3, 6)), buds: Math.floor(between(rng, 2, 4)), leaves: 2, scale: 1.3, taken, allowed }));
  // Fio dourado saindo de 50-60% do arco para fora, por tras das folhas.
  const g = pointAt(pts, L * between(rng, .5, .6));
  for (let t = 0; t < 6; t++) {
    const tp = tendrilPoints(g.x, g.y, radial(g) + between(rng, -25, 25), between(rng, 55, 75), rng);
    if (tp.every(p => Math.hypot(p[0] - C, p[1] - C) > LIMIT && allowed(p[0], p[1], 0))) { tendrils.push(paintTendril(tp)); break; }
  }
}

function frameMarkup(id: string, seed: number, layout: keyof typeof BOXES, watercolor: boolean) {
  const rng = createRng(seed), ctx = new Palette(id, watercolor, seed % 997);
  const boxes = BOXES[layout].map(([x0, y0, x1, y1]) => [x0 + C, y0 + C, x1 + C, y1 + C]);
  // Centros de flor fora da foto; nada encosta no texto nem passa da borda do SVG.
  const allowed = (x: number, y: number, r: number) => Math.hypot(x - C, y - C) > LIMIT + r * .6
    && x > r && y > r && x < SIZE - r && y < SIZE - r
    && boxes.every(([x0, y0, x1, y1]) => x + r < x0 || x - r > x1 || y + r < y0 || y - r > y1);
  const out = emptyLayers(), tendrils: string[] = [], taken: Spot[] = [];
  sprig(ctx, rng, 150, 246, allowed, out, tendrils, taken);
  // No celular o texto fica embaixo: o raminho da direita sobe (de 4 para 1 hora).
  if (layout === 'stack') sprig(ctx, rng, 30, -66, allowed, out, tendrils, taken);
  else sprig(ctx, rng, -30, 66, allowed, out, tendrils, taken);
  return `<defs>${ctx.defs()}</defs>${tendrils.join('')}${ctx.layer(layersMarkup(out))}`;
}

const STACK_QUERY = '(max-width: 820px)';
export const useStacked = () => {
  const [stacked, setStacked] = useState(() => typeof window !== 'undefined' && window.matchMedia(STACK_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(STACK_QUERY), update = () => setStacked(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return stacked;
};

export const FloralFrame = ({ seed, aside = false }: { seed: number; aside?: boolean }) => {
  const id = `ff${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const layout = useStacked() ? 'stack' : aside ? 'sideAside' : 'side';
  const html = useMemo(() => frameMarkup(id, seed, layout, true), [id, seed, layout]);
  return <svg className="wed-floral-frame" viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: html }} />;
};
