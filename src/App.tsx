import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Landing from './pages/Landing'
import ProjectLayout from './pages/ProjectLayout'
import Dashboard from './pages/Dashboard'
import Workers from './pages/Workers'
import PayrollCalculator from './pages/PayrollCalculator'
import PayrollHistory from './pages/PayrollHistory'
import Paychecks from './pages/Paychecks'
import Reports from './pages/Reports'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="workers" element={<Workers />} />
            <Route path="calculator" element={<PayrollCalculator />} />
            <Route path="history" element={<PayrollHistory />} />
            <Route path="paychecks" element={<Paychecks />} />
            <Route path="reports" element={<Reports />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
