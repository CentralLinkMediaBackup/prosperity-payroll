import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Download, TrendingUp, Users, DollarSign, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts'

const NAVY = '#1B3A5C'
const NAVY2 = '#2563A8'
const ORANGE = '#F47B20'
const COLORS = [NAVY, ORANGE, '#16a34a', '#7c3aed', '#db2777', '#0891b2']

export default function Reports() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useApp()

  const workers = data.workers.filter((w) => w.projectId === projectId)
  const entries = data.payrollEntries.filter((e) => e.projectId === projectId)

  const totalGross = entries.reduce((s, e) => s + e.grossPay, 0)
  const totalNet = entries.reduce((s, e) => s + e.netPay, 0)
  const totalHours = entries.reduce((s, e) => s + e.totalHours, 0)
  const totalFringe = entries.reduce((s, e) => s + e.fringeTotal, 0)
  const totalTaxes = entries.reduce((s, e) => s + e.totalTaxes, 0)

  const weeks = useMemo(() => {
    const wks = [...new Set(entries.map((e) => e.weekNumber))].sort((a, b) => a - b)
    return wks.map((wk) => {
      const wkEntries = entries.filter((e) => e.weekNumber === wk)
      return {
        week: `Wk ${wk}`,
        gross: parseFloat(wkEntries.reduce((s, e) => s + e.grossPay, 0).toFixed(2)),
        net: parseFloat(wkEntries.reduce((s, e) => s + e.netPay, 0).toFixed(2)),
        hours: parseFloat(wkEntries.reduce((s, e) => s + e.totalHours, 0).toFixed(1)),
        taxes: parseFloat(wkEntries.reduce((s, e) => s + e.totalTaxes, 0).toFixed(2)),
      }
    })
  }, [entries])

  const workerStats = useMemo(() =>
    workers.map((w) => {
      const wEntries = entries.filter((e) => e.workerId === w.id)
      return {
        name: w.name.split(' ')[0],
        fullName: w.name,
        trade: w.trade,
        gross: parseFloat(wEntries.reduce((s, e) => s + e.grossPay, 0).toFixed(2)),
        net: parseFloat(wEntries.reduce((s, e) => s + e.netPay, 0).toFixed(2)),
        hours: parseFloat(wEntries.reduce((s, e) => s + e.totalHours, 0).toFixed(1)),
        taxes: parseFloat(wEntries.reduce((s, e) => s + e.totalTaxes, 0).toFixed(2)),
        weeks: wEntries.length,
      }
    }).sort((a, b) => b.gross - a.gross)
  , [workers, entries])

  const exportCSV = () => {
    const headers = ['Employee', 'Trade', 'Total Weeks', 'Total Hours', 'Gross Pay', 'Fringe', 'Taxes', 'Net Pay']
    const rows = workerStats.map((w) => [
      w.fullName, w.trade, w.weeks, w.hours, w.gross.toFixed(2), '', w.taxes.toFixed(2), w.net.toFixed(2)
    ].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob); a.download = 'payroll-report.csv'; a.click()
  }

  if (entries.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <p className="text-slate-400">No payroll data to report yet.</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">{weeks.length} weeks · {workers.length} employees</p>
        </div>
        <button onClick={exportCSV}
          className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm text-slate-600 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Gross Pay', value: formatCurrency(totalGross), icon: DollarSign, color: NAVY },
          { label: 'Total Net Pay',   value: formatCurrency(totalNet),   icon: TrendingUp, color: '#16a34a' },
          { label: 'Total Hours',     value: `${totalHours.toFixed(0)} hrs`, icon: Clock, color: ORANGE },
          { label: 'Total Fringe',    value: formatCurrency(totalFringe), icon: Users, color: NAVY2 },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '18' }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
            <p className="text-xl font-bold text-slate-800">{value}</p>
          </div>
        ))}
      </div>

      {/* Weekly gross + net chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 shadow-sm">
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="rounded-t-[10px]" style={{ background: `linear-gradient(to right, ${NAVY}, ${NAVY2})` }}>
            <span className="text-white font-semibold text-[13px] px-3 py-1.5 block rounded-[8px]">Weekly Payroll Totals</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={weeks} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatCurrency(v)} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="gross" stroke={NAVY} strokeWidth={2} dot={{ r: 3 }} name="Gross" />
            <Line type="monotone" dataKey="net" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Net" />
            <Line type="monotone" dataKey="taxes" stroke={ORANGE} strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 2" name="Taxes" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Worker breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Bar chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-700 mb-4">Gross Pay by Employee</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={workerStats} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="gross" radius={[4,4,0,0]} name="Gross Pay">
                {workerStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col">
          <p className="text-sm font-semibold text-slate-700 mb-4">Share of Total Gross</p>
          <div className="flex-1 flex items-center">
            <ResponsiveContainer width="55%" height={180}>
              <PieChart>
                <Pie data={workerStats} dataKey="gross" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {workerStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2 pl-2">
              {workerStats.map((w, i) => (
                <div key={w.fullName} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{w.name}</p>
                    <p className="text-[10px] text-slate-400">{formatCurrency(w.gross)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Worker detail table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 rounded-t-[10px]" style={{ background: `linear-gradient(to right, ${NAVY}, ${NAVY2})` }}>
          <span className="text-white font-semibold text-[13px]">Employee Breakdown</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Employee', 'Trade', 'Weeks', 'Total Hours', 'Gross Pay', 'Taxes', 'Net Pay'].map((h) => (
                  <th key={h} className={`px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider ${h === 'Employee' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {workerStats.map((w, i) => (
                <tr key={w.fullName} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="font-medium text-slate-800">{w.fullName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">{w.trade}</td>
                  <td className="px-4 py-3 text-right text-slate-500">{w.weeks}</td>
                  <td className="px-4 py-3 text-right text-slate-600">{w.hours.toFixed(1)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(w.gross)}</td>
                  <td className="px-4 py-3 text-right text-red-600">{formatCurrency(w.taxes)}</td>
                  <td className="px-4 py-3 text-right font-semibold" style={{ color: NAVY }}>{formatCurrency(w.net)}</td>
                </tr>
              ))}
              <tr className="bg-slate-50 border-t border-slate-200">
                <td className="px-4 py-3 font-semibold text-slate-700" colSpan={3}>Totals</td>
                <td className="px-4 py-3 text-right font-semibold text-slate-700">{totalHours.toFixed(1)}</td>
                <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(totalGross)}</td>
                <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(totalTaxes)}</td>
                <td className="px-4 py-3 text-right font-semibold" style={{ color: NAVY }}>{formatCurrency(totalNet)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
