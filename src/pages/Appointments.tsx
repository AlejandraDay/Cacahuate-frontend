import React from 'react'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import ParentAppointments from '../components/ParentAppointments'
import TherapistAppointments from '../components/TherapistAppointments'
import AdminAppointments from '../components/AdminAppointments'

const Appointments: React.FC = () => {
  const { user } = useAuth()

  const renderAppointmentView = () => {
    switch (user?.role) {
      case 'Parent':
        return <ParentAppointments />
      case 'Therapist':
        return <TherapistAppointments />
      case 'Admin':
        return <AdminAppointments />
      default:
        return <ParentAppointments />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-blue-50 to-slate-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-10">
        {renderAppointmentView()}
      </div>
    </div>
  )
}

export default Appointments
