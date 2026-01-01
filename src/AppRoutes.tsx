import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PlayersPage from './pages/PlayersPage'
import TournamentsPage from './pages/TournamentsPage'
import GamePage from './pages/GamePage'
import ResultsPage from './pages/ResultsPage'
import SettingsPage from './pages/SettingsPage'
import PublicResultsPage from './pages/PublicResultsPage'
import PublicYearlyResultsPage from './pages/PublicYearlyResultsPage'
import PublicGamePage from './pages/PublicGamePage'
import Layout from './components/Layout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/public/results/:tournamentId" element={<PublicResultsPage />} />
      <Route path="/public/results/yearly/:year" element={<PublicYearlyResultsPage />} />
      <Route path="/public/games/:id" element={<PublicGamePage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/players" element={<PlayersPage />} />
                <Route path="/tournaments" element={<TournamentsPage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/results" element={<ResultsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default AppRoutes
