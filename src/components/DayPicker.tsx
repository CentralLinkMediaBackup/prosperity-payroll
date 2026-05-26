const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface DayPickerProps {
  selected: number[];
  onChange: (days: number[]) => void;
}

export default function DayPicker({ selected, onChange }: DayPickerProps) {
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const toggle = (i: number) => {
    const s = new Set(selected)
    s.has(i) ? s.delete(i) : s.add(i)
    onChange([...s].sort((a, b) => a - b))
  }

  const setPreset = (days: number[]) => onChange([...days].sort((a, b) => a - b))

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {DAY_NAMES.map((_name, i) => {
          const active = selected.includes(i)
          return (
            <button
              key={i}
              type="button"
              onClick={() => toggle(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-all
                ${active
                  ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-500' : 'bg-slate-300'}`} />
              {DAY_LABELS[i]}
            </button>
          )
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="font-medium">{selected.length} day{selected.length !== 1 ? 's' : ''}</span>
        <span className="text-slate-300">|</span>
        <button type="button" onClick={() => setPreset([1,2,3,4,5])}
          className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-600">M–F</button>
        <button type="button" onClick={() => setPreset([1,2,3,4,5,6])}
          className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-600">M–Sat</button>
        <button type="button" onClick={() => setPreset([0,1,2,3,4,5,6])}
          className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-600">Full week</button>
        <button type="button" onClick={() => onChange([])}
          className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 text-slate-600">Clear</button>
      </div>
    </div>
  )
}
