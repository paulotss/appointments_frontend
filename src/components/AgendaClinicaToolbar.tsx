import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import SearchIcon from '@mui/icons-material/Search'
import TuneIcon from '@mui/icons-material/Tune'
import {
  Badge,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Popover,
  Stack,
  TextField,
} from '@mui/material'
import { useMemo, useState } from 'react'
import type { ClinicalAppointmentStatus, ClinicalAppointmentType } from '../types/agendamentoClinico'
import {
  CLINICAL_APPOINTMENT_STATUSES,
  CLINICAL_APPOINTMENT_STATUS_LABELS,
  CLINICAL_APPOINTMENT_TYPES,
  CLINICAL_APPOINTMENT_TYPE_LABELS,
} from '../types/agendamentoClinico'
import type { Patient } from '../types/paciente'
import type { HealthProfessional } from '../types/profissional'
import { tituloDiaPt, tituloMesPt } from '../utils/dataHoraSaoPaulo'
import { AgendaCalendarioMini } from './AgendaCalendarioMini'
import type { VisaoAgenda } from './AgendaClinicaCalendario'
import { AgendaFiltroPessoaChip } from './AgendaFiltroPessoaChip'
import { PacienteBuscaAutocomplete } from './PacienteBuscaAutocomplete'
import { ProfissionalBuscaAutocomplete } from './ProfissionalBuscaAutocomplete'

export type VisaoTela = VisaoAgenda | 'lista'

const VISAO_LABELS: Record<VisaoTela, string> = {
  dia: 'Dia',
  semana: 'Semana',
  mes: 'Mês',
  lista: 'Lista',
}

const VISOES: VisaoTela[] = ['dia', 'semana', 'mes', 'lista']

function capitalizar(texto: string): string {
  if (!texto) return texto
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function tituloToolbar(visao: VisaoTela, dataRef: string): string {
  if (visao === 'dia') return tituloDiaPt(dataRef)
  return capitalizar(tituloMesPt(dataRef))
}

interface AgendaClinicaToolbarProps {
  visao: VisaoTela
  onVisaoChange: (visao: VisaoTela) => void
  dataRef: string
  onDataRefChange: (ymd: string) => void
  onHoje: () => void
  onAnterior: () => void
  onProximo: () => void
  filtroPaciente: Patient | null
  onFiltroPacienteChange: (paciente: Patient | null) => void
  filtroProfissional: HealthProfessional | null
  onFiltroProfissionalChange: (profissional: HealthProfessional | null) => void
  filtroTipo: ClinicalAppointmentType | ''
  onFiltroTipoChange: (tipo: ClinicalAppointmentType | '') => void
  filtroStatus: ClinicalAppointmentStatus | ''
  onFiltroStatusChange: (status: ClinicalAppointmentStatus | '') => void
  onNovoAgendamento: () => void
}

export function AgendaClinicaToolbar({
  visao,
  onVisaoChange,
  dataRef,
  onDataRefChange,
  onHoje,
  onAnterior,
  onProximo,
  filtroPaciente,
  onFiltroPacienteChange,
  filtroProfissional,
  onFiltroProfissionalChange,
  filtroTipo,
  onFiltroTipoChange,
  filtroStatus,
  onFiltroStatusChange,
  onNovoAgendamento,
}: AgendaClinicaToolbarProps) {
  const [dataAnchor, setDataAnchor] = useState<HTMLElement | null>(null)
  const [buscaAnchor, setBuscaAnchor] = useState<HTMLElement | null>(null)
  const [filtrosAnchor, setFiltrosAnchor] = useState<HTMLElement | null>(null)
  const [visaoAnchor, setVisaoAnchor] = useState<HTMLElement | null>(null)

  const titulo = useMemo(() => tituloToolbar(visao, dataRef), [visao, dataRef])
  const filtrosExtrasAtivos = filtroTipo !== '' || filtroStatus !== ''

  return (
    <Paper sx={{ px: 1, py: 0.75 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          minWidth: 0,
          overflowX: 'auto',
          flexWrap: 'nowrap',
        }}
      >
        <IconButton
          aria-label="Novo agendamento"
          onClick={onNovoAgendamento}
          size="small"
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            width: 36,
            height: 36,
            flexShrink: 0,
          }}
        >
          <AddIcon />
        </IconButton>

        <Button size="small" variant="outlined" onClick={onHoje} sx={{ flexShrink: 0, borderRadius: 5, px: 1.5 }}>
          Hoje
        </Button>

        <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <IconButton aria-label="Anterior" onClick={onAnterior} size="small">
            <ChevronLeftIcon />
          </IconButton>
          <IconButton aria-label="Próximo" onClick={onProximo} size="small">
            <ChevronRightIcon />
          </IconButton>
        </Box>

        <Button
          color="inherit"
          onClick={(event) => setDataAnchor(event.currentTarget)}
          endIcon={<ArrowDropDownIcon />}
          aria-haspopup="dialog"
          aria-expanded={Boolean(dataAnchor)}
          aria-label="Selecionar data"
          sx={{
            flexShrink: 0,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '1.05rem',
            color: 'text.primary',
            px: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {titulo}
        </Button>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            flex: 1,
            minWidth: 0,
          }}
        >
          {filtroProfissional ? (
            <AgendaFiltroPessoaChip
              name={filtroProfissional.name}
              tipo="profissional"
              onDelete={() => onFiltroProfissionalChange(null)}
            />
          ) : null}
          {filtroPaciente ? (
            <AgendaFiltroPessoaChip
              name={filtroPaciente.name}
              tipo="paciente"
              onDelete={() => onFiltroPacienteChange(null)}
            />
          ) : null}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, ml: 'auto', flexShrink: 0 }}>
          <IconButton
            aria-label="Pesquisar profissional ou paciente"
            onClick={(event) => setBuscaAnchor(event.currentTarget)}
            size="small"
          >
            <SearchIcon />
          </IconButton>

          <IconButton
            aria-label="Mais filtros"
            onClick={(event) => setFiltrosAnchor(event.currentTarget)}
            size="small"
          >
            <Badge color="primary" variant="dot" invisible={!filtrosExtrasAtivos}>
              <TuneIcon />
            </Badge>
          </IconButton>

          <Button
            size="small"
            variant="outlined"
            onClick={(event) => setVisaoAnchor(event.currentTarget)}
            endIcon={<ArrowDropDownIcon />}
            aria-haspopup="menu"
            aria-expanded={Boolean(visaoAnchor)}
            sx={{ borderRadius: 5, textTransform: 'none', px: 1.5 }}
          >
            {VISAO_LABELS[visao]}
          </Button>
        </Box>
      </Box>

      <Popover
        open={Boolean(dataAnchor)}
        anchorEl={dataAnchor}
        onClose={() => setDataAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      >
        <AgendaCalendarioMini
          dataSelecionada={dataRef}
          onSelecionar={(ymd) => {
            onDataRefChange(ymd)
            setDataAnchor(null)
          }}
        />
      </Popover>

      <Popover
        open={Boolean(buscaAnchor)}
        anchorEl={buscaAnchor}
        onClose={() => setBuscaAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        disableAutoFocus
        disableEnforceFocus
        slotProps={{
          paper: { sx: { overflow: 'visible' } },
        }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 320 }}>
          <ProfissionalBuscaAutocomplete
            value={filtroProfissional}
            onChange={onFiltroProfissionalChange}
            size="small"
            fullWidth
            disableListPortal
          />
          <PacienteBuscaAutocomplete
            value={filtroPaciente}
            onChange={onFiltroPacienteChange}
            size="small"
            fullWidth
            disableListPortal
          />
        </Stack>
      </Popover>

      <Popover
        open={Boolean(filtrosAnchor)}
        anchorEl={filtrosAnchor}
        onClose={() => setFiltrosAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 260 }}>
          <TextField
            select
            size="small"
            label="Tipo"
            value={filtroTipo}
            onChange={(event) => onFiltroTipoChange(event.target.value as ClinicalAppointmentType | '')}
            slotProps={{
              select: {
                MenuProps: { disablePortal: true },
              },
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {CLINICAL_APPOINTMENT_TYPES.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {CLINICAL_APPOINTMENT_TYPE_LABELS[tipo]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Status"
            value={filtroStatus}
            onChange={(event) => onFiltroStatusChange(event.target.value as ClinicalAppointmentStatus | '')}
            slotProps={{
              select: {
                MenuProps: { disablePortal: true },
              },
            }}
          >
            <MenuItem value="">Todos</MenuItem>
            {CLINICAL_APPOINTMENT_STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {CLINICAL_APPOINTMENT_STATUS_LABELS[status]}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Popover>

      <Menu
        anchorEl={visaoAnchor}
        open={Boolean(visaoAnchor)}
        onClose={() => setVisaoAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {VISOES.map((item) => (
          <MenuItem
            key={item}
            selected={item === visao}
            onClick={() => {
              onVisaoChange(item)
              setVisaoAnchor(null)
            }}
          >
            {VISAO_LABELS[item]}
          </MenuItem>
        ))}
      </Menu>
    </Paper>
  )
}
