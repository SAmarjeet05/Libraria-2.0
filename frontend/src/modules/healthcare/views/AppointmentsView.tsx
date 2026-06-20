import React from 'react';
import { Card } from '../../../components/ui/Card';

export const AppointmentsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-semibold mb-4">Appointments</h2>
        <p>Schedule and manage patient appointments.</p>
      </Card>

      {/* Example Appointments List */}
      <div className="grid gap-4">
        {[
          { id: 1, patient: 'John Doe', date: '2024-02-25', time: '09:00 AM', type: 'Check-up' },
          { id: 2, patient: 'Jane Smith', date: '2024-02-25', time: '10:30 AM', type: 'Follow-up' },
          { id: 3, patient: 'Bob Wilson', date: '2024-02-26', time: '02:00 PM', type: 'Consultation' }
        ].map((appointment) => (
          <Card key={appointment.id} hover>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{appointment.patient}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {appointment.date} at {appointment.time}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">{appointment.type}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg text-sm">
                  Edit
                </button>
                <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Schedule Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
          Schedule Appointment
        </button>
      </div>
    </div>
  );
};