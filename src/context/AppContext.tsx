import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import type { AppData, Project, Worker, PayrollEntry } from '../types'
import { loadData, saveData } from '../utils/storage'

interface AppContextValue {
  data: AppData;
  loading: boolean;
  saving: boolean;
  error: string | null;
  updateData: (next: AppData) => Promise<void>;
  addProject: (p: Project) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addWorker: (w: Worker) => Promise<void>;
  updateWorker: (w: Worker) => Promise<void>;
  deleteWorker: (id: string) => Promise<void>;
  addPayrollEntry: (e: PayrollEntry) => Promise<void>;
  updatePayrollEntry: (e: PayrollEntry) => Promise<void>;
  deletePayrollEntry: (id: string) => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>({ projects: [], workers: [], payrollEntries: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const updateData = useCallback(async (next: AppData) => {
    setData(next)
    setSaving(true)
    try {
      await saveData(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }, [])

  const addProject = useCallback(async (p: Project) => {
    await updateData({ ...data, projects: [...data.projects, p] })
  }, [data, updateData])

  const updateProject = useCallback(async (p: Project) => {
    await updateData({ ...data, projects: data.projects.map((x) => x.id === p.id ? p : x) })
  }, [data, updateData])

  const deleteProject = useCallback(async (id: string) => {
    await updateData({
      projects: data.projects.filter((x) => x.id !== id),
      workers: data.workers.filter((x) => x.projectId !== id),
      payrollEntries: data.payrollEntries.filter((x) => x.projectId !== id),
    })
  }, [data, updateData])

  const addWorker = useCallback(async (w: Worker) => {
    await updateData({ ...data, workers: [...data.workers, w] })
  }, [data, updateData])

  const updateWorker = useCallback(async (w: Worker) => {
    await updateData({ ...data, workers: data.workers.map((x) => x.id === w.id ? w : x) })
  }, [data, updateData])

  const deleteWorker = useCallback(async (id: string) => {
    await updateData({
      ...data,
      workers: data.workers.filter((x) => x.id !== id),
      payrollEntries: data.payrollEntries.filter((x) => x.workerId !== id),
    })
  }, [data, updateData])

  const addPayrollEntry = useCallback(async (e: PayrollEntry) => {
    await updateData({ ...data, payrollEntries: [...data.payrollEntries, e] })
  }, [data, updateData])

  const updatePayrollEntry = useCallback(async (e: PayrollEntry) => {
    await updateData({ ...data, payrollEntries: data.payrollEntries.map((x) => x.id === e.id ? e : x) })
  }, [data, updateData])

  const deletePayrollEntry = useCallback(async (id: string) => {
    await updateData({ ...data, payrollEntries: data.payrollEntries.filter((x) => x.id !== id) })
  }, [data, updateData])

  return (
    <AppContext.Provider value={{
      data, loading, saving, error,
      updateData, addProject, updateProject, deleteProject,
      addWorker, updateWorker, deleteWorker,
      addPayrollEntry, updatePayrollEntry, deletePayrollEntry,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
