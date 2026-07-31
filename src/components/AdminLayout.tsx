import React from 'react';
import Navbar from './Navbar';
import AdminSidebar from './AdminSidebar';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-100">
    <Navbar />
    <AdminSidebar />
    <div className="pt-20 pb-8 sm:pb-10 lg:pb-12 md:pl-52">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </div>
  </div>
);

export default AdminLayout;
