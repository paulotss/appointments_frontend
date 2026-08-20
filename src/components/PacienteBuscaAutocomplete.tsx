import type { SxProps, Theme } from '@mui/material'
import { Autocomplete, CircularProgress, TextField } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { listarPacientes } from '../services/patients.service'
import type { Patient } from '../types/paciente'

interface PacienteBuscaAutocompleteProps {
  value: Patient | null
  onChange: (paciente: Patient | null) => void
  label?: string
  error?: boolean
  helperText?: string
  disabled?: boolean
  size?: 'small' | 'medium'
  inputRef?: React.Ref<HTMLInputElement>
  onBlur?: () => void
  sx?: SxProps<Theme>
  fullWidth?: boolean
}

export function PacienteBuscaAutocomplete({
  value,
  onChange,
  label = 'Paciente',
  error,
  helperText,
  disabled,
  size,
  inputRef,
  onBlur,
  sx,
  fullWidth,
}: PacienteBuscaAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value?.name ?? '')
  const [opcoes, setOpcoes] = useState<Patient[]>(value ? [value] : [])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (value?.name && inputValue === '') {
      setInputValue(value.name)
    }
  }, [value, inputValue])

  useEffect(() => {
    let ativo = true
    const termo = inputValue.trim()
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true)
        try {
          const { data } = await listarPacientes({
            ...(termo ? { name: termo } : {}),
            limit: 50,
            page: 1,
          })
          if (!ativo) return
          const lista = [...data]
          if (value && !lista.some((item) => item.id === value.id)) {
            lista.unshift(value)
          }
          setOpcoes(lista)
        } catch {
          if (ativo) setOpcoes(value ? [value] : [])
        } finally {
          if (ativo) setLoading(false)
        }
      })()
    }, 300)
    return () => {
      ativo = false
      window.clearTimeout(timer)
    }
  }, [inputValue, value])

  const opcoesUnicas = useMemo(() => {
    const porId = new Map<number, Patient>()
    for (const item of opcoes) porId.set(item.id, item)
    if (value) porId.set(value.id, value)
    return Array.from(porId.values())
  }, [opcoes, value])

  return (
    <Autocomplete
      options={opcoesUnicas}
      filterOptions={(options) => options}
      getOptionLabel={(paciente) => paciente.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      value={value}
      inputValue={inputValue}
      onInputChange={(_, next, reason) => {
        if (reason !== 'reset') setInputValue(next)
      }}
      onChange={(_, paciente) => {
        onChange(paciente)
        setInputValue(paciente?.name ?? '')
      }}
      onBlur={onBlur}
      disabled={disabled}
      loading={loading}
      sx={sx}
      fullWidth={fullWidth}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          label={label}
          size={size}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={16} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}
