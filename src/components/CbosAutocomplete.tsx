import { Autocomplete, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import { listarCbos, rotuloCbos, type TissCbos } from '../services/tiss-catalog.service'

interface CbosAutocompleteProps {
  value: string
  onChange: (code: string) => void
  label?: string
  error?: boolean
  helperText?: string
  disabled?: boolean
}

export function CbosAutocomplete({
  value,
  onChange,
  label = 'CBO-S',
  error = false,
  helperText,
  disabled = false,
}: CbosAutocompleteProps) {
  const [opcoes, setOpcoes] = useState<TissCbos[]>([])

  useEffect(() => {
    let ativo = true
    void listarCbos()
      .then((lista) => {
        if (ativo) setOpcoes(lista)
      })
      .catch(() => {
        if (ativo) setOpcoes([])
      })
    return () => {
      ativo = false
    }
  }, [])

  const selecionado = opcoes.find((item) => item.code === value) ?? null

  return (
    <Autocomplete
      options={opcoes}
      value={selecionado}
      disabled={disabled}
      getOptionLabel={rotuloCbos}
      isOptionEqualToValue={(option, selected) => option.code === selected.code}
      onChange={(_, item) => onChange(item?.code ?? '')}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          error={error}
          helperText={helperText}
          placeholder="225125 - Médico clínico"
        />
      )}
    />
  )
}
