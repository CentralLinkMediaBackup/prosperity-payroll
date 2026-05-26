import { Search, Bell, ChevronDown } from 'lucide-react'

export default function TopHeader() {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-full bg-slate-50 focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 placeholder:text-slate-400"
          placeholder="Search..."
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Bell className="w-5 h-5 text-slate-500" />
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">5</span>
        </div>
        <div className="flex items-center gap-2 cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-xs font-bold">A</div>
          <div className="text-sm">
            <p className="font-medium text-slate-700 leading-none">Admin</p>
            <p className="text-xs text-slate-400 mt-0.5">Admin Dashboard</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>
    </div>
  )
}
