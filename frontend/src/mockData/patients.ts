import { Patient } from '../types';

export const mockPatients: Patient[] = [
  {
    id: '1',
    name: 'Alice Johnson',
    age: 34,
    gender: 'Female',
    condition: 'Hypertension',
    lastVisit: '2024-12-10',
    status: 'Active'
  },
  {
    id: '2',
    name: 'Bob Smith',
    age: 45,
    gender: 'Male',
    condition: 'Diabetes Type 2',
    lastVisit: '2024-12-08',
    status: 'Active'
  },
  {
    id: '3',
    name: 'Carol Davis',
    age: 28,
    gender: 'Female',
    condition: 'Asthma',
    lastVisit: '2024-11-25',
    status: 'Inactive'
  },
  {
    id: '4',
    name: 'David Wilson',
    age: 52,
    gender: 'Male',
    condition: 'Heart Disease',
    lastVisit: '2024-12-12',
    status: 'Active'
  }
];