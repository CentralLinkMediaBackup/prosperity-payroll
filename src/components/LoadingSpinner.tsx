export default function LoadingSpinner({ fullScreen = false }: { fullScreen?: boolean }) {
  const spinner = (
    <div className="flex items-center justify-center gap-3">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <span className="text-slate-500 text-sm">Loading…</span>
    </div>
  )
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-slate-50 flex items-center justify-center z-50">
        {spinner}
      </div>
    )
  }
  return <div className="py-12 flex justify-center">{spinner}</div>
}
