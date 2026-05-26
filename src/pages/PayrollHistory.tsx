import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { ChevronDown, ChevronRight, Download, Trash2, Calendar } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { PayrollEntry } from '../types'
import { formatCurrency, formatHours } from '../utils/format'
import Toast from '../components/Toast'
import Modal from '../components/Modal'

const NAVY = '#1B3A5C'
const NAVY2 = '#2563A8'

export default function PayrollHistory() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data, deletePayrollEntry } = useApp()

  const workers = data.workers.filter((w) => w.projectId === projectId)
  const entries = data.payrollEntries.filter((e) => e.projectId === projectId)

  const [expandedWeek, setExpandedWeek] = useState<number | null>(null)
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<PayrollEntry | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const weeks = [...new Set(entries.map((e) => e.weekNumber))].sort((a, b) => b - a)

  const weekEntries = (wk: number) => entries.filter((e) => e.weekNumber === wk)

  const workerName = (id: string) => workers.find((w) => w.id === id)?.name ?? 'Unknown'
  const workerTrade = (id: string) => workers.find((w) => w.id === id)?.trade ?? ''

  const fmtPeriod = (start: string, end: string) => {
    const s = new Date(start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const e = new Date(end + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${s} – ${e}`
  }

  const handleDelete = async () => {
    if (!deleting) return
    await deletePayrollEntry(deleting.id)
    setDeleting(null)
    setToast({ msg: 'Entry deleted', type: 'success' })
  }

  const exportCSV = () => {
    const headers = ['Worker', 'Trade', 'Week', 'Period', 'Check Amount', 'Total Hours', 'Reg Hours', 'OT Hours', 'Gross Pay', 'Fringe', 'Taxes', 'Net Pay']
    const rows = entries.sort((a, b) => b.weekNumber - a.weekNumber).map((e) => {
      const w = workers.find((x) => x.id === e.workerId)
      return [
        w?.name ?? '', w?.trade ?? '', e.weekNumber, e.weekLabel,
        e.checkAmount.toFixed(2), e.totalHours.toFixed(2), e.regularHours.toFixed(2),
        e.overtimeHours.toFixed(2), e.grossPay.toFixed(2), e.fringeTotal.toFixed(2),
        e.totalTaxes.toFixed(2), e.netPay.toFixed(2),
      ].join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'payroll-history.csv'
    a.click()
  }

  return (
    <div className="p-6 max-w-4xl">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payroll History</h1>
          <p className="text-sm text-slate-500 mt-0.5">{weeks.length} weeks · {entries.length} entries</p>
        </div>
        <button onClick={exportCSV} disabled={entries.length === 0}
          className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 px-4 py-2 rounded-lg text-sm text-slate-600 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {weeks.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
          <p className="text-slate-500">No payroll history yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {weeks.map((wk) => {
            const wkEntries = weekEntries(wk)
            const first = wkEntries[0]
            const totalGross = wkEntries.reduce((s, e) => s + e.grossPay, 0)
            const totalNet = wkEntries.reduce((s, e) => s + e.netPay, 0)
            const isWeekOpen = expandedWeek === wk

            return (
              <div key={wk} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                {/* Week header */}
                <button
                  className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors text-left"
                  onClick={() => setExpandedWeek(isWeekOpen ? null : wk)}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})` }}>
                    <span className="text-white text-[11px] font-bold">{wk}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800">Week {wk}</span>
                      <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                        {wkEntries.length} worker{wkEntries.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {first && (
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span className="text-xs text-slate-500">{fmtPeriod(first.payPeriodStart, first.payPeriodEnd)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0 mr-2">
                    <p className="text-sm font-semibold text-green-700">{formatCurrency(totalGross)} gross</p>
                    <p className="text-xs text-slate-400">{formatCurrency(totalNet)} net</p>
                  </div>
                  <span className="text-slate-400 shrink-0">
                    {isWeekOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </span>
                </button>

                {/* Workers in this week */}
                {isWeekOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-50">
                    {wkEntries.map((entry) => {
                      const isEntryOpen = expandedEntry === entry.id
                      return (
                        <div key={entry.id}>
                          <button
                            className="w-full flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors text-left"
                            onClick={() => setExpandedEntry(isEntryOpen ? null : entry.id)}
                          >
                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                              <span className="text-[9px] font-bold">
                                {workerName(entry.workerId).split(' ').map(n => n[0]).join('').slice(0,2)}
                              </span>
                            </div>
                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2 text-sm">
                              <div>
                                <p className="font-medium text-slate-800 text-[13px]">{workerName(entry.workerId)}</p>
                                <p className="text-xs text-slate-400">{workerTrade(entry.workerId)}</p>
                              </div>
                              <div>
                                <p className="text-slate-600 text-[13px]">{formatHours(entry.totalHours)} hrs</p>
                                <p className="text-xs text-slate-400">{entry.regularHours.toFixed(1)} reg + {entry.overtimeHours.toFixed(1)} OT</p>
                              </div>
                              <div>
                                <p className="font-medium text-green-700 text-[13px]">{formatCurrency(entry.grossPay)}</p>
                                <p className="text-xs text-slate-400">gross</p>
                              </div>
                              <div>
                                <p className="text-red-600 text-[13px]">{formatCurrency(entry.totalTaxes)}</p>
                                <p className="text-xs text-slate-400">taxes</p>
                              </div>
                              <div>
                                <p className="font-medium text-blue-700 text-[13px]">{formatCurrency(entry.netPay)}</p>
                                <p className="text-xs text-slate-400">net · check {formatCurrency(entry.checkAmount)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={(ev) => { ev.stopPropagation(); setDeleting(entry) }}
                                className="p-1.5 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-slate-300">
                                {isEntryOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                              </span>
                            </div>
                          </button>

                          {/* Entry detail */}
                          {isEntryOpen && (
                            <div className="bg-slate-50 border-t border-slate-100 px-5 pb-5 pt-4 ml-10">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                {[
                                  { l: 'Fringe total', v: formatCurrency(entry.fringeTotal), c: 'text-green-700' },
                                  { l: 'Base total', v: formatCurrency(entry.baseTotal), c: '' },
                                  { l: 'Taxes', v: formatCurrency(entry.totalTaxes), c: 'text-red-600' },
                                  { l: 'Net w/o fringe', v: formatCurrency(entry.netWithoutFringe), c: '' },
                                ].map(({ l, v, c }) => (
                                  <div key={l} className="bg-white rounded-lg p-3 border border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">{l}</p>
                                    <p className={`font-semibold text-sm ${c}`}>{v}</p>
                                  </div>
                                ))}
                              </div>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-slate-200">
                                      <th className="py-2 text-left text-xs font-semibold text-slate-400 uppercase">Day</th>
                                      <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">Hrs</th>
                                      <th className="py-2 text-right text-xs font-semibold text-green-600 uppercase">NT Fringe</th>
                                      <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">NT Base</th>
                                      <th className="py-2 text-right text-xs font-semibold text-amber-600 uppercase">OT Fringe</th>
                                      <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">OT Base</th>
                                      <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
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
