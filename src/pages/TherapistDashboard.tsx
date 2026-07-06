import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import TherapistAppointments from '../components/TherapistAppointments';

const TherapistDashboard: React.FC = () => (
  <DashboardLayout>
    <TherapistAppointments />
  </DashboardLayout>
);

export default TherapistDashboard;
