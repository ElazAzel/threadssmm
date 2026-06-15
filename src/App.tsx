import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'

const LandingPage = lazy(() => import('./pages/LandingPage').then((module) => ({ default: module.LandingPage })))
const LoginPage = lazy(() => import('./pages/LoginPage').then((module) => ({ default: module.LoginPage })))
const SetupRequiredPage = lazy(() => import('./pages/SetupRequiredPage').then((module) => ({ default: module.SetupRequiredPage })))
const OnboardingPage = lazy(() => import('./pages/OnboardingPage').then((module) => ({ default: module.OnboardingPage })))
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })))
const AccountsPage = lazy(() => import('./pages/ContentPages').then((module) => ({ default: module.AccountsPage })))
const BrandsPage = lazy(() => import('./pages/ContentPages').then((module) => ({ default: module.BrandsPage })))
const StudioPage = lazy(() => import('./pages/ContentPages').then((module) => ({ default: module.StudioPage })))
const CalendarPage = lazy(() => import('./pages/OperationsPages').then((module) => ({ default: module.CalendarPage })))
const MonitoringPage = lazy(() => import('./pages/OperationsPages').then((module) => ({ default: module.MonitoringPage })))
const ApprovalsPage = lazy(() => import('./pages/OperationsPages').then((module) => ({ default: module.ApprovalsPage })))
const AnalyticsPage = lazy(() => import('./pages/InsightsPages').then((module) => ({ default: module.AnalyticsPage })))
const MediaPage = lazy(() => import('./pages/InsightsPages').then((module) => ({ default: module.MediaPage })))
const BillingPage = lazy(() => import('./pages/InsightsPages').then((module) => ({ default: module.BillingPage })))
const SettingsPage = lazy(() => import('./pages/InsightsPages').then((module) => ({ default: module.SettingsPage })))

export default function App() {
  return (
    <Suspense fallback={<div className="route-loader" role="status">Загрузка интерфейса...</div>}><Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/setup" element={<SetupRequiredPage />} />
      <Route path="/onboarding" element={<ProtectedRoute workspaceRequired={false}><OnboardingPage /></ProtectedRoute>} />
      <Route path="/app" element={<ProtectedRoute><Navigate to="/app/dashboard" replace /></ProtectedRoute>} />
      <Route path="/app/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/app/accounts" element={<ProtectedRoute><AccountsPage /></ProtectedRoute>} />
      <Route path="/app/brands" element={<ProtectedRoute><BrandsPage /></ProtectedRoute>} />
      <Route path="/app/studio" element={<ProtectedRoute><StudioPage /></ProtectedRoute>} />
      <Route path="/app/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
      <Route path="/app/monitoring" element={<ProtectedRoute><MonitoringPage /></ProtectedRoute>} />
      <Route path="/app/approvals" element={<ProtectedRoute><ApprovalsPage /></ProtectedRoute>} />
      <Route path="/app/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
      <Route path="/app/media" element={<ProtectedRoute><MediaPage /></ProtectedRoute>} />
      <Route path="/app/billing" element={<ProtectedRoute><BillingPage /></ProtectedRoute>} />
      <Route path="/app/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes></Suspense>
  )
}
