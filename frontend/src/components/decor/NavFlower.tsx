import { Blossom } from './Blossom';

// Florzinha em aquarela de 20 px que marca a ancora ativa da navbar. A posicao
// horizontal vem de fora, para deslizar entre as ancoras.
export const NavFlower = ({ x }: { x: number }) => <Blossom size={20} seed={11} className="wed-nav-flower" style={{ transform: `translateX(${x.toFixed(1)}px)` }} />;
