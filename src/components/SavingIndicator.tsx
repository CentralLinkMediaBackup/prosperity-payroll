import { useApp } from '../context/AppContext'

export default function SavingIndicator() {
  const { saving } = useApp()
  if (!saving) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border border-slate-200 shadow-md rounded-full px-4 py-2 text-xs text-slate-500 flex items-center gap-2">
      <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      Saving…
    </div>
  )
}
