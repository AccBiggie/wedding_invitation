import { useEffect, useId, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { Box, Paper, Stack, Table, TableBody, TableCell, TableHead, TableRow, ToggleButton, ToggleButtonGroup, Tooltip, Typography } from '@mui/material';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import TableRowsRounded from '@mui/icons-material/TableRowsRounded';

// Cores dos graficos, derivadas do tema (rose e champanhe) e validadas com o validador de paletas
// (faixa de luminosidade, croma, separacao para daltonismo e contraste sobre o card branco).
export const VIZ = {
  rose: '#b4507a', // serie 1 (e unica cor quando so ha uma serie)
  gold: '#c4892a', // serie 2
  roseSoft: '#ebc3d3', // mesmo rose, mais claro: o "resto" de uma barra empilhada
  other: '#cdc3c7', // "Nao informado" / sem resposta
  track: '#f8eef2', // trilho atras das barras
  grid: '#f1e5ea', // linhas de grade
  axis: '#dbc9d0' // linha de base
};
// Cores de status (significam bom/ruim): sempre com icone e texto ao lado.
export const STATUS_COLORS = { good: '#2e7d53', warning: '#fab219', critical: '#b74445', neutral: VIZ.other };
// Texto dentro de um bloco colorido: branco nos escuros, quase preto nos claros.
export const INK = { light: '#ffffff', dark: '#2b1f24' };

export const formatNumber = (value: number) => value.toLocaleString('pt-BR');
const percent = (value: number, total: number) => total ? Math.round(value / total * 100) : 0;

// Conteudo do tooltip: o valor em destaque, o nome depois.
function Tip({ value, label, detail }: { value: string; label: string; detail?: string }) {
  return <Box sx={{ py: .25 }}>
    <Typography sx={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{value}</Typography>
    <Typography sx={{ fontSize: 12, opacity: .85 }}>{label}</Typography>
    {detail && <Typography sx={{ fontSize: 12, opacity: .7 }}>{detail}</Typography>}
  </Box>;
}
const tipProps = { arrow: true, placement: 'top' as const, slotProps: { tooltip: { sx: { bgcolor: '#3b2a32', borderRadius: 2, px: 1.25, py: .75, boxShadow: '0 8px 24px rgba(122, 44, 75, .25)' } }, arrow: { sx: { color: '#3b2a32' } } } };
// Marca com foco de teclado: mostra o mesmo tooltip do mouse.
const focusRing = { outline: 'none', '&:focus-visible': { boxShadow: '0 0 0 2px #fff, 0 0 0 4px #9e3f63' } };

export interface TableData { columns: string[]; rows: (string | number)[][] }

// Tabela equivalente ao grafico (acessivel e para conferir os numeros).
function DataTable({ columns, rows, label }: TableData & { label: string }) {
  return <Box sx={{ overflowX: 'auto' }}><Table size="small" aria-label={label}>
    <TableHead><TableRow>{columns.map((column, index) => <TableCell key={column} align={index ? 'right' : 'left'} sx={{ fontWeight: 600, color: 'text.secondary' }}>{column}</TableCell>)}</TableRow></TableHead>
    <TableBody>{rows.map(row => <TableRow key={String(row[0])}>{row.map((cell, index) => <TableCell key={index} align={index ? 'right' : 'left'} sx={{ fontVariantNumeric: 'tabular-nums' }}>{typeof cell === 'number' ? formatNumber(cell) : cell}</TableCell>)}</TableRow>)}</TableBody>
  </Table></Box>;
}

const segmented = {
  p: .25, gap: .25, borderRadius: 999, bgcolor: 'action.hover', alignSelf: 'flex-start',
  '& .MuiToggleButtonGroup-grouped': { border: 0, borderRadius: '999px !important', m: 0, px: 1, py: .25, color: 'text.secondary' },
  '& .MuiToggleButtonGroup-grouped.Mui-selected, & .MuiToggleButtonGroup-grouped.Mui-selected:hover': { bgcolor: 'background.paper', color: 'primary.main', boxShadow: '0 1px 3px rgba(122, 44, 75, .16)' }
};

// Card de grafico: titulo, subtitulo e a troca entre grafico e tabela.
export function ChartCard({ title, subtitle, table, children }: { title: string; subtitle?: string; table: TableData; children: ReactNode }) {
  const [view, setView] = useState<'chart' | 'table'>('chart');
  return <Paper variant="outlined" component="section" aria-label={title} sx={{ p: { xs: 2, md: 2.5 }, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
    <Stack direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography component="h2" sx={{ fontWeight: 700, fontSize: 16 }}>{title}</Typography>
        {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
      </Box>
      <ToggleButtonGroup size="small" exclusive value={view} onChange={(_, value) => value && setView(value)} aria-label={`Exibir ${title.toLowerCase()} como`} sx={segmented}>
        <ToggleButton value="chart" aria-label="Gráfico"><BarChartRounded sx={{ fontSize: 18 }} /></ToggleButton>
        <ToggleButton value="table" aria-label="Tabela"><TableRowsRounded sx={{ fontSize: 18 }} /></ToggleButton>
      </ToggleButtonGroup>
    </Stack>
    {view === 'chart' ? children : <DataTable {...table} label={title} />}
  </Paper>;
}

export function EmptyChart({ text = 'Ainda não há dados para mostrar.' }: { text?: string }) {
  return <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary', fontSize: 14, borderRadius: 2, bgcolor: VIZ.track }}>{text}</Box>;
}

export interface LegendItem { label: string; color: string; icon?: ReactNode }
export function Legend({ items }: { items: LegendItem[] }) {
  return <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: 'wrap' }} component="ul" aria-label="Legenda" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
    {items.map(item => <Box component="li" key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: .75, fontSize: 13, color: 'text.secondary' }}>
      {item.icon || <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: item.color, flex: 'none' }} />}
      {item.label}
    </Box>)}
  </Stack>;
}

export interface Part { key: string; label: string; value: number; color: string; ink?: string; detail?: string; icon?: ReactNode }

// Ordem fixa das cores de categorias no donut (validada com o validador de paletas, incluindo o
// par que fecha o circulo). A cor segue a categoria, nunca a posicao: filtrar nao repinta ninguem.
// Ordem: rose, azul, dourado, verde, violeta, laranja (todos os pares vizinhos passam, inclusive o que fecha o circulo).
export const CATEGORY_COLORS = ['#b4507a', '#2a78d6', '#c4892a', '#1d7f56', '#7b5cd6', '#eb6834'];

// Donut fino com espaco de 2px entre as fatias. O centro mostra o total ou a fatia sob o ponteiro/foco;
// a legenda ao lado traz nome, numero e porcentagem e acende a fatia correspondente.
export function DonutChart({ parts, label, centerLabel, unit, stacked }: { parts: Part[]; label: string; centerLabel: string; unit: [string, string]; stacked?: boolean }) {
  const [active, setActive] = useState<string | null>(null);
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (!total) return <EmptyChart />;
  const size = 184, ring = 32, outer = size / 2 - 1, inner = outer - ring, center = size / 2;
  const point = (radius: number, degrees: number) => {
    const radians = degrees * Math.PI / 180;
    return `${(center + radius * Math.cos(radians)).toFixed(3)} ${(center + radius * Math.sin(radians)).toFixed(3)}`;
  };
  let angle = -90;
  const arcs = parts.filter(part => part.value > 0).map(part => {
    const sweep = part.value / total * 360;
    const arc = { part, start: angle, end: angle + sweep, sweep };
    angle += sweep;
    return arc;
  });
  const current = parts.find(part => part.key === active);
  const unitOf = (value: number) => value === 1 ? unit[0] : unit[1];
  const describe = (part: Part) => `${part.label}: ${formatNumber(part.value)} ${unitOf(part.value)} (${percent(part.value, total)}%)${part.detail ? `, ${part.detail}` : ''}`;
  const dim = (key: string) => active && active !== key ? .3 : 1;
  return <Stack direction={stacked ? 'column' : { xs: 'column', sm: 'row' }} spacing={stacked ? 2 : 3} sx={{ alignItems: 'center' }}>
    <Box sx={{ position: 'relative', width: size, height: size, flex: 'none' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="group" aria-label={label} style={{ display: 'block', overflow: 'visible' }}>
        {arcs.map(({ part, start, end, sweep }) => {
          const events = { tabIndex: 0, role: 'img', 'aria-label': describe(part), onMouseEnter: () => setActive(part.key), onMouseLeave: () => setActive(null), onFocus: () => setActive(part.key), onBlur: () => setActive(null), style: { opacity: dim(part.key), transition: 'opacity .15s', outline: 'none', cursor: 'default' } };
          // Fatia unica: anel inteiro (um arco de 360 graus nao se desenha).
          if (sweep >= 359.99) return <circle key={part.key} cx={center} cy={center} r={(outer + inner) / 2} fill="none" stroke={part.color} strokeWidth={ring} {...events} />;
          const large = sweep > 180 ? 1 : 0;
          const d = `M ${point(outer, start)} A ${outer} ${outer} 0 ${large} 1 ${point(outer, end)} L ${point(inner, end)} A ${inner} ${inner} 0 ${large} 0 ${point(inner, start)} Z`;
          return <path key={part.key} d={d} fill={part.color} stroke="#fff" strokeWidth={2} strokeLinejoin="round" {...events} />;
        })}
      </svg>
      <Box aria-hidden sx={{ position: 'absolute', inset: ring + 8, borderRadius: '50%', display: 'grid', placeItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>
        <Box>
          <Typography sx={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>{formatNumber(current ? current.value : total)}</Typography>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.25, px: .5 }}>{current ? `${current.label} · ${percent(current.value, total)}%` : centerLabel}</Typography>
          {current?.detail && <Typography sx={{ fontSize: 11, color: 'text.secondary', lineHeight: 1.25 }}>{current.detail}</Typography>}
        </Box>
      </Box>
    </Box>
    <Box component="ul" aria-label={`Legenda: ${label}`} sx={{ listStyle: 'none', m: 0, p: 0, flex: 1, width: '100%', minWidth: 0 }}>
      {parts.map(part => <Box component="li" key={part.key} onMouseEnter={() => part.value && setActive(part.key)} onMouseLeave={() => setActive(null)}
        sx={{ display: 'flex', alignItems: 'center', gap: 1, py: .75, px: 1, mx: -1, borderRadius: 2, opacity: part.value ? dim(part.key) : .55, transition: 'opacity .15s, background-color .15s', bgcolor: active === part.key ? 'action.hover' : 'transparent' }}>
        {part.icon || <Box aria-hidden sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: part.color, flex: 'none' }} />}
        <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>{part.label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{formatNumber(part.value)}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ width: 40, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{percent(part.value, total)}%</Typography>
      </Box>)}
    </Box>
  </Stack>;
}

// Uma barra dividida em partes (um todo). tall: 28px com a porcentagem dentro de cada bloco
// (so quando cabe); fina: 8px sem texto, para ficar acima de uma lista que ja traz os numeros.
export function SegmentedBar({ parts, label, tall = true }: { parts: Part[]; label: string; tall?: boolean }) {
  const total = parts.reduce((sum, part) => sum + part.value, 0);
  if (!total) return <EmptyChart />;
  const visible = parts.filter(part => part.value > 0);
  return <Box role="group" aria-label={label} sx={{ display: 'flex', gap: '2px', height: tall ? 28 : 8 }}>
    {visible.map(part => {
      const share = percent(part.value, total);
      return <Tooltip key={part.key} {...tipProps} title={<Tip value={`${formatNumber(part.value)} · ${share}%`} label={part.label} detail={part.detail} />}>
        <Box tabIndex={0} aria-label={`${part.label}: ${formatNumber(part.value)} (${share}%)`}
          sx={{ flex: `${part.value} 1 0`, minWidth: 6, bgcolor: part.color, color: part.ink || INK.light, borderRadius: tall ? '4px' : 999, display: 'flex', alignItems: 'center', px: 1, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', cursor: 'default', transition: 'filter .15s', '&:hover': { filter: 'brightness(1.08)' }, ...focusRing }}>
          {tall && share >= 14 ? `${share}%` : null}
        </Box>
      </Tooltip>;
    })}
  </Box>;
}

export interface BarRow { key: string; label: string; value: number; detail?: string }
// Barras horizontais em ordem, uma cor so: nome e numero em cima, barra embaixo sobre um trilho.
export function BarList({ rows, label, color = VIZ.rose, unit }: { rows: BarRow[]; label: string; color?: string; unit: [string, string] }) {
  const max = Math.max(0, ...rows.map(row => row.value));
  if (!max) return <EmptyChart />;
  return <Stack component="ul" spacing={1.5} aria-label={label} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
    {rows.map(row => <Box component="li" key={row.key}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: .5 }}>
        <Typography variant="body2" sx={{ minWidth: 0 }} noWrap>{row.label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{formatNumber(row.value)}{row.detail && <Box component="span" sx={{ color: 'text.secondary', fontWeight: 400 }}> · {row.detail}</Box>}</Typography>
      </Box>
      <Box sx={{ height: 10, borderRadius: '0 4px 4px 0', bgcolor: VIZ.track }}>
        <Tooltip {...tipProps} title={<Tip value={`${formatNumber(row.value)} ${row.value === 1 ? unit[0] : unit[1]}`} label={row.label} detail={row.detail} />}>
          <Box tabIndex={0} aria-label={`${row.label}: ${formatNumber(row.value)} ${row.value === 1 ? unit[0] : unit[1]}`}
            sx={{ height: '100%', width: `${row.value / max * 100}%`, minWidth: row.value ? 4 : 0, bgcolor: color, borderRadius: '0 4px 4px 0', transition: 'width .4s ease, filter .15s', '&:hover': { filter: 'brightness(1.1)' }, ...focusRing }} />
        </Tooltip>
      </Box>
    </Box>)}
  </Stack>;
}

export interface StackRow { key: string; label: string; done: number; total: number }
// Barras horizontais empilhadas: confirmados (rose) + demais (rose claro), escala pelo maior total.
export function StackedBarList({ rows, label, doneLabel, restLabel }: { rows: StackRow[]; label: string; doneLabel: string; restLabel: string }) {
  const max = Math.max(0, ...rows.map(row => row.total));
  if (!max) return <EmptyChart />;
  return <Stack spacing={2}>
    <Legend items={[{ label: doneLabel, color: VIZ.rose }, { label: restLabel, color: VIZ.roseSoft }]} />
    <Stack component="ul" spacing={1.5} aria-label={label} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {rows.map(row => {
        const rest = row.total - row.done;
        return <Box component="li" key={row.key}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1, mb: .5 }}>
            <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>{row.label}</Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}><b>{formatNumber(row.done)}</b><Box component="span" sx={{ color: 'text.secondary' }}> de {formatNumber(row.total)}</Box></Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: '2px', height: 10, width: `${row.total / max * 100}%`, minWidth: row.total ? 6 : 0 }}>
            {[[row.done, VIZ.rose, doneLabel], [rest, VIZ.roseSoft, restLabel]].filter(([value]) => Number(value) > 0).map(([value, color, name], index, list) =>
              <Tooltip key={String(name)} {...tipProps} title={<Tip value={formatNumber(Number(value))} label={`${row.label} · ${name}`} />}>
                <Box tabIndex={0} aria-label={`${row.label}, ${name}: ${formatNumber(Number(value))}`}
                  sx={{ flex: `${value} 1 0`, minWidth: 4, bgcolor: String(color), borderRadius: index === list.length - 1 ? '0 4px 4px 0' : 0, '&:hover': { filter: 'brightness(1.08)' }, ...focusRing }} />
              </Tooltip>)}
          </Box>
        </Box>;
      })}
    </Stack>
  </Stack>;
}

// Marcas redondas no eixo: 0, 5, 10... ate passar do maior valor.
function niceTicks(max: number, count = 4) {
  if (max <= 0) return [0, 1];
  const raw = max / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map(factor => factor * power).find(value => value >= raw) || raw;
  const whole = Math.max(1, Math.ceil(step));
  const ticks = [];
  for (let value = 0; value < max + whole; value += whole) { ticks.push(value); if (value >= max) break; }
  return ticks;
}

export interface Column { key: string; label: string; done: number; total: number; detail?: string }
// Colunas empilhadas (confirmados embaixo, demais em cima) com grade fina e o total no topo de cada coluna.
export function ColumnChart({ columns, label, doneLabel, restLabel }: { columns: Column[]; label: string; doneLabel: string; restLabel: string }) {
  const max = Math.max(0, ...columns.map(column => column.total));
  if (!max) return <EmptyChart />;
  const ticks = niceTicks(max);
  const top = ticks[ticks.length - 1];
  const plot = 180;
  return <Stack spacing={2}>
    <Legend items={[{ label: doneLabel, color: VIZ.rose }, { label: restLabel, color: VIZ.roseSoft }]} />
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Box aria-hidden sx={{ position: 'relative', width: 28, height: plot, flex: 'none' }}>
        {ticks.map(tick => <Typography key={tick} sx={{ position: 'absolute', right: 0, bottom: `${tick / top * 100}%`, transform: 'translateY(50%)', fontSize: 11, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>{tick}</Typography>)}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0, overflowX: 'auto', pt: 1 }}>
        <Box sx={{ minWidth: columns.length * 34 }}>
          <Box role="group" aria-label={label} sx={{ position: 'relative', height: plot, display: 'flex', alignItems: 'flex-end', borderBottom: 1, borderColor: VIZ.axis }}>
            {ticks.slice(1).map(tick => <Box key={tick} aria-hidden sx={{ position: 'absolute', left: 0, right: 0, bottom: `${tick / top * 100}%`, borderTop: 1, borderColor: VIZ.grid }} />)}
            {columns.map(column => {
              const rest = column.total - column.done;
              return <Box key={column.key} sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' }}>
                <Typography sx={{ fontSize: 11, fontWeight: 600, color: 'text.secondary', mb: .25, fontVariantNumeric: 'tabular-nums' }}>{column.total}</Typography>
                <Tooltip {...tipProps} title={<Tip value={`${formatNumber(column.total)} ${column.total === 1 ? 'pessoa' : 'pessoas'}`} label={column.label} detail={`${formatNumber(column.done)} ${doneLabel.toLowerCase()}${column.detail ? ` · ${column.detail}` : ''}`} />}>
                  <Box tabIndex={0} aria-label={`${column.label}: ${formatNumber(column.total)} pessoas, ${formatNumber(column.done)} ${doneLabel.toLowerCase()}`}
                    sx={{ width: '60%', maxWidth: 24, height: `${column.total / top * 100}%`, display: 'flex', flexDirection: 'column', gap: '2px', cursor: 'default', '&:hover > *': { filter: 'brightness(1.08)' }, ...focusRing }}>
                    {rest > 0 && <Box sx={{ flex: `${rest} 1 0`, bgcolor: VIZ.roseSoft, borderRadius: '4px 4px 0 0' }} />}
                    {column.done > 0 && <Box sx={{ flex: `${column.done} 1 0`, bgcolor: VIZ.rose, borderRadius: rest > 0 ? 0 : '4px 4px 0 0' }} />}
                  </Box>
                </Tooltip>
              </Box>;
            })}
          </Box>
          <Box aria-hidden sx={{ display: 'flex', mt: .75 }}>
            {columns.map(column => <Typography key={column.key} noWrap sx={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 11, color: 'text.secondary', px: .25 }}>{column.label}</Typography>)}
          </Box>
        </Box>
      </Box>
    </Box>
  </Stack>;
}

// Largura do elemento (o SVG da linha redesenha ao mudar o tamanho do card).
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export interface LineSeries { key: string; label: string; color: string; values: number[] }
const shortDate = (day: string) => day.slice(8, 10) + '/' + day.slice(5, 7);
const longDate = (day: string) => day.split('-').reverse().join('/');

// Linhas no tempo (mesma unidade, um eixo so): mira vertical que acompanha o ponteiro e o teclado,
// tooltip com todas as series, ponto e numero no fim de cada linha.
export function LineChart({ days, series, label }: { days: string[]; series: LineSeries[]; label: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const titleId = useId();
  if (!days.length) return <EmptyChart />;
  const height = 240, left = 36, right = 56, topPad = 12, bottom = 26;
  const plotWidth = Math.max(10, width - left - right), plotHeight = height - topPad - bottom;
  const ticks = niceTicks(Math.max(...series.flatMap(item => item.values)));
  const top = ticks[ticks.length - 1];
  const x = (index: number) => left + (days.length === 1 ? plotWidth / 2 : index / (days.length - 1) * plotWidth);
  const y = (value: number) => topPad + plotHeight - value / top * plotHeight;
  const xTicks = days.length <= 6 ? days.map((_, index) => index) : Array.from({ length: 5 }, (_, step) => Math.round(step * (days.length - 1) / 4));
  const last = days.length - 1;
  // Numeros no fim das linhas so quando nao se encostam (senao ficam a legenda e o tooltip).
  const ends = series.map(item => y(item.values[last]));
  const endLabels = ends.every((value, index) => ends.every((other, j) => j === index || Math.abs(value - other) >= 14));
  const pick = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const position = (event.clientX - box.left - left) / plotWidth;
    setActive(Math.min(last, Math.max(0, Math.round(position * last))));
  };
  const keys = (event: KeyboardEvent<SVGSVGElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setActive(current => Math.min(last, Math.max(0, (current ?? last) + (event.key === 'ArrowRight' ? 1 : -1))));
  };
  const tipLeft = active === null ? 0 : Math.min(Math.max(x(active) - 80, 0), Math.max(0, width - 170));
  return <Stack spacing={2}>
    <Legend items={series.map(item => ({ label: item.label, color: item.color, icon: <Box aria-hidden sx={{ width: 14, height: 2, borderRadius: 1, bgcolor: item.color }} /> }))} />
    <Box ref={ref} sx={{ position: 'relative', width: '100%', height }}>
      {width > 0 && <svg width={width} height={height} role="img" aria-labelledby={titleId} tabIndex={0} onPointerMove={pick} onPointerLeave={() => setActive(null)} onKeyDown={keys} onFocus={() => setActive(current => current ?? last)} onBlur={() => setActive(null)} style={{ display: 'block', outline: 'none', touchAction: 'pan-y' }}>
        <title id={titleId}>{`${label}. ${series.map(item => `${item.label}: ${formatNumber(item.values[last])}`).join('; ')} em ${longDate(days[last])}. Use as setas para percorrer os dias.`}</title>
        {ticks.map(tick => <g key={tick}>
          <line x1={left} x2={left + plotWidth} y1={y(tick)} y2={y(tick)} stroke={tick ? VIZ.grid : VIZ.axis} strokeWidth={1} />
          <text x={left - 8} y={y(tick)} dy="0.32em" textAnchor="end" fontSize={11} fill="#6b726d" style={{ fontVariantNumeric: 'tabular-nums' }}>{tick}</text>
        </g>)}
        {xTicks.map(index => <text key={index} x={x(index)} y={height - 6} textAnchor={index === 0 && days.length > 1 ? 'start' : index === last && days.length > 1 ? 'end' : 'middle'} fontSize={11} fill="#6b726d">{shortDate(days[index])}</text>)}
        {series.map(item => <path key={item.key} d={item.values.map((value, index) => `${index ? 'L' : 'M'}${x(index)},${y(value)}`).join(' ')} fill="none" stroke={item.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
        {series.map(item => <g key={item.key}>
          <circle cx={x(last)} cy={y(item.values[last])} r={4} fill={item.color} stroke="#fff" strokeWidth={2} />
          {endLabels && <text x={x(last) + 8} y={y(item.values[last])} dy="0.32em" fontSize={12} fontWeight={700} fill="#3b2a32">{formatNumber(item.values[last])}</text>}
        </g>)}
        {active !== null && <g aria-hidden>
          <line x1={x(active)} x2={x(active)} y1={topPad} y2={topPad + plotHeight} stroke="#9aa39d" strokeWidth={1} />
          {series.map(item => <circle key={item.key} cx={x(active)} cy={y(item.values[active])} r={4.5} fill={item.color} stroke="#fff" strokeWidth={2} />)}
        </g>}
        <rect x={left} y={topPad} width={plotWidth} height={plotHeight} fill="transparent" />
      </svg>}
      {active !== null && <Box aria-hidden sx={{ position: 'absolute', top: 0, left: tipLeft, width: 170, pointerEvents: 'none', bgcolor: '#3b2a32', color: '#fff', borderRadius: 2, px: 1.25, py: 1, boxShadow: '0 8px 24px rgba(122, 44, 75, .25)' }}>
        <Typography sx={{ fontSize: 12, opacity: .8, mb: .5 }}>{longDate(days[active])}</Typography>
        {series.map(item => <Box key={item.key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 2, borderRadius: 1, bgcolor: item.color, flex: 'none' }} />
          <Typography sx={{ fontSize: 14, fontWeight: 700 }}>{formatNumber(item.values[active])}</Typography>
          <Typography sx={{ fontSize: 12, opacity: .8 }} noWrap>{item.label}</Typography>
        </Box>)}
      </Box>}
    </Box>
  </Stack>;
}

// Numero de destaque com rotulo e uma linha de apoio.
export function StatTile({ label, value, hint, icon }: { label: string; value: number | string; hint?: string; icon?: ReactNode }) {
  return <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, display: 'flex', gap: 1.5, alignItems: 'flex-start', minWidth: 0 }}>
    {icon && <Box aria-hidden sx={{ width: 36, height: 36, borderRadius: 2, display: 'grid', placeItems: 'center', bgcolor: '#f6e8ee', color: '#9e3f63', flex: 'none' }}>{icon}</Box>}
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.3 }}>{label}</Typography>
      <Typography sx={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{typeof value === 'number' ? formatNumber(value) : value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Box>
  </Paper>;
}
