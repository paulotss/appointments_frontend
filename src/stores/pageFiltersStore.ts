import { useCallback, useSyncExternalStore } from 'react'
import type { CallRecordStatus } from '../types/call'
import type { MessageRecordStatus } from '../types/message'

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

let mensagensFiltros = createDefaultMensagensFiltros()
let chamadasFiltros = createDefaultChamadasFiltros()

const mensagensListeners = new Set<() => void>()
const chamadasListeners = new Set<() => void>()

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

function getMensagensFiltrosSnapshot() {
  return mensagensFiltros
}

function getChamadasFiltrosSnapshot() {
  return chamadasFiltros
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
