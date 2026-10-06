import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
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
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { BloqueiosSemanaisEditor } from '../components/BloqueiosSemanaisEditor'
import { RegrasAtendimentoEditor, regrasParaApi } from '../components/RegrasAtendimentoEditor'
import { mensagemBloqueiosSemanais, mensagemRegrasAtendimento } from '../schemas/profissional.schema'
import { listarEspecialidades } from '../services/especialidades.service'
import { atualizarProfissional, buscarProfissional } from '../services/health-professionals.service'
import type { Especialidade } from '../types/registro'
import {
  COUNCIL_TYPES,
  type CouncilType,
  type HealthProfessional,
  type ScheduleRuleInput,
  type WeeklyBlockInput,
} from '../types/profissional'
import { mensagemErroApi } from '../utils/apiError'
import { UFS_BRASIL, type UfBrasil } from '../utils/ufBrasil'

const FORM_ID = 'editar-profissional'

type EspecialidadeEdicao = {
  specialtyId: number | ''
}

export function EditarProfissionalPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const profissionalId = Number(id)

  const [profissional, setProfissional] = useState<HealthProfessional | null>(null)
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [specialties, setSpecialties] = useState<EspecialidadeEdicao[]>([])
  const [councilType, setCouncilType] = useState<CouncilType>('CRM')
  const [councilNumber, setCouncilNumber] = useState('')
  const [councilUf, setCouncilUf] = useState<UfBrasil | ''>('')
  const [cbosCode, setCbosCode] = useState('')
  const [cpf, setCpf] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [weeklyBlocks, setWeeklyBlocks] = useState<WeeklyBlockInput[]>([])
  const [scheduleRules, setScheduleRules] = useState<ScheduleRuleInput[]>([])

  useEffect(() => {
    if (!Number.isFinite(profissionalId) || profissionalId <= 0) {
      setError('Profissional inválido.')
      setLoading(false)
      return
    }

    async function carregar() {
      setLoading(true)
      setError(null)
      try {
        const [profissionalCarregado, especialidadesCarregadas] = await Promise.all([
          buscarProfissional(profissionalId),
          listarEspecialidades(),
        ])
        setProfissional(profissionalCarregado)
        setEspecialidades(especialidadesCarregadas)
        setNome(profissionalCarregado.name)
        setSpecialties(
          profissionalCarregado.specialties.length > 0
            ? profissionalCarregado.specialties.map((item) => ({ specialtyId: item.specialtyId }))
            : [{ specialtyId: '' }],
        )
        setCouncilType(profissionalCarregado.councilType)
        setCouncilNumber(profissionalCarregado.councilNumber)
        setCouncilUf(profissionalCarregado.councilUf ?? '')
        setCbosCode(profissionalCarregado.cbosCode ?? '')
        setCpf(profissionalCarregado.cpf)
        setPhone(profissionalCarregado.phone ?? '')
        setEmail(profissionalCarregado.email ?? '')
        setIsActive(profissionalCarregado.isActive)
        setWeeklyBlocks(profissionalCarregado.weeklyBlocks.map((item) => ({ ...item })))
        setScheduleRules(
          profissionalCarregado.scheduleRules.map((rule) => ({
            ...rule,
            windows: rule.windows.map((window) => ({ ...window })),
          })),
        )
      } catch (err) {
        setProfissional(null)
        setError(mensagemErroApi(err, 'Não foi possível carregar o profissional.'))
      } finally {
        setLoading(false)
      }
    }

    void carregar()
  }, [profissionalId])

  function voltar() {
    if (saving) return
    navigate('/profissionais')
  }

  const nomeInvalido = nome.trim().length < 3
  const councilNumberInvalido = councilNumber.trim().length < 1
  const cpfInvalido = cpf.replace(/\D/g, '').length !== 11
  const specialtyIds = specialties
    .map((item) => item.specialtyId)
    .filter((specialtyId): specialtyId is number => specialtyId !== '')
  const specialtiesInvalidas =
    specialties.length === 0 ||
    specialties.some((item) => item.specialtyId === '') ||
    new Set(specialtyIds).size !== specialtyIds.length
  const bloqueiosInvalidos = mensagemBloqueiosSemanais(weeklyBlocks)
  const regrasInvalidas = mensagemRegrasAtendimento(scheduleRules)
  const formularioInvalido =
    nomeInvalido ||
    councilNumberInvalido ||
    cpfInvalido ||
    specialtiesInvalidas ||
    Boolean(bloqueiosInvalidos) ||
    Boolean(regrasInvalidas)

  async function salvar(event: FormEvent) {
    event.preventDefault()
    if (!profissional || formularioInvalido) return
    const cpfDigits = cpf.replace(/\D/g, '')
    const specialtiesPayload = specialties
      .filter((item) => item.specialtyId !== '')
      .map((item) => ({ specialtyId: item.specialtyId as number }))
    setSaving(true)
    setError(null)
    try {
      await atualizarProfissional(profissional.id, {
        name: nome.trim(),
        specialties: specialtiesPayload,
        councilType,
        councilNumber: councilNumber.trim(),
        councilUf: councilUf === '' ? null : councilUf,
        cbosCode: cbosCode.replace(/\D/g, '') || null,
        cpf: cpfDigits,
        phone: phone.trim() || null,
        email: email.trim() || null,
        isActive,
        weeklyBlocks,
        scheduleRules: regrasParaApi(scheduleRules),
      })
      navigate('/profissionais', {
        replace: true,
        state: { success: 'Profissional atualizado com sucesso.' },
      })
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível editar o profissional.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Stack spacing={0.25}>
          <Typography variant="h5" fontWeight={700}>
            Profissional
          </Typography>
          {profissional ? (
            <Typography variant="body2" color="text.secondary">
              {profissional.name}
            </Typography>
          ) : null}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            type="submit"
            form={FORM_ID}
            disabled={saving || loading || !profissional || formularioInvalido}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={voltar} disabled={saving}>
            Voltar
          </Button>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando profissional...</Typography>
        </Stack>
      ) : null}

      {!loading && profissional ? (
        <Stack component="form" id={FORM_ID} spacing={1.5} sx={{ maxWidth: 720 }} onSubmit={(event) => void salvar(event)}>
          <TextField
            label="Nome"
            value={nome}
            onChange={(event) => setNome(event.target.value)}
            error={Boolean(nome) && nomeInvalido}
            helperText={Boolean(nome) && nomeInvalido ? 'Minimo 3 caracteres' : ' '}
          />
          <Typography variant="subtitle2" fontWeight={700}>
            Especialidades
          </Typography>
          {especialidades.length === 0 ? (
            <Alert severity="warning">Cadastre especialidades antes de editar as do profissional.</Alert>
          ) : null}
          {specialties.map((item, index) => {
            const selecionados = specialties
              .map((row, rowIndex) => (rowIndex === index ? undefined : row.specialtyId))
              .filter((specialtyId): specialtyId is number => typeof specialtyId === 'number')
            const opcoes = especialidades.filter(
              (esp) => !selecionados.includes(esp.id) || esp.id === item.specialtyId,
            )
            const specialtyInvalida = item.specialtyId === ''

            return (
              <Stack key={`${item.specialtyId}-${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  select
                  label="Especialidade"
                  value={item.specialtyId}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    setSpecialties((prev) =>
                      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, specialtyId: value } : row)),
                    )
                  }}
                  error={specialtyInvalida}
                  helperText={specialtyInvalida ? 'Selecione uma especialidade' : ' '}
                  sx={{ flex: 1, minWidth: 220 }}
                >
                  <MenuItem value="" disabled>
                    Selecione uma especialidade
                  </MenuItem>
                  {opcoes.map((esp) => (
                    <MenuItem key={esp.id} value={esp.id}>
                      {esp.nome}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  aria-label="Remover especialidade"
                  onClick={() => setSpecialties((prev) => prev.filter((_, rowIndex) => rowIndex !== index))}
                  disabled={specialties.length === 1}
                  sx={{ mt: 0.5 }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
            )
          })}
          <Button
            type="button"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setSpecialties((prev) => [...prev, { specialtyId: '' }])}
            disabled={specialties.length >= especialidades.length}
            sx={{ alignSelf: 'flex-start' }}
          >
            Adicionar especialidade
          </Button>
          <TextField
            select
            label="Tipo de conselho"
            value={councilType}
            onChange={(event) => setCouncilType(event.target.value as CouncilType)}
          >
            {COUNCIL_TYPES.map((tipo) => (
              <MenuItem key={tipo} value={tipo}>
                {tipo}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Numero do conselho"
            value={councilNumber}
            onChange={(event) => setCouncilNumber(event.target.value)}
            error={Boolean(councilNumber) && councilNumberInvalido}
            helperText={
              Boolean(councilNumber) && councilNumberInvalido ? 'Informe o numero do conselho' : ' '
            }
          />
          <TextField
            select
            label="UF do conselho"
            value={councilUf}
            onChange={(event) => setCouncilUf(event.target.value as UfBrasil | '')}
          >
            <MenuItem value="">Não informado</MenuItem>
            {UFS_BRASIL.map((uf) => (
              <MenuItem key={uf} value={uf}>
                {uf}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="CBO-S"
            value={cbosCode}
            onChange={(event) => setCbosCode(event.target.value)}
            helperText="6 dígitos da ocupação"
          />
          <TextField
            label="CPF"
            value={cpf}
            onChange={(event) => setCpf(event.target.value)}
            error={Boolean(cpf) && cpfInvalido}
            helperText={Boolean(cpf) && cpfInvalido ? 'CPF deve ter 11 digitos' : ' '}
          />
          <TextField label="Telefone (opcional)" value={phone} onChange={(event) => setPhone(event.target.value)} />
          <TextField label="E-mail (opcional)" value={email} onChange={(event) => setEmail(event.target.value)} />
          <FormControlLabel
            control={<Switch checked={isActive} onChange={(_, checked) => setIsActive(checked)} />}
            label="Ativo"
          />
          <BloqueiosSemanaisEditor
            value={weeklyBlocks}
            onChange={setWeeklyBlocks}
            error={weeklyBlocks.length > 0 ? (bloqueiosInvalidos ?? undefined) : undefined}
          />
          <RegrasAtendimentoEditor
            value={scheduleRules}
            onChange={setScheduleRules}
            specialtyIds={specialtyIds}
            error={regrasInvalidas ?? undefined}
          />
        </Stack>
      ) : null}
    </Stack>
  )
}
