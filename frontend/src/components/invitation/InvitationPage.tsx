import type { ReactNode } from 'react';
import './pagina-convite.css';

// Pagina do convite no layout 9 (Detalhes em blocos) do componente PaginaConvite do
// design system: foto e confirmacao lado a lado e seis blocos de informacao. Carregar o
// convite e salvar a confirmacao continuam no Public() (main.jsx); aqui so a apresentacao.

export interface Guest { _id: string; name: string; confirmed: boolean }
interface Place { name?: string; address?: string; query?: string }
export interface InvitationPageWedding {
  couple: [string, string]; verse: string; photo: string; datetime: string; time: string[];
  ceremony: Place; party?: Place; contact?: { address?: { street?: string; city?: string } };
}
export interface Status { error: boolean; text: string }

const WEEKDAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
// Data do casamento lida do texto ISO, sem passar pelo fuso do navegador.
function shortDate(datetime: string) {
  const [year, month, day] = datetime.slice(0, 10).split('-').map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
  return `${weekday}, ${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

const Icon = ({ children }: { children: ReactNode }) => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true">{children}</svg>;
const Tile = ({ href, external, icon, title, detail }: { href?: string; external?: boolean; icon: ReactNode; title: string; detail: string }) => {
  const body = <><Icon>{icon}</Icon><b>{title}</b><span>{detail}</span></>;
  return href
    ? <a className="tile" href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{body}</a>
    : <div className="tile">{body}</div>;
};

export function InvitationPage({ wedding, guests, selected, onToggle, onConfirm, confirming, status, deadline }: {
  wedding: InvitationPageWedding; guests: Guest[]; selected: string[]; onToggle: (id: string) => void; onConfirm: () => void;
  confirming: boolean; status: Status | null; deadline: string | null;
}) {
  const [bride, groom] = wedding.couple;
  const address = wedding.contact?.address;
  const ceremonyAddress = address?.street ? [address.street, address.city].filter(Boolean).join(', ') : wedding.ceremony.address || wedding.ceremony.name || '';
  const party = wedding.party?.name ? [wedding.party.name, wedding.party.address].filter(Boolean).join(' · ') : 'Logo após, no mesmo local';
  const mapQuery = wedding.ceremony.query || ceremonyAddress;
  return <section className="cv9" aria-label="Seu convite">
    <div className="hero">
      <div className="foto" role="img" aria-label={`Foto de ${bride} e ${groom}`} style={{ backgroundImage: `url('${wedding.photo}')` }} />
      <div className="lado" id="confirmar">
        <h1 className="nm">{bride} <em>&amp;</em> {groom}</h1>
        <p className="bencao">{wedding.verse}</p>
        {deadline && <p className="prazo">Confirme sua presença até {deadline}.</p>}
        <div className="lista" role="group" aria-label="Quem vai">
          {guests.map(guest => <label key={guest._id}>
            <input type="checkbox" checked={selected.includes(String(guest._id))} onChange={() => onToggle(String(guest._id))} />
            <span className="cx" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></span>
            <span className="nome">{guest.name}</span>
            {guest.confirmed && <span className="selo">✓ Confirmado</span>}
          </label>)}
        </div>
        <button type="button" className="bt" disabled={confirming} onClick={onConfirm}><span className="co" aria-hidden="true">♥</span>{confirming ? 'Atualizando...' : 'Atualizar confirmação'}</button>
        <div className={`ok${status ? ' on' : ''}${status?.error ? ' erro' : ''}`} role="status">{status?.text}</div>
      </div>
    </div>
    <div className="tiles">
      <Tile icon={<><rect x="4" y="5.5" width="16" height="14" rx="2" /><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4" /></>} title="Data" detail={shortDate(wedding.datetime)} />
      <Tile icon={<><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>} title="Horário" detail={wedding.time.join('')} />
      <Tile icon={<path d="M12 3v4M10 5h4M6 21V11l6-4 6 4v10M10 21v-4a2 2 0 0 1 4 0v4" />} title="Cerimônia" detail={ceremonyAddress} />
      <Tile icon={<path d="M8 3h8l-1 6a3 3 0 0 1-6 0zM12 12v7M9 20h6" />} title="Festa" detail={party} />
      <Tile href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} external icon={<><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></>} title="Como chegar" detail="Abrir no mapa" />
      <Tile href="/casamento#presentes" icon={<><rect x="4" y="9" width="16" height="11" rx="1.5" /><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1.5S10 9 12 9c2 0 6 .9 6-1.5S14 5 12 9" /></>} title="Presentes" detail="Ver a lista" />
    </div>
  </section>;
}
