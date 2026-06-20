import React from 'react';
import { Card } from '../../../components/ui/Card';

export const RecordsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-semibold mb-4">Medical Records</h2>
        <p>Access and manage patient medical records.</p>
      </Card>

      {/* Example Records List */}
      <div className="grid gap-4">
        {[
          { id: 1, patient: 'John Doe', type: 'Lab Report', date: '2024-02-15', category: 'Blood Test' },
          { id: 2, patient: 'Jane Smith', type: 'Prescription', date: '2024-02-18', category: 'Follow-up' },
          { id: 3, patient: 'Bob Wilson', type: 'Imaging', date: '2024-02-20', category: 'X-Ray' }
        ].map((record) => (
          <Card key={record.id} hover>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{record.patient}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{record.type} • {record.category}</p>
                <p className="text-xs text-gray-500 dark:text-gray-500">Date: {record.date}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm">
                  View
                </button>
                <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                  Download
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Record Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Add New Record
        </button>
      </div>
    </div>
  );
};