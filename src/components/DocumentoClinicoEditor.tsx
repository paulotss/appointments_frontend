import AddIcon from '@mui/icons-material/Add'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import logoSeraphisVerde from '../assets/logo-seraphis-verde.png'
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { CampoData } from './CampoData'
import { buscarProfissional } from '../services/health-professionals.service'
import { getLoggedUser } from '../services/authStorage'
import type {
  GeneratedFileKind,
  MedicalOrderContent,
  MedicalOrderItem,
  MedicationLine,
  PrescriptionContent,
} from '../types/arquivoPaciente'
import type { Patient } from '../types/paciente'
import { formatarDataISO, hojeLocalISO } from '../utils/dataISO'

const NOME_CLINICA = 'Clínica Seraphis'

interface DocumentoClinicoEditorProps {
  patient: Patient
  kind: GeneratedFileKind
  initial: PrescriptionContent | MedicalOrderContent | null
  saving: boolean
  onCancel: () => void
  onSave: (content: PrescriptionContent | MedicalOrderContent) => void
}

function linhaMedicamento(): MedicationLine {
  return { name: '', dosage: '', quantity: '' }
}

function linhaPedido(): MedicalOrderItem {
  return { description: '' }
}

function formatarCpf(cpf: string | null): string {
  if (!cpf) return '—'
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return cpf
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatarConselho(profissional: {
  councilType: string
  councilNumber: string
  councilUf: string | null
}): string {
  const uf = profissional.councilUf ? `/${profissional.councilUf}` : ''
  return `${profissional.councilType} ${profissional.councilNumber}${uf}`
}

function conteudoInicialReceita(initial: PrescriptionContent | MedicalOrderContent | null): PrescriptionContent {
  if (initial && 'medications' in initial) return initial
  return {
    date: hojeLocalISO(),
    professionalName: '',
    professionalCouncil: '',
    medications: [linhaMedicamento()],
    notes: '',
  }
}

function conteudoInicialPedido(initial: PrescriptionContent | MedicalOrderContent | null): MedicalOrderContent {
  if (initial && 'items' in initial) return initial
  return {
    date: hojeLocalISO(),
    professionalName: '',
    professionalCouncil: '',
    indication: '',
    items: [linhaPedido()],
  }
}

export function DocumentoClinicoEditor({
  patient,
  kind,
  initial,
  saving,
  onCancel,
  onSave,
}: DocumentoClinicoEditorProps) {
  const receitaInicial = conteudoInicialReceita(initial)
  const pedidoInicial = conteudoInicialPedido(initial)
  const [date, setDate] = useState(kind === 'PRESCRIPTION' ? receitaInicial.date : pedidoInicial.date)
  const [professionalName, setProfessionalName] = useState(
    kind === 'PRESCRIPTION' ? receitaInicial.professionalName : pedidoInicial.professionalName,
  )
  const [professionalCouncil, setProfessionalCouncil] = useState(
    kind === 'PRESCRIPTION' ? receitaInicial.professionalCouncil : pedidoInicial.professionalCouncil,
  )
  const [medications, setMedications] = useState(receitaInicial.medications)
  const [notes, setNotes] = useState(receitaInicial.notes)
  const [indication, setIndication] = useState(pedidoInicial.indication)
  const [items, setItems] = useState(pedidoInicial.items)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (initial) return
    const user = getLoggedUser()
    if (user?.role !== 'PROFESSIONAL' || user.healthProfessionalId == null) return
    let ativo = true
    buscarProfissional(user.healthProfessionalId)
      .then((profissional) => {
        if (!ativo) return
        setProfessionalName((atual) => atual || profissional.name)
        setProfessionalCouncil((atual) => atual || formatarConselho(profissional))
      })
      .catch(() => undefined)
    return () => {
      ativo = false
    }
  }, [initial])

  function salvar() {
    if (!date) {
      setErro('Informe a data do documento.')
      return
    }
    if (!professionalName.trim() || !professionalCouncil.trim()) {
      setErro('Informe o nome e o conselho do profissional.')
      return
    }
    if (kind === 'PRESCRIPTION') {
      const linhas = medications.map((item) => ({
        name: item.name.trim(),
        dosage: item.dosage.trim(),
        quantity: item.quantity.trim(),
      }))
      if (linhas.length === 0 || linhas.some((item) => !item.name || !item.dosage || !item.quantity)) {
        setErro('Preencha nome, posologia e quantidade de cada medicamento.')
        return
      }
      setErro(null)
      onSave({
        date,
        professionalName: professionalName.trim(),
        professionalCouncil: professionalCouncil.trim(),
        medications: linhas,
        notes: notes.trim(),
      })
      return
    }
    const linhas = items.map((item) => ({ description: item.description.trim() }))
    if (!indication.trim()) {
      setErro('Informe a indicação clínica.')
      return
    }
    if (linhas.length === 0 || linhas.some((item) => !item.description)) {
      setErro('Informe ao menos um exame ou procedimento.')
      return
    }
    setErro(null)
    onSave({
      date,
      professionalName: professionalName.trim(),
      professionalCouncil: professionalCouncil.trim(),
      indication: indication.trim(),
      items: linhas,
    })
  }

  const titulo = kind === 'PRESCRIPTION' ? 'Receituário' : 'Pedido médico'

  return (
    <Stack spacing={2}>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .documento-clinico-impressao, .documento-clinico-impressao * { visibility: visible; }
          .documento-clinico-impressao {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none;
          }
        }
      `}</style>
      <Stack direction="row" spacing={1} className="no-print" sx={{ '@media print': { display: 'none' } }}>
        <Button variant="contained" onClick={salvar} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button variant="outlined" onClick={() => window.print()} disabled={saving}>
          Imprimir
        </Button>
        <Button variant="text" onClick={onCancel} disabled={saving}>
          Voltar
        </Button>
      </Stack>
      {erro ? <Alert severity="error">{erro}</Alert> : null}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="flex-start">
        <Stack spacing={2} sx={{ flex: 1, width: '100%', '@media print': { display: 'none' } }}>
          <CampoData label="Data" value={date} onChange={setDate} />
          <TextField
            label="Profissional"
            value={professionalName}
            onChange={(event) => setProfessionalName(event.target.value)}
          />
          <TextField
            label="Conselho"
            value={professionalCouncil}
            onChange={(event) => setProfessionalCouncil(event.target.value)}
            placeholder="CRM 123456/SP"
          />
          {kind === 'PRESCRIPTION' ? (
            <Stack spacing={1.5}>
              <Typography variant="subtitle2">Medicamentos</Typography>
              {medications.map((item, index) => (
                <Stack key={index} direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="flex-start">
                  <TextField
                    label="Medicamento"
                    value={item.name}
                    onChange={(event) =>
                      setMedications((atual) =>
                        atual.map((linha, i) => (i === index ? { ...linha, name: event.target.value } : linha)),
                      )
                    }
                    fullWidth
                  />
                  <TextField
                    label="Posologia"
                    value={item.dosage}
                    onChange={(event) =>
                      setMedications((atual) =>
                        atual.map((linha, i) => (i === index ? { ...linha, dosage: event.target.value } : linha)),
                      )
                    }
                    fullWidth
                  />
                  <TextField
                    label="Quantidade"
                    value={item.quantity}
                    onChange={(event) =>
                      setMedications((atual) =>
                        atual.map((linha, i) => (i === index ? { ...linha, quantity: event.target.value } : linha)),
                      )
                    }
                    sx={{ minWidth: 120 }}
                  />
                  <IconButton
                    aria-label="Remover medicamento"
                    disabled={medications.length === 1}
                    onClick={() => setMedications((atual) => atual.filter((_, i) => i !== index))}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => setMedications((atual) => [...atual, linhaMedicamento()])}
                sx={{ alignSelf: 'flex-start' }}
              >
                Adicionar medicamento
              </Button>
              <TextField
                label="Orientações"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                multiline
                minRows={3}
              />
            </Stack>
          ) : (
            <Stack spacing={1.5}>
              <TextField
                label="Indicação clínica"
                value={indication}
                onChange={(event) => setIndication(event.target.value)}
                multiline
                minRows={3}
              />
              <Typography variant="subtitle2">Solicitação</Typography>
              {items.map((item, index) => (
                <Stack key={index} direction="row" spacing={1} alignItems="flex-start">
                  <TextField
                    label="Exame ou procedimento"
                    value={item.description}
                    onChange={(event) =>
                      setItems((atual) =>
                        atual.map((linha, i) =>
                          i === index ? { description: event.target.value } : linha,
                        ),
                      )
                    }
                    fullWidth
                  />
                  <IconButton
                    aria-label="Remover item"
                    disabled={items.length === 1}
                    onClick={() => setItems((atual) => atual.filter((_, i) => i !== index))}
                  >
                    <DeleteOutlineIcon />
                  </IconButton>
                </Stack>
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={() => setItems((atual) => [...atual, linhaPedido()])}
                sx={{ alignSelf: 'flex-start' }}
              >
                Adicionar item
              </Button>
            </Stack>
          )}
        </Stack>
        <Paper
          className="documento-clinico-impressao"
          variant="outlined"
          sx={{ flex: 1, width: '100%', p: 3, bgcolor: '#fff', color: '#111' }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Box component="img" src={logoSeraphisVerde} alt="Clínica Seraphis" sx={{ height: 56, width: 'auto' }} />
              <Typography variant="h6" fontWeight={700}>
                {NOME_CLINICA}
              </Typography>
            </Stack>
            <Divider />
            <Typography variant="h5" textAlign="center" fontWeight={700}>
              {titulo}
            </Typography>
            <Typography variant="body2">Data: {formatarDataISO(date) || '—'}</Typography>
            <Typography variant="body2">Paciente: {patient.name}</Typography>
            <Typography variant="body2">Nascimento: {formatarDataISO(patient.birthDate) || '—'}</Typography>
            <Typography variant="body2">CPF: {formatarCpf(patient.cpf)}</Typography>
            <Typography variant="body2">
              Profissional: {professionalName.trim() || '—'}
              {professionalCouncil.trim() ? ` — ${professionalCouncil.trim()}` : ''}
            </Typography>
            <Divider />
            {kind === 'PRESCRIPTION' ? (
              <Stack spacing={1.5}>
                {medications.map((item, index) => (
                  <Box key={index}>
                    <Typography fontWeight={700}>{item.name.trim() || 'Medicamento'}</Typography>
                    <Typography variant="body2">Posologia: {item.dosage.trim() || '—'}</Typography>
                    <Typography variant="body2">Quantidade: {item.quantity.trim() || '—'}</Typography>
                  </Box>
                ))}
                {notes.trim() ? (
                  <Typography variant="body2">Orientações: {notes.trim()}</Typography>
                ) : null}
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                <Typography variant="body2">Indicação clínica: {indication.trim() || '—'}</Typography>
                {items.map((item, index) => (
                  <Typography key={index} variant="body2">
                    {index + 1}. {item.description.trim() || '—'}
                  </Typography>
                ))}
              </Stack>
            )}
            <Stack spacing={0.5} sx={{ pt: 6, alignItems: 'center' }}>
              <Box sx={{ borderTop: '1px solid #111', width: 240 }} />
              <Typography variant="body2">{professionalName.trim() || 'Assinatura'}</Typography>
              <Typography variant="caption">{professionalCouncil.trim()}</Typography>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Stack>
  )
}
