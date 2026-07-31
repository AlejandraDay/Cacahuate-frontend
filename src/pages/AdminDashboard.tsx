import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import AdminAppointments from '../components/AdminAppointments';
import AdminForms from '../components/AdminForms';
import { CalendarDaysIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

type Tab = 'appointments' | 'forms';

const isTab = (value: string | null): value is Tab => value === 'appointments' || value === 'forms';

const AdminDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(isTab(searchParams.get('tab')) ? searchParams.get('tab') as Tab : 'appointments');

  useEffect(() => {
    const t = searchParams.get('tab');
    if (isTab(t)) setTab(t);
  }, [searchParams]);

  const handleTabClick = (key: Tab) => {
    setTab(key);
    setSearchParams({ tab: key });
  };

  return (
    <AdminLayout>
      {/* Top tab navigation (mobile / no sidebar) */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-fit md:hidden">
        {([
          { key: 'appointments', label: 'Citas', icon: CalendarDaysIcon },
          { key: 'forms', label: 'Formularios', icon: ClipboardDocumentListIcon },
        ] as { key: Tab; label: string; icon: React.FC<{ className?: string }> }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleTabClick(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              tab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'appointments' && <AdminAppointments />}
      {tab === 'forms' && <AdminForms />}
    </AdminLayout>
  );
};

export default AdminDashboard;
