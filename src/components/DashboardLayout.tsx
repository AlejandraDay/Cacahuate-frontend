import React from 'react';
import Navbar from './Navbar';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-100">
    <Navbar />
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8 sm:pb-10 lg:pb-12">
      {children}
    </div>
  </div>
);

export default DashboardLayout;
