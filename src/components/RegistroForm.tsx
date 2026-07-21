import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Grid, MenuItem, Paper, TextField } from '@mui/material'
import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { registroSchema, type RegistroFormInput, type RegistroFormValues } from '../schemas/registro.schema'
import type { Especialidade, TipoAtendimento } from '../types/registro'

export interface ContatoFixo {
  telefone: string
  atendimento: Extract<TipoAtendimento, 'telefone' | 'whatsapp'>
  nome?: string
}

/** @deprecated Use ContatoFixo */
export type ContatoFixoChamada = ContatoFixo

interface RegistroFormProps {
  especialidades: Especialidade[]
  onSubmit: (values: RegistroFormValues) => Promise<void>
  loading: boolean
  contatoFixo?: ContatoFixo | null
  /** @deprecated Use contatoFixo */
  contatoFixoChamada?: ContatoFixo | null
}

const atendimentoLabel: Record<'telefone' | 'whatsapp', string> = {
  telefone: 'Telefone',
  whatsapp: 'WhatsApp',
}

const baseDefaultValues: Partial<RegistroFormInput> = {
  nome: '',
  telefone: '',
  motivo: null,
  especialidade_id: undefined,
  observacoes: '',
}

export function RegistroForm({
  especialidades,
  onSubmit,
  loading,
  contatoFixo,
  contatoFixoChamada,
}: RegistroFormProps) {
  const contato = contatoFixo ?? contatoFixoChamada ?? null

  const defaultValues = useMemo<Partial<RegistroFormInput>>(() => {
    if (!contato) {
      return { ...baseDefaultValues }
    }
    return {
      ...baseDefaultValues,
      ...(contato.nome?.trim() ? { nome: contato.nome.trim() } : {}),
      telefone: contato.telefone,
      atendimento: contato.atendimento,
    }
  }, [contato])

  const {
    control,
    register,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm<RegistroFormInput, unknown, RegistroFormValues>({
    resolver: zodResolver(registroSchema),
    defaultValues,
  })

  const agendamento = useWatch({ control, name: 'agendamento' })

  useEffect(() => {
    if (agendamento === 'sim') {
      resetField('motivo', { defaultValue: null })
    }
  }, [agendamento, resetField])

  return (
    <Paper sx={{ p: 2.5 }}>
      <Grid
        component="form"
        container
        spacing={2}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Nome"
            fullWidth
            required
            error={Boolean(errors.nome)}
            helperText={errors.nome?.message}
            {...register('nome')}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            label="Telefone"
            fullWidth
            required
            error={Boolean(errors.telefone)}
            helperText={errors.telefone?.message}
            {...register('telefone')}
            slotProps={{
              input: {
                readOnly: Boolean(contato),
              },
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          {contato ? (
            <>
              <input type="hidden" {...register('atendimento')} />
              <TextField
                label="Atendimento"
                fullWidth
                required
                defaultValue={atendimentoLabel[contato.atendimento]}
                slotProps={{ input: { readOnly: true } }}
              />
            </>
          ) : (
            <TextField
              select
              label="Atendimento"
              fullWidth
              required
              defaultValue=""
              error={Boolean(errors.atendimento)}
              helperText={errors.atendimento?.message}
              {...register('atendimento')}
            >
              <MenuItem value="">Selecione...</MenuItem>
              <MenuItem value="whatsapp">WhatsApp</MenuItem>
              <MenuItem value="telefone">Telefone</MenuItem>
              <MenuItem value="outro">Outro</MenuItem>
            </TextField>
          )}
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            label="Primeira vez"
            fullWidth
            required
            defaultValue=""
            error={Boolean(errors.primeira_vez)}
            helperText={errors.primeira_vez?.message}
            {...register('primeira_vez')}
          >
            <MenuItem value="">Selecione...</MenuItem>
            <MenuItem value="sim">Sim</MenuItem>
            <MenuItem value="nao">Nao</MenuItem>
          </TextField>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            label="Agendamento"
            fullWidth
            required
            defaultValue=""
            error={Boolean(errors.agendamento)}
            helperText={errors.agendamento?.message}
            {...register('agendamento')}
          >
            <MenuItem value="">Selecione...</MenuItem>
            <MenuItem value="sim">Sim</MenuItem>
            <MenuItem value="nao">Nao</MenuItem>
          </TextField>
        </Grid>

        {agendamento === 'nao' ? (
          <Grid size={12}>
            <TextField
              label="Motivo"
              fullWidth
              required
              error={Boolean(errors.motivo)}
              helperText={errors.motivo?.message}
              {...register('motivo')}
            />
          </Grid>
        ) : null}

        <Grid size={{ xs: 12, md: 6 }}>
          <TextField
            select
            label="Especialidade"
            fullWidth
            required
            defaultValue=""
            error={Boolean(errors.especialidade_id)}
            helperText={errors.especialidade_id?.message}
            {...register('especialidade_id', {
              setValueAs: (value: string) => (value ? Number(value) : undefined),
            })}
          >
            <MenuItem value="">Selecione...</MenuItem>
            {especialidades.map((especialidade) => (
              <MenuItem key={especialidade.id} value={especialidade.id}>
                {especialidade.nome}
              </MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid size={12}>
          <TextField label="Observacoes" multiline rows={4} fullWidth {...register('observacoes')} />
        </Grid>

        <Grid size={12}>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Salvando...' : 'Cadastrar registro'}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )
}
