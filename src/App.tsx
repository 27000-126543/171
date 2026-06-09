import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import MainLayout from '@/components/Layout/MainLayout'
import Dashboard from '@/pages/Dashboard'
import Shops from '@/pages/Shops'
import Operations from '@/pages/Operations'
import Parking from '@/pages/Parking'
import Security from '@/pages/Security'
import Cleaning from '@/pages/Cleaning'
import Energy from '@/pages/Energy'
import Advertising from '@/pages/Advertising'
import Statistics from '@/pages/Statistics'

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/shops" element={<Shops />} />
          <Route path="/operations" element={<Operations />} />
          <Route path="/parking" element={<Parking />} />
          <Route path="/security" element={<Security />} />
          <Route path="/cleaning" element={<Cleaning />} />
          <Route path="/energy" element={<Energy />} />
          <Route path="/advertising" element={<Advertising />} />
          <Route path="/statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </Router>
  )
}
