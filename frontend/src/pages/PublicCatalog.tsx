import { useEffect, useState, type ReactNode } from 'react';
import { Box, Card, CardContent, CardMedia, Typography } from '@mui/material';
import api from '../services/api';
import type { ApiResponse, GiftProduct, Godparent } from '../types/api';
const currency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
const roleName: Record<Godparent['role'], string> = { groomsman: 'Padrinho', bridesmaid: 'Madrinha', mother: 'Mãe', father: 'Pai', other: 'Outro' };
export function PublicGodparents({ fallback }: { fallback: ReactNode }) {
  const [items, setItems] = useState<Godparent[] | null>(null);
  useEffect(() => { api.get<ApiResponse<Godparent[]>>('/public/godparents').then(r => setItems(r.data.data)).catch(() => setItems([])); }, []);
  if (!items?.length) return <>{fallback}</>;
  return <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }, gap: 2 }}>{items.map(item => <Card key={item._id}>{item.image && <CardMedia component="img" image={item.image} alt={item.name} sx={{ height: 180, objectFit: 'cover' }} />}<CardContent><Typography variant="h6">{item.name}</Typography><Typography color="text.secondary">{roleName[item.role]}</Typography>{item.description && <Typography>{item.description}</Typography>}</CardContent></Card>)}</Box>;
}
export function PublicGifts({ Carousel }: { Carousel: ({ label, children }: { label: string; children: ReactNode }) => ReactNode }) {
  const [items, setItems] = useState<GiftProduct[]>([]);
  useEffect(() => { api.get<ApiResponse<GiftProduct[]>>('/public/gift-products').then(r => setItems(r.data.data)).catch(() => setItems([])); }, []);
  if (!items.length) return null;
  return <Carousel label="Lista de presentes">{items.map(item => <div className="wed-card wed-gift" key={item._id}>
    <div className="wed-gift-image">{item.image ? <img src={item.image} alt={item.name} loading="lazy" /> : <span aria-hidden="true">{item.name.trim().charAt(0)}</span>}</div>
    <strong>{item.name}</strong>
    <span className="wed-gift-price">{currency(item.price)}</span>
    {item.description && <p>{item.description}</p>}
  </div>)}</Carousel>;
}
