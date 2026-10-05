import AddIcon from '@mui/icons-material/Add'
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import DownloadIcon from '@mui/icons-material/Download'
import EditIcon from '@mui/icons-material/Edit'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { DocumentoClinicoEditor } from './DocumentoClinicoEditor'
import {
  atualizarDocumentoGerado,
  baixarArquivoPaciente,
  criarDocumentoGerado,
  enviarArquivoPaciente,
  listarArquivosPaciente,
  removerArquivoPaciente,
} from '../services/patient-files.service'
import {
  PATIENT_FILE_KIND_LABELS,
  PATIENT_FILE_ORIGIN_LABELS,
  type GeneratedDocumentContent,
  type GeneratedFileKind,
  type MedicalOrderContent,
  type PatientFile,
  type PatientFileKind,
  type PrescriptionContent,
} from '../types/arquivoPaciente'
import type { Patient } from '../types/paciente'
import { mensagemErroApi } from '../utils/apiError'
import { formatarDataHoraISO } from '../utils/dataISO'

const ACCEPT_ARQUIVOS = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png'
const LIMITE_BYTES = 10 * 1024 * 1024

type FiltroArquivo = 'ALL' | PatientFileKind

interface EditorAberto {
  kind: GeneratedFileKind
  file: PatientFile | null
}

interface PacienteArquivosSecaoProps {
  patient: Patient
}

function nomeArquivo(arquivo: PatientFile): string {
  return arquivo.title || arquivo.originalName || PATIENT_FILE_KIND_LABELS[arquivo.kind]
}

function formatarTamanho(bytes: number | null): string {
  if (bytes == null) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function conteudoEditavel(arquivo: PatientFile): PrescriptionContent | MedicalOrderContent | null {
  if (arquivo.origin !== 'GENERATED' || !arquivo.content) return null
  if (arquivo.kind === 'PRESCRIPTION' && 'medications' in arquivo.content) {
    return arquivo.content
  }
  if (arquivo.kind === 'MEDICAL_ORDER' && 'items' in arquivo.content) {
    return arquivo.content
  }
  return null
}

export function PacienteArquivosSecao({ patient }: PacienteArquivosSecaoProps) {
  const [arquivos, setArquivos] = useState<PatientFile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<FiltroArquivo>('ALL')
  const [uploadAberto, setUploadAberto] = useState(false)
  const [tipoUpload, setTipoUpload] = useState<PatientFileKind | ''>('')
  const [arquivoUpload, setArquivoUpload] = useState<File | null>(null)
  const [menuNovo, setMenuNovo] = useState<HTMLElement | null>(null)
  const [editor, setEditor] = useState<EditorAberto | null>(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setArquivos(await listarArquivosPaciente(patient.id))
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível carregar os arquivos.'))
    } finally {
      setLoading(false)
    }
  }, [patient.id])

  useEffect(() => {
    void carregar()
  }, [carregar])

  const visiveis = arquivos.filter((item) => filtro === 'ALL' || item.kind === filtro)

  async function enviar() {
    if (!tipoUpload) {
      setError('Selecione o tipo do arquivo.')
      return
    }
    if (!arquivoUpload) {
      setError('Selecione um arquivo.')
      return
    }
    const tipo = arquivoUpload.type.toLowerCase()
    const nome = arquivoUpload.name.toLowerCase()
    const permitido =
      tipo === 'application/pdf' ||
      tipo === 'image/jpeg' ||
      tipo === 'image/jpg' ||
      tipo === 'image/png' ||
      nome.endsWith('.pdf') ||
      nome.endsWith('.jpg') ||
      nome.endsWith('.jpeg') ||
      nome.endsWith('.png')
    if (!permitido) {
      setError('Somente PDF, JPEG e PNG são permitidos.')
      return
    }
    if (arquivoUpload.size > LIMITE_BYTES) {
      setError('Cada arquivo deve ter no máximo 10 MB.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await enviarArquivoPaciente(patient.id, tipoUpload, arquivoUpload)
      setUploadAberto(false)
      setTipoUpload('')
      setArquivoUpload(null)
      await carregar()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível enviar o arquivo.'))
    } finally {
      setSaving(false)
    }
  }

  async function salvarDocumento(content: GeneratedDocumentContent) {
    if (!editor) return
    setSaving(true)
    setError(null)
    try {
      if (editor.file) {
        await atualizarDocumentoGerado(patient.id, editor.file.id, content)
      } else {
        await criarDocumentoGerado(patient.id, editor.kind, content)
      }
      setEditor(null)
      await carregar()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível salvar o documento.'))
    } finally {
      setSaving(false)
    }
  }

  async function baixar(arquivo: PatientFile) {
    setError(null)
    try {
      const blob = await baixarArquivoPaciente(patient.id, arquivo.id)
      const url = URL.createObjectURL(blob)
      const link = window.document.createElement('a')
      link.href = url
      link.setAttribute('download', arquivo.originalName || nomeArquivo(arquivo))
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível baixar o arquivo.'))
    }
  }

  async function excluir(arquivo: PatientFile) {
    const confirmou = window.confirm(`Confirma excluir ${nomeArquivo(arquivo)}?`)
    if (!confirmou) return
    setError(null)
    try {
      await removerArquivoPaciente(patient.id, arquivo.id)
      await carregar()
    } catch (err) {
      setError(mensagemErroApi(err, 'Não foi possível excluir o arquivo.'))
    }
  }

  if (editor) {
    return (
      <Stack spacing={2}>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <DocumentoClinicoEditor
          patient={patient}
          kind={editor.kind}
          initial={editor.file ? conteudoEditavel(editor.file) : null}
          saving={saving}
          onCancel={() => setEditor(null)}
          onSave={(content) => void salvarDocumento(content)}
        />
      </Stack>
    )
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
        <ToggleButtonGroup
          exclusive
          size="small"
          value={filtro}
          onChange={(_, value: FiltroArquivo | null) => {
            if (value) setFiltro(value)
          }}
        >
          <ToggleButton value="ALL">Todos</ToggleButton>
          <ToggleButton value="MEDICAL_ORDER">Pedido médico</ToggleButton>
          <ToggleButton value="PRESCRIPTION">Receituário</ToggleButton>
          <ToggleButton value="OTHER">Outros</ToggleButton>
        </ToggleButtonGroup>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => {
              setError(null)
              setUploadAberto(true)
            }}
          >
            Enviar arquivo
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            endIcon={<ArrowDropDownIcon />}
            onClick={(event) => setMenuNovo(event.currentTarget)}
          >
            Novo
          </Button>
          <Menu anchorEl={menuNovo} open={Boolean(menuNovo)} onClose={() => setMenuNovo(null)}>
            <MenuItem
              onClick={() => {
                setMenuNovo(null)
                setEditor({ kind: 'PRESCRIPTION', file: null })
              }}
            >
              Receituário
            </MenuItem>
            <MenuItem
              onClick={() => {
                setMenuNovo(null)
                setEditor({ kind: 'MEDICAL_ORDER', file: null })
              }}
            >
              Pedido médico
            </MenuItem>
          </Menu>
        </Stack>
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}

      {loading ? (
        <Stack direction="row" alignItems="center" gap={1.5}>
          <CircularProgress size={20} />
          <Typography>Carregando arquivos...</Typography>
        </Stack>
      ) : null}

      {!loading && visiveis.length === 0 ? (
        <Typography color="text.secondary">Nenhum arquivo neste filtro.</Typography>
      ) : null}

      {!loading && visiveis.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Tipo</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Origem</TableCell>
              <TableCell>Tamanho</TableCell>
              <TableCell>Data</TableCell>
              <TableCell>Autor</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visiveis.map((arquivo) => (
              <TableRow key={arquivo.id} hover>
                <TableCell>{PATIENT_FILE_KIND_LABELS[arquivo.kind]}</TableCell>
                <TableCell>{nomeArquivo(arquivo)}</TableCell>
                <TableCell>{PATIENT_FILE_ORIGIN_LABELS[arquivo.origin]}</TableCell>
                <TableCell>{formatarTamanho(arquivo.sizeBytes)}</TableCell>
                <TableCell>{formatarDataHoraISO(arquivo.createdAt)}</TableCell>
                <TableCell>{arquivo.createdBy.name}</TableCell>
                <TableCell align="right">
                  {arquivo.origin === 'GENERATED' && arquivo.kind !== 'OTHER' ? (
                    <IconButton
                      size="small"
                      aria-label="Alterar documento"
                      onClick={() =>
                        setEditor({
                          kind: arquivo.kind as GeneratedFileKind,
                          file: arquivo,
                        })
                      }
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                  {arquivo.origin === 'UPLOAD' ? (
                    <IconButton
                      size="small"
                      aria-label="Baixar arquivo"
                      onClick={() => void baixar(arquivo)}
                    >
                      <DownloadIcon fontSize="small" />
                    </IconButton>
                  ) : null}
                  <IconButton
                    size="small"
                    aria-label="Excluir arquivo"
                    onClick={() => void excluir(arquivo)}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}

      <Dialog open={uploadAberto} onClose={() => !saving && setUploadAberto(false)} fullWidth maxWidth="xs">
        <DialogTitle>Enviar arquivo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {error ? <Alert severity="error">{error}</Alert> : null}
            <TextField
              select
              label="Tipo"
              value={tipoUpload}
              onChange={(event) => setTipoUpload(event.target.value as PatientFileKind)}
              fullWidth
            >
              <MenuItem value="MEDICAL_ORDER">Pedido médico</MenuItem>
              <MenuItem value="PRESCRIPTION">Receituário</MenuItem>
              <MenuItem value="OTHER">Outros</MenuItem>
            </TextField>
            <Button variant="outlined" component="label">
              {arquivoUpload ? arquivoUpload.name : 'Selecionar PDF, JPEG ou PNG'}
              <input
                hidden
                type="file"
                accept={ACCEPT_ARQUIVOS}
                onChange={(event) => setArquivoUpload(event.target.files?.[0] ?? null)}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadAberto(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={() => void enviar()} disabled={saving}>
            {saving ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
