import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import LoadingSpinner from '../components/LoadingSpinner'

export default function Landing() {
  const { data, loading } = useApp()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && data.projects.length > 0) {
      navigate(`/projects/${data.projects[0].id}`, { replace: true })
    }
  }, [loading, data.projects, navigate])

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <p className="text-slate-500 text-sm">No project found. Contact your administrator.</p>
    </div>
  )
}
