import type { ReactNode } from 'react';
import { ScrollReveal } from '../reveal/ScrollReveal';
import { FloralFrame } from '../decor/FloralFrame';
import { OliveCorner } from '../decor/Olive';

export interface StoryChapter { title: string; subtitle: string; photo: string; text: string; note?: string; doodle?: Doodle }
export interface Story { kicker: string; title: string; tagline: string; lead: string; cover: string; chapters: StoryChapter[]; closing: [string, string]; polaroids?: { photo: string; caption: string }[] }
type Doodle = 'camera' | 'signpost' | 'ring' | 'toast' | 'chapel';

// ---- Ilustracoes em traco (cores e espessura via CSS) ----------------------
const Heart = ({ className }: { className?: string }) => <svg className={className} viewBox="0 0 24 22" aria-hidden="true"><path d="M12 21 3.2 12.4a5.3 5.3 0 0 1 7.5-7.5L12 6.2l1.3-1.3a5.3 5.3 0 0 1 7.5 7.5z" /></svg>;

const doodles: Record<Doodle, ReactNode> = {
  camera: <svg viewBox="0 0 110 90" aria-hidden="true"><path d="M14 30h18l7-11h30l7 11h18a6 6 0 0 1 6 6v38a6 6 0 0 1-6 6H14a6 6 0 0 1-6-6V36a6 6 0 0 1 6-6z" /><circle cx="55" cy="54" r="18" /><circle cx="55" cy="54" r="11" /><circle cx="51" cy="50" r="3" className="fill" /><rect x="80" y="37" width="12" height="7" rx="2" /><path d="M18 37h10" /><path d="M8 40c-6 10-4 26 6 34" className="thin" /></svg>,
  signpost: <svg viewBox="0 0 150 160" aria-hidden="true"><path d="M75 12v138" /><path d="M71 12h8" />
    {[['Viagens', 24, 1], ['Planos', 50, -1], ['Vida', 76, 1], ['Nós', 102, -1]].map(([label, y, dir]) => { const right = dir === 1; const yy = Number(y); return <g key={String(label)}><path d={right ? `M40 ${yy}h66l10 9-10 9H40z` : `M110 ${yy}H44l-10 9 10 9h66z`} className="board" /><text x={right ? 75 : 74} y={yy + 13} textAnchor="middle">{String(label).toUpperCase()}</text></g>; })}
    <path d="M30 150c14-8 30-8 45-2 14-6 32-6 46 2" className="thin" /><path d="M52 150l4-10 3 10M92 150l3-8 4 8" className="thin" /></svg>,
  ring: <svg viewBox="0 0 90 100" aria-hidden="true"><ellipse cx="45" cy="64" rx="27" ry="27" /><ellipse cx="45" cy="64" rx="21" ry="21" className="thin" /><path d="M33 40l6-12h12l6 12-12 8z" className="gem" /><path d="M33 40h24M39 28l6 12 6-12M45 48V40" className="thin" /><path d="M66 18l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" className="spark" /></svg>,
  toast: <svg viewBox="0 0 110 100" aria-hidden="true"><g transform="rotate(-12 35 50)"><path d="M22 14h26c0 22-4 32-13 34-9-2-13-12-13-34z" /><path d="M24 26h22c-1 11-4 17-11 18-7-1-10-7-11-18z" className="wine" /><path d="M35 48v34M24 84h22" /></g><g transform="rotate(12 75 50)"><path d="M62 14h26c0 22-4 32-13 34-9-2-13-12-13-34z" /><path d="M64 26h22c-1 11-4 17-11 18-7-1-10-7-11-18z" className="wine" /><path d="M75 48v34M64 84h22" /></g><path d="M55 4l1.6 5 5 1.6-5 1.6L55 17l-1.6-4.8-5-1.6 5-1.6z" className="spark" /><path d="M10 96c20-6 70-6 90 0" className="thin" /></svg>,
  chapel: <svg viewBox="0 0 200 80" aria-hidden="true"><path d="M4 74c40-10 70-14 100-12s60 6 92 12" className="thin" /><path d="M86 64V36l14-12 14 12v28" /><path d="M100 24V10M95 15h10" /><path d="M95 64V52a5 5 0 0 1 10 0v12" /><path d="M114 64V44h22v20M114 44l11-9 11 9" /><circle cx="100" cy="40" r="3" className="thin" />
    {[[40, 60, 12], [56, 58, 9], [160, 60, 11], [176, 62, 8]].map(([x, y, r]) => <g key={`${x}`}><circle cx={x} cy={y - r} r={r} className="tree" /><path d={`M${x} ${y}v8`} className="thin" /></g>)}</svg>
};

// Borda de papel rasgado entre a capa e o corpo (pontos fixos: sem variar a cada render).
const TEAR = 'M0 34 L0 14 L0 13.4 L6 14.4 L17 9.4 L23 13.2 L31 15.3 L40 22.2 L49 7.8 L64 10.8 L73 9.1 L81 15.8 L93 13.5 L106 11.4 L122 16.3 L128 13.2 L139 9.4 L151 17.8 L163 14.8 L179 13.7 L193 15.5 L201 12.9 L212 5.3 L226 10.3 L241 9.8 L257 17.2 L267 12.6 L274 10.8 L285 14.9 L295 12.7 L308 14.2 L313 18.0 L328 12.9 L341 5.9 L348 6.4 L354 10.0 L370 11.9 L379 16.0 L396 13.7 L402 12.4 L409 9.2 L416 14.2 L433 17.6 L442 10.7 L456 12.3 L473 17.5 L487 11.3 L492 9.3 L506 18.6 L523 18.6 L530 11.0 L546 17.4 L561 9.8 L575 16.5 L590 12.3 L599 13.0 L606 14.2 L621 10.5 L634 12.5 L639 18.7 L655 13.3 L663 11.5 L675 11.6 L691 12.5 L707 13.2 L718 13.1 L725 9.0 L736 16.3 L747 14.6 L759 11.5 L770 14.6 L780 15.1 L794 13.5 L810 16.0 L818 14.6 L825 10.2 L833 9.7 L848 10.5 L855 17.8 L871 13.0 L886 10.6 L896 11.0 L901 14.5 L910 15.2 L927 16.9 L935 9.4 L941 13.2 L949 10.5 L963 11.5 L973 9.7 L988 9.8 L1000 14 L1000 34 Z';

const Landscape = () => <svg className="wed-story-landscape" viewBox="0 0 1000 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <path className="far" d="M0 98 C70 70 120 84 170 66 S270 52 330 74 S440 60 500 78 S610 50 680 70 S800 58 860 76 S950 66 1000 72 V150 H0Z" />
  <path className="mid" d="M0 118 C90 96 150 108 230 92 S360 104 430 96 S560 82 640 100 S780 92 850 104 S960 96 1000 102 V150 H0Z" />
  <path className="near" d="M0 136 C120 122 230 132 330 126 S520 120 620 130 S820 124 1000 132 V150 H0Z" />
  {[[60, 118, 14], [84, 122, 10], [910, 120, 13], [936, 124, 9], [960, 118, 15]].map(([x, y, r]) => <g key={x} className="tree"><circle cx={x} cy={y - r} r={r} /><path d={`M${x} ${y}v12`} /></g>)}
</svg>;

// Caminho tracejado entre capitulos: sai de um lado e chega ao outro, com coracao.
const Connector = ({ toRight }: { toRight: boolean }) => <ScrollReveal preset="fade" className={`wed-story-link ${toRight ? 'to-right' : 'to-left'}`} aria-hidden="true">
  <svg className="wed-story-path" viewBox="0 0 1000 100" preserveAspectRatio="none"><path d={toRight ? 'M300 0 C300 70, 640 30, 640 100' : 'M640 0 C640 70, 300 30, 300 100'} /></svg>
  <Heart className="wed-story-link-heart" />
</ScrollReveal>;

// Secao "Nossa historia" no estilo album de papel: capa com o casal, linha do
// tempo em zigue-zague com fotos circulares, notas manuscritas e desenhos.
export function OurStory({ story, finalDate }: { story: Story; finalDate: string }) {
  const chapters = story.chapters;
  return <section className="wed-sec wed-story" id="nossa-historia" aria-labelledby="wed-story-title">
    <header className="wed-story-hero">
      <img className="wed-story-cover" src={story.cover} alt="Stéfani e André de mãos dadas em um jardim" loading="lazy" decoding="async" />
      <ScrollReveal className="wed-story-heading" preset="fade" stagger>
        <span className="wed-story-kicker">{story.kicker}</span>
        <h2 id="wed-story-title" className="wed-story-title">{story.title}<svg className="wed-story-flourish" viewBox="0 0 150 50" aria-hidden="true"><path d="M2 40 C30 44 52 40 70 30 C84 22 80 6 70 10 C60 14 66 32 82 34 C100 36 120 30 148 18" /></svg></h2>
        <p className="wed-story-tagline">{story.tagline}</p>
        <div className="wed-story-rule" aria-hidden="true"><i /><Heart /><i /></div>
        <p className="wed-story-lead">{story.lead}</p>
      </ScrollReveal>
      <svg className="wed-story-tear" viewBox="0 0 1000 34" preserveAspectRatio="none" aria-hidden="true"><path d={TEAR} /></svg>
    </header>

    <div className="wed-story-body">
      <OliveCorner className="wed-story-corner left" seed={23} />
      <ol className="wed-story-timeline">
        {chapters.map((chapter, index) => {
          const right = index % 2 === 1;
          const number = String(index + 1).padStart(2, '0');
          const subtitle = chapter.subtitle || finalDate;
          return <li key={chapter.title} className={`wed-story-step${right ? ' is-right' : ''}`}>
            <div className="wed-story-chapter">
              <ScrollReveal className="wed-story-photo" preset="scale-soft">
                <img src={chapter.photo} alt={chapter.title} loading="lazy" decoding="async" width="260" height="260" />
                <FloralFrame seed={index * 97 + 31} aside={right && Boolean(chapter.note || chapter.doodle)} />
              </ScrollReveal>
              <ScrollReveal className="wed-story-text" delay={120}>
                <Heart className="wed-story-pin" />
                <span className="wed-story-number">{number}</span>
                <h3>{chapter.title}</h3>
                <p className="wed-story-date">{subtitle}</p>
                <p className="wed-story-copy">{chapter.text}</p>
              </ScrollReveal>
              {(chapter.note || chapter.doodle) && <ScrollReveal className="wed-story-aside" preset="fade" delay={260} aria-hidden="true">
                {chapter.doodle && <span className={`wed-story-doodle is-${chapter.doodle}`}>{doodles[chapter.doodle]}</span>}
                {chapter.note && <p className="wed-story-note">{chapter.note}</p>}
              </ScrollReveal>}
            </div>
            {index < chapters.length - 1 && <Connector toRight={!right} />}
          </li>;
        })}
      </ol>

      <footer className="wed-story-end">
        {story.polaroids?.map((polaroid, index) => <ScrollReveal key={polaroid.photo} as="figure" className={`wed-story-polaroid ${index ? 'is-right' : 'is-left'}`} preset={index ? 'fade-left' : 'fade-right'} delay={150}>
          <img src={polaroid.photo} alt={polaroid.caption} loading="lazy" decoding="async" width="220" height="260" /><figcaption>{polaroid.caption}</figcaption>
        </ScrollReveal>)}
        <ScrollReveal className="wed-story-closing" preset="fade" stagger>
          <p className="wed-story-closing-top">{story.closing[0]}</p>
          <div className="wed-story-rule" aria-hidden="true"><i /><Heart /><i /></div>
          <p className="wed-story-closing-bottom">{story.closing[1]}</p>
        </ScrollReveal>
      </footer>
      <OliveCorner className="wed-story-corner right" seed={58} />
      <Landscape />
    </div>
  </section>;
}
