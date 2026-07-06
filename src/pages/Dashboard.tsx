import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const roleHome: Record<string, string> = {
  Parent: '/parent',
  Therapist: '/therapist',
  Admin: '/admin',
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  return <Navigate to={roleHome[user.role] ?? '/login'} replace />;
};

export default Dashboard;
