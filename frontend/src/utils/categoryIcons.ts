import { resolveImageUrl } from '../services/images.service';

// SVGs tematicos das categorias da "Lista na loja". Para adicionar um icone, basta
// colocar <chave>.svg em src/assets/category-icons (e, se quiser, o rotulo abaixo).
const files = import.meta.glob<string>('../assets/category-icons/*.svg', { eager: true, query: '?url', import: 'default' });
const labels: Record<string, string> = { camisetas: 'Camisetas', chuteiras: 'Chuteiras', eletrodomesticos: 'Eletrodomésticos', jogos: 'Jogos', loucas: 'Louças', panelas: 'Panelas', tacas: 'Taças', utensilios: 'Utensílios' };
const keyOf = (path: string) => path.split('/').pop()!.replace(/\.svg$/, '');

export interface CategoryIcon { key: string; label: string; url: string }
export const categoryIcons: CategoryIcon[] = Object.entries(files)
  .map(([path, url]) => ({ key: keyOf(path), label: labels[keyOf(path)] || keyOf(path), url }))
  .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR'));
const byKey = new Map(categoryIcons.map(icon => [icon.key, icon]));
export const categoryIconUrl = (key?: string) => (key && byKey.get(key)?.url) || '';
// Chave do icone que bate com o nome da categoria ("Louças" ou "Louças finas" -> "loucas").
export const suggestCategoryIcon = (name: string) => {
  const slug = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  return byKey.has(slug) ? slug : categoryIcons.find(icon => slug.startsWith(`${icon.key}-`))?.key || '';
};
// Imagem exibida: a enviada/URL prevalece; sem ela, o SVG escolhido.
export const categoryImageUrl = (category: { image?: string; icon?: string }) => category.image ? resolveImageUrl(category.image) : categoryIconUrl(category.icon);
