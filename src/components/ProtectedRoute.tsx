import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspace } from '../contexts/WorkspaceContext'

export function ProtectedRoute({ children, workspaceRequired = true }: { children: ReactNode; workspaceRequired?: boolean }) {
  const { user, loading: authLoading, configured } = useAuth()
  const { workspace, loading: workspaceLoading } = useWorkspace()
  const location = useLocation()

  if (!configured) return <Navigate to="/setup" replace />
  if (authLoading || workspaceLoading) return <div className="route-loader" role="status">Загрузка рабочего пространства...</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (workspaceRequired && !workspace) return <Navigate to="/onboarding" replace />
  return children
}
