// Igreja (Paroquia de Ivailandia) em traco fino, no estilo dos desenhos da
// "Nossa historia". Fica como marca d'agua no fundo de papel da landing.
// Degraus em meia-lua: cada um um pouco mais largo e curvo que o de cima.
const STEPS = [0, 1, 2, 3, 4, 5, 6].map(i => ({ y: 284 + i * 7, w: 66 + i * 20, r: 5 + i * 1.6 }));
const Window = ({ x }: { x: number }) => <g>
  <path d={`M${x} 248 V196 a8 8 0 0 1 16 0 V248 Z`} className="glass" />
  <path d={`M${x + 8} 190 V248 M${x} 212 h16 M${x} 228 h16`} className="thin" />
</g>;

export const ChurchSketch = ({ className = '' }: { className?: string }) => <svg className={`wed-church ${className}`} viewBox="0 0 400 350" aria-hidden="true">
  {/* chao e arvores */}
  <path className="thin" d="M8 338 C80 330 140 334 200 333 S330 330 392 338" />
  <g className="tree"><circle cx="34" cy="246" r="20" /><circle cx="52" cy="260" r="14" /><circle cx="20" cy="266" r="12" /><path d="M36 270 V300" /></g>
  <g className="tree"><circle cx="372" cy="258" r="15" /><circle cx="358" cy="270" r="10" /><path d="M370 282 V304" /></g>
  {/* corpo e telhados laterais */}
  <path d="M70 284 V170 H330 V284" />
  <path d="M52 172 L168 140 M348 172 L232 140" />
  <path d="M86 186 L168 166 M314 186 L232 166" className="thin" />
  <path d="M70 172 V284 M78 172 V284 M322 172 V284 M330 172 V284" className="thin" />
  <Window x={88} /><Window x={114} /><Window x={270} /><Window x={296} />
  {/* torre, lanterna e cruz */}
  <path d="M168 190 V86 H232 V190" />
  <path d="M160 86 H240" />
  <path d="M184 86 V64 H216 V86" />
  <path d="M180 64 L200 46 L220 64 Z" className="roof" />
  <path d="M200 46 V14 M189 24 H211" className="cross" />
  <path d="M186 58 c-6 -2 -9 2 -8 6 M214 58 c6 -2 9 2 8 6" className="thin" />
  <path d="M190 132 V112 a10 10 0 0 1 20 0 V132 Z" className="glass" />
  <path d="M190 118 h20 M190 123 h20 M190 128 h20" className="thin" />
  {/* alpendre e porta */}
  <path d="M132 214 L200 190 L268 214" />
  <path d="M138 214 H262" className="thin" />
  <path d="M146 214 V284 M254 214 V284" />
  <path d="M178 284 V236 H222 V284" className="door" />
  <path d="M200 236 V284" className="thin" />
  {/* corrimaos e escadaria em meia-lua */}
  <path d="M70 276 L132 252 M330 276 L268 252" className="thin" />
  {STEPS.map(({ y, w, r }) => <path key={y} d={`M${200 - w} ${y} A${w} ${r} 0 0 0 ${200 + w} ${y}`} className={y === 284 ? '' : 'thin'} />)}
</svg>;
