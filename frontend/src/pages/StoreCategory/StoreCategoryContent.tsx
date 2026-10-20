import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { resolveImageUrl } from '../../services/images.service';
import { storeCategoriesService } from '../../services/storeCategories.service';
import { categoryImageUrl } from '../../utils/categoryIcons';
import { usePixStatus } from '../Pix/GravataEntry';
import type { Pagination, PublicGiftProduct, PublicStoreCategory } from '../../types/api';
const GiftDetailsDialog = lazy(() => import('./GiftDetailsDialog').then(module => ({ default: module.GiftDetailsDialog })));
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
export const PAGE_SIZE = 12;
export const LANDING_PATH = '/casamento';
export const STORE_LIST_HREF = `${LANDING_PATH}#lista-na-loja`;

// Titulo e meta description da aba; restaura os originais ao sair da pagina.
function usePageMeta(title: string | null, description: string | null) {
  useEffect(() => {
    if (!title) return;
    const previousTitle = document.title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const created = !meta;
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta); }
    const previousDescription = meta.content;
    document.title = title; meta.content = description || '';
    return () => { document.title = previousTitle; if (created) meta.remove(); else meta.content = previousDescription; };
  }, [title, description]);
}

function ProductImage({ product }: { product: PublicGiftProduct }) {
  const [failed, setFailed] = useState(false);
  return <div className="wed-gift-image wed-catpage-image">{product.image && !failed ? <img src={resolveImageUrl(product.image)} alt={product.name} loading="lazy" decoding="async" onError={() => setFailed(true)} /> : <span aria-hidden="true">{product.name.trim().charAt(0)}</span>}</div>;
}

// Grade de presentes de uma categoria com o detalhe de cada um ("Ver presente"). Usada na
// pagina da categoria e na area de produtos da "Lista na loja" na landing.
export function ProductCards({ products, category, nameTag: Name = 'h2' }: { products: PublicGiftProduct[]; category: string; nameTag?: 'h2' | 'h5' }) {
  const [selected, setSelected] = useState<PublicGiftProduct | null>(null);
  const pix = usePixStatus();
  return <>
    <ul className="wed-catpage-grid">{products.map(product => <li key={product._id} className="wed-card wed-catpage-card">
      <ProductImage product={product} />
      <Name className="wed-catpage-name">{product.name}</Name>
      <span className="wed-gift-price">{currency(product.price)}</span>
      {product.description && <p className="wed-catpage-text">{product.description}</p>}
      <button type="button" className="wed-btn wed-btn-ghost wed-catpage-cta" onClick={() => setSelected(product)} aria-label={`Ver presente: ${product.name}`}>Ver presente</button>
    </li>)}</ul>
    {selected && <Suspense fallback={null}><GiftDetailsDialog product={selected} category={category} pixActive={pix.active} onClose={() => setSelected(null)} /></Suspense>}
  </>;
}

type State = { status: 'loading' } | { status: 'notFound' } | { status: 'error' } | { status: 'ready'; category: PublicStoreCategory; products: PublicGiftProduct[]; pagination: Pagination };

// Pagina publica /lista-na-loja/:slug. A moldura (fundo, menu, rodape) vem do main.jsx.
export function StoreCategoryContent({ slug, icons }: { slug: string; icons: { back: ReactNode; gift: ReactNode } }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [loadingMore, setLoadingMore] = useState(false); const [moreError, setMoreError] = useState(false);
  const load = () => {
    setState({ status: 'loading' });
    storeCategoriesService.getPublicBySlug(slug, 1, PAGE_SIZE)
      .then(data => setState({ status: 'ready', ...data }))
      .catch(error => setState({ status: axios.isAxiosError(error) && error.response?.status === 404 ? 'notFound' : 'error' }));
  };
  useEffect(load, [slug]);
  const loadMore = async () => {
    if (state.status !== 'ready' || loadingMore) return;
    setLoadingMore(true); setMoreError(false);
    try {
      const next = await storeCategoriesService.getPublicBySlug(slug, state.pagination.page + 1, PAGE_SIZE);
      setState({ ...state, products: [...state.products, ...next.products], pagination: next.pagination });
    } catch { setMoreError(true); } finally { setLoadingMore(false); }
  };
  const ready = state.status === 'ready' ? state : null;
  usePageMeta(ready ? `${ready.category.name} | Lista de Presentes` : state.status === 'notFound' ? 'Categoria não encontrada | Lista de Presentes' : null, ready?.category.description || null);

  if (state.status === 'notFound' || state.status === 'error') return <section className="wed-sec wed-catpage wed-catpage-state">
    <span className="wed-catpage-state-icon">{icons.gift}</span>
    <h1 className="wed-sec-title">{state.status === 'notFound' ? 'Categoria não encontrada.' : 'Não foi possível carregar a categoria.'}</h1>
    <p className="wed-sec-intro">{state.status === 'notFound' ? 'Ela pode ter sido removida ou o endereço está incorreto.' : 'Verifique sua conexão e tente novamente.'}</p>
    <div className="wed-catpage-actions">
      {state.status === 'error' && <button type="button" className="wed-btn wed-btn-ghost" onClick={load}>Tentar novamente</button>}
      <a className="wed-btn" href={`${LANDING_PATH}#presentes`}>Voltar para a lista de presentes</a>
    </div>
  </section>;

  return <section className="wed-sec wed-catpage" aria-busy={state.status === 'loading'}>
    <nav className="wed-crumbs" aria-label="Você está em">
      <ol><li><a href={LANDING_PATH}>Início</a></li><li><a href={STORE_LIST_HREF}>Lista na loja</a></li><li aria-current="page">{ready ? ready.category.name : '…'}</li></ol>
    </nav>
    <header className="wed-catpage-head">
      <span className={`wed-shop-thumb wed-catpage-thumb${ready ? '' : ' is-loading'}`}>{ready && categoryImageUrl(ready.category) && <img src={categoryImageUrl(ready.category)} alt="" />}</span>
      <div>
        {ready ? <h1 className="wed-catpage-title">{ready.category.name}</h1> : <span className="wed-catpage-title is-loading" />}
        {ready ? <p className="wed-catpage-desc">{ready.category.description}</p> : <span className="wed-catpage-desc is-loading" />}
        {ready && ready.pagination.total > 0 && <p className="wed-catpage-count">{ready.pagination.total} {ready.pagination.total === 1 ? 'presente' : 'presentes'}</p>}
      </div>
    </header>
    {!ready ? <ul className="wed-catpage-grid is-loading" aria-hidden="true">{Array.from({ length: 4 }, (_, index) => <li key={index} className="wed-card wed-catpage-card"><div className="wed-gift-image wed-catpage-image" /><span /><span /></li>)}</ul>
      : ready.products.length === 0 ? <div className="wed-catpage-empty"><span>{icons.gift}</span><p>Ainda não adicionamos presentes nesta categoria.</p><p className="wed-catpage-empty-sub">Novidades em breve.</p></div>
      : <>
        <ProductCards products={ready.products} category={ready.category.name} />
        {ready.pagination.page < ready.pagination.totalPages && <div className="wed-catpage-more">
          {moreError && <p role="alert">Não foi possível carregar mais presentes.</p>}
          <button type="button" className="wed-btn wed-btn-ghost" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Carregando...' : 'Ver mais presentes'}</button>
        </div>}
      </>}
    <a className="wed-catpage-back" href={STORE_LIST_HREF}>{icons.back}Ver todas as categorias</a>
  </section>;
}
