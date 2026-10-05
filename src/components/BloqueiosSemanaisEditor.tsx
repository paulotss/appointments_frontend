import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Alert, Button, IconButton, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { DIAS_SEMANA_BLOQUEIO } from '../utils/bloqueioHorario'
import type { WeeklyBlockInput } from '../types/profissional'

interface BloqueiosSemanaisEditorProps {
  value: WeeklyBlockInput[]
  onChange: (next: WeeklyBlockInput[]) => void
  error?: string
}

export function BloqueiosSemanaisEditor({ value, onChange, error }: BloqueiosSemanaisEditorProps) {
  function atualizar(index: number, patch: Partial<WeeklyBlockInput>) {
    onChange(value.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" fontWeight={700}>
        Horários bloqueados
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Períodos em que o profissional não atende, repetidos toda semana. Fora desses horários o
        agendamento continua livre.
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {value.map((item, index) => (
        <Stack key={`bloqueio-${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            select
            label="Dia"
            value={item.weekday}
            onChange={(event) => atualizar(index, { weekday: Number(event.target.value) })}
            sx={{ minWidth: 110 }}
          >
            {DIAS_SEMANA_BLOQUEIO.map((dia) => (
              <MenuItem key={dia.value} value={dia.value}>
                {dia.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Início"
            value={item.startTime}
            onChange={(event) => atualizar(index, { startTime: event.target.value })}
            placeholder="08:00"
            slotProps={{ htmlInput: { maxLength: 5 } }}
            sx={{ width: { sm: 120 } }}
          />
          <TextField
            label="Fim"
            value={item.endTime}
            onChange={(event) => atualizar(index, { endTime: event.target.value })}
            placeholder="12:00"
            slotProps={{ htmlInput: { maxLength: 5 } }}
            sx={{ width: { sm: 120 } }}
          />
          <Button
            type="button"
            variant="outlined"
            onClick={() => atualizar(index, { startTime: '00:00', endTime: '24:00' })}
            sx={{ alignSelf: { sm: 'center' }, whiteSpace: 'nowrap' }}
          >
            Dia inteiro
          </Button>
          <IconButton
            aria-label="Remover bloqueio"
            onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
            sx={{ alignSelf: { sm: 'center' } }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      ))}
      <Button
        type="button"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => onChange([...value, { weekday: 1, startTime: '12:00', endTime: '13:00' }])}
        sx={{ alignSelf: 'flex-start' }}
      >
        Adicionar período
      </Button>
    </Stack>
  )
}
