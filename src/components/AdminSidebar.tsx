import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarDaysIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';

const items = [
  { key: 'appointments', label: 'Citas', icon: CalendarDaysIcon },
  { key: 'forms', label: 'Formularios', icon: ClipboardDocumentListIcon },
] as const;

const AdminSidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeTab = params.get('tab') ?? 'appointments';
  const isAdminHome = location.pathname === '/admin';

  return (
    <aside className="hidden md:block fixed left-0 top-20 bottom-0 w-52 pl-4 sm:pl-6 lg:pl-8 pb-8 z-10">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-3 space-y-1">
        <p className="px-3 pt-1 pb-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
          Administración
        </p>
        {items.map(({ key, label, icon: Icon }) => {
          const active = isAdminHome && activeTab === key;
          return (
            <button
              key={key}
              onClick={() => navigate(`/admin?tab=${key}`)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-colors ${
                active ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </div>
    </aside>
  );
};

export default AdminSidebar;
