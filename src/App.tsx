import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { localMode } from './lib/env'
const LocalAssistantPage = lazy(() => import('./pages/LocalAssistantPage').then((module) => ({ default: module.LocalAssistantPage })))
const CloudApp = lazy(() => import('./CloudApp'))
export default function App() {
  return <Suspense fallback={<div className="route-loader" role="status">Загрузка интерфейса...</div>}><Routes>
    <Route path="/assistant" element={<LocalAssistantPage />} />
    {localMode && <Route path="/" element={<Navigate to="/assistant" replace />} />}
    {localMode && <Route path="/app/*" element={<Navigate to="/assistant" replace />} />}
    {localMode && <Route path="/login" element={<Navigate to="/assistant" replace />} />}
    <Route path="/*" element={<CloudApp />} />
  </Routes></Suspense>
}
