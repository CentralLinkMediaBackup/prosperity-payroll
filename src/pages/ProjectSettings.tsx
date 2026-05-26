import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Upload, Trash2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Project } from '../types'
import Toast from '../components/Toast'
import Modal from '../components/Modal'

function ContactFields({ label, data, onChange }: {
  label: string;
  data: { name: string; phone: string; email: string };
  onChange: (d: { name: string; phone: string; email: string }) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-slate-700">{label}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {(['name', 'phone', 'email'] as const).map((f) => (
          <div key={f}>
            <label className="block text-xs text-slate-500 mb-1 capitalize">{f}</label>
            <input
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data[f]} onChange={(e) => onChange({ ...data, [f]: e.target.value })}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProjectSettings() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { data, updateProject, deleteProject } = useApp()

  const project = data.projects.find((p) => p.id === projectId)!

  const [name, setName] = useState(project.name)
  const [gc, setGc] = useState(project.gc)
  const [address, setAddress] = useState(project.address)
  const [logo, setLogo] = useState<string | null>(project.logo)
  const [super_, setSuper] = useState(project.superintendent)
  const [contact, setContact] = useState(project.contactPerson)
  const [saving, setSaving] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    setName(project.name); setGc(project.gc); setAddress(project.address)
    setLogo(project.logo); setSuper(project.superintendent); setContact(project.contactPerson)
  }, [project])

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogo(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const updated: Project = {
      ...project, name: name.trim(), gc: gc.trim(), address: address.trim(),
      logo, superintendent: super_, contactPerson: contact,
    }
    await updateProject(updated)
    setSaving(false)
    setToast({ msg: 'Project updated', type: 'success' })
  }

  const handleDelete = async () => {
    await deleteProject(projectId!)
    navigate('/')
  }

  return (
    <div className="p-6 max-w-2xl">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <h1 className="text-xl font-bold text-slate-900 mb-6">Project Settings</h1>

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project details</h2>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Project name</label>
            <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">General Contractor</label>
            <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={gc} onChange={(e) => setGc(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Project address</label>
            <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-2">Logo</label>
            <label className="flex items-center gap-3 border border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition-colors">
              <Upload className="w-5 h-5 text-slate-400" />
              <span className="text-sm text-slate-500">{logo ? 'Replace logo' : 'Upload PNG/JPG'}</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </label>
            {logo && (
              <div className="flex items-center gap-3 mt-2">
                <img src={logo} alt="Logo" className="h-12 object-contain rounded border border-slate-200 p-1 bg-slate-50" />
                <button type="button" onClick={() => setLogo(null)} className="text-xs text-red-500 hover:text-red-700">Remove</button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contacts</h2>
          <ContactFields label="Superintendent" data={super_} onChange={setSuper} />
          <ContactFields label="Contact Person" data={contact} onChange={setContact} />
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <h2 className="text-sm font-semibold text-red-600 mb-3">Danger Zone</h2>
        <button
          onClick={() => setShowDelete(true)}
          className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Trash2 className="w-4 h-4" /> Delete Project
        </button>
      </div>

      {showDelete && (
        <Modal title="Delete Project" onClose={() => setShowDelete(false)}>
          <p className="text-sm text-slate-600 mb-5">
            Delete <strong>{project.name}</strong>? This will permanently remove the project, all workers, and all payroll entries. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={handleDelete}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
              Delete Project
            </button>
            <button onClick={() => setShowDelete(false)}
              className="flex-1 border border-slate-200 hover:bg-slate-50 rounded-lg py-2 text-sm text-slate-600 transition-colors">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
