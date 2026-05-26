import { Link } from 'react-router-dom'
import { Plus, MapPin, Building2, Flame } from 'lucide-react'
import { useApp } from '../context/AppContext'
import LoadingSpinner from '../components/LoadingSpinner'
import SavingIndicator from '../components/SavingIndicator'

export default function Landing() {
  const { data, loading } = useApp()

  if (loading) return <LoadingSpinner fullScreen />

  return (
    <div className="min-h-screen bg-slate-50">
      <SavingIndicator />
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 text-lg leading-none">Prosperity Fire Protection</h1>
              <p className="text-xs text-slate-500 mt-0.5">Payroll Calculator — Internal Tool</p>
            </div>
          </div>
          <Link
            to="/projects/new"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Project
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {data.projects.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-700 mb-2">No projects yet</h2>
            <p className="text-slate-500 mb-6 text-sm">Create your first project to start tracking payroll.</p>
            <Link
              to="/projects/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Project
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-700 mb-5">Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.projects.map((project) => {
                const workers = data.workers.filter((w) => w.projectId === project.id)
                const entries = data.payrollEntries.filter((e) => e.projectId === project.id)
                const totalGross = entries.reduce((s, e) => s + e.grossPay, 0)
                return (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-blue-200 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      {project.logo ? (
                        <img src={project.logo} alt="" className="w-12 h-12 rounded-xl object-contain bg-slate-50 p-1 border border-slate-100" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-lg group-hover:bg-blue-700 transition-colors">
                          {project.name[0]}
                        </div>
                      )}
                      <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md">
                        {workers.length} worker{workers.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-0.5">{project.name}</h3>
                    <p className="text-sm text-blue-600 font-medium mb-2">{project.gc}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-3">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{project.address}</span>
                    </div>
                    {entries.length > 0 && (
                      <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between text-xs text-slate-500">
                        <span>{entries.length} payroll entries</span>
                        <span className="text-green-700 font-medium">
                          ${(totalGross / 1000).toFixed(1)}k gross
                        </span>
                      </div>
                    )}
                  </Link>
                )
              })}
              <Link
                to="/projects/new"
                className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all min-h-[160px]"
              >
                <Plus className="w-8 h-8 mb-2" />
                <span className="text-sm font-medium">New Project</span>
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
