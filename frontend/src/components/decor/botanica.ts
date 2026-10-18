// Botanica Aquarela: pintores das florzinhas de jasmim (petalas marfim pontudas,
// miolo dourado com estames e pontas ferrugem), botoes, folhas em aquarela e fios
// dourados. Cada pintor recebe so geometria e devolve markup SVG (string); todo
// sorteio vem de um rng com semente fixa, entao o desenho nao muda entre renders.

export type Point = [number, number];
export type Rng = () => number;

export const createRng = (seed: number): Rng => {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
export const between = (rng: Rng, min: number, max: number) => min + (max - min) * rng();
const int = (rng: Rng, min: number, max: number) => Math.floor(min + (max - min + 1) * rng());
const chance = (rng: Rng, p: number) => rng() < p;
const sign = (rng: Rng) => (rng() < .5 ? -1 : 1);

const D2R = Math.PI / 180;

export const COLORS = {
  paper: '#f8f5ec',
  petal050: '#fbf7ee', petal100: '#f1e6d0', petal200: '#e3cfaa', petalEdge: '#cbb085', petalTip: '#a5764a',
  heart300: '#e5bb5c', heart500: '#cf9f45', heart700: '#9a6b2c',
  leaf300: '#a5a681', leaf500: '#7e8360', leaf700: '#555c3d', leafVein: '#d6d5bd',
  stem: '#77724c', goldLight: '#c9ab78'
};
export const PARAMS = {
  flowerMin: 18, flowerMax: 28, tiltMin: .6, petalRatio: .25, budLength: 11, leafRatio: 1.6,
  clusterFlowersMax: 5, clusterBudsMax: 3, clusterRadius: 22, tendrilWidth: .8, displacement: 1.2
};

// ---- geometria --------------------------------------------------------------
const n = (v: number) => Math.round(v * 100) / 100;
const m = (p: Point) => `M${n(p[0])},${n(p[1])}`;
// Perfis de largura ao longo da forma (t = 0 na base, 1 na ponta).
const PROFILE = {
  petal: (t: number) => Math.pow(Math.sin(Math.PI * Math.pow(t, 1.16)), .9), // base estreita, ponta fina
  leaf: (t: number) => Math.pow(Math.sin(Math.PI * Math.pow(t, .8)), 1.1),   // eliptica, ponta acuminada
  bud: (t: number) => Math.pow(Math.sin(Math.PI * Math.pow(t, .68)), .72)    // gota alongada
};

// Catmull-Rom aberto -> segmentos cubicos (sem o M inicial). Extremos ficam pontudos.
function catmull(pts: Point[]) {
  let d = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += `C${n(p1[0] + (p2[0] - p0[0]) / 6)},${n(p1[1] + (p2[1] - p0[1]) / 6)} ${n(p2[0] - (p3[0] - p1[0]) / 6)},${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])},${n(p2[1])}`;
  }
  return d;
}

interface ShapeOptions { x0: number; length: number; width: number; bow?: number; skew?: number; profile: (t: number) => number; steps?: number }
// Forma alongada ao longo de +x: base em x0, nervura em arco (bow = flecha / comprimento).
function shape(o: ShapeOptions) {
  const N = o.steps || 12, top: Point[] = [], bottom: Point[] = [], mid: Point[] = [];
  const skew = o.skew || 0, bow = o.bow || 0;
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = o.x0 + o.length * t, y = 4 * bow * o.length * t * (1 - t);
    const slope = 4 * bow * (1 - 2 * t), l = Math.sqrt(1 + slope * slope), nx = -slope / l, ny = 1 / l;
    const w = o.width * o.profile(t);
    top.push([x - nx * w * (1 + skew), y - ny * w * (1 + skew)]);
    bottom.push([x + nx * w * (1 - skew), y + ny * w * (1 - skew)]);
    mid.push([x, y]);
  }
  const bottomRev = bottom.slice().reverse(), midRev = mid.slice().reverse();
  return {
    d: m(top[0]) + catmull(top) + catmull(bottomRev) + 'Z',
    top: m(top[0]) + catmull(top) + catmull(midRev) + 'Z',
    bottom: m(mid[0]) + catmull(mid) + catmull(bottomRev) + 'Z',
    vein: m(mid[0]) + catmull(mid.slice(0, Math.round(N * .9) + 1))
  };
}

// Linha suave pelos pontos (para mascaras e trajetos).
export const smoothPath = (pts: Point[]) => m(pts[0]) + catmull(pts);

// Caminhada com curvatura variavel: curvature(s, angulo) devolve graus por px.
export function walk(x: number, y: number, angle: number, length: number, step: number, curvature: (s: number, a: number) => number) {
  const pts: Point[] = [[x, y]]; let s = 0, a = angle;
  while (s < length - .01) {
    const ds = Math.min(step, length - s);
    a += curvature(s, a) * ds; x += Math.cos(a * D2R) * ds; y += Math.sin(a * D2R) * ds; s += ds;
    pts.push([x, y]);
  }
  return { pts, angle: a };
}
// Ondulacao suave (soma de senos) + mola que puxa o angulo de volta para 'target'.
export function wobble(rng: Rng, amp: number, freq: number, target: number, spring: number) {
  const f1 = freq * between(rng, .7, 1.3), f2 = freq * between(rng, 1.8, 2.6), p1 = between(rng, 0, 6.28), p2 = between(rng, 0, 6.28);
  return (s: number, a: number) => amp * (Math.sin(s * f1 + p1) + .45 * Math.sin(s * f2 + p2)) + spring * ((((target - a) % 360) + 540) % 360 - 180);
}
// Galho que fecha a curva ate virar espiral: a curvatura cresce com o comprimento,
// k(s) = lado * (k0 + k1 * (s/L)^p), somando 'turns' voltas no total.
export function spiralBranch(x: number, y: number, angle: number, length: number, side: number, turns: number) {
  const total = turns * 2 * Math.PI, k0 = .15, p = 2.6, k1 = (total - k0) * (p + 1);
  return walk(x, y, angle, length, 2.5, s => side * (k0 + k1 * Math.pow(s / length, p)) / length * 57.2958);
}
export function pathLength(pts: Point[]) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}
export function pointAt(pts: Point[], s: number) {
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (acc + d >= s || i === pts.length - 1) {
      const t = d ? Math.max(0, Math.min(1, (s - acc) / d)) : 0;
      return { x: a[0] + (b[0] - a[0]) * t, y: a[1] + (b[1] - a[1]) * t, angle: Math.atan2(b[1] - a[1], b[0] - a[0]) / D2R };
    }
    acc += d;
  }
  return { x: pts[0][0], y: pts[0][1], angle: 0 };
}
export function quad(p0: Point, c: Point, p1: Point, N: number) {
  const pts: Point[] = [];
  for (let i = 0; i <= N; i++) { const t = i / N, u = 1 - t; pts.push([u * u * p0[0] + 2 * u * t * c[0] + t * t * p1[0], u * u * p0[1] + 2 * u * t * c[1] + t * t * p1[1]]); }
  return pts;
}
// Interpola angulos (graus) pelo menor caminho.
export const blendAngle = (a: number, b: number, t: number) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;

// ---- contexto: ids unicos, degrades e filtro de aquarela ---------------------
export class Palette {
  constructor(public id: string, public watercolor = true, private seed = 1) {}
  url(k: string) { return `url(#${this.id}-${k})`; }
  stroke(r: number) { return n(Math.max(.4, Math.min(.9, r * .045))); }
  // Um filtro por camada, nunca por flor. A classe permite desligar no celular (CSS).
  layer(body: string) { return this.watercolor ? `<g class="ba-aq" filter="${this.url('aq')}">${body}</g>` : `<g>${body}</g>`; }
  defs() {
    const c = COLORS, id = this.id;
    const st = (o: number, color: string, op?: number) => `<stop offset="${o}" stop-color="${color}"${op != null && op < 1 ? ` stop-opacity="${op}"` : ''}/>`;
    const lin = (name: string, stops: string) => `<linearGradient id="${id}-${name}" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient>`;
    let s = '';
    // Petalas, da base a ponta: bege -> marfim -> marfim -> ponta ferrugem (3 intensidades).
    [0, .55, .95].forEach((f, i) => { s += lin(`pt${i}`, st(0, c.petal200) + st(.28, c.petal100) + st(.56, c.petal050) + st(.82, c.petal100) + st(1, f ? c.petalTip : c.petal200, f || 1)); });
    s += lin('bt', st(0, c.petal200) + st(.4, c.petal050) + st(.8, c.petal100) + st(1, c.petalTip, .85));
    s += lin('fl0', st(0, c.leaf300) + st(.55, c.leaf500) + st(1, c.leaf500));
    s += lin('fl1', st(0, c.leaf500) + st(.6, c.leaf500) + st(1, c.leaf700));
    s += lin('fl2', st(0, c.leaf300) + st(.45, c.leaf300) + st(1, c.leaf500));
    s += `<radialGradient id="${id}-gg">${st(0, c.heart300) + st(.45, c.heart300, .6) + st(1, c.heart300, 0)}</radialGradient>`;
    if (this.watercolor) {
      // Bordas levemente irregulares + granulacao suave da tinta (opacidade entre ~0,78 e 0,97).
      s += `<filter id="${id}-aq" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="${this.seed}" result="r"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="r" scale="${PARAMS.displacement}" xChannelSelector="R" yChannelSelector="G" result="d"/>` +
        `<feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="${this.seed + 7}" result="g"/>` +
        '<feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.45 1.1" result="mk"/>' +
        '<feComposite in="d" in2="mk" operator="in"/></filter>';
    }
    return s;
  }
}

// ---- pintores ---------------------------------------------------------------
// Caule afilado; 'start' (0-1) afina tambem a base, para nao terminar num corte reto.
export function paintStem(pts: Point[], w0: number, w1: number, color: string, start = 0) {
  const left: Point[] = [], right: Point[] = [], N = pts.length - 1;
  for (let i = 0; i <= N; i++) {
    const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.sqrt(dx * dx + dy * dy) || 1;
    const u = i / Math.max(1, N); let w = (w0 + (w1 - w0) * u) / 2;
    if (start && u < start) w *= .3 + .7 * Math.sin(u / start * Math.PI / 2);
    left.push([p[0] - dy / l * w, p[1] + dx / l * w]);
    right.push([p[0] + dy / l * w, p[1] - dx / l * w]);
  }
  return `<path d="${m(left[0]) + catmull(left)}L${n(right[N][0])},${n(right[N][1])}${catmull(right.slice().reverse())}Z" fill="${color}"/>`;
}

function paintHeart(ctx: Palette, r: number, rng: Rng) {
  const c = COLORS;
  let s = `<circle r="${n(r * .5)}" fill="${ctx.url('gg')}"/><circle r="${n(r * .15)}" fill="${c.heart500}"/>`;
  const k = int(rng, 6, 9), a0 = between(rng, 0, 6.28);
  for (let i = 0; i < k; i++) {
    const a = a0 + i * 6.2832 / k + between(rng, -.25, .25), rr = r * between(rng, .15, .22);
    const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
    s += `<path d="M0,0L${n(px)},${n(py)}" stroke="${c.heart500}" stroke-opacity=".85" stroke-width="${n(Math.max(.3, r * .028))}" stroke-linecap="round"/>`;
    s += `<circle cx="${n(px)}" cy="${n(py)}" r="${n(Math.max(.3, r * between(rng, .026, .04)))}" fill="${c.heart700}" fill-opacity=".85"/>`;
  }
  return s + `<circle cx="${n(-r * .035)}" cy="${n(-r * .045)}" r="${n(r * .035)}" fill="${c.petal050}" fill-opacity=".75"/>`;
}

// Flor aberta (jasmim / flor de laranjeira). r = metade do diametro; rotation alinha o achatamento.
export function paintFlower(ctx: Palette, x: number, y: number, r: number, rng: Rng, rotation?: number) {
  const c = COLORS, tr = ctx.stroke(r);
  const petals = chance(rng, .15) ? 6 : 5, spin = between(rng, 0, 360), tilt = between(rng, PARAMS.tiltMin, 1);
  const rot = rotation ?? between(rng, 0, 360), ratio = PARAMS.petalRatio, r0 = r * .08;
  let s = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)}) scale(1 ${n(tilt)})">`;
  for (let i = 0; i < petals; i++) {
    const a = spin + i * 360 / petals + between(rng, -8, 8);
    const L = r * between(rng, .88, 1.06), w = L * between(rng, ratio - .03, ratio + .03);
    const bow = between(rng, -.06, .06), skew = between(rng, -.14, .14);
    const f = shape({ x0: r0, length: L - r0, width: w, bow, skew, profile: PROFILE.petal });
    const fold = shape({ x0: r0, length: (L - r0) * .5, width: w * .3, bow: bow * .6, profile: PROFILE.petal, steps: 8 });
    // ~80% das petalas com a ponta ferrugem, em duas intensidades.
    const g = rng() < .2 ? 0 : (rng() < .55 ? 1 : 2);
    s += `<g transform="rotate(${n(a)})"><path d="${f.d}" fill="${ctx.url(`pt${g}`)}"/>` +
      // dobra: um lado da petala um pouco mais quente, como pigmento acumulado
      `<path d="${rng() < .5 ? f.top : f.bottom}" fill="${c.petal200}" fill-opacity="${n(between(rng, .2, .34))}"/>` +
      `<path d="${fold.d}" fill="${c.petal200}" fill-opacity=".3"/>` +
      `<path d="${f.vein}" fill="none" stroke="${c.petal200}" stroke-opacity=".55" stroke-width="${n(tr * .7)}" stroke-linecap="round"/>` +
      `<path d="${f.d}" fill="none" stroke="${c.petalEdge}" stroke-opacity=".45" stroke-width="${tr}" stroke-linejoin="round"/></g>`;
  }
  return s + paintHeart(ctx, r, rng) + '</g>';
}

// Botao: fechado (gota com torcao) ou abrindo (tres petalas em leque). Base em (x, y), aponta para angle.
export function paintBud(ctx: Palette, x: number, y: number, angle: number, length: number, rng: Rng, opening = chance(rng, .3)) {
  const c = COLORS, tr = ctx.stroke(length * .7);
  let s = `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})">`;
  if (opening) {
    for (const k of [-1, 1, 0]) {
      const L = length * between(rng, 1, 1.12) * (k ? .88 : 1);
      const p = shape({ x0: length * .12, length: L, width: L * .17, bow: .07 * k, skew: .15 * k, profile: PROFILE.petal });
      s += `<path transform="rotate(${n(k * 26 + between(rng, -4, 4))})" d="${p.d}" fill="${ctx.url('pt2')}" stroke="${c.petalEdge}" stroke-opacity=".5" stroke-width="${tr}" stroke-linejoin="round"/>`;
    }
  } else {
    const b = shape({ x0: length * .08, length: length * .92, width: length * between(rng, .19, .23), bow: between(rng, -.06, .06), skew: between(rng, -.12, .12), profile: PROFILE.bud });
    s += `<path d="${b.d}" fill="${ctx.url('bt')}" stroke="${c.petalEdge}" stroke-opacity=".6" stroke-width="${tr}" stroke-linejoin="round"/>`;
    s += `<path d="M${n(length * .24)},${n(length * .09)}Q${n(length * .56)},${n(-length * .11)} ${n(length * .92)},${n(length * .01)}" fill="none" stroke="${c.petal200}" stroke-width="${tr}" stroke-linecap="round"/>`;
  }
  // Tres sepalas verdes abracando a base.
  for (let k = -1; k <= 1; k++) {
    const sp = shape({ x0: 0, length: length * between(rng, .2, .27), width: length * .055, bow: -.08 * k, profile: PROFILE.leaf, steps: 8 });
    s += `<path transform="rotate(${n(k * 34 + between(rng, -6, 6))})" d="${sp.d}" fill="${c.leaf500}" fill-opacity=".9"/>`;
  }
  return s + '</g>';
}

// Folha em aquarela dos raminhos floridos. Base em (x, y), aponta para angle.
export function paintLeaf(ctx: Palette, x: number, y: number, angle: number, length: number, rng: Rng) {
  const c = COLORS, tr = ctx.stroke(length * .5);
  const f = shape({ x0: length * .08, length: length * .92, width: length * between(rng, .17, .22), bow: between(rng, -.07, .07), skew: between(rng, -.12, .12), profile: PROFILE.leaf, steps: 14 });
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(angle)})">` +
    `<path d="M0,0L${n(length * .1)},0" stroke="${c.stem}" stroke-width="${n(Math.max(.6, length * .03))}" stroke-linecap="round"/>` +
    `<path d="${f.d}" fill="${ctx.url(`fl${int(rng, 0, 2)}`)}" fill-opacity="${n(between(rng, .9, .98))}"/>` +
    `<path d="${rng() < .5 ? f.top : f.bottom}" fill="${c.leaf700}" fill-opacity="${n(between(rng, .2, .36))}"/>` +
    `<path d="${f.d}" fill="none" stroke="${c.leaf700}" stroke-opacity=".45" stroke-width="${tr}"/>` +
    `<path d="${f.vein}" fill="none" stroke="${c.leafVein}" stroke-opacity=".75" stroke-width="${n(Math.max(.5, length * .022))}" stroke-linecap="round"/></g>`;
}

// Fio dourado: curva longa em S que termina num caracol, com um pontinho na ponta.
export function tendrilPoints(x: number, y: number, angle: number, length: number, rng: Rng) {
  const side = sign(rng), force = between(rng, 11, 15), N = 64, ds = length / N, pts: Point[] = [[x, y]];
  let a = angle, px = x, py = y;
  for (let i = 1; i <= N; i++) {
    a += side * (-1.1 + force * Math.pow(i / N, 3)) / length * 57.2958 * ds;
    px += Math.cos(a * D2R) * ds; py += Math.sin(a * D2R) * ds; pts.push([px, py]);
  }
  return pts;
}
export function paintTendril(pts: Point[]) {
  const w = PARAMS.tendrilWidth, end = pts[pts.length - 1];
  return `<path d="${m(pts[0]) + catmull(pts)}" fill="none" stroke="${COLORS.goldLight}" stroke-width="${n(w)}" stroke-linecap="round"/>` +
    `<circle cx="${n(end[0])}" cy="${n(end[1])}" r="${n(w * 1.4)}" fill="${COLORS.goldLight}"/>`;
}

// ---- cacho ------------------------------------------------------------------
export interface Spot { x: number; y: number; r: number }
export interface Layers { stems: string[]; leaves: string[]; buds: string[]; flowers: { svg: string; r: number }[] }
export const emptyLayers = (): Layers => ({ stems: [], leaves: [], buds: [], flowers: [] });
export const mergeLayers = (into: Layers, from: Layers) => { into.stems.push(...from.stems); into.leaves.push(...from.leaves); into.buds.push(...from.buds); into.flowers.push(...from.flowers); return into; };
// Ordem de pintura: caules -> folhas -> botoes -> flores (as maiores por ultimo).
export const layersMarkup = (l: Layers) => l.stems.join('') + l.leaves.join('') + l.buds.join('') + l.flowers.slice().sort((a, b) => a.r - b.r).map(f => f.svg).join('');

interface ClusterOptions { flowers: number; buds: number; leaves?: number; scale?: number; stemColor?: string; taken?: Spot[]; allowed?: (x: number, y: number, r: number) => boolean }
// Flores em leque a +-55 graus, botoes mais para fora a +-70, folhas na base; pedicelos curvos.
export function paintCluster(ctx: Palette, x: number, y: number, angle: number, rng: Rng, o: ClusterOptions): Layers {
  const scale = o.scale || 1, stemColor = o.stemColor || COLORS.stem, radius = PARAMS.clusterRadius * scale;
  const taken = o.taken || [], allowed = o.allowed || (() => true);
  const items: (Spot & { a: number; length?: number })[] = [];
  const fits = (px: number, py: number, r: number) => allowed(px, py, r)
    && items.every(it => Math.hypot(it.x - px, it.y - py) >= (it.r + r) * .72)
    && taken.every(it => Math.hypot(it.x - px, it.y - py) >= (it.r + r) * .95);
  for (let i = 0; i < o.flowers; i++) for (let t = 0; t < 40; t++) {
    const a = angle + between(rng, -55, 55), dist = radius * between(rng, i ? .5 : .2, i ? .95 : .4);
    const r = scale * between(rng, PARAMS.flowerMin, PARAMS.flowerMax) / 2;
    const fx = x + Math.cos(a * D2R) * dist, fy = y + Math.sin(a * D2R) * dist;
    if (fits(fx, fy, r)) { items.push({ x: fx, y: fy, r, a }); break; }
  }
  for (let i = 0; i < o.buds; i++) for (let t = 0; t < 40; t++) {
    const a = angle + between(rng, -70, 70), dist = radius * between(rng, .9, 1.3);
    const bx = x + Math.cos(a * D2R) * dist, by = y + Math.sin(a * D2R) * dist, length = scale * PARAMS.budLength * between(rng, .75, 1.25);
    if (fits(bx, by, length * .5)) { items.push({ x: bx, y: by, r: length * .5, a, length }); break; }
  }
  const out = emptyLayers();
  for (let i = 0; i < (o.leaves || 0); i++) {
    const length = scale * between(rng, PARAMS.leafRatio * .9, PARAMS.leafRatio * 1.35) * (PARAMS.flowerMin + PARAMS.flowerMax) / 2;
    for (let t = 0; t < 14; t++) {
      const a = angle + 180 + (i % 2 ? 1 : -1) * between(rng, 50, 115);
      const px = x + Math.cos(a * D2R) * length, py = y + Math.sin(a * D2R) * length;
      if (allowed(px, py, 4) && allowed((x + px) / 2, (y + py) / 2, length * .2)) { out.leaves.push(paintLeaf(ctx, x, y, a, length, rng)); break; }
    }
  }
  items.forEach(it => {
    const cx = (x + it.x) / 2 + between(rng, -3, 3) * scale, cy = (y + it.y) / 2 + between(rng, -3, 3) * scale;
    out.stems.push(paintStem(quad([x, y], [cx, cy], [it.x, it.y], 8), 1.1 * scale, .6 * scale, stemColor));
    taken.push({ x: it.x, y: it.y, r: it.r });
  });
  items.forEach(it => { if (it.length) out.buds.push(paintBud(ctx, it.x, it.y, it.a + between(rng, -12, 12), it.length, rng)); });
  items.forEach(it => { if (!it.length) out.flowers.push({ svg: paintFlower(ctx, it.x, it.y, it.r, rng, it.a - 90 + between(rng, -20, 20)), r: it.r }); });
  return out;
}

// ---- galho vestido ----------------------------------------------------------
export interface Piece { kind: 'leaf' | 'stem' | 'bud' | 'flower'; svg: string; s: number; r: number }
interface DressOptions { step: number; leaf: number; free: number; flowerChance: number; flowerGap?: number; flowerScale?: number; allowed?: (x: number, y: number, r: number) => boolean }
// Folhas em aquarela alternadas ao longo do galho, diminuindo ate ~55% na ponta;
// flores e botoes pequenos em alguns nos, do lado oposto ao da folha. A ponta
// enrolada (a fracao 'free' final do comprimento) fica nua, como gavinha.
export function dressBranch(ctx: Palette, pts: Point[], rng: Rng, o: DressOptions): Piece[] {
  const L = pathLength(pts), pieces: Piece[] = [], allowed = o.allowed || (() => true), gap = o.flowerGap || 46;
  let side = sign(rng), last = -Infinity;
  for (let s = o.step * .7; s < L * (1 - o.free); s += o.step * between(rng, .8, 1.2)) {
    const q = pointAt(pts, s), t = s / L;
    side = -side;
    const length = o.leaf * between(rng, .8, 1.15) * (1 - .45 * t), angle = q.angle + side * between(rng, 35, 58);
    if (allowed(q.x + Math.cos(angle * D2R) * length, q.y + Math.sin(angle * D2R) * length, 0)) pieces.push({ kind: 'leaf', svg: paintLeaf(ctx, q.x, q.y, angle, length, rng), s, r: 0 });
    if (s - last > gap && chance(rng, o.flowerChance)) {
      const a = q.angle - side * between(rng, 35, 60), pc = between(rng, 5, 9);
      const fx = q.x + Math.cos(a * D2R) * pc, fy = q.y + Math.sin(a * D2R) * pc;
      const bud = chance(rng, .3), r = bud ? PARAMS.budLength * .35 : between(rng, 6, 9) * (o.flowerScale || 1);
      if (!allowed(fx, fy, r)) continue;
      last = s;
      pieces.push({ kind: 'stem', svg: paintStem(quad([q.x, q.y], [(q.x + fx) / 2, (q.y + fy) / 2 + 1], [fx, fy], 5), .8, .5, COLORS.stem), s, r: 0 });
      pieces.push(bud ? { kind: 'bud', svg: paintBud(ctx, fx, fy, a, PARAMS.budLength * between(rng, .6, .85), rng), s, r: 0 } : { kind: 'flower', svg: paintFlower(ctx, fx, fy, r, rng, a - 90), s, r });
    }
  }
  return pieces;
}
// Converte um cacho em pecas posicionadas em 's' (para a ordem e o atraso da animacao).
export const clusterPieces = (l: Layers, s: number): Piece[] => [
  ...l.stems.map(svg => ({ kind: 'stem' as const, svg, s, r: 0 })), ...l.leaves.map(svg => ({ kind: 'leaf' as const, svg, s, r: 0 })),
  ...l.buds.map(svg => ({ kind: 'bud' as const, svg, s, r: 0 })), ...l.flowers.map(f => ({ kind: 'flower' as const, svg: f.svg, s, r: f.r }))
];
// Ordem de pintura das pecas: pedicelos -> folhas -> botoes -> flores (as maiores por ultimo).
const ORDER = { stem: 0, leaf: 1, bud: 2, flower: 3 };
export const sortPieces = <T extends Piece>(pieces: T[]) => pieces.slice().sort((a, b) => ORDER[a.kind] - ORDER[b.kind] || a.r - b.r);
