import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { ScrollReveal } from '../reveal/ScrollReveal';
import './recados.css';

// Mural "Recados" no layout 5 (Bilhetes inclinados) do componente Recados do design
// system: os recados viram bilhetes girados que andam em duas faixas continuas e o
// formulario fica ao lado. Salvar e moderar continuam no backend (/public/messages).

export interface Message { _id: string; name: string; message: string; createdAt: string }
interface Api { get: <T>(url: string) => Promise<{ data: { data: T } }>; post: <T>(url: string, body: unknown) => Promise<{ data: { data: T } }> }

const MAX_TEXT = 400;
const MIN_PER_LANE = 4;
const rotation = (i: number) => `${(i % 2 ? 1 : -1) * (1 + i % 3)}deg`;
const date = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
const MessageIcon = () => <svg className="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v10H9l-4 4z" /><path d="M8.5 9h7M8.5 12h4.5" /></svg>;

// Uma faixa: a lista repetida ate ter MIN_PER_LANE bilhetes (sem buraco com poucos
// recados) e depois duplicada, para o translateX(-50%) recomecar sem pulo. So a
// primeira aparicao de cada recado e lida e focada; as copias ficam aria-hidden.
function Lane({ items, className }: { items: Message[]; className: string }) {
  const base: Message[] = [];
  while (base.length < Math.max(MIN_PER_LANE, items.length)) base.push(...items);
  const loop = [...base, ...base];
  return <div className={`faixa ${className}`}>
    <div className="faixa-in">
      {loop.map((item, i) => {
        const copy = i >= items.length;
        return <article key={`${item._id}-${i}`} className="rc-card post" style={{ '--r': rotation(i % base.length) } as CSSProperties} tabIndex={copy ? -1 : 0} aria-hidden={copy || undefined}>
          <p className="txt">{item.message}</p>
          <p className="pe"><b>{item.name}</b><span>{date(item.createdAt)}</span></p>
        </article>;
      })}
    </div>
  </div>;
}

export function Guestbook({ api }: { api: Api }) {
  const [items, setItems] = useState<Message[]>([]);
  const [form, setForm] = useState({ name: '', message: '' });
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  useEffect(() => { api.get<Message[]>('/public/messages').then(response => setItems(response.data.data)).catch(() => setItems([])); }, [api]);

  // Mais novo primeiro: a primeira metade vai para a faixa de cima. Ate 3 recados, uma faixa so.
  const lanes = useMemo(() => {
    if (items.length <= 3) return [items];
    const half = Math.ceil(items.length / 2);
    return [items.slice(0, half), items.slice(half)];
  }, [items]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const name = form.name.trim(), message = form.message.trim();
    if (!name || !message) { setNotice({ error: true, text: 'Preencha o seu nome e o recado.' }); return; }
    setSending(true); setNotice(null);
    try {
      const response = await api.post<Message & { approved?: boolean }>('/public/messages', { name, message });
      if (response.data.data.approved !== false) setItems(current => [response.data.data, ...current]);
      setForm({ name: '', message: '' });
      setNotice({ error: false, text: 'Recado enviado!' });
    } catch (reason) {
      const data = (reason as { response?: { data?: { message?: string } } }).response?.data;
      setNotice({ error: true, text: data?.message || 'Não foi possível enviar o seu recado.' });
    } finally { setSending(false); }
  };
  const edit = (field: 'name' | 'message', value: string) => { setNotice(null); setForm(current => ({ ...current, [field]: value })); };

  return <div className="rc rc-5"><div className="lado inv">
    <ScrollReveal className="faixas" preset="fade" role="region" aria-label="Recados do mural">
      {items.length === 0
        ? <div className="faixa vazia"><div className="faixa-in"><article className="rc-card post" style={{ '--r': rotation(1) } as CSSProperties}><p className="txt">Seja o primeiro a deixar um recado!</p></article></div></div>
        : lanes.map((lane, index) => <Lane key={index} items={lane} className={index ? 'b' : 'a'} />)}
    </ScrollReveal>
    <form className="rc-form" onSubmit={submit} noValidate>
      <label htmlFor="rc-nome">Seu nome</label>
      <input id="rc-nome" name="nome" autoComplete="name" required maxLength={120} value={form.name} onChange={event => edit('name', event.target.value)} placeholder="Como podemos te chamar?" />
      <label htmlFor="rc-texto">Seu recado</label>
      <textarea id="rc-texto" name="texto" rows={4} required maxLength={MAX_TEXT} value={form.message} onChange={event => edit('message', event.target.value)} placeholder="Escreva um carinho para os noivos..." aria-describedby="rc-conta" />
      <span id="rc-conta" className="rc-conta">{form.message.length}/{MAX_TEXT}</span>
      <button type="submit" className="rc-enviar" disabled={sending}><MessageIcon />{sending ? 'Enviando...' : 'Deixar recado'}</button>
      <p className={`rc-aviso${notice?.error ? ' is-erro' : ''}`} role="status">{notice?.text}</p>
    </form>
  </div></div>;
}
