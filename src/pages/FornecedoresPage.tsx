import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FornecedoresTable } from '../components/FornecedoresTable'
import {
  atualizarFornecedor,
  excluirFornecedor,
  listarFornecedores,
} from '../services/suppliers.service'
import type { Fornecedor } from '../types/estoque'
import { apenasDigitos } from '../utils/fornecedorFormat'

export function FornecedoresPage() {
  const navigate = useNavigate()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [editando, setEditando] = useState<Fornecedor | null>(null)
  const [legalNameEdicao, setLegalNameEdicao] = useState('')
  const [tradeNameEdicao, setTradeNameEdicao] = useState('')
  const [cnpjEdicao, setCnpjEdicao] = useState('')
  const [phoneEdicao, setPhoneEdicao] = useState('')
  const [emailEdicao, setEmailEdicao] = useState('')
  const [websiteEdicao, setWebsiteEdicao] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    const termoDigitos = apenasDigitos(busca)
    if (!termo) return fornecedores

    return fornecedores.filter((fornecedor) => {
      if (fornecedor.tradeName.toLowerCase().includes(termo)) return true
      if (fornecedor.legalName.toLowerCase().includes(termo)) return true
      if (fornecedor.email.toLowerCase().includes(termo)) return true
      if (termoDigitos && apenasDigitos(fornecedor.cnpj).includes(termoDigitos)) return true
      return false
    })
  }, [busca, fornecedores])

  function abrirEdicao(fornecedor: Fornecedor) {
    setEditando(fornecedor)
    setLegalNameEdicao(fornecedor.legalName)
    setTradeNameEdicao(fornecedor.tradeName)
    setCnpjEdicao(fornecedor.cnpj)
    setPhoneEdicao(fornecedor.phone)
    setEmailEdicao(fornecedor.email)
    setWebsiteEdicao(fornecedor.website ?? '')
  }

  function fecharEdicao() {
    setEditando(null)
    setLegalNameEdicao('')
    setTradeNameEdicao('')
    setCnpjEdicao('')
    setPhoneEdicao('')
    setEmailEdicao('')
    setWebsiteEdicao('')
  }

  const legalNameInvalido = legalNameEdicao.trim().length < 2
  const tradeNameInvalido = tradeNameEdicao.trim().length < 2
  const cnpjInvalido = apenasDigitos(cnpjEdicao).length !== 14
  const phoneInvalido = phoneEdicao.trim().length < 8
  const emailInvalido = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEdicao.trim())
  const websiteInvalido =
    websiteEdicao.trim().length > 0 && !/^https?:\/\//i.test(websiteEdicao.trim())

  async function salvarEdicao() {
    if (!editando) return
    setSavingEdit(true)
    setError(null)
    setSuccess(null)
    try {
      const website = websiteEdicao.trim()
      const atualizado = await atualizarFornecedor(editando.id, {
        legalName: legalNameEdicao.trim(),
        tradeName: tradeNameEdicao.trim(),
        cnpj: apenasDigitos(cnpjEdicao),
        phone: apenasDigitos(phoneEdicao) || phoneEdicao.trim(),
        email: emailEdicao.trim(),
        website: website || null,
      })
      setFornecedores((prev) => prev.map((item) => (item.id === atualizado.id ? atualizado : item)))
      fecharEdicao()
      setSuccess('Fornecedor atualizado com sucesso.')
    } catch {
      setError('Nao foi possivel editar o fornecedor.')
    } finally {
      setSavingEdit(false)
    }
  }

  async function excluir(fornecedor: Fornecedor) {
    const confirmou = window.confirm(
      `Confirma excluir o fornecedor "${fornecedor.tradeName}"?`,
    )
    if (!confirmou) return

    setError(null)
    setSuccess(null)
    try {
      await excluirFornecedor(fornecedor.id)
      setFornecedores((prev) => prev.filter((item) => item.id !== fornecedor.id))
      setSuccess('Fornecedor excluido com sucesso.')
    } catch {
      setError('Nao foi possivel excluir o fornecedor.')
    }
  }

  useEffect(() => {
    async function carregarFornecedores() {
      setLoading(true)
      setError(null)
      try {
        const data = await listarFornecedores()
        setFornecedores(data)
      } catch {
        setError('Nao foi possivel carregar os fornecedores.')
      } finally {
        setLoading(false)
      }
    }

    void carregarFornecedores()
  }, [])

  return (
    <Stack spacing={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between" gap={2}>
        <Typography variant="h5" fontWeight={700}>
          Fornecedores
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/configuracoes/estoque/fornecedores/novo')}
        >
          Novo fornecedor
        </Button>
      </Box>

      {loading ? (
        <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CircularProgress size={20} />
          <Typography>Carregando fornecedores...</Typography>
        </Paper>
      ) : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
      {success ? <Alert severity="success">{success}</Alert> : null}

      {!loading && !error && fornecedores.length === 0 ? (
        <Paper sx={{ p: 3 }}>
          <Typography>Nenhum fornecedor encontrado.</Typography>
        </Paper>
      ) : null}

      {!loading && !error && fornecedores.length > 0 ? (
        <Stack spacing={2}>
          <TextField
            label="Buscar por nome, CNPJ ou e-mail"
            size="small"
            fullWidth
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />

          {fornecedoresFiltrados.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography>Nenhum fornecedor encontrado para a busca.</Typography>
            </Paper>
          ) : (
            <Paper sx={{ p: 0 }}>
              <FornecedoresTable
                fornecedores={fornecedoresFiltrados}
                onEditar={abrirEdicao}
                onExcluir={excluir}
              />
            </Paper>
          )}
        </Stack>
      ) : null}

      <Dialog open={Boolean(editando)} onClose={fecharEdicao} fullWidth maxWidth="sm">
        <DialogTitle>Editar fornecedor</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <TextField
              label="Nome fantasia"
              value={tradeNameEdicao}
              onChange={(event) => setTradeNameEdicao(event.target.value)}
              error={Boolean(tradeNameEdicao) && tradeNameInvalido}
              helperText={
                Boolean(tradeNameEdicao) && tradeNameInvalido ? 'Minimo 2 caracteres' : ' '
              }
            />
            <TextField
              label="Razão social"
              value={legalNameEdicao}
              onChange={(event) => setLegalNameEdicao(event.target.value)}
              error={Boolean(legalNameEdicao) && legalNameInvalido}
              helperText={
                Boolean(legalNameEdicao) && legalNameInvalido ? 'Minimo 2 caracteres' : ' '
              }
            />
            <TextField
              label="CNPJ"
              value={cnpjEdicao}
              onChange={(event) => setCnpjEdicao(event.target.value)}
              error={Boolean(cnpjEdicao) && cnpjInvalido}
              helperText={
                Boolean(cnpjEdicao) && cnpjInvalido ? 'O CNPJ deve ter 14 digitos' : ' '
              }
            />
            <TextField
              label="Telefone"
              value={phoneEdicao}
              onChange={(event) => setPhoneEdicao(event.target.value)}
              error={Boolean(phoneEdicao) && phoneInvalido}
              helperText={
                Boolean(phoneEdicao) && phoneInvalido ? 'Informe o telefone' : ' '
              }
            />
            <TextField
              label="E-mail"
              value={emailEdicao}
              onChange={(event) => setEmailEdicao(event.target.value)}
              error={Boolean(emailEdicao) && emailInvalido}
              helperText={
                Boolean(emailEdicao) && emailInvalido ? 'Informe um e-mail valido' : ' '
              }
            />
            <TextField
              label="Website"
              value={websiteEdicao}
              onChange={(event) => setWebsiteEdicao(event.target.value)}
              error={websiteInvalido}
              helperText={
                websiteInvalido ? 'Informe uma URL valida (http:// ou https://)' : 'Opcional'
              }
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
              legalNameInvalido ||
              tradeNameInvalido ||
              cnpjInvalido ||
              phoneInvalido ||
              emailInvalido ||
              websiteInvalido
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
