import { useState } from 'react'
import type { Worker } from '../types'
import RateChips from './RateChips'

interface WorkerFormProps {
  initial?: Partial<Worker>;
  projectId: string;
  onSave: (w: Omit<Worker, 'id'>) => void;
  onCancel: () => void;
}

export default function WorkerForm({ initial, projectId, onSave, onCancel }: WorkerFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [trade, setTrade] = useState(initial?.trade ?? '')
  const [rate, setRate] = useState(String(initial?.regularRate ?? ''))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const r = parseFloat(rate)
    if (!name.trim() || !trade.trim() || isNaN(r) || r <= 0) return
    onSave({ projectId, name: name.trim(), trade: trade.trim(), regularRate: r })
  }

  const rateNum = parseFloat(rate) || 0

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm text-slate-600 mb-1">Worker name</label>
        <input
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={name} onChange={(e) => setName(e.target.value)} required placeholder="Full name"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Trade / title</label>
        <input
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={trade} onChange={(e) => setTrade(e.target.value)} required placeholder="e.g. Pipe Fitter"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-600 mb-1">Regular rate ($/hr)</label>
        <input
          type="number" step="0.01" min="0"
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={rate} onChange={(e) => setRate(e.target.value)} required placeholder="e.g. 50.92"
        />
        {rateNum > 0 && <RateChips regularRate={rateNum} />}
      </div>
      <div className="flex gap-3 pt-2">
        <button type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
          Save Worker
        </button>
        <button type="button" onClick={onCancel}
          className="flex-1 border border-slate-200 hover:bg-slate-50 rounded-lg py-2 text-sm text-slate-600 transition-colors">
          Cancel
        </button>
      </div>
    </form>
  )
}
