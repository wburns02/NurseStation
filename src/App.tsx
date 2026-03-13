import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Shifts from './pages/Shifts'
import Staff from './pages/Staff'
import Analytics from './pages/Analytics'
import Marketplace from './pages/Marketplace'
import Credentials from './pages/Credentials'
import Messages from './pages/Messages'
import StaffProfile from './pages/StaffProfile'
import Notifications from './pages/Notifications'
import Labor from './pages/Labor'
import TimeOff from './pages/TimeOff'
import Training from './pages/Training'
import Coverage from './pages/Coverage'
import Wellbeing from './pages/Wellbeing'
import AutoSchedule from './pages/AutoSchedule'
import ShiftBoard from './pages/ShiftBoard'
import Forecast from './pages/Forecast'
import StaffIntelligence from './pages/StaffIntelligence'
import ChargeBoard from './pages/ChargeBoard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="credentials" element={<Credentials />} />
          <Route path="shifts" element={<Shifts />} />
          <Route path="staff" element={<Staff />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="messages" element={<Messages />} />
          <Route path="staff/:staffId" element={<StaffProfile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="labor" element={<Labor />} />
          <Route path="time-off" element={<TimeOff />} />
          <Route path="training" element={<Training />} />
          <Route path="coverage" element={<Coverage />} />
          <Route path="wellbeing" element={<Wellbeing />} />
          <Route path="auto-schedule" element={<AutoSchedule />} />
          <Route path="shift-board" element={<ShiftBoard />} />
          <Route path="forecast" element={<Forecast />} />
          <Route path="people" element={<StaffIntelligence />} />
          <Route path="charge" element={<ChargeBoard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
