import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'
import { IconButton, InputAdornment, TextField, type TextFieldProps } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  dataBRParaIso,
  isoDatePrefix,
  isoParaDataBR,
  mascararDataBR,
} from '../utils/dataISO'

type CampoDataProps = Omit<TextFieldProps, 'type' | 'value' | 'onChange' | 'defaultValue'> & {
  value?: string | null
  onChange: (value: string) => void
  min?: string
  max?: string
}

export function CampoData({
  value,
  onChange,
  onBlur,
  inputRef,
  min,
  max,
  placeholder = 'dd/mm/aaaa',
  InputLabelProps,
  InputProps,
  inputProps,
  ...props
}: CampoDataProps) {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(isoDatePrefix(value)) ? isoDatePrefix(value) : ''
  const [texto, setTexto] = useState(() => isoParaDataBR(iso))
  const [focado, setFocado] = useState(false)

  useEffect(() => {
    if (!focado) setTexto(isoParaDataBR(iso))
  }, [iso, focado])

  function confirmar(proximoIso: string) {
    onChange(proximoIso)
  }

  return (
    <TextField
      {...props}
      placeholder={placeholder}
      value={texto}
      onChange={(event) => {
        const mascarado = mascararDataBR(event.target.value)
        setTexto(mascarado)
        if (mascarado === '') {
          confirmar('')
          return
        }
        const convertido = dataBRParaIso(mascarado)
        if (convertido) confirmar(convertido)
      }}
      onFocus={() => setFocado(true)}
      onBlur={(event) => {
        setFocado(false)
        setTexto(isoParaDataBR(iso))
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
                type="date"
                aria-label="Selecionar data no calendário"
                value={iso}
                min={min}
                max={max}
                onChange={(event) => {
                  const proximo = event.target.value
                  setTexto(isoParaDataBR(proximo))
                  confirmar(proximo)
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
