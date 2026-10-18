import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';

// Ramos de oliveira do tema "Nossa historia", gerados de forma procedural: cada
// carregamento da pagina sorteia uma semente nova, entao os galhos nunca crescem
// do mesmo jeito. Dentro da mesma visita a forma fica estavel (semente por instancia).

type Point = [number, number];
type Rng = () => number;
// Gerador pseudoaleatorio pequeno e deterministico (mulberry32).
const createRng = (seed: number): Rng => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const between = (rng: Rng, min: number, max: number) => min + (max - min) * rng();
const newSeed = () => Math.floor(Math.random() * 2 ** 31);

// Curva suave (Catmull-Rom -> Bezier) por pontos de controle, com amostragem por
// comprimento para distribuir folhas e galhos ao longo dela.
function smoothCurve(points: Point[]) {
  const segments: Point[][] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i], p1 = points[i], p2 = points[i + 1], p3 = points[i + 2] || p2;
    segments.push([p1, [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6], p2]);
  }
  const at = (seg: Point[], t: number): Point => {
    const u = 1 - t;
    return [0, 1].map(i => u * u * u * seg[0][i] + 3 * u * u * t * seg[1][i] + 3 * u * t * t * seg[2][i] + t * t * t * seg[3][i]) as Point;
  };
  const samples: { x: number; y: number; s: number }[] = [];
  let length = 0; let previous = points[0];
  segments.forEach(seg => { for (let k = 0; k <= 24; k++) { const p = at(seg, k / 24); length += Math.hypot(p[0] - previous[0], p[1] - previous[1]); previous = p; samples.push({ x: p[0], y: p[1], s: length }); } });
  const sample = (s: number) => {
    const target = Math.max(0, Math.min(length, s));
    let i = samples.findIndex(point => point.s >= target); if (i < 1) i = 1;
    const a = samples[i - 1], b = samples[i];
    return { x: b.x, y: b.y, angle: Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI };
  };
  const d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}` + segments.map(seg => ` C${seg.slice(1).map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')}`).join('');
  return { d, length, sample };
}

interface Leaf { x: number; y: number; angle: number; size: number; tone: number; delay: number; fade?: number }
interface Stem { d: string; width: number; delay: number }
interface Plant { stems: Stem[]; leaves: Leaf[] }
// taper 'tip': folhas menores na ponta (ramos soltos); 'inner': crescem ate a ponta (guirlanda junto ao titulo).
interface BranchOptions { start: Point; angle: number; length: number; wander: number; leafSize: number; leafGap: number; width: number; depth: number; delay: number; timeScale: number; taper?: 'tip' | 'inner'; upward?: boolean }

// Folha de oliveira: lanceolada, estreita, com nervura central.
const LEAF_BODY = 'M0 0 C5 -3.4 15 -4.2 24 -.7 C25 -.3 25 .3 24 .7 C15 4.2 5 3.4 0 0 Z';
const LEAF_VEIN = 'M1.5 0 C8 -.5 16 -.5 22.5 0';

function growBranch(rng: Rng, plant: Plant, o: BranchOptions) {
  const rad = o.angle * Math.PI / 180;
  const end: Point = [o.start[0] + Math.cos(rad) * o.length, o.start[1] + Math.sin(rad) * o.length];
  // Pontos intermediarios desviados para os lados: o galho serpenteia de leve.
  const steps = Math.max(2, Math.round(o.length / 160) + 1);
  const points: Point[] = [o.start];
  for (let i = 1; i < steps; i++) {
    const t = i / steps; const off = between(rng, -o.wander, o.wander);
    points.push([o.start[0] + (end[0] - o.start[0]) * t - Math.sin(rad) * off, o.start[1] + (end[1] - o.start[1]) * t + Math.cos(rad) * off]);
  }
  points.push(end);
  const curve = smoothCurve(points);
  plant.stems.push({ d: curve.d, width: o.width, delay: o.delay });
  const timeAt = (s: number) => o.delay + (s / curve.length) * o.timeScale;
  // Folhas alternadas; maiores no meio, menores na ponta.
  let side = rng() < .5 ? 1 : -1;
  for (let s = between(rng, o.leafGap * .4, o.leafGap), gap = o.leafGap; s < curve.length - 6; s += gap * between(rng, .8, 1.2)) {
    const point = curve.sample(s); const t = s / curve.length;
    const taper = o.taper === 'inner' ? .6 + .5 * t : .7 + .55 * Math.sin(Math.PI * Math.min(1, t * 1.15)) - .25 * t;
    gap = o.taper === 'inner' ? o.leafGap * (1.25 - .45 * t) : o.leafGap;
    // upward (guirlandas dos titulos): folhas do lado de baixo ficam mais rentes ao caule, sem descer sobre o texto.
    const below = o.upward && side > 0;
    plant.leaves.push({ x: point.x, y: point.y, angle: point.angle + side * (below ? between(rng, 18, 30) : between(rng, 32, 58)), size: o.leafSize * taper * between(rng, .85, 1.12) * (below ? .8 : 1), tone: Math.floor(rng() * 3), delay: timeAt(s) + .15, fade: o.taper === 'inner' ? .45 + .55 * Math.min(1, t * 2.2) : undefined });
    side = -side;
  }
  const tip = curve.sample(curve.length);
  plant.leaves.push({ x: tip.x, y: tip.y, angle: tip.angle + between(rng, -12, 12), size: o.leafSize * (o.taper === 'inner' ? 1 : .8), tone: 0, delay: timeAt(curve.length) + .1 });
  // Galhos secundarios saindo do principal.
  if (o.depth > 0) {
    const count = Math.round(between(rng, 1, 2.6) * (o.length > 500 ? 2.4 : 1));
    for (let i = 0; i < count; i++) {
      // Na guirlanda os galhos saem longe do titulo para nao invadir o texto.
      const s = curve.length * (o.taper === 'inner' ? between(rng, .12, .55) : between(rng, .18, .82)); const point = curve.sample(s);
      growBranch(rng, plant, { ...o, start: [point.x, point.y], angle: point.angle + (o.upward || rng() < .5 ? -1 : 1) * between(rng, 28, 55), length: o.length * between(rng, .22, .42), wander: o.wander * .5, leafSize: o.leafSize * .9, width: o.width * .7, depth: o.depth - 1, delay: timeAt(s), timeScale: o.timeScale * .45, taper: 'tip' });
    }
  }
}

const Plant = ({ plant, animated }: { plant: Plant; animated?: boolean }) => <>
  {plant.stems.map((stem, i) => <path key={`s${i}`} className="stem" d={stem.d} pathLength={animated ? 1 : undefined} style={{ strokeWidth: stem.width, ...(animated && { '--grow-delay': `${stem.delay.toFixed(2)}s` }) } as CSSProperties} />)}
  {plant.leaves.map((leaf, i) => <g key={`l${i}`} transform={`translate(${leaf.x.toFixed(1)} ${leaf.y.toFixed(1)}) rotate(${leaf.angle.toFixed(0)}) scale(${(leaf.size / 24).toFixed(3)})`} opacity={leaf.fade?.toFixed(2)}>
    <g className={`leaf tone-${leaf.tone}`} style={animated ? { '--grow-delay': `${leaf.delay.toFixed(2)}s` } as CSSProperties : undefined}><path d={LEAF_BODY} /><path className="vein" d={LEAF_VEIN} /></g>
  </g>)}
</>;

// Raminho pequeno (cards e convite).
export const OliveSprig = ({ flip = false }: { flip?: boolean }) => {
  const [seed] = useState(newSeed);
  const plant = useMemo(() => { const p: Plant = { stems: [], leaves: [] }; growBranch(createRng(seed), p, { start: [3, 27], angle: -24, length: 44, wander: 3, leafSize: 13, leafGap: 8, width: 1.1, depth: 0, delay: 0, timeScale: 0 }); return p; }, [seed]);
  return <svg className="wed-olive wed-olive-sprig" width="48" height="32" viewBox="0 0 48 32" aria-hidden="true" style={flip ? { transform: 'scaleX(-1)' } : undefined}><Plant plant={plant} /></svg>;
};

// Guirlanda dos titulos: o galho atravessa todo o espaco ate a borda da secao
// (medido em pixels, entao as folhas mantem o tamanho em qualquer largura).
export const OliveGarland = ({ flip = false }: { flip?: boolean }) => {
  const ref = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState<[number, number]>([0, 0]);
  const [seed] = useState(newSeed);
  useLayoutEffect(() => {
    const node = ref.current; if (!node) return;
    const measure = () => { const box = node.getBoundingClientRect(); setSize(current => Math.abs(current[0] - box.width) < 2 && current[1] === Math.round(box.height) ? current : [Math.round(box.width), Math.round(box.height)]); };
    measure();
    const observer = new ResizeObserver(measure); observer.observe(node);
    return () => observer.disconnect();
  }, []);
  const [width, height] = size;
  const plant = useMemo(() => {
    const p: Plant = { stems: [], leaves: [] };
    if (width < 20) return p;
    const rng = createRng(seed);
    // Nasce na borda externa e termina subindo junto ao titulo.
    growBranch(rng, p, { start: [-4, height * between(rng, .6, .68)], angle: -between(rng, 2, 6), length: width - Math.min(22, height * .55), wander: Math.min(5, height * .14), leafSize: Math.min(23, height * .6), leafGap: 15, width: 1.3, depth: width > 200 ? 1 : 0, delay: 0, timeScale: 0, taper: 'inner', upward: true });
    return p;
  }, [seed, width, height]);
  return <svg ref={ref} className={`wed-olive wed-olive-garland${flip ? ' is-flip' : ''}`} viewBox={`0 0 ${Math.max(1, width)} ${Math.max(1, height)}`} aria-hidden="true"><Plant plant={plant} /></svg>;
};

// Ramo grande que cresce no fundo da landing (altura da tela). O caule e
// desenhado e as folhas brotam em sequencia (CSS, disparado por .is-paper).
export const OliveVine = ({ className = '' }: { className?: string }) => {
  const [seed] = useState(newSeed);
  const plant = useMemo(() => {
    const rng = createRng(seed); const p: Plant = { stems: [], leaves: [] };
    growBranch(rng, p, { start: [between(rng, 30, 70), 1010], angle: -90 + between(rng, -6, 6), length: 1040, wander: 34, leafSize: 42, leafGap: 27, width: 2.2, depth: 2, delay: 0, timeScale: 2.4 });
    // 1 a 2 galhos longos que avancam para dentro e passam por tras das secoes.
    for (let i = 0, n = rng() < .55 ? 1 : 2; i < n; i++) {
      const y = between(rng, 180, 820);
      growBranch(rng, p, { start: [between(rng, 40, 90), y], angle: between(rng, -22, 14), length: between(rng, 520, 900), wander: 46, leafSize: 36, leafGap: 30, width: 1.6, depth: 1, delay: .4 + (1000 - y) / 1000 * 1.6, timeScale: 2.2, taper: 'tip' });
    }
    return p;
  }, [seed]);
  return <svg className={`wed-olive wed-olive-vine ${className}`} viewBox="0 0 260 1000" preserveAspectRatio="xMinYMid meet" aria-hidden="true"><Plant plant={plant} animated /></svg>;
};
