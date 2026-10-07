import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Alert, FormHelperText, IconButton, Stack } from '@mui/material'
import { CampoData } from './CampoData'
import { sessoesNoMesmoDia } from '../utils/proporDatasSessoes'

interface DatasSessoesProcedimentoProps {
  dates: string[]
  min?: string
  max?: string
  error?: string
  onChange: (dates: string[]) => void
}

export function DatasSessoesProcedimento({
  dates,
  min,
  max,
  error,
  onChange,
}: DatasSessoesProcedimentoProps) {
  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      {dates.map((date, index) => (
        <Stack key={`${index}-${dates.length}`} direction="row" spacing={1} alignItems="flex-start">
          <CampoData
            label={`Sessão ${index + 1}`}
            value={date}
            min={min}
            max={max}
            onChange={(next) => {
              const copy = [...dates]
              copy[index] = next
              onChange(copy)
            }}
            sx={{ flex: 1 }}
          />
          <IconButton
            aria-label="Remover sessão"
            disabled={dates.length <= 1}
            onClick={() => onChange(dates.filter((_, itemIndex) => itemIndex !== index))}
            sx={{ mt: 0.5 }}
          >
            <DeleteOutlineIcon />
          </IconButton>
        </Stack>
      ))}
      {sessoesNoMesmoDia(dates) ? (
        <Alert severity="warning">
          Há sessões no mesmo dia. Ajuste as datas se precisar de dias diferentes.
        </Alert>
      ) : null}
      {error ? <FormHelperText error>{error}</FormHelperText> : null}
    </Stack>
  )
}
