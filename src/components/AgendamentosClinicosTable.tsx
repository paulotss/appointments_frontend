import StickyNote2Icon from '@mui/icons-material/StickyNote2'
import { Box, Chip, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tooltip, Typography } from '@mui/material'
import type { ClinicalAppointment } from '../types/agendamentoClinico'
import {
  CLINICAL_APPOINTMENT_STATUS_CORES,
  CLINICAL_APPOINTMENT_STATUS_LABELS,
  CLINICAL_APPOINTMENT_TYPE_CORES,
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
              <TableCell>
                {formatarDataHoraSaoPaulo(item.scheduledAt)} – {formatarHoraSaoPaulo(item.endsAt)}
              </TableCell>
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

export function EventoAgendaChip({ item, compact = false, onClick }: EventoChipProps) {
  const nota = item.notes?.trim() || ''

  return (
    <Box
      onClick={(event) => {
        event.stopPropagation()
        onClick(item)
      }}
      sx={{
        position: 'relative',
        bgcolor: CLINICAL_APPOINTMENT_STATUS_CORES[item.status],
        color: '#fff',
        borderLeft: `4px solid ${CLINICAL_APPOINTMENT_TYPE_CORES[item.type]}`,
        borderRadius: 0.75,
        px: 0.75,
        py: compact ? 0.15 : 0.4,
        pr: nota ? 2 : 0.75,
        fontSize: compact ? 11 : 12,
        lineHeight: 1.25,
        cursor: 'pointer',
        overflow: 'hidden',
        height: compact ? 'auto' : '100%',
        opacity: item.status === 'finished' ? 0.72 : 1,
        '&:hover': { filter: 'brightness(1.08)' },
      }}
    >
      {nota ? (
        <Tooltip
          title={
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', maxWidth: 280 }}>
              {nota}
            </Typography>
          }
          arrow
        >
          <Box
            component="span"
            sx={{
              position: 'absolute',
              top: compact ? 1 : 2,
              right: 2,
              display: 'flex',
              lineHeight: 0,
              zIndex: 1,
            }}
          >
            <StickyNote2Icon sx={{ fontSize: compact ? 11 : 13, color: '#ffeb3b' }} />
          </Box>
        </Tooltip>
      ) : null}
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
