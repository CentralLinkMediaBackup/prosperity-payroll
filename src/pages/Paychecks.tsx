import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Upload, Trash2, Eye, FileText, Plus } from 'lucide-react'
import { useApp } from '../context/AppContext'
import type { PaycheckPDF } from '../types'
import Toast from '../components/Toast'
import Modal from '../components/Modal'

const NAVY = '#1B3A5C'
const NAVY2 = '#2563A8'

export default function Paychecks() {
  const { projectId } = useParams<{ projectId: string }>()
  const { data, addPaycheckPDF, deletePaycheckPDF } = useApp()

  const entries = data.payrollEntries.filter((e) => e.projectId === projectId)
  const pdfs = (data.paycheckPDFs ?? []).sort((a, b) => a.weekNumber - b.weekNumber)

  const knownWeeks = [...new Set(entries.map((e) => e.weekNumber))].sort((a, b) => a - b)
  const maxWeek = Math.max(...knownWeeks, ...pdfs.map(p => p.weekNumber), 0)

  const [showUpload, setShowUpload] = useState(false)
  const [uploadWeek, setUploadWeek] = useState('')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<PaycheckPDF | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const weekLabel = (wk: number) => {
    const e = entries.find(x => x.weekNumber === wk)
    if (e) return e.weekLabel
    const pdf = pdfs.find(p => p.weekNumber === wk)
    return pdf?.weekLabel ?? `Week ${wk}`
  }

  const handleUpload = async () => {
    if (!uploadFile || !uploadWeek) return
    const wk = parseInt(uploadWeek)
    if (isNaN(wk) || wk < 1) return

    setUploading(true)
    try {
      const data64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(uploadFile)
      })

      const label = weekLabel(wk)
      await addPaycheckPDF({
        id: crypto.randomUUID(),
        weekNumber: wk,
        weekLabel: label,
        fileName: uploadFile.name,
        data: data64,
        uploadedAt: new Date().toISOString(),
      })
      setShowUpload(false)
      setUploadWeek('')
      setUploadFile(null)
      if (fileRef.current) fileRef.current.value = ''
      setToast({ msg: `Week ${wk} paychecks uploaded`, type: 'success' })
    } finally {
      setUploading(false)
    }
  }

  const openPDF = (pdf: PaycheckPDF) => {
    const byteStr = atob(pdf.data.split(',')[1])
    const ab = new Uint8Array(byteStr.length)
    for (let i = 0; i < byteStr.length; i++) ab[i] = byteStr.charCodeAt(i)
    const blob = new Blob([ab], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 5000)
  }

  const handleDelete = async () => {
    if (!deleting) return
    await deletePaycheckPDF(deleting.id)
    setDeleting(null)
    setToast({ msg: 'PDF removed', type: 'success' })
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

  // Build full week list: known weeks + uploaded-only weeks, sorted
  const allWeeks = [...new Set([...knownWeeks, ...pdfs.map(p => p.weekNumber)])].sort((a, b) => a - b)

  return (
    <div className="p-6 max-w-4xl">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Paychecks</h1>
          <p className="text-sm text-slate-500 mt-0.5">{pdfs.length} PDF{pdfs.length !== 1 ? 's' : ''} uploaded · {allWeeks.length} weeks</p>
        </div>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: NAVY }}
        >
          <Plus className="w-4 h-4" /> Upload PDF
        </button>
      </div>

      {allWeeks.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6 text-blue-400" />
          </div>
          <p className="font-medium text-slate-700 mb-1">No paycheck PDFs yet</p>
          <p className="text-sm text-slate-500 mb-4">Upload a PDF for each week's paychecks.</p>
          <button onClick={() => setShowUpload(true)}
            className="inline-flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: NAVY }}>
            <Upload className="w-4 h-4" /> Upload First PDF
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {allWeeks.map((wk) => {
            const pdf = pdfs.find(p => p.weekNumber === wk)
            const hasPayroll = knownWeeks.includes(wk)
            const entry = entries.find(e => e.weekNumber === wk)

            return (
              <div key={wk} className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `linear-gradient(135deg, ${NAVY}, ${NAVY2})` }}>
                  <span className="text-white text-[11px] font-bold">{wk}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 text-sm">Week {wk}</span>
                    {hasPayroll && (
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">payroll data</span>
                    )}
                  </div>
                  {entry && (
                    <p className="text-xs text-slate-400 mt-0.5">{entry.weekLabel}</p>
                  )}
                </div>

                {pdf ? (
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-600 font-medium truncate max-w-[160px]">{pdf.fileName}</p>
                      <p className="text-[10px] text-slate-400">Uploaded {fmtDate(pdf.uploadedAt)}</p>
                    </div>
                    <button
                      onClick={() => openPDF(pdf)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
                      style={{ background: NAVY }}
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => setDeleting(pdf)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setUploadWeek(String(wk)); setShowUpload(true) }}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-slate-300 rounded-lg text-xs text-slate-500 hover:border-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload
                  </button>
                )}
              </div>
            )
          })}

          {/* Add next week */}
          <button
            onClick={() => { setUploadWeek(String(maxWeek + 1)); setShowUpload(true) }}
            className="w-full border-2 border-dashed border-slate-200 rounded-xl py-4 flex items-center justify-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all text-sm"
          >
            <Plus className="w-4 h-4" /> Upload Week {maxWeek + 1}
          </button>
        </div>
      )}

      {/* Upload Modal */}
      {showUpload && (
        <Modal title="Upload Paycheck PDF" onClose={() => { setShowUpload(false); setUploadWeek(''); setUploadFile(null) }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-1">Week number</label>
              <input
                type="number" min="1"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={uploadWeek}
                onChange={(e) => setUploadWeek(e.target.value)}
                placeholder="e.g. 21"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-1">PDF file</label>
              {uploadFile ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs text-blue-700 flex-1 truncate">{uploadFile.name}</span>
                  <button type="button" onClick={() => { setUploadFile(null); if (fileRef.current) fileRef.current.value = '' }}
                    className="text-blue-400 hover:text-red-500 transition-colors">
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-lg py-6 flex flex-col items-center gap-2 text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-colors"
                >
                  <Upload className="w-6 h-6" />
                  <span className="text-sm">Click to select PDF</span>
                </button>
              )}
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                onClick={handleUpload}
                disabled={!uploadFile || !uploadWeek || uploading}
                className="flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-40 transition-colors"
                style={{ background: NAVY }}
              >
                {uploading ? 'Uploading…' : 'Upload PDF'}
              </button>
              <button
                onClick={() => { setShowUpload(false); setUploadWeek(''); setUploadFile(null) }}
                className="flex-1 border border-slate-200 hover:bg-slate-50 rounded-lg py-2 text-sm text-slate-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {deleting && (
        <Modal title="Remove PDF" onClose={() => setDeleting(null)}>
          <p className="text-sm text-slate-600 mb-5">
            Remove the paycheck PDF for <strong>Week {deleting.weekNumber}</strong>? This cannot be undone.
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
