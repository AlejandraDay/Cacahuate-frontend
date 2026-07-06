import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import ParentAppointments from '../components/ParentAppointments';

const ParentDashboard: React.FC = () => (
  <DashboardLayout>
    <ParentAppointments />
  </DashboardLayout>
);

export default ParentDashboard;
