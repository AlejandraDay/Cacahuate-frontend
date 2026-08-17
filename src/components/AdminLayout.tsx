import React from 'react';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="h-screen overflow-hidden bg-gray-100">
    <Navbar />
    <AdminSidebar />
    <div className="pt-20 pb-6 h-full overflow-y-auto md:pl-52">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col min-h-0">
        {children}
      </div>
    </div>
  </div>
);

export default AdminLayout;
