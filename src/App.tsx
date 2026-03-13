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
import Onboarding from './pages/Onboarding'
import OvertimeApproval from './pages/OvertimeApproval'
import IncidentHub from './pages/IncidentHub'
import Recognition from './pages/Recognition'
import RatioMonitor from './pages/RatioMonitor'
import Handoff from './pages/Handoff'
import TimeClock from './pages/TimeClock'
import Payroll from './pages/Payroll'
import Hiring from './pages/Hiring'
import Availability from './pages/Availability'
import Swaps from './pages/Swaps'
import SelfSchedule from './pages/SelfSchedule'
import Scorecard from './pages/Scorecard'

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
          <Route path="onboarding" element={<Onboarding />} />
          <Route path="overtime" element={<OvertimeApproval />} />
          <Route path="incidents" element={<IncidentHub />} />
          <Route path="recognition" element={<Recognition />} />
          <Route path="ratios" element={<RatioMonitor />} />
          <Route path="handoff" element={<Handoff />} />
          <Route path="timeclock" element={<TimeClock />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="hiring" element={<Hiring />} />
          <Route path="availability" element={<Availability />} />
          <Route path="swaps" element={<Swaps />} />
          <Route path="self-schedule" element={<SelfSchedule />} />
          <Route path="scorecard" element={<Scorecard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
