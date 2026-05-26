import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { MoreVertical, ChevronLeft, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import {
  PieChart, Pie, Cell, Tooltip as RTooltip, ResponsiveContainer,
  Bar, ComposedChart, Line,
} from 'recharts'

const NAVY = '#1B3A5C'
const NAVY2 = '#2563A8'
const ORANGE = '#F47B20'
const WORKER_COLORS = [NAVY, ORANGE, '#16a34a', '#7c3aed', '#db2777', '#0891b2']

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

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
  return (
    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
      style={{ background: WORKER_COLORS[name.charCodeAt(0) % WORKER_COLORS.length] }}>
      {initials}
    </div>
  )
}

function MiniCalendar() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (d: number | null) => d !== null && d === today.getDate() && month === today.getMonth() && year === today.getFullYear()

  return (
    <div className="px-4 pb-4 pt-1 select-none">
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-500">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-[13px] font-semibold text-slate-700">{MONTH_NAMES[month]} {year}</span>
        <button onClick={next} className="p-1 rounded hover:bg-slate-100 transition-colors text-slate-500">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES.map(d => (
          <div key={d} className="text-center text-[9px] font-semibold text-slate-400 pb-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => (
          <div key={i} className={`h-7 flex items-center justify-center text-[11px] rounded-md
            ${d === null ? '' : isToday(d)
              ? 'text-white font-bold'
              : 'text-slate-600 hover:bg-slate-50'}`}
            style={isToday(d) ? { background: ORANGE } : {}}>
            {d}
          </div>
        ))}
      </div>
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

  // Card 3: current period per-worker breakdown
  const periodWorkerData = currentEntries.map((e, i) => {
    const w = workers.find(x => x.id === e.workerId)
    return {
      name: w?.name.split(' ')[0] ?? 'Worker',
      fullName: w?.name ?? 'Worker',
      gross: e.grossPay,
      taxes: e.totalTaxes,
      net: e.netPay,
      hours: e.totalHours,
      color: WORKER_COLORS[i % WORKER_COLORS.length],
    }
  }).sort((a, b) => b.gross - a.gross)

  // Card 5: missing payrolls
  const missingWeeks = useMemo(() => {
    if (!currentPeriodEntry) return []
    const lastEndDate = new Date(currentPeriodEntry.payPeriodEnd + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const existingWeeks = new Set(entries.map(e => e.weekNumber))
    const missing: { weekNumber: number; startDate: Date; endDate: Date }[] = []
    let checkEnd = new Date(lastEndDate)
    checkEnd.setDate(checkEnd.getDate() + 7)
    let wkNum = maxWeek + 1
    while (checkEnd <= today) {
      if (!existingWeeks.has(wkNum)) {
        const start = new Date(checkEnd)
        start.setDate(start.getDate() - 6)
        missing.push({ weekNumber: wkNum, startDate: start, endDate: new Date(checkEnd) })
      }
      checkEnd.setDate(checkEnd.getDate() + 7)
      wkNum++
    }
    return missing
  }, [entries, currentPeriodEntry, maxWeek])

  const fmtShort = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

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
        {/* Card 3 — Most Recent Pay Period */}
        <Card className="flex-[50]">
          <CardHeader title={`Pay Period — Week ${maxWeek}`} />
          <div className="p-4">
            {currentPeriodEntry ? (
              <>
                <p className="text-xs text-slate-400 mb-3">{fmtPeriod(currentPeriodEntry)}</p>
                <div className="flex gap-4">
                  {/* Worker table */}
                  <div className="flex-1 min-w-0">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="pb-1.5 text-left text-[10px] font-semibold text-slate-400 uppercase">Employee</th>
                          <th className="pb-1.5 text-right text-[10px] font-semibold text-slate-400 uppercase">Hrs</th>
                          <th className="pb-1.5 text-right text-[10px] font-semibold text-green-600 uppercase">Gross</th>
                          <th className="pb-1.5 text-right text-[10px] font-semibold text-red-500 uppercase">Tax</th>
                          <th className="pb-1.5 text-right text-[10px] font-semibold text-slate-400 uppercase">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {periodWorkerData.map((w) => (
                          <tr key={w.name}>
                            <td className="py-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: w.color }} />
                                <span className="font-medium text-slate-700 text-[11px]">{w.fullName.split(' ')[0]}</span>
                              </div>
                            </td>
                            <td className="py-1.5 text-right text-slate-500">{w.hours.toFixed(1)}</td>
                            <td className="py-1.5 text-right font-medium text-green-700">{formatCurrency(w.gross)}</td>
                            <td className="py-1.5 text-right text-red-500">{formatCurrency(w.taxes)}</td>
                            <td className="py-1.5 text-right font-semibold" style={{ color: NAVY }}>{formatCurrency(w.net)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-100">
                          <td className="pt-2 text-[10px] font-semibold text-slate-500">TOTAL</td>
                          <td className="pt-2 text-right font-semibold text-slate-600 text-[11px]">
                            {currentEntries.reduce((s,e) => s+e.totalHours, 0).toFixed(1)}
                          </td>
                          <td className="pt-2 text-right font-semibold text-green-700 text-[11px]">
                            {formatCurrency(currentEntries.reduce((s,e) => s+e.grossPay, 0))}
                          </td>
                          <td className="pt-2 text-right font-semibold text-red-500 text-[11px]">
                            {formatCurrency(currentEntries.reduce((s,e) => s+e.totalTaxes, 0))}
                          </td>
                          <td className="pt-2 text-right font-semibold text-[11px]" style={{ color: NAVY }}>
                            {formatCurrency(currentEntries.reduce((s,e) => s+e.netPay, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  {/* Pie chart — who earned most */}
                  <div className="w-[110px] shrink-0">
                    <ResponsiveContainer width="100%" height={110}>
                      <PieChart>
                        <Pie data={periodWorkerData} dataKey="gross" cx="50%" cy="50%" innerRadius={28} outerRadius={48} paddingAngle={2}>
                          {periodWorkerData.map((w, i) => <Cell key={i} fill={w.color} />)}
                        </Pie>
                        <RTooltip formatter={(v: number) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-1">
                      {periodWorkerData.map((w) => (
                        <div key={w.name} className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: w.color }} />
                          <span className="text-[9px] text-slate-500 truncate">{w.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 py-4 text-center">No payroll entries yet.</p>
            )}
          </div>
        </Card>

        {/* Card 4 — Mini Calendar */}
        <Card className="flex-[25]">
          <CardHeader title="Calendar" />
          <MiniCalendar />
        </Card>

        {/* Card 5 — Missing Payrolls */}
        <Card className="flex-[25]">
          <CardHeader title="Payroll Status" />
          <div className="p-4 space-y-2">
            {missingWeeks.length === 0 ? (
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-green-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-700">All payrolls current</p>
                  {currentPeriodEntry && (
                    <p className="text-[11px] text-slate-400 mt-0.5">Last: Week {maxWeek} · {fmtDate(currentPeriodEntry.payPeriodEnd)}</p>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[11px] font-semibold text-amber-700">{missingWeeks.length} missing payroll{missingWeeks.length !== 1 ? 's' : ''}</span>
                </div>
                {missingWeeks.map((mw) => (
                  <div key={mw.weekNumber} className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Week {mw.weekNumber}</p>
                      <p className="text-[10px] text-amber-600">{fmtShort(mw.startDate)} – {fmtShort(mw.endDate)}</p>
                    </div>
                    <span className="ml-auto text-[9px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded-full font-medium">Missing</span>
                  </div>
                ))}
                {currentPeriodEntry && (
                  <p className="text-[10px] text-slate-400 pt-1">Last recorded: Week {maxWeek} · {fmtDate(currentPeriodEntry.payPeriodEnd)}</p>
                )}
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
