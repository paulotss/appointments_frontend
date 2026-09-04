import { useCallback, useSyncExternalStore } from 'react'
import type { CallRecordStatus } from '../types/call'
import type { InsuranceGuideStatus } from '../types/guia'
import type { MessageRecordStatus } from '../types/message'
import type { Patient } from '../types/paciente'

function getHojeLocalISO(): string {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export type FiltroRegistroMensagem = MessageRecordStatus | 'all'
export type FiltroRegistroChamada = CallRecordStatus | 'all'

export type MensagensFiltros = {
  dataInicio: string
  dataFim: string
  filtroRegistro: FiltroRegistroMensagem
  filtroAtendenteId: string
}

export type ChamadasFiltros = {
  dataInicio: string
  dataFim: string
  filtroRegistro: FiltroRegistroChamada
  filtroAtendenteId: string
  mostrarNaoAtendidos: boolean
  mostrarRealizados: boolean
}

export type GuiasFiltros = {
  filtroPaciente: Patient | null
  filtroPlanoId: number | ''
  filtroStatus: InsuranceGuideStatus | ''
  filtroPertoVencer: boolean
  filtroVencidas: boolean
  filtroMostrarFaturadas: boolean
  filtroSemSaldo: boolean
}

function createDefaultMensagensFiltros(): MensagensFiltros {
  const hoje = getHojeLocalISO()
  return {
    dataInicio: hoje,
    dataFim: hoje,
    filtroRegistro: 'pending',
    filtroAtendenteId: '',
  }
}

function createDefaultChamadasFiltros(): ChamadasFiltros {
  const hoje = getHojeLocalISO()
  return {
    dataInicio: hoje,
    dataFim: hoje,
    filtroRegistro: 'pending',
    filtroAtendenteId: '',
    mostrarNaoAtendidos: false,
    mostrarRealizados: false,
  }
}

function createDefaultGuiasFiltros(): GuiasFiltros {
  return {
    filtroPaciente: null,
    filtroPlanoId: '',
    filtroStatus: '',
    filtroPertoVencer: false,
    filtroVencidas: false,
    filtroMostrarFaturadas: false,
    filtroSemSaldo: false,
  }
}

let mensagensFiltros = createDefaultMensagensFiltros()
let chamadasFiltros = createDefaultChamadasFiltros()
let guiasFiltros = createDefaultGuiasFiltros()

const mensagensListeners = new Set<() => void>()
const chamadasListeners = new Set<() => void>()
const guiasListeners = new Set<() => void>()

function subscribeMensagens(onStoreChange: () => void) {
  mensagensListeners.add(onStoreChange)
  return () => {
    mensagensListeners.delete(onStoreChange)
  }
}

function subscribeChamadas(onStoreChange: () => void) {
  chamadasListeners.add(onStoreChange)
  return () => {
    chamadasListeners.delete(onStoreChange)
  }
}

function subscribeGuias(onStoreChange: () => void) {
  guiasListeners.add(onStoreChange)
  return () => {
    guiasListeners.delete(onStoreChange)
  }
}

function getMensagensFiltrosSnapshot() {
  return mensagensFiltros
}

function getChamadasFiltrosSnapshot() {
  return chamadasFiltros
}

function getGuiasFiltrosSnapshot() {
  return guiasFiltros
}

export function setMensagensFiltros(partial: Partial<MensagensFiltros>) {
  mensagensFiltros = { ...mensagensFiltros, ...partial }
  for (const listener of mensagensListeners) {
    listener()
  }
}

export function setChamadasFiltros(partial: Partial<ChamadasFiltros>) {
  chamadasFiltros = { ...chamadasFiltros, ...partial }
  for (const listener of chamadasListeners) {
    listener()
  }
}

export function setGuiasFiltros(partial: Partial<GuiasFiltros>) {
  guiasFiltros = { ...guiasFiltros, ...partial }
  for (const listener of guiasListeners) {
    listener()
  }
}

export function useMensagensFiltros() {
  const filtros = useSyncExternalStore(subscribeMensagens, getMensagensFiltrosSnapshot)
  const setFiltros = useCallback((partial: Partial<MensagensFiltros>) => {
    setMensagensFiltros(partial)
  }, [])
  return [filtros, setFiltros] as const
}

export function useChamadasFiltros() {
  const filtros = useSyncExternalStore(subscribeChamadas, getChamadasFiltrosSnapshot)
  const setFiltros = useCallback((partial: Partial<ChamadasFiltros>) => {
    setChamadasFiltros(partial)
  }, [])
  return [filtros, setFiltros] as const
}

export function useGuiasFiltros() {
  const filtros = useSyncExternalStore(subscribeGuias, getGuiasFiltrosSnapshot)
  const setFiltros = useCallback((partial: Partial<GuiasFiltros>) => {
    setGuiasFiltros(partial)
  }, [])
  return [filtros, setFiltros] as const
}
