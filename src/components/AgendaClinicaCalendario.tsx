import { Box, Typography } from '@mui/material'
import type { ClinicalAppointment } from '../types/agendamentoClinico'
import { EventoAgendaChip } from './AgendamentosClinicosTable'
import {
  DIAS_SEMANA_CURTOS,
  diasDaSemana,
  gradeDoMes,
  indiceSemanaSegunda,
  isoParaHmSaoPaulo,
  isoParaYmdSaoPaulo,
  mesmoMes,
  ymdEmSaoPaulo,
} from '../utils/dataHoraSaoPaulo'

export type VisaoAgenda = 'dia' | 'semana' | 'mes'

const HORA_INICIO = 7
const HORA_FIM = 21
const PX_POR_HORA = 112
const SLOT_MIN = 30
const SLOTS = Array.from(
  { length: ((HORA_FIM - HORA_INICIO) * 60) / SLOT_MIN },
  (_, i) => HORA_INICIO * 60 + i * SLOT_MIN,
)

function formatarMinutosDoDia(minutos: number): string {
  const hora = Math.floor(minutos / 60)
  const minuto = minutos % 60
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`
}

interface AgendaClinicaCalendarioProps {
  visao: VisaoAgenda
  dataRef: string
  agendamentos: ClinicalAppointment[]
  onSlotClick: (ymd: string, hm: string) => void
  onEventoClick: (item: ClinicalAppointment) => void
  onDiaClick: (ymd: string) => void
}

type EventoPosicionado = {
  item: ClinicalAppointment
  top: number
  height: number
  col: number
  colCount: number
  startMin: number
}

function minutosDoIso(iso: string): number {
  const [h, m] = isoParaHmSaoPaulo(iso).split(':').map(Number)
  return h * 60 + m
}

function posicionarEventos(items: ClinicalAppointment[]): EventoPosicionado[] {
  const preparados = items
    .map((item) => {
      const startMin = minutosDoIso(item.scheduledAt)
      const endMin = Math.max(minutosDoIso(item.endsAt), startMin + SLOT_MIN)
      return { item, startMin, endMin }
    })
    .sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)

  const clusters: (typeof preparados)[] = []
  let atual: typeof preparados = []
  let fimCluster = -1
  for (const ev of preparados) {
    if (atual.length === 0 || ev.startMin < fimCluster) {
      atual.push(ev)
      fimCluster = Math.max(fimCluster, ev.endMin)
    } else {
      clusters.push(atual)
      atual = [ev]
      fimCluster = ev.endMin
    }
  }
  if (atual.length > 0) clusters.push(atual)

  const resultado: EventoPosicionado[] = []
  for (const cluster of clusters) {
    const colunas: number[] = []
    const alocados: { ev: (typeof cluster)[number]; col: number }[] = []
    for (const ev of cluster) {
      let col = colunas.findIndex((fim) => fim <= ev.startMin)
      if (col === -1) {
        col = colunas.length
        colunas.push(ev.endMin)
      } else {
        colunas[col] = ev.endMin
      }
      alocados.push({ ev, col })
    }
    const colCount = colunas.length
    for (const alocado of alocados) {
      resultado.push({
        item: alocado.ev.item,
        startMin: alocado.ev.startMin,
        top: ((alocado.ev.startMin - HORA_INICIO * 60) / 60) * PX_POR_HORA,
        height: Math.max(((alocado.ev.endMin - alocado.ev.startMin) / 60) * PX_POR_HORA, 56),
        col: alocado.col,
        colCount,
      })
    }
  }
  return resultado
}

function agendamentosDoDia(agendamentos: ClinicalAppointment[], ymd: string): ClinicalAppointment[] {
  return agendamentos.filter((item) => isoParaYmdSaoPaulo(item.scheduledAt) === ymd)
}

function GradeHorarios({
  dias,
  agendamentos,
  onSlotClick,
  onEventoClick,
}: {
  dias: string[]
  agendamentos: ClinicalAppointment[]
  onSlotClick: (ymd: string, hm: string) => void
  onEventoClick: (item: ClinicalAppointment) => void
}) {
  const hoje = ymdEmSaoPaulo()
  const altura = (HORA_FIM - HORA_INICIO) * PX_POR_HORA

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: `56px repeat(${dias.length}, minmax(0, 1fr))`, minWidth: dias.length > 1 ? 720 : 360 }}>
      <Box />
      {dias.map((ymd) => {
        const [y, m, d] = ymd.split('-')
        const isHoje = ymd === hoje
        return (
          <Box
            key={`cab-${ymd}`}
            sx={{
              textAlign: 'center',
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: isHoje ? 'primary.light' : 'transparent',
            }}
          >
            <Typography variant="caption" sx={{ textTransform: 'uppercase', color: 'text.secondary', fontWeight: 700 }}>
              {DIAS_SEMANA_CURTOS[indiceSemanaSegunda(ymd)]}
            </Typography>
            <Typography variant="h6" fontWeight={700} color={isHoje ? 'primary.dark' : 'text.primary'}>
              {Number(d)}/{m}
            </Typography>
            <Typography variant="caption" sx={{ display: 'none' }}>
              {y}
            </Typography>
          </Box>
        )
      })}

      <Box sx={{ position: 'relative', height: altura }}>
        {SLOTS.map((minutos) => {
          const ehHoraCheia = minutos % 60 === 0
          return (
            <Box
              key={minutos}
              sx={{
                height: PX_POR_HORA / 2,
                pr: 1,
                textAlign: 'right',
                fontSize: ehHoraCheia ? 12 : 10,
                color: 'text.secondary',
                transform: 'translateY(-8px)',
              }}
            >
              {formatarMinutosDoDia(minutos)}
            </Box>
          )
        })}
      </Box>

      {dias.map((ymd) => {
        const eventos = posicionarEventos(agendamentosDoDia(agendamentos, ymd))
        return (
          <Box
            key={ymd}
            sx={{
              position: 'relative',
              height: altura,
              borderLeft: '1px solid',
              borderColor: 'divider',
              bgcolor: ymd === hoje ? 'rgba(31, 143, 102, 0.04)' : '#fff',
            }}
          >
            {SLOTS.map((minutos) => {
              const ehHoraCheia = minutos % 60 === 0
              return (
                <Box
                  key={`${ymd}-${minutos}`}
                  onClick={() => onSlotClick(ymd, formatarMinutosDoDia(minutos))}
                  sx={{
                    height: PX_POR_HORA / 2,
                    borderBottom: '1px solid',
                    borderColor: ehHoraCheia ? 'grey.200' : 'grey.100',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                />
              )
            })}
            {eventos.map((ev) => (
              <Box
                key={ev.item.id}
                sx={{
                  position: 'absolute',
                  top: ev.top + 2,
                  height: ev.height - 4,
                  left: `calc(${(ev.col / ev.colCount) * 100}% + 2px)`,
                  width: `calc(${100 / ev.colCount}% - 4px)`,
                  zIndex: 1,
                }}
              >
                <Box sx={{ height: '100%' }}>
                  <EventoAgendaChip
                    item={ev.item}
                    onClick={onEventoClick}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )
      })}
    </Box>
  )
}

function VisaoMes({
  dataRef,
  agendamentos,
  onDiaClick,
  onEventoClick,
}: {
  dataRef: string
  agendamentos: ClinicalAppointment[]
  onDiaClick: (ymd: string) => void
  onEventoClick: (item: ClinicalAppointment) => void
}) {
  const dias = gradeDoMes(dataRef)
  const hoje = ymdEmSaoPaulo()

  return (
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
        {DIAS_SEMANA_CURTOS.map((dia) => (
          <Box key={dia} sx={{ textAlign: 'center', py: 1, textTransform: 'uppercase', fontSize: 12, fontWeight: 700, color: 'text.secondary' }}>
            {dia}
          </Box>
        ))}
        {dias.map((ymd) => {
          const doMes = mesmoMes(ymd, dataRef)
          const eventos = agendamentosDoDia(agendamentos, ymd)
          const visiveis = eventos.slice(0, 3)
          const resto = eventos.length - visiveis.length
          const isHoje = ymd === hoje
          return (
            <Box
              key={ymd}
              onClick={() => onDiaClick(ymd)}
              sx={{
                minHeight: 110,
                border: '1px solid',
                borderColor: 'grey.200',
                p: 0.75,
                bgcolor: doMes ? '#fff' : 'grey.50',
                cursor: 'pointer',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  width: 28,
                  height: 28,
                  lineHeight: '28px',
                  textAlign: 'center',
                  borderRadius: '50%',
                  fontWeight: 700,
                  mb: 0.5,
                  color: doMes ? 'text.primary' : 'text.disabled',
                  bgcolor: isHoje ? 'primary.main' : 'transparent',
                  ...(isHoje ? { color: 'primary.contrastText' } : {}),
                }}
              >
                {Number(ymd.slice(8, 10))}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
                {visiveis.map((item) => (
                  <EventoAgendaChip key={item.id} item={item} compact onClick={onEventoClick} />
                ))}
                {resto > 0 ? (
                  <Typography variant="caption" color="text.secondary">
                    +{resto} mais
                  </Typography>
                ) : null}
              </Box>
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

export function AgendaClinicaCalendario({
  visao,
  dataRef,
  agendamentos,
  onSlotClick,
  onEventoClick,
  onDiaClick,
}: AgendaClinicaCalendarioProps) {
  if (visao === 'mes') {
    return (
      <VisaoMes
        dataRef={dataRef}
        agendamentos={agendamentos}
        onDiaClick={onDiaClick}
        onEventoClick={onEventoClick}
      />
    )
  }

  const dias = visao === 'dia' ? [dataRef] : diasDaSemana(dataRef)
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <GradeHorarios
        dias={dias}
        agendamentos={agendamentos}
        onSlotClick={onSlotClick}
        onEventoClick={onEventoClick}
      />
    </Box>
  )
}
