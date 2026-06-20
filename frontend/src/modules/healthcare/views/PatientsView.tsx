import React from 'react';
import { Card } from '../../../components/ui/Card';

export const PatientsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-semibold mb-4">Patients</h2>
        <p>View and manage patient information.</p>
      </Card>

      {/* Example Patients List */}
      <div className="grid gap-4">
        {[
          { id: 1, name: 'John Doe', age: 45, gender: 'Male', lastVisit: '2024-02-15' },
          { id: 2, name: 'Jane Smith', age: 32, gender: 'Female', lastVisit: '2024-02-18' },
          { id: 3, name: 'Bob Wilson', age: 28, gender: 'Male', lastVisit: '2024-02-20' }
        ].map((patient) => (
          <Card key={patient.id} hover>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{patient.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {patient.age} years • {patient.gender}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Last Visit: {patient.lastVisit}
                </p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm">
                  View Details
                </button>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                  Schedule Visit
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Patient Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Add New Patient
        </button>
      </div>
    </div>
  );
};