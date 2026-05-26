import { Outlet, useParams, Navigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TopHeader from '../components/TopHeader'
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
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader />
        <main className="flex-1 overflow-auto bg-app-bg">
          <Outlet />
        </main>
      </div>
      <SavingIndicator />
    </div>
  )
}
