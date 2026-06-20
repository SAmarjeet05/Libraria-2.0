import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserDashboard } from './UserDashboard';
import { AdminDashboard } from './AdminDashboard';

export const DashboardController: React.FC = () => {
  const { hasRole } = useAuth();
  
  return hasRole('Admin') ? <AdminDashboard /> : <UserDashboard />;
};