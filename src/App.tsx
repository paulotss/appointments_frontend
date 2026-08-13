import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from './layouts/AppLayout'
import { CategoriasPage } from './pages/CategoriasPage'
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
import { GuiasPage } from './pages/GuiasPage'
import { NovaGuiaPage } from './pages/NovaGuiaPage'
import { NovoPacientePage } from './pages/NovoPacientePage'
import { NovoPlanoSaudePage } from './pages/NovoPlanoSaudePage'
import { NovoProfissionalPage } from './pages/NovoProfissionalPage'
import { PacientesPage } from './pages/PacientesPage'
import { PlanosSaudePage } from './pages/PlanosSaudePage'
import { ProdutosConfigPage } from './pages/ProdutosConfigPage'
import { ProdutosEstoquePage } from './pages/ProdutosEstoquePage'
import { ProfissionaisPage } from './pages/ProfissionaisPage'
import { SaidasPage } from './pages/SaidasPage'
import { SetoresPage } from './pages/SetoresPage'
import { UsuariosPage } from './pages/UsuariosPage'
import { AdminRoute } from './routes/AdminRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'

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
        <Route path="/" element={<Navigate to="/registros" replace />} />
        <Route path="/registros" element={<RegistrosPage />} />
        <Route path="/registros/novo" element={<NovoRegistroPage />} />
        <Route path="/chamadas" element={<ChamadasPage />} />
        <Route path="/chamadas/:callId" element={<ChamadaDetalhePage />} />
        <Route path="/mensagens" element={<MensagensPage />} />
        <Route path="/mensagens/:messageId" element={<MensagemDetalhePage />} />
        <Route path="/relatorios/horarios" element={<HorariosPage />} />
        <Route path="/relatorios/atendimentos" element={<AtendimentosPage />} />
        <Route path="/relatorios/taxa-conversao" element={<TaxaConversaoPage />} />
        <Route path="/relatorios/especialidades-atendidas" element={<EspecialidadesAtendidasPage />} />
        <Route
          path="/estoque/produtos"
          element={
            <AdminRoute>
              <ProdutosEstoquePage />
            </AdminRoute>
          }
        />
        <Route
          path="/estoque/lotes"
          element={
            <AdminRoute>
              <LotesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/estoque/lotes/novo"
          element={
            <AdminRoute>
              <NovoLotePage />
            </AdminRoute>
          }
        />
        <Route
          path="/estoque/lotes/:id/editar"
          element={
            <AdminRoute>
              <EditarLotePage />
            </AdminRoute>
          }
        />
        <Route
          path="/estoque/saidas"
          element={
            <AdminRoute>
              <SaidasPage />
            </AdminRoute>
          }
        />
        <Route
          path="/estoque/saidas/nova"
          element={
            <AdminRoute>
              <NovaSaidaPage />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/categorias"
          element={
            <AdminRoute>
              <CategoriasPage />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/categorias/nova"
          element={
            <AdminRoute>
              <NovaCategoriaPage />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/produtos"
          element={
            <AdminRoute>
              <ProdutosConfigPage />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/produtos/novo"
          element={
            <AdminRoute>
              <NovoProdutoConfigPage />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/setores"
          element={
            <AdminRoute>
              <SetoresPage />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/setores/novo"
          element={
            <AdminRoute>
              <NovoSetorPage />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/locais"
          element={
            <AdminRoute>
              <LocaisPage />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/locais/novo"
          element={
            <AdminRoute>
              <NovoLocalPage />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/fornecedores"
          element={
            <AdminRoute>
              <FornecedoresPage />
            </AdminRoute>
          }
        />
        <Route
          path="/configuracoes/estoque/fornecedores/novo"
          element={
            <AdminRoute>
              <NovoFornecedorPage />
            </AdminRoute>
          }
        />
        <Route
          path="/especialidades"
          element={
            <AdminRoute>
              <EspecialidadesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/especialidades/nova"
          element={
            <AdminRoute>
              <NovaEspecialidadePage />
            </AdminRoute>
          }
        />
        <Route
          path="/usuarios"
          element={
            <AdminRoute>
              <UsuariosPage />
            </AdminRoute>
          }
        />
        <Route
          path="/usuarios/novo"
          element={
            <AdminRoute>
              <NovoUsuarioPage />
            </AdminRoute>
          }
        />
        <Route
          path="/profissionais"
          element={
            <AdminRoute>
              <ProfissionaisPage />
            </AdminRoute>
          }
        />
        <Route
          path="/profissionais/novo"
          element={
            <AdminRoute>
              <NovoProfissionalPage />
            </AdminRoute>
          }
        />
        <Route
          path="/pacientes"
          element={
            <AdminRoute>
              <PacientesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/pacientes/novo"
          element={
            <AdminRoute>
              <NovoPacientePage />
            </AdminRoute>
          }
        />
        <Route
          path="/planos-saude"
          element={
            <AdminRoute>
              <PlanosSaudePage />
            </AdminRoute>
          }
        />
        <Route
          path="/planos-saude/novo"
          element={
            <AdminRoute>
              <NovoPlanoSaudePage />
            </AdminRoute>
          }
        />
        <Route
          path="/guias"
          element={
            <AdminRoute>
              <GuiasPage />
            </AdminRoute>
          }
        />
        <Route
          path="/guias/novo"
          element={
            <AdminRoute>
              <NovaGuiaPage />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/registros" replace />} />
    </Routes>
  )
}

export default App
