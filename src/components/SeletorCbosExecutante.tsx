import { MenuItem, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import { listarCbos, rotuloCbos } from '../services/tiss-catalog.service'
import type { HealthProfessional } from '../types/profissional'

export function cbosDoProfissional(profissional: HealthProfessional | null | undefined): string[] {
  const codes = new Set<string>()
  for (const link of profissional?.specialties ?? []) {
    const code = link.specialty?.cbosCode?.replace(/\D/g, '') ?? ''
    if (code.length === 6) codes.add(code)
  }
  return [...codes]
}

export function cbosInicial(
  profissional: HealthProfessional | null | undefined,
  lido?: string | null,
): string {
  const codes = cbosDoProfissional(profissional)
  const normalizado = (lido ?? '').replace(/\D/g, '')
  if (normalizado.length === 6 && codes.includes(normalizado)) return normalizado
  return codes.length === 1 ? codes[0]! : ''
}

interface SeletorCbosExecutanteProps {
  profissional: HealthProfessional | null | undefined
  value: string
  onChange: (code: string) => void
  error?: string
}

export function SeletorCbosExecutante({
  profissional,
  value,
  onChange,
  error,
}: SeletorCbosExecutanteProps) {
  const codes = cbosDoProfissional(profissional)
  const [nomes, setNomes] = useState<Record<string, string>>({})

  useEffect(() => {
    void listarCbos()
      .then((lista) => {
        setNomes(Object.fromEntries(lista.map((item) => [item.code, item.name])))
      })
      .catch(() => setNomes({}))
  }, [])

  const codesKey = codes.join(',')

  useEffect(() => {
    if (!profissional) return
    if (codes.length === 1 && value !== codes[0]) onChange(codes[0]!)
    else if (value && !codes.includes(value)) onChange('')
    // A lista entra pela chave; onChange e value vêm do render em que ela muda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codesKey, profissional?.id])

  return (
    <TextField
      select
      label="CBOS do profissional executante"
      value={codes.includes(value) ? value : ''}
      onChange={(event) => onChange(event.target.value)}
      error={Boolean(error) || codes.length === 0}
      helperText={
        error ||
        (codes.length === 0
          ? 'Cadastre o CBO-S nas especialidades deste profissional.'
          : 'Escolha um CBO-S das especialidades que ele atende.')
      }
      required
      disabled={codes.length === 0}
    >
      {codes.map((code) => (
        <MenuItem key={code} value={code}>
          {rotuloCbos({ code, name: nomes[code] })}
        </MenuItem>
      ))}
    </TextField>
  )
}
