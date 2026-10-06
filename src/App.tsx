import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { CategoriasPage } from './pages/CategoriasPage'
import { ClinicaPage } from './pages/ClinicaPage'
import { EspecialidadesPage } from './pages/EspecialidadesPage'
import { EditarLotePage } from './pages/EditarLotePage'
import { EspecialidadesAtendidasPage } from './pages/EspecialidadesAtendidasPage'
import { FornecedoresPage } from './pages/FornecedoresPage'
import { LocaisPage } from './pages/LocaisPage'
import { LotesPage } from './pages/LotesPage'
import { LoginPage } from './pages/LoginPage'
import { AtendimentosPage } from './pages/AtendimentosPage'
import { HorariosPage } from './pages/HorariosPage'
import { TaxaConversaoPage } from './pages/TaxaConversaoPage'
import { NovaCategoriaPage } from './pages/NovaCategoriaPage'
import { NovaEspecialidadePage } from './pages/NovaEspecialidadePage'
import { NovoLocalPage } from './pages/NovoLocalPage'
import { NovaSaidaPage } from './pages/NovaSaidaPage'
import { NovoFornecedorPage } from './pages/NovoFornecedorPage'
import { NovoLotePage } from './pages/NovoLotePage'
import { NovoProdutoConfigPage } from './pages/NovoProdutoConfigPage'
import { NovoSetorPage } from './pages/NovoSetorPage'
import { ChamadaDetalhePage } from './pages/ChamadaDetalhePage'
import { ChamadasPage } from './pages/ChamadasPage'
import { MensagemDetalhePage } from './pages/MensagemDetalhePage'
import { MensagensPage } from './pages/MensagensPage'
import { NovoRegistroPage } from './pages/NovoRegistroPage'
import { RegistrosPage } from './pages/RegistrosPage'
import { NovoUsuarioPage } from './pages/NovoUsuarioPage'
import { AgendaClinicaPage } from './pages/AgendaClinicaPage'
import { EntradaFinanceiraDetalhePage } from './pages/EntradaFinanceiraDetalhePage'
import { FinanceiroEntradasPage } from './pages/FinanceiroEntradasPage'
import { FinanceiroPagamentosPage } from './pages/FinanceiroPagamentosPage'
import { FinanceiroSaidasPage } from './pages/FinanceiroSaidasPage'
import { GuiaDetalhePage } from './pages/GuiaDetalhePage'
import { GuiasPage } from './pages/GuiasPage'
import { HigiaPage } from './pages/HigiaPage'
import { LoteTissDetalhePage } from './pages/LoteTissDetalhePage'
import { NovaEntradaFinanceiraPage } from './pages/NovaEntradaFinanceiraPage'
import { NovaGuiaPage } from './pages/NovaGuiaPage'
import { ImportarGuiaPage } from './pages/ImportarGuiaPage'
import { NovoLoteTissPage } from './pages/NovoLoteTissPage'
import { NovoPagamentoPage } from './pages/NovoPagamentoPage'
import { NovoProcedimentoPage } from './pages/NovoProcedimentoPage'
import { PagamentoDetalhePage } from './pages/PagamentoDetalhePage'
import { ProcedimentosPage } from './pages/ProcedimentosPage'
import { TissLotesPage } from './pages/TissLotesPage'
import { EditarPacientePage } from './pages/EditarPacientePage'
import { NovoPacientePage } from './pages/NovoPacientePage'
import { NovoPlanoSaudePage } from './pages/NovoPlanoSaudePage'
import { EditarProfissionalPage } from './pages/EditarProfissionalPage'
import { NovoProfissionalPage } from './pages/NovoProfissionalPage'
import { PacientesPage } from './pages/PacientesPage'
import { PacotesPage } from './pages/PacotesPage'
import { NovoPacotePage } from './pages/NovoPacotePage'
import { NovoPlanoCartaoPage } from './pages/NovoPlanoCartaoPage'
import { PlanosCartaoPage } from './pages/PlanosCartaoPage'
import { PlanosSaudePage } from './pages/PlanosSaudePage'
import { ProdutosConfigPage } from './pages/ProdutosConfigPage'
import { ProdutosEstoquePage } from './pages/ProdutosEstoquePage'
import { ProfissionaisPage } from './pages/ProfissionaisPage'
import { SaidasPage } from './pages/SaidasPage'
import { SetoresPage } from './pages/SetoresPage'
import { TokensServicoPage } from './pages/TokensServicoPage'
import { UsuariosPage } from './pages/UsuariosPage'
import { ADMIN_ROLES, CLINICAL_STAFF_ROLES, STAFF_ROLES } from './routes/access'
import { ProtectedRoute } from './routes/ProtectedRoute'
import { RoleRoute } from './routes/RoleRoute'
import { getUserRole, homePathForRole, isAuthenticated } from './services/authStorage'

function HomeRedirect() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return <Navigate to={homePathForRole(getUserRole())} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/registros" element={<RoleRoute roles={STAFF_ROLES}><RegistrosPage /></RoleRoute>} />
        <Route path="/registros/novo" element={<RoleRoute roles={STAFF_ROLES}><NovoRegistroPage /></RoleRoute>} />
        <Route path="/clinical-appointments" element={<AgendaClinicaPage />} />
        <Route path="/chamadas" element={<RoleRoute roles={STAFF_ROLES}><ChamadasPage /></RoleRoute>} />
        <Route path="/chamadas/:callId" element={<RoleRoute roles={STAFF_ROLES}><ChamadaDetalhePage /></RoleRoute>} />
        <Route path="/mensagens" element={<RoleRoute roles={STAFF_ROLES}><MensagensPage /></RoleRoute>} />
        <Route path="/mensagens/:messageId" element={<RoleRoute roles={STAFF_ROLES}><MensagemDetalhePage /></RoleRoute>} />
        <Route path="/higia" element={<RoleRoute roles={STAFF_ROLES}><HigiaPage /></RoleRoute>} />
        <Route path="/relatorios/horarios" element={<RoleRoute roles={STAFF_ROLES}><HorariosPage /></RoleRoute>} />
        <Route path="/relatorios/atendimentos" element={<RoleRoute roles={STAFF_ROLES}><AtendimentosPage /></RoleRoute>} />
        <Route path="/relatorios/taxa-conversao" element={<RoleRoute roles={STAFF_ROLES}><TaxaConversaoPage /></RoleRoute>} />
        <Route path="/relatorios/especialidades-atendidas" element={<RoleRoute roles={STAFF_ROLES}><EspecialidadesAtendidasPage /></RoleRoute>} />
        <Route
          path="/estoque/produtos"
          element={
            <RoleRoute roles={CLINICAL_STAFF_ROLES}>
              <ProdutosEstoquePage />
            </RoleRoute>
          }
        />
        <Route
          path="/estoque/lotes"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <LotesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/estoque/lotes/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoLotePage />
            </RoleRoute>
          }
        />
        <Route
          path="/estoque/lotes/:id/editar"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <EditarLotePage />
            </RoleRoute>
          }
        />
        <Route
          path="/estoque/saidas"
          element={
            <RoleRoute roles={CLINICAL_STAFF_ROLES}>
              <SaidasPage />
            </RoleRoute>
          }
        />
        <Route
          path="/estoque/saidas/nova"
          element={
            <RoleRoute roles={CLINICAL_STAFF_ROLES}>
              <NovaSaidaPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/categorias"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <CategoriasPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/categorias/nova"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovaCategoriaPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/produtos"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <ProdutosConfigPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/produtos/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoProdutoConfigPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/setores"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <SetoresPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/setores/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoSetorPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/locais"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <LocaisPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/locais/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoLocalPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/fornecedores"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <FornecedoresPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/fornecedores/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoFornecedorPage />
            </RoleRoute>
          }
        />
        <Route
          path="/especialidades"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <EspecialidadesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/especialidades/nova"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovaEspecialidadePage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/clinica"
          element={
            <RoleRoute roles={ADMIN_ROLES}>
              <ClinicaPage />
            </RoleRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <RoleRoute roles={ADMIN_ROLES}>
              <UsuariosPage />
            </RoleRoute>
          }
        />
        <Route
          path="/usuarios/novo"
          element={
            <RoleRoute roles={ADMIN_ROLES}>
              <NovoUsuarioPage />
            </RoleRoute>
          }
        />
        <Route
          path="/configuracoes/tokens"
          element={
            <RoleRoute roles={ADMIN_ROLES}>
              <TokensServicoPage />
            </RoleRoute>
          }
        />
        <Route
          path="/profissionais"
          element={
            <RoleRoute roles={CLINICAL_STAFF_ROLES}>
              <ProfissionaisPage />
            </RoleRoute>
          }
        />
        <Route
          path="/profissionais/novo"
          element={
            <RoleRoute roles={CLINICAL_STAFF_ROLES}>
              <NovoProfissionalPage />
            </RoleRoute>
          }
        />
        <Route
          path="/profissionais/:id"
          element={
            <RoleRoute roles={CLINICAL_STAFF_ROLES}>
              <EditarProfissionalPage />
            </RoleRoute>
          }
        />
        <Route
          path="/pacientes"
          element={
            <RoleRoute roles={CLINICAL_STAFF_ROLES}>
              <PacientesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/pacientes/novo"
          element={
            <RoleRoute roles={CLINICAL_STAFF_ROLES}>
              <NovoPacientePage />
            </RoleRoute>
          }
        />
        <Route
          path="/pacientes/:id"
          element={
            <RoleRoute roles={CLINICAL_STAFF_ROLES}>
              <EditarPacientePage />
            </RoleRoute>
          }
        />
        <Route
          path="/cartao/planos"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <PlanosCartaoPage />
            </RoleRoute>
          }
        />
        <Route
          path="/cartao/planos/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoPlanoCartaoPage />
            </RoleRoute>
          }
        />
        <Route
          path="/pacotes"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <PacotesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/pacotes/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoPacotePage />
            </RoleRoute>
          }
        />
        <Route
          path="/planos-saude"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <PlanosSaudePage />
            </RoleRoute>
          }
        />
        <Route
          path="/planos-saude/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoPlanoSaudePage />
            </RoleRoute>
          }
        />
        <Route
          path="/guias"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <GuiasPage />
            </RoleRoute>
          }
        />
        <Route
          path="/guias/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovaGuiaPage />
            </RoleRoute>
          }
        />
        <Route
          path="/guias/importar"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <ImportarGuiaPage />
            </RoleRoute>
          }
        />
        <Route
          path="/guias/:id"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <GuiaDetalhePage />
            </RoleRoute>
          }
        />
        <Route
          path="/tiss/lotes"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <TissLotesPage />
            </RoleRoute>
          }
        />
        <Route
          path="/tiss/lotes/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoLoteTissPage />
            </RoleRoute>
          }
        />
        <Route
          path="/tiss/lotes/:id"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <LoteTissDetalhePage />
            </RoleRoute>
          }
        />
        <Route
          path="/financeiro/entradas"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <FinanceiroEntradasPage />
            </RoleRoute>
          }
        />
        <Route
          path="/financeiro/entradas/nova"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovaEntradaFinanceiraPage />
            </RoleRoute>
          }
        />
        <Route
          path="/financeiro/entradas/:id"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <EntradaFinanceiraDetalhePage />
            </RoleRoute>
          }
        />
        <Route
          path="/financeiro/saidas"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <FinanceiroSaidasPage />
            </RoleRoute>
          }
        />
        <Route
          path="/financeiro/pagamentos"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <FinanceiroPagamentosPage />
            </RoleRoute>
          }
        />
        <Route
          path="/financeiro/pagamentos/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoPagamentoPage />
            </RoleRoute>
          }
        />
        <Route
          path="/financeiro/pagamentos/:id"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <PagamentoDetalhePage />
            </RoleRoute>
          }
        />
        <Route
          path="/procedimentos"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <ProcedimentosPage />
            </RoleRoute>
          }
        />
        <Route
          path="/procedimentos/novo"
          element={
            <RoleRoute roles={STAFF_ROLES}>
              <NovoProcedimentoPage />
            </RoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  )
}

export default App
