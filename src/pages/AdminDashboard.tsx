import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import AdminAppointments from '../components/AdminAppointments';
import AdminForms from '../components/AdminForms';
import AdminParents from '../components/AdminParents';

type Tab = 'appointments' | 'forms' | 'parents';

const isTab = (value: string | null): value is Tab => value === 'appointments' || value === 'forms' || value === 'parents';

const AdminDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(isTab(searchParams.get('tab')) ? searchParams.get('tab') as Tab : 'appointments');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (isTab(t)) setTab(t);
  }, [searchParams]);

  return (
    <AdminLayout>
      {tab === 'appointments' && <AdminAppointments />}
      {tab === 'forms' && <AdminForms />}
      {tab === 'parents' && <AdminParents />}
    </AdminLayout>
  );
};

export default AdminDashboard;
