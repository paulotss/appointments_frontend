import { Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material'
import type { ClinicalAppointment } from '../types/agendamentoClinico'
import {
  CLINICAL_APPOINTMENT_STATUS_LABELS,
  CLINICAL_APPOINTMENT_TYPE_LABELS,
} from '../types/agendamentoClinico'
import { formatarDataHoraSaoPaulo, formatarHoraSaoPaulo } from '../utils/dataHoraSaoPaulo'

interface AgendamentosClinicosTableProps {
  agendamentos: ClinicalAppointment[]
  onAbrir: (item: ClinicalAppointment) => void
}

export function AgendamentosClinicosTable({ agendamentos, onAbrir }: AgendamentosClinicosTableProps) {
  const ordenados = [...agendamentos].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
  )

  return (
    <TableContainer component={Paper}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Data/hora</TableCell>
            <TableCell>Paciente</TableCell>
            <TableCell>Profissional</TableCell>
            <TableCell>Tipo</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Guia</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ordenados.map((item) => (
            <TableRow key={item.id} hover sx={{ cursor: 'pointer' }} onClick={() => onAbrir(item)}>
              <TableCell>{formatarDataHoraSaoPaulo(item.scheduledAt)}</TableCell>
              <TableCell>{item.patient?.name ?? '—'}</TableCell>
              <TableCell>{item.healthProfessional?.name ?? '—'}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={CLINICAL_APPOINTMENT_TYPE_LABELS[item.type]}
                  color={item.type === 'private' ? 'primary' : 'info'}
                />
              </TableCell>
              <TableCell>{CLINICAL_APPOINTMENT_STATUS_LABELS[item.status]}</TableCell>
              <TableCell>
                {item.type === 'health_plan'
                  ? item.insuranceGuides.length > 0
                    ? item.insuranceGuides
                        .map((link) =>
                          link.insuranceGuide
                            ? `#${link.insuranceGuide.id} · ${link.insuranceGuide.healthPlan?.name ?? 'Plano'}`
                            : `#${link.insuranceGuideId}`,
                        )
                        .join(' · ')
                    : '—'
                  : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {ordenados.length === 0 ? (
        <Stack sx={{ p: 3 }}>
          <Typography>Nenhum agendamento no período.</Typography>
        </Stack>
      ) : null}
    </TableContainer>
  )
}

interface EventoChipProps {
  item: ClinicalAppointment
  compact?: boolean
  onClick: (item: ClinicalAppointment) => void
}

const STATUS_COR: Record<ClinicalAppointment['status'], string> = {
  marked: '#90a4ae',
  confirmed: '#2e7d32',
  waiting: '#ed6c02',
  attended: '#0277bd',
  finished: '#616161',
}

export function EventoAgendaChip({ item, compact = false, onClick }: EventoChipProps) {
  const cor = item.type === 'private' ? '#1f8f66' : '#1565c0'
  return (
    <Box
      onClick={(event) => {
        event.stopPropagation()
        onClick(item)
      }}
      sx={{
        bgcolor: cor,
        color: '#fff',
        borderLeft: `4px solid ${STATUS_COR[item.status]}`,
        borderRadius: 0.75,
        px: 0.75,
        py: compact ? 0.15 : 0.4,
        fontSize: compact ? 11 : 12,
        lineHeight: 1.25,
        cursor: 'pointer',
        overflow: 'hidden',
        height: compact ? 'auto' : '100%',
        opacity: item.status === 'finished' ? 0.72 : 1,
        '&:hover': { filter: 'brightness(1.08)' },
      }}
    >
      <Box component="span" sx={{ fontWeight: 700, display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {formatarHoraSaoPaulo(item.scheduledAt)} {item.patient?.name ?? 'Paciente'}
      </Box>
      {!compact ? (
        <>
          <Box component="span" sx={{ display: 'block', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', opacity: 0.92 }}>
            {item.healthProfessional?.name ?? ''}
          </Box>
          <Box component="span" sx={{ display: 'block', fontSize: 10, opacity: 0.9 }}>
            {CLINICAL_APPOINTMENT_STATUS_LABELS[item.status]}
          </Box>
        </>
      ) : null}
    </Box>
  )
}
