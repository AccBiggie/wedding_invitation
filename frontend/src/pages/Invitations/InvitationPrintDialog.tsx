import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Button, CircularProgress, DialogActions, Stack, Typography } from '@mui/material';
import PictureAsPdfOutlined from '@mui/icons-material/PictureAsPdfOutlined';
import PrintOutlined from '@mui/icons-material/PrintOutlined';
import { CrudDialog } from '../../components/common/CrudDialog';
import { INVITE_LAYOUTS, type InviteLayout } from '../../invite-print/convite';
import { IGREJA_FUNDO, IGREJA_TEXTOS } from '../../invite-print/conviteIgreja';
import { inviteDocument, prepareInviteFrame, SHEET_SCREEN_PADDING } from '../../invite-print/printDocument';
import { displayName, inviteData, photoUrl, type InvitationCard, type PrintableInvitation } from '../../invite-print/inviteData';

const MM = 96 / 25.4;
const frameWidth = (sheetMm: number) => Math.ceil(sheetMm * MM + SHEET_SCREEN_PADDING * 2);
const slug = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface PrintJob { layout: InviteLayout; invitations: (PrintableInvitation & { code: string })[] }

export function InvitationPrintDialog({ job, card, onClose }: { job: PrintJob | null; card: InvitationCard | null; onClose: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<{ ready: boolean; height: number; imageFailed: boolean }>({ ready: false, height: 0, imageFailed: false });
  const [boxWidth, setBoxWidth] = useState(560);
  const model = INVITE_LAYOUTS.find(item => item.layout === job?.layout)?.name || '';
  const count = job?.invitations.length || 0;
  const igreja = job?.layout === 'igreja';
  const FRAME_WIDTH = frameWidth(igreja ? 297 : 210);
  const title = !job ? '' : count === 1 ? `Convite ${model} - ${displayName(job.invitations[0].name)}` : `Convites ${model} - ${count} convites`;
  const fileTitle = !job ? '' : count === 1 ? `convite-${slug(model)}-${slug(displayName(job.invitations[0].name))}` : `convites-${slug(model)}-${count}`;
  const html = useMemo(() => job && card ? inviteDocument(fileTitle, job.layout, job.invitations.map(item => inviteData(card, item))) : '', [job, card, fileTitle]);

  useEffect(() => { setState({ ready: false, height: 0, imageFailed: false }); }, [html]);
  useEffect(() => {
    if (!box.current) return;
    const observer = new ResizeObserver(([entry]) => setBoxWidth(entry.contentRect.width));
    observer.observe(box.current);
    return () => observer.disconnect();
  }, [job]);

  const onLoad = async () => {
    if (!frame.current || !card || !job) return;
    const images = igreja ? [IGREJA_FUNDO, IGREJA_TEXTOS] : job.layout === 9 && photoUrl(card) ? [photoUrl(card)] : [];
    const result = await prepareInviteFrame(frame.current, images, igreja);
    setState({ ready: true, height: result.height, imageFailed: !result.imagesOk });
  };
  // A janela de impressao do navegador salva o PDF com o titulo do documento.
  const print = () => {
    const win = frame.current?.contentWindow;
    if (!win) return;
    const previous = document.title;
    document.title = fileTitle;
    win.focus(); win.print();
    document.title = previous;
  };

  if (!job) return null;
  const scale = Math.min(1, boxWidth / FRAME_WIDTH);
  const sheets = Math.ceil(count / 2);
  return <CrudDialog title={title} onClose={onClose}>
    <Stack spacing={2}>
      <Typography color="text.secondary">{igreja ? (count === 1 ? 'O convite ocupa uma folha A4 deitada.' : `${count} convites em ${count} folhas A4 deitadas, 1 por folha, na ordem da lista.`) : count === 1 ? 'O convite fica na metade de cima de uma folha A4 em pé.' : `${count} convites em ${sheets} folha${sheets > 1 ? 's' : ''} A4 em pé, 2 por folha, na ordem da lista.`}</Typography>
      {state.imageFailed && <Alert severity="warning">{igreja ? 'As imagens do convite não carregaram. Feche e abra a prévia de novo.' : 'A foto do casal não carregou. Confira a foto nas configurações do convite.'}</Alert>}
      <Box ref={box} sx={{ position: 'relative', width: '100%', height: state.height ? state.height * scale : 420, maxHeight: '60vh', overflow: 'auto', borderRadius: 1, bgcolor: '#e7e3da' }}>
        {!state.ready && <Stack sx={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 }}><CircularProgress aria-label="Preparando convite" /></Stack>}
        <Box sx={{ width: FRAME_WIDTH * scale, height: state.height * scale, overflow: 'hidden', mx: 'auto' }}>
          <iframe ref={frame} title="Prévia do convite" srcDoc={html} onLoad={() => void onLoad()} style={{ border: 0, width: FRAME_WIDTH, height: state.height || 1200, transform: `scale(${scale})`, transformOrigin: '0 0', visibility: state.ready ? 'visible' : 'hidden' }} />
        </Box>
      </Box>
      <Alert severity="info">{igreja ? "Imprima em A4 paisagem, em 100% (sem 'ajustar à página')." : "Imprima em A4 retrato, em 100% (sem 'ajustar à página'), e corte na linha do meio."}</Alert>
    </Stack>
    <DialogActions sx={{ flexWrap: 'wrap', gap: 1, mt: 2, px: 0 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mr: 'auto' }}>Para baixar, escolha "Salvar como PDF" como destino na janela que abrir.</Typography>
      <Button onClick={onClose}>Fechar</Button>
      <Button variant="outlined" startIcon={<PrintOutlined />} disabled={!state.ready || (igreja && state.imageFailed)} onClick={print}>Imprimir</Button>
      <Button variant="contained" startIcon={<PictureAsPdfOutlined />} disabled={!state.ready || (igreja && state.imageFailed)} onClick={print}>Baixar PDF</Button>
    </DialogActions>
  </CrudDialog>;
}
