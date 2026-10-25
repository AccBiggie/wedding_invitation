import { useId, useState, type ComponentType, type KeyboardEvent, type ReactNode } from 'react';
import { ScrollReveal } from '../reveal/ScrollReveal';
import './cerimonia.css';

// Bloco "Cerimônia" no layout 2 (Linha do tempo) do componente Cerimonia do design
// system: mesma marcação e classes de cerimonia.js. Ordem fixa: data, horário,
// local da celebração e local da festa; a celebração vem antes em todo o bloco.

export interface Place { name: string; address: string; query: string; time: string }
export interface CeremonyData { datetime: string; time: string; celebration: Place; party: Place }

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const WEEKDAYS = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const ICONS = {
  celebracao: <path d="M12 3v4M10 5h4M7 21V11l5-4 5 4v10M7 21h10M10 21v-4a2 2 0 0 1 4 0v4" />,
  festa: <path d="M8 4h4l-.5 6a1.5 1.5 0 0 1-3 0zM10 11v8M8 19h4M14 6h4l-.5 5a1.5 1.5 0 0 1-3 0zM16 12v7M14 19h4" />,
  seta: <path d="M7 17 17 7M9 7h8v8" />
};
const Icon = ({ name }: { name: keyof typeof ICONS }) => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>;

const googleMaps = (place: Place) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.query)}`;
const waze = (place: Place) => `https://waze.com/ul?q=${encodeURIComponent(place.query)}`;
const embed = (place: Place) => `https://www.google.com/maps?q=${encodeURIComponent(place.query)}&z=16&output=embed`;

// Data do casamento lida do texto ISO, sem passar pelo fuso do navegador.
function longDate(datetime: string) {
  const [year, month, day] = datetime.slice(0, 10).split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday} · ${day} de ${MONTHS[month - 1]} de ${year}`;
}

const TABS = [{ key: 'celebracao', label: 'Celebração' }, { key: 'festa', label: 'Festa' }] as const;
type TabKey = typeof TABS[number]['key'];

export function Ceremony({ data, title, MapArt }: { data: CeremonyData; title: ReactNode; MapArt: ComponentType }) {
  const [tab, setTab] = useState<TabKey>('celebracao');
  const id = useId().replace(/:/g, '');
  const places: Record<TabKey, Place> = { celebracao: data.celebration, festa: data.party };
  // Tab e Enter alcancam e escolhem cada aba; as setas tambem trocam, como no padrao de abas.
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = TABS.findIndex(item => item.key === tab);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? TABS.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length;
    setTab(TABS[next].key);
    document.getElementById(`${id}-aba-${TABS[next].key}`)?.focus();
  };

  return <section className="wed-sec" id="cerimonia">
    {title}
    <div className="ce ce-2"><div className="ce-in">
      <ScrollReveal as="p" className="hero" preset="fade" delay={80}>{longDate(data.datetime)}</ScrollReveal>
      <ScrollReveal as="ol" stagger className="tempo">
        {TABS.map(({ key, label }) => <li key={key}>
          <span className="bola"><Icon name={key} /></span><b>{places[key].time}</b>
          <p className="rot">{label}</p><p className="val">{places[key].name}</p><small>{places[key].address}</small>
        </li>)}
      </ScrollReveal>
      <ScrollReveal preset="scale-soft">
        <div className="abas" role="tablist" aria-label="Como chegar" onKeyDown={onKey}>
          {TABS.map(({ key, label }) => <button key={key} type="button" role="tab" id={`${id}-aba-${key}`} aria-selected={tab === key} aria-controls={`${id}-painel-${key}`} onClick={() => setTab(key)}><Icon name={key} />{label}</button>)}
        </div>
        {TABS.map(({ key }) => {
          const place = places[key];
          return <div key={key} className="painel-aba" role="tabpanel" id={`${id}-painel-${key}`} aria-labelledby={`${id}-aba-${key}`} tabIndex={0} hidden={tab !== key}>
            <div className="painel-txt">
              <p className="nome-local">{place.name}</p><p className="end">{place.address}</p><p className="quando">{place.time}</p>
              <span className="links">
                <a href={googleMaps(place)} target="_blank" rel="noopener noreferrer">Google Maps <Icon name="seta" /></a>
                <a href={waze(place)} target="_blank" rel="noopener noreferrer">Waze <Icon name="seta" /></a>
              </span>
            </div>
            <div className="mapa">
              <MapArt />
              {tab === key && <iframe title={`Mapa: ${place.name}`} src={embed(place)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />}
              <a className="wed-map-tap" href={googleMaps(place)} target="_blank" rel="noopener noreferrer" aria-label={`Abrir ${place.name} no Google Maps`} />
            </div>
          </div>;
        })}
      </ScrollReveal>
    </div></div>
  </section>;
}
