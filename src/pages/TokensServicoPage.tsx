import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import {
  criarTokenServico,
  listarTokensServico,
  revogarTokenServico,
  SERVICE_TOKEN_SCOPE_LABELS,
  SERVICE_TOKEN_SCOPES,
  type ServiceAccessToken,
  type ServiceTokenScope,
} from '../services/service-tokens.service'

function formatarData(valor: string | null): string {
  if (!valor) return '—'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '—'
  return data.toLocaleDateString('pt-BR')
}

export function TokensServicoPage() {
  const [tokens, setTokens] = useState<ServiceAccessToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalAberto, setModalAberto] = useState(false)
  const [nome, setNome] = useState('')
  const [scopes, setScopes] = useState<ServiceTokenScope[]>(['CALLS_WRITE'])
  const [dias, setDias] = useState('365')
  const [gerando, setGerando] = useState(false)
  const [erroModal, setErroModal] = useState<string | null>(null)
  const [segredo, setSegredo] = useState<string | null>(null)

  async function carregar() {
    const data = await listarTokensServico()
    setTokens(data)
  }

  useEffect(() => {
    void carregar()
      .catch(() => setError('Não foi possível listar os tokens de serviço.'))
      .finally(() => setLoading(false))
  }, [])

  function abrirModal() {
    setNome('')
    setScopes(['CALLS_WRITE'])
    setDias('365')
    setErroModal(null)
    setSegredo(null)
    setModalAberto(true)
  }

  function fecharModal() {
    if (gerando) return
    setModalAberto(false)
  }

  function alternarEscopo(scope: ServiceTokenScope, checked: boolean) {
    setScopes((atual) => {
      if (checked) return atual.includes(scope) ? atual : [...atual, scope]
      return atual.filter((item) => item !== scope)
    })
  }

  async function gerar() {
    const expiresInDays = Number(dias)
    if (nome.trim().length < 2 || scopes.length === 0 || !Number.isInteger(expiresInDays) || expiresInDays < 1) {
      setErroModal('Informe um nome, ao menos um escopo e uma validade em dias.')
      return
    }
    setGerando(true)
    setErroModal(null)
    try {
      const criado = await criarTokenServico({
        name: nome.trim(),
        scopes,
        expiresInDays,
      })
      setSegredo(criado.token)
      await carregar()
    } catch {
      setErroModal('Não foi possível gerar o token.')
    } finally {
      setGerando(false)
    }
  }

  async function revogar(token: ServiceAccessToken) {
    const confirmou = window.confirm(`Revogar o token "${token.name}"?`)
    if (!confirmou) return
    setError(null)
    try {
      await revogarTokenServico(token.id)
      await carregar()
    } catch {
      setError('Não foi possível revogar o token.')
    }
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Tokens de serviço
          </Typography>
          <Typography variant="body2" color="text.secondary">
            CALLS_WRITE autentica o tarifador. AGENT_DATA_READ autentica o cliente que chama /api/agent-data. O
            segredo aparece uma única vez.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={abrirModal}>
          Gerar token
        </Button>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando tokens...</Typography>
        </Paper>
      ) : null}

      {!loading && tokens.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography color="text.secondary">Nenhum token de serviço cadastrado.</Typography>
        </Paper>
      ) : null}

      {!loading && tokens.length > 0 ? (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>Escopos</TableCell>
                <TableCell>Criado em</TableCell>
                <TableCell>Expira em</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tokens.map((token) => (
                <TableRow key={token.id} hover>
                  <TableCell>{token.name}</TableCell>
                  <TableCell>{token.scopes.map((scope) => SERVICE_TOKEN_SCOPE_LABELS[scope]).join(', ')}</TableCell>
                  <TableCell>{formatarData(token.createdAt)}</TableCell>
                  <TableCell>{formatarData(token.expiresAt)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={token.revokedAt ? 'Revogado' : 'Ativo'}
                      color={token.revokedAt ? 'default' : 'success'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {token.revokedAt ? null : (
                      <Button size="small" color="error" onClick={() => void revogar(token)}>
                        Revogar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}

      <Dialog open={modalAberto} onClose={fecharModal} fullWidth maxWidth="sm">
        <DialogTitle>{segredo ? 'Token gerado' : 'Gerar token'}</DialogTitle>
        <DialogContent>
          {segredo ? (
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              <Alert severity="warning">Copie o token agora. Ele não será mostrado de novo.</Alert>
              <TextField
                label="Token"
                value={segredo}
                multiline
                minRows={3}
                slotProps={{ input: { readOnly: true } }}
              />
            </Stack>
          ) : (
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              {erroModal ? <Alert severity="error">{erroModal}</Alert> : null}
              <TextField label="Nome" value={nome} onChange={(event) => setNome(event.target.value)} autoFocus />
              <TextField
                label="Validade (dias)"
                value={dias}
                onChange={(event) => setDias(event.target.value)}
                inputProps={{ inputMode: 'numeric' }}
              />
              <FormGroup>
                {SERVICE_TOKEN_SCOPES.map((scope) => (
                  <FormControlLabel
                    key={scope}
                    control={
                      <Checkbox
                        checked={scopes.includes(scope)}
                        onChange={(_, checked) => alternarEscopo(scope, checked)}
                      />
                    }
                    label={SERVICE_TOKEN_SCOPE_LABELS[scope]}
                  />
                ))}
              </FormGroup>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {segredo ? (
            <Button variant="contained" onClick={fecharModal}>
              Fechar
            </Button>
          ) : (
            <>
              <Button onClick={fecharModal} disabled={gerando}>
                Cancelar
              </Button>
              <Button variant="contained" onClick={() => void gerar()} disabled={gerando}>
                {gerando ? 'Gerando...' : 'Gerar'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
