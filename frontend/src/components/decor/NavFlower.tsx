import { useId, useMemo } from 'react';
import { Palette, createRng, paintFlower } from './botanica';

// Florzinha em aquarela de 20 px que marca a ancora ativa da navbar (mesmo pintor
// das flores do site). A posicao horizontal vem de fora, para deslizar entre as ancoras.
export const NavFlower = ({ x }: { x: number }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const html = useMemo(() => {
    const ctx = new Palette(`nf${id}`, true, 7);
    return `<defs>${ctx.defs()}</defs>${ctx.layer(paintFlower(ctx, 12, 12, 11.4, createRng(11), 0))}`;
  }, [id]);
  return <svg className="wed-nav-flower" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false" style={{ transform: `translateX(${x.toFixed(1)}px)` }} dangerouslySetInnerHTML={{ __html: html }} />;
};
