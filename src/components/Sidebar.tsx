import { NavLink, useParams } from 'react-router-dom'
import { LayoutDashboard, Users, Calculator, History, Settings, ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const NAV = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: 'workers', label: 'Workers', icon: Users },
  { to: 'calculator', label: 'Payroll Calculator', icon: Calculator },
  { to: 'history', label: 'Payroll History', icon: History },
  { to: 'settings', label: 'Project Settings', icon: Settings },
]

export default function Sidebar() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useApp()
  const project = data.projects.find((p) => p.id === projectId)

  return (
    <aside className="w-60 shrink-0 bg-slate-900 text-white flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b border-slate-700">
        <Link to="/" className="flex items-center gap-2 text-slate-400 hover:text-white text-xs mb-4 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> All Projects
        </Link>
        <div className="flex items-center gap-3">
          {project?.logo ? (
            <img src={project.logo} alt="" className="w-9 h-9 rounded-lg object-contain bg-white/10 p-1" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-sm font-bold">
              {project?.name?.[0] ?? 'P'}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{project?.name ?? 'Project'}</p>
            <p className="text-xs text-slate-400 truncate">{project?.gc}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to === '' ? `/projects/${projectId}` : `/projects/${projectId}/${to}`}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
               ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500">Prosperity Fire Protection</p>
        <p className="text-xs text-slate-600">Internal Tool</p>
      </div>
    </aside>
  )
}
