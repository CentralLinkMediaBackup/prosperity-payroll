import { NavLink, useParams, Link } from 'react-router-dom'
import { LayoutDashboard, Users, Clock, FileText, BarChart2, Flame, FileCheck } from 'lucide-react'
import logo from '../assets/logo.png'

const NAV = [
  { to: '',            label: 'Dashboard',          icon: LayoutDashboard, end: true },
  { to: 'workers',     label: 'Employees',          icon: Users },
  { to: 'calculator',  label: 'Payroll Calculator', icon: Clock },
  { to: 'history',     label: 'Payroll History',    icon: FileText },
  { to: 'paychecks',   label: 'Paychecks',          icon: FileCheck },
  { to: 'reports',     label: 'Reports',            icon: BarChart2 },
]

export default function Sidebar() {
  const { projectId } = useParams<{ projectId: string }>()

  return (
    <aside className="w-[200px] shrink-0 flex flex-col min-h-screen" style={{ background: '#1B3A5C' }}>
      {/* Logo */}
      <div className="px-4 pt-6 pb-5 border-b border-white/10">
        <Link to="/" className="flex items-center gap-2.5">
          {logo
            ? <img src={logo} alt="Prosperity" className="h-8 w-auto object-contain" />
            : <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center"><Flame className="w-4 h-4 text-white" /></div>
          }
          <div className="leading-tight">
            <p className="text-white font-semibold text-[11px] leading-tight">Prosperity Fire</p>
            <p className="text-accent text-[10px] font-medium">Protection LLC</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2">
        {NAV.map(({ to, label, icon: Icon, end }) => {
          const href = to === '' ? `/projects/${projectId}` : `/projects/${projectId}/${to}`
          return (
            <NavLink
              key={to}
              to={href}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all relative
                 ${isActive
                   ? 'text-white font-medium'
                   : 'text-white/60 hover:text-white hover:bg-white/5'}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-accent" />
                  )}
                  <span className={`absolute inset-0 rounded-lg transition-all ${isActive ? 'bg-white/10' : ''}`} />
                  <Icon className="w-4 h-4 shrink-0 relative z-10" />
                  <span className="relative z-10">{label}</span>
                </>
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-white/30 text-[10px]">Internal Payroll Tool</p>
      </div>
    </aside>
  )
}
