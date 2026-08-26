import React, { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="h-dvh overflow-hidden bg-gray-100">
      <Navbar />
      <AdminSidebar />

      {/* Mobile nav drawer */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 max-w-[80%] bg-gray-100 shadow-2xl pt-20 px-4 pb-6 overflow-y-auto">
            <div className="flex items-center justify-end mb-2">
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
                aria-label="Cerrar menú"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <AdminSidebar variant="mobile" onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}

      <div className="pt-20 pb-6 h-full overflow-y-auto md:pl-52">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col min-h-0">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden shrink-0 mb-3 inline-flex items-center gap-2 w-fit px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 shadow-sm"
          >
            <Bars3Icon className="w-4 h-4" />
            Menú
          </button>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
