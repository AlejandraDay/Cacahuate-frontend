import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import AdminAppointments from '../components/AdminAppointments';
import AdminForms from '../components/AdminForms';
import AdminParents from '../components/AdminParents';

type Tab = 'appointments' | 'forms' | 'parents';

const isTab = (value: string | null): value is Tab => value === 'appointments' || value === 'forms' || value === 'parents';

const AdminDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const param = searchParams.get('tab');
  const tab: Tab = isTab(param) ? param : 'appointments';

  return (
    <AdminLayout>
      {tab === 'appointments' && <AdminAppointments />}
      {tab === 'forms' && <AdminForms />}
      {tab === 'parents' && <AdminParents />}
    </AdminLayout>
  );
};

export default AdminDashboard;
