import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppProvider } from './context/AppContext'
import Landing from './pages/Landing'
import NewProject from './pages/NewProject'
import ProjectLayout from './pages/ProjectLayout'
import Dashboard from './pages/Dashboard'
import Workers from './pages/Workers'
import PayrollCalculator from './pages/PayrollCalculator'
import PayrollHistory from './pages/PayrollHistory'
import ProjectSettings from './pages/ProjectSettings'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/projects/new" element={<NewProject />} />
          <Route path="/projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="workers" element={<Workers />} />
            <Route path="calculator" element={<PayrollCalculator />} />
            <Route path="history" element={<PayrollHistory />} />
            <Route path="settings" element={<ProjectSettings />} />
          </Route>
        </Routes>
      </AppProvider>
    </BrowserRouter>
  )
}
