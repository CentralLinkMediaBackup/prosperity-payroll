import { Outlet, useParams, Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import SavingIndicator from '../components/SavingIndicator'
import { useApp } from '../context/AppContext'

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data, loading } = useApp()

  if (!loading && !data.projects.find((p) => p.id === projectId)) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-50">
        <Outlet />
      </main>
      <SavingIndicator />
    </div>
  )
}
