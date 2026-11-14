import dayjs, { type Dayjs } from 'dayjs';
import 'dayjs/locale/pt-br';
import { alpha } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ptBR } from '@mui/x-date-pickers/locales';
import CalendarMonthRounded from '@mui/icons-material/CalendarMonthRounded';

const localeText = ptBR.components.MuiLocalizationProvider.defaultProps.localeText;
// 'AAAA-MM-DD' vira data local (o dayjs le esse formato sem plugin).
const toDay = (value?: string) => value ? dayjs(value) : null;

// Campo de data do painel: calendario em pt-BR com cantos arredondados, sombra suave e dia
// selecionado na cor do tema. Valor e onChange em texto 'AAAA-MM-DD' ('' = vazio), como o input nativo.
export function DateField({ label, value, onChange, minDate, maxDate, size, required, helperText, disabled }: {
  label: string; value: string; onChange: (value: string) => void; minDate?: string; maxDate?: string;
  size?: 'small' | 'medium'; required?: boolean; helperText?: string; disabled?: boolean;
}) {
  const change = (date: Dayjs | null) => {
    if (!date) onChange('');
    else if (date.isValid()) onChange(date.format('YYYY-MM-DD'));
  };
  return <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br" localeText={localeText}>
    <DatePicker label={label} value={toDay(value)} onChange={change} minDate={toDay(minDate) ?? undefined} maxDate={toDay(maxDate) ?? undefined}
      format="DD/MM/YYYY" disabled={disabled} slots={{ openPickerIcon: CalendarMonthRounded }}
      slotProps={{
        textField: { size, required, helperText, fullWidth: true },
        openPickerButton: { sx: { color: 'text.secondary' } },
        actionBar: { actions: ['clear', 'today'] },
        desktopPaper: { sx: { mt: 1, borderRadius: 3, border: 1, borderColor: 'divider', boxShadow: '0 16px 40px rgba(20, 35, 28, .14)' } },
        mobilePaper: { sx: { borderRadius: 4 } },
        layout: {
          sx: {
            '& .MuiPickersCalendarHeader-label': { fontWeight: 600, textTransform: 'capitalize' },
            '& .MuiDayCalendar-weekDayLabel': { color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 },
            '& .MuiPickersDay-root': { borderRadius: 2, fontWeight: 500 },
            '& .MuiPickersDay-root:not(.Mui-selected):hover': { bgcolor: theme => alpha(theme.palette.primary.main, .08) },
            '& .MuiPickersDay-today:not(.Mui-selected)': { border: 0, color: 'primary.main', fontWeight: 700, bgcolor: theme => alpha(theme.palette.primary.main, .08) },
            '& .MuiPickersDay-root.Mui-selected': { bgcolor: 'primary.main', fontWeight: 700 },
            '& .MuiPickersYear-yearButton, & .MuiPickersMonth-monthButton': { borderRadius: 2 },
            '& .MuiDialogActions-root': { px: 2, pb: 1.5 },
            '& .MuiDialogActions-root .MuiButton-root': { borderRadius: 2, fontWeight: 600 }
          }
        }
      }} />
  </LocalizationProvider>;
}
