import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PatientsView } from './views/PatientsView';
import { RecordsView } from './views/RecordsView';
import { AppointmentsView } from './views/AppointmentsView';
import { RoleGuard } from '../../components/auth/RoleGuard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { motion } from 'framer-motion';

// Mock patients data
const patients = [
  {
    id: 1,
    name: 'John Doe',
    age: 45,
    gender: 'Male',
    condition: 'Hypertension',
    lastVisit: '2023-12-01',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Jane Smith',
    age: 32,
    gender: 'Female',
    condition: 'Diabetes',
    lastVisit: '2023-12-05',
    status: 'Critical'
  },
  {
    id: 3,
    name: 'Bob Johnson',
    age: 28,
    gender: 'Male',
    condition: 'Flu',
    lastVisit: '2023-12-08',
    status: 'Recovered'
  }
];

// Mock stats data with icons as JSX elements
const stats = [
  { label: 'Total Patients', value: '120', icon: () => <span>👥</span>, color: 'text-blue-500' },
  { label: 'Active Cases', value: '45', icon: () => <span>🏥</span>, color: 'text-green-500' },
  { label: 'Critical Cases', value: '8', icon: () => <span>⚠️</span>, color: 'text-red-500' },
  { label: 'Recoveries', value: '67', icon: () => <span>✅</span>, color: 'text-purple-500' }
];

// Utility function for status colors
const getStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    case 'recovered':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};

export const HealthcareModule: React.FC = () => {
  return (
    <Routes>
      <Route index element={<Navigate to="patients" replace />} />
      <Route path="patients" element={<PatientsView />} />
      <Route path="records" element={<RecordsView />} />
      <Route path="appointments" element={<AppointmentsView />} />
    </Routes>
  );
};