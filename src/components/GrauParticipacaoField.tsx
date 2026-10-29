import { MenuItem, TextField } from '@mui/material'
import {
  TISS_PARTICIPATION_DEGREE_CODES,
  TISS_PARTICIPATION_DEGREE_LABELS,
  type TissParticipationDegree,
} from '../types/tiss'

interface GrauParticipacaoFieldProps {
  value: string
  onChange: (value: TissParticipationDegree) => void
  error?: boolean
  helperText?: string
}

export function GrauParticipacaoField({
  value,
  onChange,
  error,
  helperText,
}: GrauParticipacaoFieldProps) {
  return (
    <TextField
      select
      label="Grau de participação"
      value={value}
      onChange={(event) => onChange(event.target.value as TissParticipationDegree)}
      error={error}
      helperText={helperText ?? 'Padrão 12, clínico. Enviado no XML de SP/SADT.'}
    >
      {TISS_PARTICIPATION_DEGREE_CODES.map((code) => (
        <MenuItem key={code} value={code}>
          {code} — {TISS_PARTICIPATION_DEGREE_LABELS[code]}
        </MenuItem>
      ))}
    </TextField>
  )
}
