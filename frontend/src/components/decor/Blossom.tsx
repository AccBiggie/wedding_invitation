import { useId, useMemo, type CSSProperties } from 'react';
import { Palette, createRng, paintFlower } from './botanica';

// Florzinha em aquarela avulsa (o mesmo pintor das flores do site), vista de frente.
export const Blossom = ({ size, seed = 11, className, style }: { size: number; seed?: number; className?: string; style?: CSSProperties }) => {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const html = useMemo(() => {
    const ctx = new Palette(`bl${id}`, true, seed % 97);
    return `<defs>${ctx.defs()}</defs>${ctx.layer(paintFlower(ctx, 12, 12, 11.4, createRng(seed), 0))}`;
  }, [id, seed]);
  return <svg className={className} style={style} viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: html }} />;
};
