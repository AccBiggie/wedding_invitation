import { resolveImageUrl } from '../services/images.service';
import type { InviteData } from './convite';

export interface InvitationCard {
  bride: string; groom: string; date: { dia: number; mes: number; ano: number }; time: string;
  siteUrl: string; greeting: string; intro: string; place: string; address: string; qrText: string; photo: string;
}
export interface PrintableInvitation { _id: string; name: string; code?: string }

// O cadastro separa as pessoas por ";" ("Maria; João"): no convite vira "Maria e João".
export function displayName(name: string) {
  const people = name.split(';').map(part => part.trim()).filter(Boolean);
  if (people.length < 2) return people[0] || name.trim();
  return `${people.slice(0, -1).join(', ')} e ${people[people.length - 1]}`;
}

export const inviteLink = (card: InvitationCard, code: string) => `${card.siteUrl.replace(/\/$/, '')}/convite/${code}`;

export const photoUrl = (card: InvitationCard) => {
  if (!card.photo) return '';
  const url = resolveImageUrl(card.photo);
  return url.startsWith('/') ? `${location.origin}${url}` : url;
};

export const inviteData = (card: InvitationCard, invitation: PrintableInvitation & { code: string }): InviteData => ({
  convidado: displayName(invitation.name), saudacao: card.greeting, link: inviteLink(card, invitation.code),
  noiva: card.bride, noivo: card.groom, intro: card.intro, data: card.date, hora: card.time,
  local: card.place, endereco: card.address, qrTexto: card.qrText, foto: photoUrl(card)
});
