import { Autocomplete, CircularProgress, TextField } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { listarProfissionais } from '../services/health-professionals.service'
import type { HealthProfessional } from '../types/profissional'

interface ProfissionalBuscaAutocompleteProps {
  value: HealthProfessional | null
  onChange: (profissional: HealthProfessional | null) => void
  label?: string
  error?: boolean
  helperText?: string
  disabled?: boolean
  size?: 'small' | 'medium'
  inputRef?: React.Ref<HTMLInputElement>
  onBlur?: () => void
  somenteAtivos?: boolean
}

export function ProfissionalBuscaAutocomplete({
  value,
  onChange,
  label = 'Profissional',
  error,
  helperText,
  disabled,
  size,
  inputRef,
  onBlur,
  somenteAtivos = false,
}: ProfissionalBuscaAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value?.name ?? '')
  const [opcoes, setOpcoes] = useState<HealthProfessional[]>(value ? [value] : [])
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
          const { data } = await listarProfissionais({
            ...(termo ? { name: termo } : {}),
            limit: 50,
            page: 1,
          })
          if (!ativo) return
          let lista = data
          if (somenteAtivos) {
            lista = lista.filter((item) => item.isActive || item.id === value?.id)
          }
          if (value && !lista.some((item) => item.id === value.id)) {
            lista = [value, ...lista]
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
  }, [inputValue, value, somenteAtivos])

  const opcoesUnicas = useMemo(() => {
    const porId = new Map<number, HealthProfessional>()
    for (const item of opcoes) porId.set(item.id, item)
    if (value) porId.set(value.id, value)
    return Array.from(porId.values())
  }, [opcoes, value])

  return (
    <Autocomplete
      options={opcoesUnicas}
      filterOptions={(options) => options}
      getOptionLabel={(profissional) => profissional.name}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      value={value}
      inputValue={inputValue}
      onInputChange={(_, next, reason) => {
        if (reason !== 'reset') setInputValue(next)
      }}
      onChange={(_, profissional) => {
        onChange(profissional)
        setInputValue(profissional?.name ?? '')
      }}
      onBlur={onBlur}
      disabled={disabled}
      loading={loading}
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
