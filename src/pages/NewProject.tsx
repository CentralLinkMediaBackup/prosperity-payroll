import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Upload } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { Project } from '../types'

function ContactFields({ prefix, label, data, onChange }: {
  prefix: string; label: string;
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
              placeholder={f === 'email' ? 'email@example.com' : f === 'phone' ? '(555) 000-0000' : 'Full name'}
              id={`${prefix}-${f}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NewProject() {
  const navigate = useNavigate()
  const { addProject } = useApp()

  const [name, setName] = useState('')
  const [gc, setGc] = useState('')
  const [address, setAddress] = useState('')
  const [logo, setLogo] = useState<string | null>(null)
  const [super_, setSuper] = useState({ name: '', phone: '', email: '' })
  const [contact, setContact] = useState({ name: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setLogo(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const project: Project = {
      id: crypto.randomUUID(),
      name: name.trim(),
      gc: gc.trim(),
      address: address.trim(),
      logo,
      superintendent: super_,
      contactPerson: contact,
      createdAt: new Date().toISOString(),
    }
    await addProject(project)
    navigate(`/projects/${project.id}`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <Link to="/" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to projects
        </Link>
        <h1 className="text-2xl font-bold text-slate-900 mb-8">New Project</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Project details</h2>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Project name</label>
              <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. City Hall Sprinkler Install" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">General Contractor</label>
              <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={gc} onChange={(e) => setGc(e.target.value)} placeholder="GC company name" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">Project address</label>
              <input required className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full project address" />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Project / GC logo (optional)</label>
              <label className="flex items-center gap-3 border border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-500">{logo ? 'Logo uploaded — click to replace' : 'Click to upload PNG/JPG'}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </label>
              {logo && <img src={logo} alt="Preview" className="mt-2 h-14 object-contain rounded border border-slate-200 p-1 bg-slate-50" />}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Contacts</h2>
            <ContactFields prefix="super" label="Superintendent" data={super_} onChange={setSuper} />
            <ContactFields prefix="contact" label="Contact Person" data={contact} onChange={setContact} />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors">
              {saving ? 'Creating…' : 'Create Project'}
            </button>
            <Link to="/" className="px-5 py-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-sm text-slate-600 transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
