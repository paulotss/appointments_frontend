import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CampoValorMoeda } from '../components/CampoValorMoeda'
import { ProfissionaisTable } from '../components/ProfissionaisTable'
import { listarEspecialidades } from '../services/especialidades.service'
import { atualizarProfissional, listarProfissionais } from '../services/health-professionals.service'
import type { ListMeta } from '../types/listEnvelope'
import type { Especialidade } from '../types/registro'
import { COUNCIL_TYPES, type CouncilType, type HealthProfessional } from '../types/profissional'

const PAGE_SIZE_OPTIONS = [25, 50, 100]
const META_VAZIA: ListMeta = { page: 1, limit: 50, total: 0, totalPages: 1 }

type EspecialidadePrecoEdicao = {
  specialtyId: number | ''
  privatePrice: number | undefined
}

export function ProfissionaisPage() {
  const navigate = useNavigate()
  const [profissionais, setProfissionais] = useState<HealthProfessional[]>([])
  const [especialidades, setEspecialidades] = useState<Especialidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [editando, setEditando] = useState<HealthProfessional | null>(null)
  const [nomeEdicao, setNomeEdicao] = useState('')
  const [specialtiesEdicao, setSpecialtiesEdicao] = useState<EspecialidadePrecoEdicao[]>([])
  const [councilTypeEdicao, setCouncilTypeEdicao] = useState<CouncilType>('CRM')
  const [councilNumberEdicao, setCouncilNumberEdicao] = useState('')
  const [cpfEdicao, setCpfEdicao] = useState('')
  const [phoneEdicao, setPhoneEdicao] = useState('')
  const [emailEdicao, setEmailEdicao] = useState('')
  const [isActiveEdicao, setIsActiveEdicao] = useState(true)
  const [savingEdit, setSavingEdit] = useState(false)
  const [filtroNome, setFiltroNome] = useState('')
  const [filtroNomeDebounced, setFiltroNomeDebounced] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [meta, setMeta] = useState<ListMeta>(META_VAZIA)

  useEffect(() => {
    const timer = window.setTimeout(() => setFiltroNomeDebounced(filtroNome.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [filtroNome])

  useEffect(() => {
    setPage(0)
  }, [filtroNomeDebounced])

  function abrirEdicao(profissional: HealthProfessional) {
    setEditando(profissional)
    setNomeEdicao(profissional.name)
    setSpecialtiesEdicao(
      profissional.specialties.length > 0
        ? profissional.specialties.map((item) => ({
            specialtyId: item.specialtyId,
            privatePrice: item.privatePrice,
          }))
        : [{ specialtyId: '', privatePrice: undefined }],
    )
    setCouncilTypeEdicao(profissional.councilType)
    setCouncilNumberEdicao(profissional.councilNumber)
    setCpfEdicao(profissional.cpf)
    setPhoneEdicao(profissional.phone ?? '')
    setEmailEdicao(profissional.email ?? '')
    setIsActiveEdicao(profissional.isActive)
  }

  function fecharEdicao() {
    setEditando(null)
    setNomeEdicao('')
    setSpecialtiesEdicao([])
    setCouncilTypeEdicao('CRM')
    setCouncilNumberEdicao('')
    setCpfEdicao('')
    setPhoneEdicao('')
    setEmailEdicao('')
    setIsActiveEdicao(true)
  }

  async function salvarEdicao() {
    if (!editando) return
    const cpfDigits = cpfEdicao.replace(/\D/g, '')
    if (cpfDigits.length !== 11) {
      setError('CPF deve ter 11 digitos.')
      return
    }
    const specialties = specialtiesEdicao
      .filter((item) => item.specialtyId !== '' && item.privatePrice != null && item.privatePrice > 0)
      .map((item) => ({
        specialtyId: item.specialtyId as number,
        privatePrice: item.privatePrice as number,
      }))
    if (specialties.length === 0) {
      setError('Informe ao menos uma especialidade com preco particular.')
      return
    }
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const atualizado = await atualizarProfissional(editando.id, {
        name: nomeEdicao.trim(),
        specialties,
        councilType: councilTypeEdicao,
        councilNumber: councilNumberEdicao.trim(),
        cpf: cpfDigits,
        phone: phoneEdicao.trim() || null,
        email: emailEdicao.trim() || null,
        isActive: isActiveEdicao,
      })
      setProfissionais((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Profissional atualizado com sucesso.')
    } catch {
      setError('Nao foi possivel editar o profissional.')
    } finally {
      setSavingEdit(false)
    }
  }

  const nomeInvalido = nomeEdicao.trim().length < 3
  const councilNumberInvalido = councilNumberEdicao.trim().length < 1
  const cpfInvalido = cpfEdicao.replace(/\D/g, '').length !== 11
  const specialtyIds = specialtiesEdicao
    .map((item) => item.specialtyId)
    .filter((id): id is number => id !== '')
  const specialtiesInvalidas =
    specialtiesEdicao.length === 0 ||
    specialtiesEdicao.some(
      (item) => item.specialtyId === '' || item.privatePrice == null || item.privatePrice <= 0,
    ) ||
    new Set(specialtyIds).size !== specialtyIds.length

  const carregarDados = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [profissionaisData, especialidadesData] = await Promise.all([
        listarProfissionais({
          ...(filtroNomeDebounced ? { name: filtroNomeDebounced } : {}),
          page: page + 1,
          limit: rowsPerPage,
        }),
        listarEspecialidades(),
      ])
      setProfissionais(profissionaisData.data)
      setMeta(profissionaisData.meta)
      setEspecialidades(especialidadesData)
    } catch {
      setError('Nao foi possivel carregar os profissionais.')
    } finally {
      setLoading(false)
    }
  }, [filtroNomeDebounced, page, rowsPerPage])

  useEffect(() => {
    void carregarDados()
  }, [carregarDados])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Profissionais
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/profissionais/novo')}
        >
          Novo profissional
        </Button>
      </Box>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      <TextField
        label="Buscar por nome"
        value={filtroNome}
        onChange={(event) => setFiltroNome(event.target.value)}
        size="small"
        sx={{ maxWidth: 360 }}
      />

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando profissionais...</Typography>
        </Paper>
      ) : null}

      {!loading && !error && profissionais.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum profissional encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && profissionais.length > 0 ? (
        <Paper sx={{ p: 0 }}>
          <ProfissionaisTable profissionais={profissionais} onEditar={abrirEdicao} />
          <TablePagination
            component="div"
            count={meta.total}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(Number(event.target.value))
              setPage(0)
            }}
            rowsPerPageOptions={PAGE_SIZE_OPTIONS}
            labelRowsPerPage="Por página"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count !== -1 ? count : `mais de ${to}`}`
            }
          />
        </Paper>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="md">
        <DialogTitle>Editar profissional</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Nome"
              value={nomeEdicao}
              onChange={(event) => setNomeEdicao(event.target.value)}
              error={Boolean(nomeEdicao) && nomeInvalido}
              helperText={Boolean(nomeEdicao) && nomeInvalido ? 'Minimo 3 caracteres' : ' '}
            />
            <Typography variant="subtitle2" fontWeight={700}>
              Especialidades
            </Typography>
            {specialtiesEdicao.map((item, index) => {
              const selecionados = specialtiesEdicao
                .map((row, rowIndex) => (rowIndex === index ? undefined : row.specialtyId))
                .filter((id): id is number => typeof id === 'number')
              const opcoes = especialidades.filter(
                (esp) => !selecionados.includes(esp.id) || esp.id === item.specialtyId,
              )
              const specialtyInvalida = item.specialtyId === ''
              const precoInvalido = item.privatePrice == null || item.privatePrice <= 0

              return (
                <Stack key={`${item.specialtyId}-${index}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                  <TextField
                    select
                    label="Especialidade"
                    value={item.specialtyId}
                    onChange={(event) => {
                      const value = Number(event.target.value)
                      setSpecialtiesEdicao((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, specialtyId: value } : row,
                        ),
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
                  <CampoValorMoeda
                    label="Preco particular"
                    value={item.privatePrice}
                    onChange={(value) => {
                      setSpecialtiesEdicao((prev) =>
                        prev.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, privatePrice: value } : row,
                        ),
                      )
                    }}
                    error={precoInvalido}
                    helperText={precoInvalido ? 'Informe o preco particular' : ' '}
                  />
                  <IconButton
                    aria-label="Remover especialidade"
                    onClick={() =>
                      setSpecialtiesEdicao((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
                    }
                    disabled={specialtiesEdicao.length === 1}
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
              onClick={() =>
                setSpecialtiesEdicao((prev) => [...prev, { specialtyId: '', privatePrice: undefined }])
              }
              disabled={specialtiesEdicao.length >= especialidades.length}
              sx={{ alignSelf: 'flex-start' }}
            >
              Adicionar especialidade
            </Button>
            <TextField
              select
              label="Tipo de conselho"
              value={councilTypeEdicao}
              onChange={(event) => setCouncilTypeEdicao(event.target.value as CouncilType)}
            >
              {COUNCIL_TYPES.map((tipo) => (
                <MenuItem key={tipo} value={tipo}>
                  {tipo}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Numero do conselho"
              value={councilNumberEdicao}
              onChange={(event) => setCouncilNumberEdicao(event.target.value)}
              error={Boolean(councilNumberEdicao) && councilNumberInvalido}
              helperText={
                Boolean(councilNumberEdicao) && councilNumberInvalido
                  ? 'Informe o numero do conselho'
                  : ' '
              }
            />
            <TextField
              label="CPF"
              value={cpfEdicao}
              onChange={(event) => setCpfEdicao(event.target.value)}
              error={Boolean(cpfEdicao) && cpfInvalido}
              helperText={Boolean(cpfEdicao) && cpfInvalido ? 'CPF deve ter 11 digitos' : ' '}
            />
            <TextField
              label="Telefone (opcional)"
              value={phoneEdicao}
              onChange={(event) => setPhoneEdicao(event.target.value)}
            />
            <TextField
              label="E-mail (opcional)"
              value={emailEdicao}
              onChange={(event) => setEmailEdicao(event.target.value)}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isActiveEdicao}
                  onChange={(_, checked) => setIsActiveEdicao(checked)}
                />
              }
              label="Ativo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={fecharEdicao}>Cancelar</Button>
          <Button
            onClick={salvarEdicao}
            variant="contained"
            disabled={
              savingEdit ||
              nomeInvalido ||
              councilNumberInvalido ||
              cpfInvalido ||
              specialtiesInvalidas
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
