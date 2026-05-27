import { useState, useRef } from 'react'
import { Upload, X, FileText, Camera } from 'lucide-react'
import type { Worker } from '../types'
import RateChips from './RateChips'
import ImageCropper from './ImageCropper'
import Modal from './Modal'

interface WorkerFormProps {
  initial?: Partial<Worker>
  projectId: string
  onSave: (w: Omit<Worker, 'id'>) => void
  onCancel: () => void
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function WorkerForm({ initial, projectId, onSave, onCancel }: WorkerFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [trade, setTrade] = useState(initial?.trade ?? '')
  const [rate, setRate] = useState(String(initial?.regularRate ?? ''))
  const [photo, setPhoto] = useState<string | null>(initial?.photo ?? null)
  const [idDocument, setIdDocument] = useState<string | null>(initial?.idDocument ?? null)
  const [idDocumentName, setIdDocumentName] = useState<string | null>(initial?.idDocumentName ?? null)
  const [cropSrc, setCropSrc] = useState<string | null>(null)

  const photoRef = useRef<HTMLInputElement>(null)
  const idRef = useRef<HTMLInputElement>(null)

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await readFileAsDataURL(file)
    setCropSrc(dataUrl)
    e.target.value = ''
  }

  const handleId = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await readFileAsDataURL(file)
    setIdDocument(dataUrl)
    setIdDocumentName(file.name)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const r = parseFloat(rate)
    if (!name.trim() || !trade.trim() || isNaN(r) || r <= 0) return
    onSave({ projectId, name: name.trim(), trade: trade.trim(), regularRate: r, photo, idDocument, idDocumentName })
  }

  const rateNum = parseFloat(rate) || 0

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Photo */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">Profile Photo</label>
          <div className="flex items-center gap-4">
            {/* Circle preview */}
            <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 border-2 border-slate-200 shrink-0 flex items-center justify-center">
              {photo
                ? <img src={photo} alt="" className="w-full h-full object-cover" />
                : <Camera className="w-6 h-6 text-slate-300" />
              }
            </div>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => photoRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
                <Upload className="w-3.5 h-3.5" />
                {photo ? 'Change Photo' : 'Upload Photo'}
              </button>
              {photo && (
                <button type="button"
                  onClick={() => { setPhoto(null); if (photoRef.current) photoRef.current.value = '' }}
                  className="flex items-center gap-1 px-2.5 py-1.5 border border-red-100 rounded-lg text-xs text-red-500 hover:bg-red-50 transition-colors">
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
          </div>
        </div>

        {/* ID Document */}
        <div>
          <label className="block text-sm text-slate-600 mb-2">ID Document</label>
          {idDocument ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
              <FileText className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-xs text-blue-700 flex-1 truncate">{idDocumentName}</span>
              <button type="button"
                onClick={() => { setIdDocument(null); setIdDocumentName(null); if (idRef.current) idRef.current.value = '' }}
                className="p-0.5 text-blue-400 hover:text-red-500 transition-colors shrink-0">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => idRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-50 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Upload ID (image or PDF)
            </button>
          )}
          <input ref={idRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleId} />
        </div>

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
            className="flex-1 text-white rounded-lg py-2 text-sm font-medium transition-colors"
            style={{ background: '#1B3A5C' }}>
            Save
          </button>
          <button type="button" onClick={onCancel}
            className="flex-1 border border-slate-200 hover:bg-slate-50 rounded-lg py-2 text-sm text-slate-600 transition-colors">
            Cancel
          </button>
        </div>
      </form>

      {/* Crop modal — shown on top of the form modal */}
      {cropSrc && (
        <Modal title="Crop Profile Photo" onClose={() => setCropSrc(null)}>
          <ImageCropper
            src={cropSrc}
            onDone={(cropped) => { setPhoto(cropped); setCropSrc(null) }}
            onCancel={() => setCropSrc(null)}
          />
        </Modal>
      )}
    </>
  )
}
