import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatCurrency } from '../utils/format'
import { Phone, Mail, BarChart2, Users, FileText, DollarSign, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function Dashboard() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data } = useApp()

  const project = data.projects.find((p) => p.id === projectId)!
  const workers = data.workers.filter((w) => w.projectId === projectId)
  const entries = data.payrollEntries.filter((e) => e.projectId === projectId)

  const totalGross = entries.reduce((s, e) => s + e.grossPay, 0)
  const totalNet = entries.reduce((s, e) => s + e.netPay, 0)
  const totalFringe = entries.reduce((s, e) => s + e.fringeTotal, 0)
  const totalTaxes = entries.reduce((s, e) => s + e.totalTaxes, 0)

  const weeks = [...new Set(entries.map((e) => e.weekNumber))].sort((a, b) => a - b)
  const chartData = weeks.map((wk) => {
    const weekEntries = entries.filter((e) => e.weekNumber === wk)
    const point: Record<string, number | string> = { week: `Wk ${wk}` }
    workers.forEach((w) => {
      const e = weekEntries.find((x) => x.workerId === w.id)
      point[w.name] = e ? Math.round(e.netPay * 100) / 100 : 0
    })
    return point
  })

  const COLORS = ['#2563eb', '#f97316', '#16a34a', '#d97706', '#7c3aed', '#0891b2']

  const workerStats = workers.map((w) => {
    const wEntries = entries.filter((e) => e.workerId === w.id)
    return {
      ...w,
      totalHours: wEntries.reduce((s, e) => s + e.totalHours, 0),
      totalGross: wEntries.reduce((s, e) => s + e.grossPay, 0),
      totalNet: wEntries.reduce((s, e) => s + e.netPay, 0),
      totalTaxes: wEntries.reduce((s, e) => s + e.totalTaxes, 0),
      weeksWorked: wEntries.length,
    }
  })

  const topEarner = [...workerStats].sort((a, b) => b.totalGross - a.totalGross)[0]

  const stats = [
    { label: 'Workers', value: workers.length, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Payroll Entries', value: entries.length, icon: FileText, color: 'bg-slate-100 text-slate-600' },
    { label: 'Gross Pay', value: formatCurrency(totalGross), icon: DollarSign, color: 'bg-green-50 text-green-600' },
    { label: 'Net Pay', value: formatCurrency(totalNet), icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
    { label: 'Fringe Paid', value: formatCurrency(totalFringe), icon: BarChart2, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Taxes Withheld', value: formatCurrency(totalTaxes), icon: DollarSign, color: 'bg-red-50 text-red-600' },
  ]

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">{project.name}</h1>
        <p className="text-slate-500 text-sm">{project.gc} · {project.address}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { label: 'Superintendent', info: project.superintendent },
          { label: 'Contact Person', info: project.contactPerson },
        ].map(({ label, info }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">{label}</p>
            <p className="font-medium text-slate-800 mb-2">{info.name || '—'}</p>
            {info.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
                <Phone className="w-3.5 h-3.5" /> {info.phone}
              </div>
            )}
            {info.email && (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Mail className="w-3.5 h-3.5" /> {info.email}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-lg font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {topEarner && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 mb-8 text-white flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-200 mb-1">Top Earner</p>
            <p className="text-xl font-bold">{topEarner.name}</p>
            <p className="text-blue-200 text-sm">{topEarner.trade}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{formatCurrency(topEarner.totalGross)}</p>
            <p className="text-blue-200 text-sm">gross pay · {topEarner.totalHours.toFixed(0)} hrs</p>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Net Pay by Week</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              {workers.map((w, i) => (
                <Bar key={w.id} dataKey={w.name} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === workers.length - 1 ? [4, 4, 0, 0] : [0,0,0,0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {workerStats.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Worker Summary</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Name', 'Trade', 'Total Hrs', 'Gross', 'Net', 'Taxes', 'Weeks'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {workerStats.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{w.name}</td>
                    <td className="px-4 py-3 text-slate-500">{w.trade}</td>
                    <td className="px-4 py-3">{w.totalHours.toFixed(2)}</td>
                    <td className="px-4 py-3 font-medium text-green-700">{formatCurrency(w.totalGross)}</td>
                    <td className="px-4 py-3 font-medium text-blue-700">{formatCurrency(w.totalNet)}</td>
                    <td className="px-4 py-3 text-red-600">{formatCurrency(w.totalTaxes)}</td>
                    <td className="px-4 py-3 text-slate-500">{w.weeksWorked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
