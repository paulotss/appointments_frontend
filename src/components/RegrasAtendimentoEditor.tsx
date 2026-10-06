import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { listarProcedimentosPorEspecialidades } from '../services/procedures.service'
import type { ScheduleRuleInput } from '../types/profissional'
import type { Procedure } from '../types/procedimento'
import { DIAS_SEMANA_BLOQUEIO } from '../utils/bloqueioHorario'

interface RegrasAtendimentoEditorProps {
  value: ScheduleRuleInput[]
  onChange: (next: ScheduleRuleInput[]) => void
  specialtyIds: number[]
  error?: string
}

export function regrasParaApi(rules: ScheduleRuleInput[]) {
  return rules.map((rule) => ({
    procedureId: rule.procedureId,
    maxConcurrentAppointments: rule.maxConcurrentAppointments,
    durationMinutes: rule.durationMinutes,
    slotIntervalMinutes: rule.slotIntervalMinutes,
    allowOverbooking: rule.allowOverbooking,
    notes: rule.notes?.trim() ? rule.notes.trim() : null,
    windows: rule.windows.map((window) => ({
      weekday: window.weekday,
      startTime: window.startTime,
      endTime: window.endTime,
    })),
  }))
}

function regraVazia(): ScheduleRuleInput {
  return {
    procedureId: 0,
    maxConcurrentAppointments: 1,
    durationMinutes: 30,
    slotIntervalMinutes: 30,
    allowOverbooking: false,
    notes: '',
    windows: [{ weekday: 1, startTime: '08:00', endTime: '12:00' }],
  }
}

export function RegrasAtendimentoEditor({
  value,
  onChange,
  specialtyIds,
  error,
}: RegrasAtendimentoEditorProps) {
  const [procedimentos, setProcedimentos] = useState<Procedure[]>([])
  const [carregando, setCarregando] = useState(false)
  const chaveEspecialidades = specialtyIds.filter((id) => id > 0).join(',')

  useEffect(() => {
    const ids = chaveEspecialidades
      .split(',')
      .map((item) => Number(item))
      .filter((id) => id > 0)
    if (ids.length === 0) {
      setProcedimentos([])
      return
    }
    let ativo = true
    setCarregando(true)
    void listarProcedimentosPorEspecialidades(ids)
      .then((data) => {
        if (ativo) setProcedimentos(data)
      })
      .catch(() => {
        if (ativo) setProcedimentos([])
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [chaveEspecialidades])

  function atualizar(index: number, patch: Partial<ScheduleRuleInput>) {
    onChange(value.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)))
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" fontWeight={700}>
        Regras de atendimento
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Duração, vagas no mesmo horário e os períodos em que cada procedimento pode ser marcado. Sem
        regra, o agente de IA não agenda esse procedimento. Na recepção, uma marcação fora da regra
        apenas pede confirmação.
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {carregando ? <CircularProgress size={18} /> : null}
      {value.map((regra, index) => {
        const opcoes = procedimentos.some((item) => item.id === regra.procedureId)
          ? procedimentos
          : regra.procedure
            ? [...procedimentos, { ...regra.procedure, specialtyId: 0, value: 0, tissGuideType: 'sp_sadt' as const, healthPlanPrices: [] }]
            : procedimentos
        return (
          <Stack
            key={`regra-${index}`}
            spacing={1.5}
            sx={{ border: 1, borderColor: 'divider', borderRadius: 1, p: 1.5 }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="subtitle2">Procedimento</Typography>
              <IconButton
                aria-label="Remover regra"
                onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
              >
                <DeleteOutlineIcon />
              </IconButton>
            </Stack>
            <TextField
              select
              label="Procedimento"
              value={regra.procedureId || ''}
              onChange={(event) => atualizar(index, { procedureId: Number(event.target.value) })}
            >
              {opcoes.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {item.name}
                </MenuItem>
              ))}
            </TextField>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                label="Vagas no mesmo horário"
                type="number"
                value={regra.maxConcurrentAppointments}
                onChange={(event) =>
                  atualizar(index, { maxConcurrentAppointments: Number(event.target.value) })
                }
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <TextField
                label="Duração (min)"
                type="number"
                value={regra.durationMinutes}
                onChange={(event) => atualizar(index, { durationMinutes: Number(event.target.value) })}
                slotProps={{ htmlInput: { min: 1 } }}
              />
              <TextField
                label="Intervalo da grade (min)"
                type="number"
                value={regra.slotIntervalMinutes}
                onChange={(event) =>
                  atualizar(index, { slotIntervalMinutes: Number(event.target.value) })
                }
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </Stack>
            <FormControlLabel
              control={
                <Switch
                  checked={regra.allowOverbooking}
                  onChange={(_, checked) => atualizar(index, { allowOverbooking: checked })}
                />
              }
              label="Permite encaixe acima da capacidade"
            />
            <TextField
              label="Observações"
              value={regra.notes ?? ''}
              onChange={(event) => atualizar(index, { notes: event.target.value })}
            />
            <Typography variant="body2" color="text.secondary">
              Horários em que este procedimento é atendido
            </Typography>
            {regra.windows.map((janela, janelaIndex) => (
              <Stack
                key={`janela-${index}-${janelaIndex}`}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1.5}
              >
                <TextField
                  select
                  label="Dia"
                  value={janela.weekday}
                  onChange={(event) => {
                    const windows = regra.windows.map((item, itemIndex) =>
                      itemIndex === janelaIndex
                        ? { ...item, weekday: Number(event.target.value) }
                        : item,
                    )
                    atualizar(index, { windows })
                  }}
                  sx={{ minWidth: 110 }}
                >
                  {DIAS_SEMANA_BLOQUEIO.map((dia) => (
                    <MenuItem key={dia.value} value={dia.value}>
                      {dia.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Início"
                  value={janela.startTime}
                  onChange={(event) => {
                    const windows = regra.windows.map((item, itemIndex) =>
                      itemIndex === janelaIndex ? { ...item, startTime: event.target.value } : item,
                    )
                    atualizar(index, { windows })
                  }}
                  placeholder="08:00"
                  slotProps={{ htmlInput: { maxLength: 5 } }}
                  sx={{ width: { sm: 120 } }}
                />
                <TextField
                  label="Fim"
                  value={janela.endTime}
                  onChange={(event) => {
                    const windows = regra.windows.map((item, itemIndex) =>
                      itemIndex === janelaIndex ? { ...item, endTime: event.target.value } : item,
                    )
                    atualizar(index, { windows })
                  }}
                  placeholder="12:00"
                  slotProps={{ htmlInput: { maxLength: 5 } }}
                  sx={{ width: { sm: 120 } }}
                />
                <IconButton
                  aria-label="Remover horário"
                  onClick={() =>
                    atualizar(index, {
                      windows: regra.windows.filter((_, itemIndex) => itemIndex !== janelaIndex),
                    })
                  }
                  sx={{ alignSelf: { sm: 'center' } }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
            ))}
            <Button
              type="button"
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() =>
                atualizar(index, {
                  windows: [...regra.windows, { weekday: 1, startTime: '14:00', endTime: '18:00' }],
                })
              }
              sx={{ alignSelf: 'flex-start' }}
            >
              Adicionar horário
            </Button>
          </Stack>
        )
      })}
      <Button
        type="button"
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={() => onChange([...value, regraVazia()])}
        sx={{ alignSelf: 'flex-start' }}
      >
        Adicionar regra
      </Button>
    </Stack>
  )
}
