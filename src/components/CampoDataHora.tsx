import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  dataHoraBRParaIsoLocal,
  isoDateTimeLocalParaBr,
  mascararDataHoraBR,
} from '../utils/dataISO'

type CampoDataHoraProps = Omit<TextFieldProps, 'type' | 'value' | 'onChange' | 'defaultValue'> & {
  value?: string | null
  onChange: (value: string) => void
}

export function CampoDataHora({
  value,
  onChange,
  onBlur,
  inputRef,
  placeholder = 'dd/mm/aaaa hh:mm',
  InputLabelProps,
  InputProps,
  inputProps,
  ...props
}: CampoDataHoraProps) {
  const iso = value ?? ''
  const [texto, setTexto] = useState(() => isoDateTimeLocalParaBr(iso))
  const [focado, setFocado] = useState(false)

  useEffect(() => {
    if (!focado) setTexto(isoDateTimeLocalParaBr(iso))
  }, [iso, focado])

  return (
    <TextField
      {...props}
      placeholder={placeholder}
      value={texto}
      onChange={(event) => {
        const mascarado = mascararDataHoraBR(event.target.value)
        setTexto(mascarado)
        if (mascarado.trim() === '') {
          onChange('')
          return
        }
        const convertido = dataHoraBRParaIsoLocal(mascarado)
        if (convertido) onChange(convertido)
      }}
      onFocus={() => setFocado(true)}
      onBlur={(event) => {
        setFocado(false)
        setTexto(isoDateTimeLocalParaBr(iso))
        onBlur?.(event)
      }}
      inputRef={inputRef}
      InputLabelProps={{ shrink: true, ...InputLabelProps }}
      inputProps={{ inputMode: 'numeric', autoComplete: 'off', ...inputProps }}
      InputProps={{
        ...InputProps,
        endAdornment: (
          <InputAdornment position="end">
            {InputProps?.endAdornment}
            <IconButton
              component="span"
              aria-label="Abrir calendário"
              edge="end"
              size="small"
              sx={{ position: 'relative', overflow: 'hidden' }}
            >
              <CalendarMonthIcon fontSize="small" />
              <input
                type="datetime-local"
                aria-label="Selecionar data e hora no calendário"
                value={/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/.test(iso) ? iso.slice(0, 16) : ''}
                onChange={(event) => {
                  const proximo = event.target.value
                  setTexto(isoDateTimeLocalParaBr(proximo))
                  onChange(proximo)
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                  width: '100%',
                  height: '100%',
                }}
              />
            </IconButton>
          </InputAdornment>
        ),
      }}
    />
  )
}
