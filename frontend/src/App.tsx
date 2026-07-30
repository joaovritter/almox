import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeModeProvider } from './context/ThemeModeContext'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { LoginPage } from './auth/LoginPage'
import { MainLayout } from './layout/MainLayout'
import { ItensPage } from './features/itens/ItensPage'
import { ColaboradoresPage } from './features/colaboradores/ColaboradoresPage'
import { MovimentacoesPage } from './features/movimentacoes/MovimentacoesPage'
import { HistoricoPage } from './features/historico/HistoricoPage'

function withLayout(children: ReactNode) {
  return (
    <ProtectedRoute>
      <MainLayout>{children}</MainLayout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <ThemeModeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={withLayout(<Navigate to="/movimentacoes" replace />)} />
            <Route path="/movimentacoes" element={withLayout(<MovimentacoesPage />)} />
            <Route path="/itens" element={withLayout(<ItensPage />)} />
            <Route path="/colaboradores" element={withLayout(<ColaboradoresPage />)} />
            <Route path="/historico" element={withLayout(<HistoricoPage />)} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeModeProvider>
  )
}

export default App
