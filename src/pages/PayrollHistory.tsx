import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Download, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { PayrollEntry } from '../types'
import { formatCurrency, formatHours } from '../utils/format'
import Toast from '../components/Toast'
import Modal from '../components/Modal'

export default function PayrollHistory() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data, deletePayrollEntry } = useApp()

  const workers = data.workers.filter((w) => w.projectId === projectId)
  const entries = data.payrollEntries.filter((e) => e.projectId === projectId)

  const [filterWorker, setFilterWorker] = useState('')
  const [filterWeekMin, setFilterWeekMin] = useState('')
  const [filterWeekMax, setFilterWeekMax] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [deleting, setDeleting] = useState<PayrollEntry | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const filtered = entries.filter((e) => {
    if (filterWorker && e.workerId !== filterWorker) return false
    if (filterWeekMin && e.weekNumber < parseInt(filterWeekMin)) return false
    if (filterWeekMax && e.weekNumber > parseInt(filterWeekMax)) return false
    return true
  }).sort((a, b) => b.weekNumber - a.weekNumber || a.workerId.localeCompare(b.workerId))

  const toggle = (id: string) => {
    const s = new Set(expanded)
    s.has(id) ? s.delete(id) : s.add(id)
    setExpanded(s)
  }

  const workerName = (id: string) => workers.find((w) => w.id === id)?.name ?? 'Unknown'

  const handleDelete = async () => {
    if (!deleting) return
    await deletePayrollEntry(deleting.id)
    setDeleting(null)
    setToast({ msg: 'Entry deleted', type: 'success' })
  }

  const exportCSV = () => {
    const headers = ['Worker', 'Trade', 'Week', 'Period', 'Check Amount', 'Total Hours', 'Reg Hours', 'OT Hours', 'Gross Pay', 'Fringe', 'Base', 'Taxes', 'Net Pay']
    const rows = filtered.map((e) => {
      const w = workers.find((x) => x.id === e.workerId)
      return [
        w?.name ?? '', w?.trade ?? '', e.weekNumber, e.weekLabel,
        e.checkAmount.toFixed(2), e.totalHours.toFixed(2), e.regularHours.toFixed(2),
        e.overtimeHours.toFixed(2), e.grossPay.toFixed(2), e.fringeTotal.toFixed(2),
        e.baseTotal.toFixed(2), e.totalTaxes.toFixed(2), e.netPay.toFixed(2),
      ].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'payroll-history.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 max-w-5xl">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payroll History</h1>
          <p className="text-sm text-slate-500 mt-0.5">{entries.length} total entries</p>
        </div>
        <button onClick={exportCSV} disabled={filtered.length === 0}
          className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 px-4 py-2 rounded-lg text-sm text-slate-600 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">Worker</label>
          <select className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterWorker} onChange={(e) => setFilterWorker(e.target.value)}>
            <option value="">All workers</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Week from</label>
          <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterWeekMin} onChange={(e) => setFilterWeekMin(e.target.value)} placeholder="e.g. 1" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Week to</label>
          <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={filterWeekMax} onChange={(e) => setFilterWeekMax(e.target.value)} placeholder="e.g. 52" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
          <p className="text-slate-500">No payroll entries found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const open = expanded.has(entry.id)
            return (
              <div key={entry.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => toggle(entry.id)}
                >
                  <span className="text-slate-400">
                    {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                    <div>
                      <p className="font-medium text-slate-800">{workerName(entry.workerId)}</p>
                      <p className="text-xs text-slate-400">{workers.find(w=>w.id===entry.workerId)?.trade}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Week {entry.weekNumber}</p>
                      <p className="text-xs text-slate-400">{entry.weekLabel}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">{formatHours(entry.totalHours)} hrs</p>
                      <p className="text-xs text-slate-400">{entry.regularHours.toFixed(1)} reg + {entry.overtimeHours.toFixed(1)} OT</p>
                    </div>
                    <div>
                      <p className="font-medium text-green-700">{formatCurrency(entry.grossPay)}</p>
                      <p className="text-xs text-slate-400">gross</p>
                    </div>
                    <div>
                      <p className="font-medium text-blue-700">{formatCurrency(entry.netPay)}</p>
                      <p className="text-xs text-slate-400">net · check {formatCurrency(entry.checkAmount)}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleting(entry) }}
                    className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {open && (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { l: 'Fringe total', v: formatCurrency(entry.fringeTotal), c: 'text-green-700' },
                        { l: 'Base total', v: formatCurrency(entry.baseTotal), c: '' },
                        { l: 'Taxes', v: formatCurrency(entry.totalTaxes), c: 'text-red-600' },
                        { l: 'Net w/o fringe', v: formatCurrency(entry.netWithoutFringe), c: '' },
                      ].map(({ l, v, c }) => (
                        <div key={l} className="bg-slate-50 rounded-lg p-3">
                          <p className="text-xs text-slate-500 mb-1">{l}</p>
                          <p className={`font-semibold text-sm ${c}`}>{v}</p>
                        </div>
                      ))}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="py-2 text-left text-xs font-semibold text-slate-400 uppercase">Day</th>
                            <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">Hrs</th>
                            <th className="py-2 text-right text-xs font-semibold text-green-600 uppercase">NT Fringe</th>
                            <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">NT Base</th>
                            <th className="py-2 text-right text-xs font-semibold text-amber-600 uppercase">OT Fringe</th>
                            <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">OT Base</th>
                            <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {entry.dailyBreakdown.map((d) => (
                            <tr key={d.dayName}>
                              <td className="py-1.5 font-medium text-slate-700">{d.dayName}</td>
                              <td className="py-1.5 text-right">{formatHours(d.totalHours)}</td>
                              <td className={`py-1.5 text-right ${d.ntHours > 0.0001 ? 'text-green-700' : 'text-slate-300'}`}>
                                {d.ntHours > 0.0001 ? formatCurrency(d.ntFringe) : '—'}
                              </td>
                              <td className="py-1.5 text-right">{d.ntHours > 0.0001 ? formatCurrency(d.ntBase) : '—'}</td>
                              <td className={`py-1.5 text-right ${d.otHours > 0.0001 ? 'text-amber-700' : 'text-slate-300'}`}>
                                {d.otHours > 0.0001 ? formatCurrency(d.otFringe) : '—'}
                              </td>
                              <td className="py-1.5 text-right">{d.otHours > 0.0001 ? formatCurrency(d.otBase) : '—'}</td>
                              <td className="py-1.5 text-right font-medium">{formatCurrency(d.dayTotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {deleting && (
        <Modal title="Delete Entry" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-600 mb-5">
            Delete the Week {deleting.weekNumber} entry for <strong>{workerName(deleting.workerId)}</strong>?
            This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              Delete
            </button>
            <button onClick={() => setDeleting(null)}
              className="flex-1 border border-slate-200 hover:bg-slate-50 rounded-lg py-2 text-sm text-slate-600 transition-colors">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
