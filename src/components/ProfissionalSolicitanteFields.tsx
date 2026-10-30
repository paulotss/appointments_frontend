import {
  Autocomplete,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import {
  buscarProfissionaisSolicitantes,
  type RequestingProfessional,
} from '../services/requesting-professionals.service'
import { listarCbos, rotuloCbos, type TissCbos } from '../services/tiss-catalog.service'
import { COUNCIL_LABELS, COUNCIL_TYPES, type CouncilType } from '../types/profissional'
import { UFS_BRASIL } from '../utils/ufBrasil'
import { CbosAutocomplete } from './CbosAutocomplete'

export interface SolicitanteFormValue {
  name: string
  councilType: CouncilType | ''
  councilNumber: string
  councilUf: string
  cbosCode: string
  saveForNext: boolean
}

export const SOLICITANTE_VAZIO: SolicitanteFormValue = {
  name: '',
  councilType: '',
  councilNumber: '',
  councilUf: '',
  cbosCode: '',
  saveForNext: false,
}

interface ProfissionalSolicitanteFieldsProps {
  value: SolicitanteFormValue
  onChange: (value: SolicitanteFormValue) => void
  errors?: Partial<Record<'name' | 'councilType' | 'councilNumber' | 'councilUf' | 'cbosCode', string>>
}

export function ProfissionalSolicitanteFields({
  value,
  onChange,
  errors,
}: ProfissionalSolicitanteFieldsProps) {
  const [opcoes, setOpcoes] = useState<RequestingProfessional[]>([])
  const [busca, setBusca] = useState('')
  const [catalogo, setCatalogo] = useState<TissCbos[]>([])

  useEffect(() => {
    void listarCbos().then(setCatalogo).catch(() => setCatalogo([]))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void buscarProfissionaisSolicitantes(busca)
        .then(setOpcoes)
        .catch(() => setOpcoes([]))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [busca])

  function aplicar(parcial: Partial<SolicitanteFormValue>) {
    onChange({ ...value, ...parcial })
  }

  const cbosSelecionado = catalogo.find((item) => item.code === value.cbosCode)

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" fontWeight={700}>
        Dados do profissional solicitante
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Pesquise ao lado um profissional previamente cadastrado ou preencha os campos abaixo manualmente.
      </Typography>
      <Autocomplete
        options={opcoes}
        getOptionLabel={(item) => item.label}
        filterOptions={(items) => items}
        inputValue={busca}
        onInputChange={(_, texto) => setBusca(texto)}
        onChange={(_, item) => {
          if (!item) return
          aplicar({
            name: item.name,
            councilType: item.councilType,
            councilNumber: item.councilNumber,
            councilUf: item.councilUf,
            cbosCode: item.cbosCode,
          })
          setBusca(item.label)
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Pesquisar profissional solicitante"
            placeholder="Nome, conselho ou CBO"
          />
        )}
      />
      <TextField
        label="Nome do profissional"
        value={value.name}
        onChange={(event) => aplicar({ name: event.target.value })}
        error={Boolean(errors?.name)}
        helperText={errors?.name}
        required
      />
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <TextField
          select
          label="Tipo de conselho"
          value={value.councilType}
          onChange={(event) => aplicar({ councilType: event.target.value as CouncilType })}
          error={Boolean(errors?.councilType)}
          helperText={errors?.councilType}
          required
          sx={{ flex: 1.4 }}
        >
          {COUNCIL_TYPES.map((tipo) => (
            <MenuItem key={tipo} value={tipo}>
              {COUNCIL_LABELS[tipo]}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          label="Nº conselho"
          value={value.councilNumber}
          onChange={(event) => aplicar({ councilNumber: event.target.value })}
          error={Boolean(errors?.councilNumber)}
          helperText={errors?.councilNumber}
          required
          sx={{ flex: 1 }}
        />
        <TextField
          select
          label="UF"
          value={value.councilUf}
          onChange={(event) => aplicar({ councilUf: event.target.value })}
          error={Boolean(errors?.councilUf)}
          helperText={errors?.councilUf}
          required
          sx={{ width: { sm: 110 } }}
        >
          {UFS_BRASIL.map((uf) => (
            <MenuItem key={uf} value={uf}>
              {uf}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <CbosAutocomplete
        label="Pesquisar CBO"
        value={value.cbosCode}
        onChange={(code) => aplicar({ cbosCode: code })}
        error={Boolean(errors?.cbosCode)}
        helperText={errors?.cbosCode ?? (cbosSelecionado ? rotuloCbos(cbosSelecionado) : 'Obrigatório')}
      />
      <FormControlLabel
        control={
          <Switch
            checked={value.saveForNext}
            onChange={(_, checked) => aplicar({ saveForNext: checked })}
          />
        }
        label="Salvar para próximas autorizações."
      />
    </Stack>
  )
}
