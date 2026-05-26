import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Worker } from '../types'
import Modal from '../components/Modal'
import WorkerForm from '../components/WorkerForm'
import Toast from '../components/Toast'
import { formatCurrency } from '../utils/format'
import { deriveRates } from '../utils/payroll'

export default function Workers() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data, addWorker, updateWorker, deleteWorker } = useApp()

  const workers = data.workers.filter((w) => w.projectId === projectId)

  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<Worker | null>(null)
  const [deleting, setDeleting] = useState<Worker | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const handleAdd = async (w: Omit<Worker, 'id'>) => {
    await addWorker({ ...w, id: crypto.randomUUID() })
    setShowAdd(false)
    setToast({ msg: 'Worker added', type: 'success' })
  }

  const handleEdit = async (w: Omit<Worker, 'id'>) => {
    if (!editing) return
    await updateWorker({ ...w, id: editing.id })
    setEditing(null)
    setToast({ msg: 'Worker updated', type: 'success' })
  }

  const handleDelete = async () => {
    if (!deleting) return
    await deleteWorker(deleting.id)
    setDeleting(null)
    setToast({ msg: 'Worker removed', type: 'success' })
  }

  return (
    <div className="p-6 max-w-4xl">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Workers</h1>
          <p className="text-sm text-slate-500 mt-0.5">{workers.length} worker{workers.length !== 1 ? 's' : ''} on this project</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Worker
        </button>
      </div>

      {workers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6 text-blue-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No workers yet</p>
          <p className="text-sm text-slate-500 mb-4">Add workers to start calculating payroll.</p>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Worker
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Trade</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Reg Rate</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Base Reg</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">OT Rate</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">OT Base</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Entries</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {workers.map((w) => {
                const { otRate, baseReg, otBase } = deriveRates(w.regularRate)
                const entryCount = data.payrollEntries.filter((e) => e.workerId === w.id).length
                return (
                  <tr key={w.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{w.name}</td>
                    <td className="px-5 py-3.5 text-slate-500">{w.trade}</td>
                    <td className="px-5 py-3.5 text-right font-medium">{formatCurrency(w.regularRate)}</td>
                    <td className="px-5 py-3.5 text-right text-slate-500">{formatCurrency(baseReg)}</td>
                    <td className="px-5 py-3.5 text-right text-amber-700 font-medium">{formatCurrency(otRate)}</td>
                    <td className="px-5 py-3.5 text-right text-slate-500">{formatCurrency(otBase)}</td>
                    <td className="px-5 py-3.5 text-right text-slate-500">{entryCount}</td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditing(w)}
                          className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleting(w)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <Modal title="Add Worker" onClose={() => setShowAdd(false)}>
          <WorkerForm projectId={projectId!} onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Worker" onClose={() => setEditing(null)}>
          <WorkerForm projectId={projectId!} initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <Modal title="Remove Worker" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-600 mb-5">
            Remove <strong>{deleting.name}</strong>? This will also delete all their payroll entries. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              Remove Worker
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
