import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Pencil, Trash2, UserPlus, FileText, ExternalLink } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Worker } from '../types'
import Modal from '../components/Modal'
import WorkerForm from '../components/WorkerForm'
import Toast from '../components/Toast'
import { formatCurrency } from '../utils/format'
import { deriveRates } from '../utils/payroll'

const COLORS = ['#1B3A5C', '#2563A8', '#F47B20', '#16a34a']

function Avatar({ worker }: { worker: Worker }) {
  if (worker.photo) {
    return <img src={worker.photo} alt={worker.name} className="w-full h-full object-cover" />
  }
  const initials = worker.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const bg = COLORS[worker.name.charCodeAt(0) % COLORS.length]
  return (
    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl" style={{ background: bg }}>
      {initials}
    </div>
  )
}

function openDoc(dataUrl: string, name: string) {
  const byteStr = atob(dataUrl.split(',')[1])
  const mime = dataUrl.split(',')[0].split(':')[1].split(';')[0]
  const ab = new Uint8Array(byteStr.length)
  for (let i = 0; i < byteStr.length; i++) ab[i] = byteStr.charCodeAt(i)
  const blob = new Blob([ab], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.target = '_blank'; a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

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
    setToast({ msg: 'Employee added', type: 'success' })
  }

  const handleEdit = async (w: Omit<Worker, 'id'>) => {
    if (!editing) return
    await updateWorker({ ...w, id: editing.id })
    setEditing(null)
    setToast({ msg: 'Employee updated', type: 'success' })
  }

  const handleDelete = async () => {
    if (!deleting) return
    await deleteWorker(deleting.id)
    setDeleting(null)
    setToast({ msg: 'Employee removed', type: 'success' })
  }

  return (
    <div className="p-6 max-w-5xl">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500 mt-0.5">{workers.length} employee{workers.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: '#1B3A5C' }}
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      {workers.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <UserPlus className="w-6 h-6 text-blue-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No employees yet</p>
          <p className="text-sm text-slate-500 mb-4">Add employees to start calculating payroll.</p>
          <button onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: '#1B3A5C' }}>
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workers.map((w) => {
            const { otRate, baseReg, otBase } = deriveRates(w.regularRate)
            const entryCount = data.payrollEntries.filter((e) => e.workerId === w.id).length
            return (
              <div key={w.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                {/* Photo header */}
                <div className="h-32 w-full overflow-hidden bg-slate-100 relative">
                  <Avatar worker={w} />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => setEditing(w)}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-slate-500 hover:text-blue-600 shadow transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleting(w)}
                      className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center text-slate-500 hover:text-red-500 shadow transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-slate-900 text-[15px]">{w.name}</h3>
                  <p className="text-xs text-slate-500 mb-3" style={{ color: '#F47B20' }}>{w.trade}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-400 mb-0.5">Reg rate</p>
                      <p className="font-semibold text-slate-700">{formatCurrency(w.regularRate)}/hr</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-400 mb-0.5">OT rate</p>
                      <p className="font-semibold text-amber-700">{formatCurrency(otRate)}/hr</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-400 mb-0.5">Base reg</p>
                      <p className="font-medium text-slate-600">{formatCurrency(baseReg)}/hr</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2">
                      <p className="text-slate-400 mb-0.5">Base OT</p>
                      <p className="font-medium text-slate-600">{formatCurrency(otBase)}/hr</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-400">{entryCount} payroll entries</span>
                    {w.idDocument ? (
                      <button
                        onClick={() => openDoc(w.idDocument!, w.idDocumentName ?? 'id-document')}
                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        View ID
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-300">No ID uploaded</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAdd && (
        <Modal title="Add Employee" onClose={() => setShowAdd(false)}>
          <WorkerForm projectId={projectId!} onSave={handleAdd} onCancel={() => setShowAdd(false)} />
        </Modal>
      )}

      {editing && (
        <Modal title="Edit Employee" onClose={() => setEditing(null)}>
          <WorkerForm projectId={projectId!} initial={editing} onSave={handleEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <Modal title="Remove Employee" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-600 mb-5">
            Remove <strong>{deleting.name}</strong>? This will also delete all their payroll entries. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              Remove
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
