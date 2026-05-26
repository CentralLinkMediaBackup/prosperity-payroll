import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { MoreVertical, Calendar, AlertTriangle, FileText } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
  Bar, ComposedChart, Line,
} from 'recharts'

const NAVY = '#1B3A5C'
const NAVY2 = '#2563A8'
const ORANGE = '#F47B20'

function CardHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 rounded-t-[10px]"
      style={{ background: `linear-gradient(to right, ${NAVY}, ${NAVY2})` }}>
      <span className="text-white font-semibold text-[13px]">{title}</span>
      <div className="flex items-center gap-2">
        {icon}
        <MoreVertical className="w-4 h-4 text-white/70 cursor-pointer" />
      </div>
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-[10px] shadow-card overflow-hidden ${className}`}>{children}</div>
}

function Avatar({ name }: { name: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const colors = [NAVY, NAVY2, ORANGE, '#16a34a']
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
      style={{ background: colors[name.charCodeAt(0) % colors.length] }}>
      {initials}
    </div>
  )
}

export default function Dashboard() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useApp()
  const [search, setSearch] = useState('')

  const workers = data.workers.filter(w => w.projectId === projectId)
  const entries = data.payrollEntries.filter(e => e.projectId === projectId)

  const maxWeek = entries.reduce((m, e) => Math.max(m, e.weekNumber), 0)
  const currentEntries = entries.filter(e => e.weekNumber === maxWeek)
  const currentPeriodEntry = currentEntries[0]

  const currentGross  = currentEntries.reduce((s, e) => s + e.grossPay, 0)
  const currentFringe = currentEntries.reduce((s, e) => s + e.fringeTotal, 0)
  const currentTaxes  = currentEntries.reduce((s, e) => s + e.totalTaxes, 0)
  const currentNet    = currentEntries.reduce((s, e) => s + e.netPay, 0)
  const currentSS     = currentEntries.reduce((s, e) => s + e.socialSecurityTax, 0)
  const currentMed    = currentEntries.reduce((s, e) => s + e.medicareTax, 0)
  const currentFed    = currentEntries.reduce((s, e) => s + e.federalTax, 0)

  const totalGross  = entries.reduce((s, e) => s + e.grossPay, 0)
  const totalFringe = entries.reduce((s, e) => s + e.fringeTotal, 0)
  const budgetPct   = Math.min(100, Math.round(((totalGross + totalFringe) / 120000) * 100))

  const recentWeeks = useMemo(() => {
    const weeks = [...new Set(entries.map(e => e.weekNumber))].sort((a, b) => a - b).slice(-6)
    return weeks.map(wk => {
      const pt: Record<string, number | string> = { week: `Wk${wk}` }
      workers.forEach(w => {
        const e = entries.find(x => x.weekNumber === wk && x.workerId === w.id)
        pt[w.name.split(' ')[0]] = e ? parseFloat(e.totalHours.toFixed(1)) : 0
      })
      return pt
    })
  }, [entries, workers])

  const donutData = [
    { name: 'Taxes',   value: parseFloat(currentTaxes.toFixed(2)) },
    { name: 'Net Pay', value: parseFloat((currentNet - currentFringe).toFixed(2)) },
    { name: 'Fringe',  value: parseFloat(currentFringe.toFixed(2)) },
  ]

  const workerStats = workers
    .filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
    .map(w => {
      const wEntries = entries.filter(e => e.workerId === w.id)
      const curEntry  = wEntries.find(e => e.weekNumber === maxWeek)
      const lastEntry = [...wEntries].sort((a, b) => b.weekNumber - a.weekNumber)[0]
      return { ...w, curHours: curEntry?.totalHours ?? 0, lastPayDate: lastEntry?.payPeriodEnd ?? '' }
    })

  const fmtDate = (s: string) =>
    s ? new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

  const fmtPeriod = (e: typeof currentPeriodEntry) => {
    if (!e) return '—'
    const s = new Date(e.payPeriodStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const end = new Date(e.payPeriodEnd + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${s} – ${end}`
  }

  const w0 = workers[0]?.name.split(' ')[0] ?? 'A'
  const w1 = workers[1]?.name.split(' ')[0] ?? 'B'

  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold text-slate-800 mb-5">Prosperity Payroll Dashboard</h1>

      {/* ROW 1 */}
      <div className="flex gap-4 mb-4">
        {/* Card 1 — Project Summary */}
        <Card className="flex-[58]">
          <CardHeader title="Project Summary Overview" />
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Project Name','Budget Status','Total Payroll Cost','Employees'].map(h => (
                    <th key={h} className={`pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider ${h==='Project Name'?'text-left':'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.projects.filter(p => p.id === projectId).map(proj => (
                  <tr key={proj.id} className="border-b border-slate-50 last:border-0">
                    <td className="py-3 font-medium text-slate-800">{proj.name}</td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#e8edf4' }}>
                          <div className="h-full rounded-full" style={{ width: `${budgetPct}%`, background: ORANGE }} />
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">{budgetPct}%</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-semibold" style={{ color: NAVY }}>{formatCurrency(totalGross + totalFringe)}</td>
                    <td className="py-3 text-right text-slate-600">{workers.length}</td>
                  </tr>
                ))}
                {data.projects.filter(p => p.id === projectId).length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-xs">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Card 2 — Employee Compensation */}
        <Card className="flex-[42]">
          <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-[10px]">
            <span className="font-semibold text-slate-800 text-[13px]">Employee Compensation & Hours</span>
            <div className="w-[100px] h-[40px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={recentWeeks} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                  <Bar dataKey={w0} fill={NAVY} opacity={0.75} radius={[2,2,0,0]} />
                  <Line type="monotone" dataKey={w1} stroke={ORANGE} strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="px-4 pt-3 pb-3">
            <input
              className="w-full pl-3 pr-3 py-1.5 text-xs border border-slate-200 rounded-full mb-3 focus:outline-none focus:ring-1 focus:ring-navy/20 bg-slate-50"
              placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)}
            />
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Name','Pay Rate','Hrs (Period)','Last Pay',''].map(h => (
                    <th key={h} className={`pb-2 text-slate-400 font-semibold uppercase tracking-wider text-[10px] ${h==='Name'||h===''?'text-left':'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {workerStats.map(w => (
                  <tr key={w.id}>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <Avatar name={w.name} />
                        <div>
                          <p className="font-medium text-slate-800 text-[11px] leading-none">{w.name}</p>
                          <p className="text-slate-400 text-[10px] mt-0.5">{w.trade}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2 text-right font-medium text-slate-700">${w.regularRate}/hr</td>
                    <td className="py-2 text-right text-slate-600">{w.curHours > 0 ? w.curHours.toFixed(1) : '—'}</td>
                    <td className="py-2 text-right text-slate-500">{fmtDate(w.lastPayDate)}</td>
                    <td className="py-2 pl-2">
                      <button className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors" style={{ background: '#e8f0fb', color: NAVY2 }}>
                        Pay Stub
                      </button>
                    </td>
                  </tr>
                ))}
                {workerStats.length === 0 && (
                  <tr><td colSpan={5} className="py-6 text-center text-slate-400">No employees</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ROW 2 */}
      <div className="flex gap-4">
        {/* Card 3 — Pay Period */}
        <Card className="flex-[50]">
          <CardHeader title="Pay Period At A Glance" />
          <div className="p-4 flex gap-6">
            <div className="flex-1 space-y-3 min-w-0">
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">Current Pay Period</p>
                <p className="font-semibold text-slate-800 text-sm">{fmtPeriod(currentPeriodEntry)}</p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">Gross Pay</p>
                <p className="text-2xl font-bold text-slate-900">{currentGross > 0 ? formatCurrency(currentGross) : '$0.00'}</p>
              </div>
              <div className="space-y-1.5 text-xs">
                {[['Social Security', currentSS],['Medicare', currentMed],['Federal Income', currentFed]].map(([l,v]) => (
                  <div key={String(l)} className="flex justify-between">
                    <span className="text-slate-500">{l}</span>
                    <span className="font-medium">{formatCurrency(Number(v))}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] text-slate-400 mb-0.5">Net Pay to be Distributed</p>
                <p className="text-xl font-bold" style={{ color: NAVY }}>{currentNet > 0 ? formatCurrency(currentNet) : '$0.00'}</p>
              </div>
            </div>
            <div className="w-[150px] flex flex-col items-center justify-center shrink-0">
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={38} outerRadius={58} dataKey="value" paddingAngle={2}>
                    {[NAVY, ORANGE, '#16a34a'].map((c, i) => <Cell key={i} fill={c} />)}
                  </Pie>
                  <RTooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1">
                {[{c:NAVY,l:'Taxes'},{c:ORANGE,l:'Net Pay'},{c:'#16a34a',l:'Fringe'}].map(({c,l}) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c }} />
                    <span className="text-[10px] text-slate-500">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Card 4 — Timesheet Approvals */}
        <Card className="flex-[25]">
          <CardHeader title="Timesheet Approvals" />
          <div className="p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"> </th>
                  <th className="text-right pb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Pending</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-3 text-sm text-slate-600">Timesheet Submissions</td>
                  <td className="py-3 text-right">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">0</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        {/* Card 5 — Tax Compliance */}
        <Card className="flex-[25]">
          <CardHeader title="Tax Compliance" icon={<Calendar className="w-4 h-4 text-accent" />} />
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ORANGE }} />
              <span className="text-xs text-slate-500">Reminders for upcoming tax deadlines</span>
            </div>
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: ORANGE }} />
              <span className="text-xs text-slate-500">Reminders for upcoming tax deadlines</span>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-semibold text-slate-700 mb-2">Tax Documents</p>
              {['Tax Document Link', 'Tax Document Link'].map((label, i) => (
                <div key={i} className="flex items-center gap-1.5 py-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs text-blue-600 hover:underline cursor-pointer">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
