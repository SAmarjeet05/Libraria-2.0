import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '../components/ui/Card';
import {
  UsersIcon,
  BookOpenIcon,
  ChartBarIcon,
  ClockIcon,
  PlusIcon,
  CogIcon,
  DocumentTextIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { adminAnalyticsService } from '../services/adminAnalyticsService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Dashboard data state
  const [dashboardMetrics, setDashboardMetrics] = useState<any>({});
  const [notesAnalytics, setNotesAnalytics] = useState<any>({});
  const [bookViewStats, setBookViewStats] = useState<any>({});
  const [mostDownloadedNotes, setMostDownloadedNotes] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<any[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load all analytics data in parallel
        const [metrics, notesData, bookViews, topNotes, contributors] = await Promise.all([
          adminAnalyticsService.getDashboardMetrics(),
          adminAnalyticsService.getNotesAnalytics(),
          adminAnalyticsService.getBookViewStats(),
          adminAnalyticsService.getMostDownloadedNotes(5),
          adminAnalyticsService.getTopContributors(5)
        ]);

        setDashboardMetrics(metrics);
        setNotesAnalytics(notesData);
        setBookViewStats(bookViews);
        setMostDownloadedNotes(topNotes);
        setTopContributors(contributors);
      } catch (err: any) {
        console.error('Error loading dashboard data:', err);
        setError(err?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Format percentage change
  const formatChange = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  // Get change color class
  const getChangeColor = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'text-gray-600 dark:text-gray-400';
    return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  // Get change icon
  const getChangeIcon = (value: number | null | undefined) => {
    if (value === null || value === undefined) return null;
    return value >= 0 ? (
      <ArrowTrendingUpIcon className="w-4 h-4 inline mr-1" />
    ) : (
      <ArrowTrendingDownIcon className="w-4 h-4 inline mr-1" />
    );
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      }
    },
    scales: {
      x: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151'
        }
      },
      y: {
        grid: {
          color: document.documentElement.classList.contains('dark') ? '#374151' : '#E5E7EB'
        },
        ticks: {
          color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#374151'
        }
      }
    }
  };

  // Book Issues Trend Chart Data
  const bookIssuesTrendData = {
    labels: dashboardMetrics.book_issues_trend?.map((d: any) => d.day) || [],
    datasets: [
      {
        label: 'Book Issues',
        data: dashboardMetrics.book_issues_trend?.map((d: any) => d.count) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Member Registrations Trend Chart Data
  const memberTrendData = {
    labels: dashboardMetrics.member_registrations_trend?.map((d: any) => d.day) || [],
    datasets: [
      {
        label: 'New Members',
        data: dashboardMetrics.member_registrations_trend?.map((d: any) => d.count) || [],
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // New Books Trend Chart Data
  const newBooksTrendData = {
    labels: dashboardMetrics.new_books_trend?.map((d: any) => d.day) || [],
    datasets: [
      {
        label: 'New Books Added',
        data: dashboardMetrics.new_books_trend?.map((d: any) => d.count) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1
      }
    ]
  };

  // Popular Books Doughnut Chart
  const popularBooksData = {
    labels: dashboardMetrics.popular_books?.slice(0, 5).map((b: any) => b.title.substring(0, 20)) || [],
    datasets: [
      {
        label: 'Issues',
        data: dashboardMetrics.popular_books?.slice(0, 5).map((b: any) => b.issues) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </Card>
    );
  }

  const stats = [
    { 
      label: 'Total Books', 
      value: dashboardMetrics.total_books?.toLocaleString() || '0', 
      icon: BookOpenIcon, 
      change: formatChange(dashboardMetrics.total_books_change_pct),
      changeValue: dashboardMetrics.total_books_change_pct,
      color: 'from-blue-500 to-blue-600'
    },
    { 
      label: 'Active Members', 
      value: dashboardMetrics.active_members?.toLocaleString() || '0', 
      icon: UsersIcon, 
      change: formatChange(dashboardMetrics.active_members_change_pct),
      changeValue: dashboardMetrics.active_members_change_pct,
      color: 'from-purple-500 to-purple-600'
    },
    { 
      label: 'Books Issued', 
      value: dashboardMetrics.books_issued?.toLocaleString() || '0', 
      icon: ChartBarIcon, 
      change: formatChange(dashboardMetrics.books_issued_change_pct),
      changeValue: dashboardMetrics.books_issued_change_pct,
      color: 'from-green-500 to-green-600'
    },
    { 
      label: 'Overdue Books', 
      value: dashboardMetrics.overdue_books?.toLocaleString() || '0', 
      icon: ClockIcon, 
      change: formatChange(dashboardMetrics.overdue_books_change_pct),
      changeValue: dashboardMetrics.overdue_books_change_pct,
      color: 'from-red-500 to-red-600'
    },
    { 
      label: 'Total Notes', 
      value: notesAnalytics.total_notes?.toLocaleString() || '0', 
      icon: DocumentDuplicateIcon, 
      change: 'All Time',
      changeValue: null,
      color: 'from-indigo-500 to-indigo-600'
    },
    { 
      label: 'Book Views', 
      value: bookViewStats.total_views?.toLocaleString() || '0', 
      icon: EyeIcon, 
      change: `${bookViewStats.unique_books || 0} Books`,
      changeValue: null,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  return (
    <div className="py-12 px-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 text-center">
          Real-time analytics and insights for your library management system
        </p>
      </div>

      {/* Analytics Overview - Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-l-4 border-blue-500 dark:border-blue-400">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                    <p className={`text-sm mt-2 ${getChangeColor(stat.changeValue)}`}>
                      {getChangeIcon(stat.changeValue)}
                      {stat.change}
                    </p>
                  </div>
                  <div className={`p-4 bg-gradient-to-br ${stat.color} rounded-xl`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Book Issues Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Book Issues Trend (Last 7 Days)</h3>
          <div className="h-64">
            <Line data={bookIssuesTrendData} options={chartOptions} />
          </div>
        </Card>

        {/* Member Registrations Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Member Registrations (Last 7 Days)</h3>
          <div className="h-64">
            <Line data={memberTrendData} options={chartOptions} />
          </div>
        </Card>

        {/* New Books Added */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">New Books Added (Last 7 Days)</h3>
          <div className="h-64">
            <Bar data={newBooksTrendData} options={chartOptions} />
          </div>
        </Card>

        {/* Popular Books Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Top 5 Popular Books</h3>
          <div className="h-64 flex items-center justify-center">
            <Doughnut data={popularBooksData} options={{ ...chartOptions, scales: undefined }} />
          </div>
        </Card>
      </div>

      {/* Most Downloaded Notes & Top Contributors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Downloaded Notes */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <DocumentDuplicateIcon className="w-6 h-6 mr-2 text-indigo-500" />
            Most Downloaded Notes
          </h3>
          <div className="space-y-3">
            {mostDownloadedNotes.length > 0 ? (
              mostDownloadedNotes.map((note, index) => (
                <motion.div
                  key={note.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:shadow-md transition-all"
                >
                  <div className="flex-1">
                    <p className="text-gray-900 dark:text-white font-medium">{note.title}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{note.subject || 'N/A'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{note.download_count}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">downloads</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">No notes data available</p>
            )}
          </div>
        </Card>

        {/* Top Contributors */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
            <UsersIcon className="w-6 h-6 mr-2 text-purple-500" />
            Top Contributors
          </h3>
          <div className="space-y-3">
            {topContributors.length > 0 ? (
              topContributors.map((contributor, index) => (
                <motion.div
                  key={contributor.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:shadow-md transition-all"
                >
                  <div className="flex items-center flex-1">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold mr-3`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{contributor.username}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{contributor.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{contributor.notes_count}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">notes</p>
                  </div>
                </motion.div>
              ))
            ) : (
              <p className="text-gray-600 dark:text-gray-400 text-center py-4">No contributors data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all flex flex-col items-center justify-center space-y-3"
          >
            <PlusIcon className="w-8 h-8" />
            <span className="font-semibold">Add New Book</span>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all flex flex-col items-center justify-center space-y-3"
          >
            <UsersIcon className="w-8 h-8" />
            <span className="font-semibold">Manage Users</span>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all flex flex-col items-center justify-center space-y-3"
          >
            <DocumentTextIcon className="w-8 h-8" />
            <span className="font-semibold">Generate Report</span>
          </motion.button>
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all flex flex-col items-center justify-center space-y-3"
          >
            <CogIcon className="w-8 h-8" />
            <span className="font-semibold">System Settings</span>
          </motion.button>
        </div>
      </div>
    </div>
  );
};
