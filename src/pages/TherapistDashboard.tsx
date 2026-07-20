import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import TherapistAppointments from '../components/TherapistAppointments';
import TherapistPatientForms from '../components/TherapistPatientForms';
import { CalendarDaysIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

type Tab = 'appointments' | 'forms';

const TherapistDashboard: React.FC = () => {
  const [tab, setTab] = useState<Tab>('appointments');

  return (
    <DashboardLayout>
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-fit">
        {([
          { key: 'appointments', label: 'Citas', icon: CalendarDaysIcon },
          { key: 'forms', label: 'Formularios', icon: ClipboardDocumentListIcon },
        ] as { key: Tab; label: string; icon: React.FC<{ className?: string }> }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
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

      {tab === 'appointments' && <TherapistAppointments />}
      {tab === 'forms' && <TherapistPatientForms />}
    </DashboardLayout>
  );
};

export default TherapistDashboard;
