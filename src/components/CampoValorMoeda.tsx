import { TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import {
  digitosParaNumeroMoedaBRL,
  formatarMoedaBRL,
  normalizarDigitosMoedaBRL,
  numeroParaDigitosMoedaBRL,
} from '../utils/moedaBRL'

interface CampoValorMoedaProps {
  value: number | undefined
  onChange: (value: number | undefined) => void
  onBlur?: () => void
  inputRef?: React.Ref<HTMLInputElement>
  error?: boolean
  helperText?: string
  label: string
}

export function CampoValorMoeda({
  value,
  onChange,
  onBlur,
  inputRef,
  error,
  helperText,
  label,
}: CampoValorMoedaProps) {
  const [digitos, setDigitos] = useState(() => numeroParaDigitosMoedaBRL(value))

  useEffect(() => {
    setDigitos(numeroParaDigitosMoedaBRL(value))
  }, [value])

  return (
    <TextField
      label={label}
      value={digitos === '' ? '' : formatarMoedaBRL(digitosParaNumeroMoedaBRL(digitos))}
      onChange={(event) => {
        const novosDigitos = normalizarDigitosMoedaBRL(digitos, event.target.value)
        setDigitos(novosDigitos)
        onChange(digitosParaNumeroMoedaBRL(novosDigitos))
      }}
      onBlur={onBlur}
      inputRef={inputRef}
      inputProps={{ inputMode: 'numeric' }}
      error={error}
      helperText={helperText}
    />
  )
}
