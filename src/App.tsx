import { Navigate, Route, Routes } from 'react-router-dom'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardPage } from './pages/DashboardPage'
import { AccountsPage, BrandsPage, StudioPage } from './pages/ContentPages'
import { ApprovalsPage, CalendarPage, MonitoringPage } from './pages/OperationsPages'
import { AnalyticsPage, BillingPage, MediaPage, SettingsPage } from './pages/InsightsPages'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/app" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/app/dashboard" element={<DashboardPage />} />
      <Route path="/app/accounts" element={<AccountsPage />} />
      <Route path="/app/brands" element={<BrandsPage />} />
      <Route path="/app/studio" element={<StudioPage />} />
      <Route path="/app/calendar" element={<CalendarPage />} />
      <Route path="/app/monitoring" element={<MonitoringPage />} />
      <Route path="/app/approvals" element={<ApprovalsPage />} />
      <Route path="/app/analytics" element={<AnalyticsPage />} />
      <Route path="/app/media" element={<MediaPage />} />
      <Route path="/app/billing" element={<BillingPage />} />
      <Route path="/app/settings" element={<SettingsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
