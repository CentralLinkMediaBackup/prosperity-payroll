import { useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { Calculator, AlertTriangle, Lock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { PayrollEntry } from '../types'
import DayPicker from '../components/DayPicker'
import RateChips from '../components/RateChips'
import Toast from '../components/Toast'
import Modal from '../components/Modal'
import { buildPayrollEntry, FRINGE, FED, SS, MED, deriveRates } from '../utils/payroll'
import { formatCurrency, formatHours } from '../utils/format'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-base font-semibold text-slate-900">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

function getWeekLabel(start: string, end: string): string {
  if (!start || !end) return ''
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export default function PayrollCalculator() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data, addPayrollEntry, updatePayrollEntry } = useApp()

  const workers = data.workers.filter((w) => w.projectId === projectId)

  const [workerId, setWorkerId] = useState(workers[0]?.id ?? '')
  const [checkAmount, setCheckAmount] = useState('')
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [weekNumber, setWeekNumber] = useState('')
  const [payPeriodStart, setPayPeriodStart] = useState('')
  const [payPeriodEnd, setPayPeriodEnd] = useState('')
  const [result, setResult] = useState<ReturnType<typeof buildPayrollEntry> | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [dupModal, setDupModal] = useState<PayrollEntry | null>(null)
  const [pendingEntry, setPendingEntry] = useState<Omit<PayrollEntry, 'id' | 'createdAt'> | null>(null)

  const worker = workers.find((w) => w.id === workerId)
  const { otRate, baseReg, otBase } = worker ? deriveRates(worker.regularRate) : { otRate: 0, baseReg: 0, otBase: 0 }

  const calculate = useCallback(() => {
    if (!worker) return
    if (!workDays.length) { setToast({ msg: 'Select at least one work day', type: 'error' }); return }
    const amt = parseFloat(checkAmount)
    if (!amt || amt <= 0) { setToast({ msg: 'Enter a valid check amount', type: 'error' }); return }
    const entry = buildPayrollEntry(amt, worker, workDays, parseInt(weekNumber) || 0, getWeekLabel(payPeriodStart, payPeriodEnd), payPeriodStart, payPeriodEnd)
    setResult(entry)
  }, [worker, workDays, checkAmount, weekNumber, payPeriodStart, payPeriodEnd])

  const save = useCallback(async (overwrite?: PayrollEntry) => {
    if (!result || !worker) return
    if (overwrite) {
      const updated: PayrollEntry = { ...result, id: overwrite.id, createdAt: overwrite.createdAt }
      await updatePayrollEntry(updated)
      setDupModal(null)
      setPendingEntry(null)
      setToast({ msg: 'Payroll entry updated', type: 'success' })
      return
    }
    const wk = parseInt(weekNumber) || 0
    const existing = data.payrollEntries.find((e) => e.workerId === workerId && e.weekNumber === wk && e.projectId === projectId)
    if (existing) { setPendingEntry(result); setDupModal(existing); return }
    const entry: PayrollEntry = { ...result, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    await addPayrollEntry(entry)
    setToast({ msg: 'Payroll entry saved', type: 'success' })
  }, [result, worker, workerId, weekNumber, projectId, data.payrollEntries, addPayrollEntry, updatePayrollEntry])

  const diff = result ? result.netPay - (parseFloat(checkAmount) || 0) : 0
  const pct = result ? Math.abs(diff) / (parseFloat(checkAmount) || 1) * 100 : 0
  const matchBadge = pct <= 0.05 ? { cls: 'bg-green-50 text-green-700 border-green-200', label: '✓ Exact match' }
    : pct <= 0.5 ? { cls: 'bg-green-50 text-green-700 border-green-200', label: '✓ Very close (<0.5%)' }
    : pct <= 2 ? { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: '~ Close (<2%)' }
    : { cls: 'bg-red-50 text-red-700 border-red-200', label: '✗ Off (>2%)' }

  return (
    <div className="p-6 max-w-4xl">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Calculator className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payroll Calculator</h1>
          <p className="text-xs text-slate-500">Enter check amount to reverse-calculate hours and breakdown</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Worker & Week */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Worker & Pay Period</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Worker</label>
              <select
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={workerId} onChange={(e) => setWorkerId(e.target.value)}
              >
                {workers.length === 0 && <option value="">No workers — add workers first</option>}
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name} — {w.trade} ({formatCurrency(w.regularRate)}/hr)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Check amount ($)</label>
              <input
                type="number" step="0.01" min="0"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={checkAmount} onChange={(e) => setCheckAmount(e.target.value)}
                placeholder="e.g. 2546.15"
              />
            </div>
          </div>

          {worker && (
            <div className="mb-4 p-3 bg-slate-50 rounded-xl text-sm">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Name</p>
                  <p className="font-medium text-slate-800">{worker.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Trade</p>
                  <p className="font-medium text-slate-800">{worker.trade}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Regular Rate</p>
                  <p className="font-medium text-slate-800">{formatCurrency(worker.regularRate)}/hr</p>
                </div>
              </div>
              <RateChips regularRate={worker.regularRate} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Week #</label>
              <input
                type="number" min="1"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={weekNumber} onChange={(e) => setWeekNumber(e.target.value)}
                placeholder="e.g. 17"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Pay period start</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={payPeriodStart} onChange={(e) => setPayPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Pay period end</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={payPeriodEnd} onChange={(e) => setPayPeriodEnd(e.target.value)}
              />
            </div>
          </div>
          {payPeriodStart && payPeriodEnd && weekNumber && (
            <p className="mt-2 text-xs text-blue-600 font-medium">
              Week {weekNumber} ({getWeekLabel(payPeriodStart, payPeriodEnd)})
            </p>
          )}
        </div>

        {/* Work Days */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Work Days — Click to Select</p>
          <DayPicker selected={workDays} onChange={setWorkDays} />
        </div>

        {/* Tax rates — locked */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Texas Tax Rates</p>
            <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
              <Lock className="w-3 h-3" /> locked
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: 'Federal income tax', value: `${FED * 100}%` },
              { label: 'Social Security', value: `${SS * 100}%` },
              { label: 'Medicare', value: `${MED * 100}%` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-500 mb-1">{label}</p>
                <p className="text-base font-semibold text-slate-800">{value}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400">Texas = no state income tax. Taxes on base pay only — fringe excluded per prevailing wage rules.</p>
        </div>

        {/* Derived rate display when no worker selected */}
        {worker && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Derived Rates</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: `Fringe (fixed)`, value: formatCurrency(FRINGE) + '/hr', sub: 'never taxed' },
                { label: 'Base regular', value: formatCurrency(baseReg) + '/hr', sub: `${formatCurrency(worker.regularRate)} − ${formatCurrency(FRINGE)}` },
                { label: 'OT rate (1.5×)', value: formatCurrency(otRate) + '/hr', sub: `${formatCurrency(worker.regularRate)} × 1.5`, accent: true },
                { label: 'OT base', value: formatCurrency(otBase) + '/hr', sub: `${formatCurrency(otRate)} − ${formatCurrency(FRINGE)}` },
              ].map(({ label, value, sub, accent }) => (
                <div key={label} className={`rounded-xl p-3 ${accent ? 'bg-amber-50' : 'bg-slate-50'}`}>
                  <p className="text-xs text-slate-500 mb-1">{label}</p>
                  <p className={`text-sm font-semibold ${accent ? 'text-amber-800' : 'text-slate-800'}`}>{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={calculate}
          disabled={!worker || !checkAmount || !workDays.length}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2"
        >
          <Calculator className="w-5 h-5" /> Calculate Payroll Breakdown
        </button>

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Hours */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Hours Worked</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <StatCard label="Regular hrs (≤40)" value={formatHours(result.regularHours)} />
                <StatCard label="Overtime hrs (>40)" value={formatHours(result.overtimeHours)} />
                <StatCard label="Total hours" value={formatHours(result.totalHours)} />
                <StatCard label="Hrs per day (even)" value={formatHours(result.hoursPerDay)} />
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-slate-500">Paycheck match:</span>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-medium ${matchBadge.cls}`}>
                  {matchBadge.label}
                </span>
                <span className="text-sm text-slate-500">
                  Calculated: {formatCurrency(result.netPay)} | Check: {formatCurrency(parseFloat(checkAmount))} | Diff: {diff >= 0 ? '+' : ''}{formatCurrency(diff)}
                </span>
              </div>
            </div>

            {/* Pay calculation */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Pay Calculation</p>
              <table className="w-full text-sm max-w-lg">
                <tbody className="divide-y divide-slate-50">
                  <tr>
                    <td className="py-2 text-slate-500">Regular pay ({formatHours(result.regularHours)} hrs × {formatCurrency(worker!.regularRate)}/hr)</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(result.regularPay)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500">Overtime pay ({formatHours(result.overtimeHours)} hrs × {formatCurrency(otRate)}/hr)</td>
                    <td className="py-2 text-right font-medium">{result.overtimeHours > 0.001 ? formatCurrency(result.overtimePay) : '—'}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2 px-2 font-semibold rounded-l-lg">Subtotal (gross)</td>
                    <td className="py-2 px-2 text-right font-semibold rounded-r-lg">{formatCurrency(result.grossPay)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500">Taxable base pay (excl. fringe)</td>
                    <td className="py-2 text-right text-slate-500">{formatCurrency(result.taxableBase)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500">Federal (22%)</td>
                    <td className="py-2 text-right">{formatCurrency(result.federalTax)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500">Social Security (6.2%)</td>
                    <td className="py-2 text-right">{formatCurrency(result.socialSecurityTax)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500">Medicare (1.45%)</td>
                    <td className="py-2 text-right">{formatCurrency(result.medicareTax)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-slate-500">Total taxes</td>
                    <td className="py-2 text-right text-red-600 font-medium">{formatCurrency(result.totalTaxes)}</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-2.5 px-2 font-semibold text-blue-700 rounded-l-lg text-base">Net pay</td>
                    <td className="py-2.5 px-2 text-right font-bold text-blue-700 rounded-r-lg text-base">{formatCurrency(result.netPay)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Daily breakdown */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Daily Fringe & Base Breakdown</p>
              <p className="text-xs text-slate-400 mb-4">Hours split evenly across selected days. NT columns fill until 40 hrs cumulative — then OT columns take over.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="py-2 text-left text-xs font-semibold text-slate-400 uppercase">Day</th>
                      <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">Total hrs</th>
                      <th className="py-2 text-right text-xs font-semibold text-green-600 uppercase">NT Fringe</th>
                      <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">NT Base</th>
                      <th className="py-2 text-right text-xs font-semibold text-amber-600 uppercase">OT Fringe</th>
                      <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">OT Base</th>
                      <th className="py-2 text-right text-xs font-semibold text-slate-400 uppercase">Day Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {result.dailyBreakdown.map((d) => {
                      const hasNT = d.ntHours > 0.0001
                      const hasOT = d.otHours > 0.0001
                      return (
                        <tr key={d.dayName}>
                          <td className="py-2 font-medium text-slate-800">{d.dayName}</td>
                          <td className="py-2 text-right">{formatHours(d.totalHours)}</td>
                          <td className={`py-2 text-right ${hasNT ? 'text-green-700' : 'text-slate-300'}`}>
                            {hasNT ? formatCurrency(d.ntFringe) : '—'}
                          </td>
                          <td className="py-2 text-right">{hasNT ? formatCurrency(d.ntBase) : '—'}</td>
                          <td className={`py-2 text-right ${hasOT ? 'text-amber-700' : 'text-slate-300'}`}>
                            {hasOT ? formatCurrency(d.otFringe) : '—'}
                          </td>
                          <td className="py-2 text-right">{hasOT ? formatCurrency(d.otBase) : '—'}</td>
                          <td className="py-2 text-right font-medium">{formatCurrency(d.dayTotal)}</td>
                        </tr>
                      )
                    })}
                    <tr className="bg-slate-50 font-semibold">
                      <td className="py-2 px-1 rounded-l-lg">Total</td>
                      <td className="py-2 text-right">{formatHours(result.totalHours)}</td>
                      <td className="py-2 text-right text-green-700">
                        {formatCurrency(result.dailyBreakdown.reduce((s, d) => s + d.ntFringe, 0))}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(result.dailyBreakdown.reduce((s, d) => s + d.ntBase, 0))}
                      </td>
                      <td className="py-2 text-right text-amber-700">
                        {formatCurrency(result.dailyBreakdown.reduce((s, d) => s + d.otFringe, 0))}
                      </td>
                      <td className="py-2 text-right">
                        {formatCurrency(result.dailyBreakdown.reduce((s, d) => s + d.otBase, 0))}
                      </td>
                      <td className="py-2 px-1 text-right rounded-r-lg">
                        {formatCurrency(result.fringeTotal + result.baseTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Summary</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <StatCard label="Fringe total" value={formatCurrency(result.fringeTotal)} />
                <StatCard label="Base total" value={formatCurrency(result.baseTotal)} />
                <StatCard label="Subtotal" value={formatCurrency(result.grossPay)} />
                <StatCard label="Taxes" value={formatCurrency(result.totalTaxes)} />
              </div>
              <div className="border-t border-slate-100 pt-4">
                <table className="w-full text-sm max-w-sm">
                  <tbody>
                    <tr className="bg-slate-50">
                      <td className="py-2.5 px-2 font-semibold text-blue-700 rounded-l-lg">Final total (net pay)</td>
                      <td className="py-2.5 px-2 text-right font-bold text-blue-700 text-base rounded-r-lg">{formatCurrency(result.netPay)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-500">Net without fringe (Net − Fringe)</td>
                      <td className="py-2 text-right">{formatCurrency(result.netWithoutFringe)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category totals */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Fringe & Base Category Totals</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {['Worker', 'NT Fringe', 'NT Base', 'OT Fringe', 'OT Base', 'Fringe Total', 'Base Total', 'Gross'].map((h) => (
                        <th key={h} className={`py-2 ${h === 'Worker' ? 'text-left' : 'text-right'} text-xs font-semibold text-slate-400 uppercase`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2.5 font-medium text-slate-800">{worker?.name}</td>
                      <td className="py-2.5 text-right text-green-700">{formatCurrency(result.dailyBreakdown.reduce((s, d) => s + d.ntFringe, 0))}</td>
                      <td className="py-2.5 text-right">{formatCurrency(result.dailyBreakdown.reduce((s, d) => s + d.ntBase, 0))}</td>
                      <td className="py-2.5 text-right text-amber-700">{formatCurrency(result.dailyBreakdown.reduce((s, d) => s + d.otFringe, 0))}</td>
                      <td className="py-2.5 text-right">{formatCurrency(result.dailyBreakdown.reduce((s, d) => s + d.otBase, 0))}</td>
                      <td className="py-2.5 text-right text-green-700 font-medium">{formatCurrency(result.fringeTotal)}</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(result.baseTotal)}</td>
                      <td className="py-2.5 text-right font-medium">{formatCurrency(result.grossPay)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Save */}
            <button
              onClick={() => save()}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
            >
              Save Payroll Entry
            </button>
          </div>
        )}
      </div>

      {/* Duplicate warning modal */}
      {dupModal && pendingEntry && (
        <Modal title="Entry Already Exists" onClose={() => { setDupModal(null); setPendingEntry(null) }}>
          <div className="flex items-start gap-3 mb-5">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-600">
              A payroll entry for <strong>{worker?.name}</strong> in <strong>Week {weekNumber}</strong> already exists.
              Do you want to overwrite it?
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => save(dupModal)}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
            >
              Overwrite Entry
            </button>
            <button
              onClick={() => { setDupModal(null); setPendingEntry(null) }}
              className="flex-1 border border-slate-200 hover:bg-slate-50 rounded-lg py-2 text-sm text-slate-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
