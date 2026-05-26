import { deriveRates, FRINGE } from '../utils/payroll'
import { formatCurrency } from '../utils/format'

export default function RateChips({ regularRate }: { regularRate: number }) {
  const { otRate, baseReg, otBase } = deriveRates(regularRate)
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <span className="text-xs bg-slate-100 rounded-md px-2.5 py-1.5 text-slate-500">
        Fringe: <strong className="text-slate-700">{formatCurrency(FRINGE)}/hr</strong> (fixed)
      </span>
      <span className="text-xs bg-slate-100 rounded-md px-2.5 py-1.5 text-slate-500">
        Base regular: <strong className="text-slate-700">{formatCurrency(baseReg)}/hr</strong>
      </span>
      <span className="text-xs bg-blue-50 rounded-md px-2.5 py-1.5 text-blue-600">
        OT rate (1.5× reg): <strong>{formatCurrency(otRate)}/hr</strong>
      </span>
      <span className="text-xs bg-slate-100 rounded-md px-2.5 py-1.5 text-slate-500">
        OT base: <strong className="text-slate-700">{formatCurrency(otBase)}/hr</strong>
      </span>
      <span className="text-xs bg-slate-100 rounded-md px-2.5 py-1.5 text-slate-500">
        OT fringe: <strong className="text-slate-700">{formatCurrency(FRINGE)}/hr</strong> (fixed)
      </span>
    </div>
  )
}
