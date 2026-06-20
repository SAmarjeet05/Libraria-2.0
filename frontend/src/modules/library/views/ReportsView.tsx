import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DocumentArrowDownIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { useAuth } from '../../../hooks/useAuth';

interface BookTrend {
  date: string;
  count: number;
}

interface AnalyticsData {
  total_books: number;
  active_members: number;
  books_issued: number;
  overdue_books: number;
  total_books_change_pct: number;
  active_members_change_pct: number;
  books_issued_change_pct: number;
  overdue_books_change_pct: number;
  popular_books: Array<{ title: string; issues: number }>;
  daily_trends: Array<{ day: string; count: number }>;
  book_issues_trend: BookTrend[];
  new_books_trend: BookTrend[];
  member_registrations_trend: BookTrend[];
}

export const ReportsView: React.FC = () => {
  const { token } = useAuth();

  const [reports, setReports] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/reports/', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }
        const data = await res.json();
        if (mounted) setReports(data);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load reports');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    // Poll every 20 seconds for near-real-time updates
    const iv = setInterval(load, 20000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, [token]);

  const handleExport = () => {
    if (!reports) {
      const empty = { generated_at: new Date().toISOString(), note: 'no data' };
      const blob = new Blob([JSON.stringify(empty, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reports-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      return;
    }

    const payload = {
      exported_at: new Date().toISOString(),
      data: reports,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const reportData = [
    { key: 'total_books', label: 'Total Books', color: 'text-blue-600', changeKey: 'total_books_change_pct' },
    { key: 'active_members', label: 'Active Members', color: 'text-green-600', changeKey: 'active_members_change_pct' },
    { key: 'books_issued', label: 'Books Issued', color: 'text-yellow-600', changeKey: 'books_issued_change_pct' },
    { key: 'overdue_books', label: 'Overdue Books', color: 'text-red-600', changeKey: 'overdue_books_change_pct' },
  ];

  const popularBooks: Array<{ title: string; issues: number }> = reports?.popular_books || [];
  const bookIssuesTrend: BookTrend[] = reports?.book_issues_trend || [];
  const newBooksTrend: BookTrend[] = reports?.new_books_trend || [];
  const memberRegistrationsTrend: BookTrend[] = reports?.member_registrations_trend || [];

  // Line Graph Component with 7-day data filling
  const LineGraph: React.FC<{ data: BookTrend[]; label: string; color: string; height?: number }> = ({ data, label, color, height = 280 }) => {
    // Fill missing days with 0 values for last 7 days
    const getLast7Days = (trendData: BookTrend[]) => {
      const today = new Date();
      const last7Days: { [key: string]: number } = {};
      
      // Initialize all 7 days with 0
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last7Days[dateStr] = 0;
      }
      
      // Fill in actual data
      trendData.forEach(item => {
        const dateStr = (item as any).date || (item as any).day || '';
        if (dateStr && last7Days.hasOwnProperty(dateStr)) {
          last7Days[dateStr] = item.count;
        }
      });
      
      // Convert back to array sorted by date
      return Object.entries(last7Days).map(([date, count]) => ({ date, count }));
    };
    
    const filledData = getLast7Days(data);
    if (!filledData || filledData.length === 0) {
      return (
        <div className="flex items-center justify-center" style={{ height: `${height}px` }}>
          <p className="text-gray-500 dark:text-gray-400">No data available</p>
        </div>
      );
    }

    const maxCount = Math.max(...filledData.map(d => d.count), 1);
    const padding = { top: 20, right: 30, bottom: 40, left: 50 };
    const svgWidth = 700;
    const svgHeight = height;
    const width = svgWidth - padding.left - padding.right;
    const graphHeight = svgHeight - padding.top - padding.bottom;
    const pointSpacing = width / (filledData.length - 1 || 1);

    const points = filledData.map((item, idx) => {
      const dateStr = item.date || '';
      return {
        x: padding.left + idx * pointSpacing,
        y: padding.top + graphHeight - (item.count / maxCount) * graphHeight,
        count: item.count,
        date: dateStr,
      };
    });

    const pathData = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPathData = `${pathData} L ${points[points.length - 1].x} ${padding.top + graphHeight} L ${points[0].x} ${padding.top + graphHeight} Z`;

    const colorMap: Record<string, { gradient: string; line: string }> = {
      'blue': { gradient: 'rgb(59, 130, 246)', line: 'rgb(59, 130, 246)' },
      'green': { gradient: 'rgb(34, 197, 94)', line: 'rgb(34, 197, 94)' },
      'purple': { gradient: 'rgb(168, 85, 247)', line: 'rgb(168, 85, 247)' },
    };

    const selectedColor = colorMap[color] || colorMap['blue'];

    return (
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{ minWidth: '600px' }}>
          {/* Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <line
              key={`grid-${ratio}`}
              x1={padding.left}
              y1={padding.top + graphHeight * (1 - ratio)}
              x2={svgWidth - padding.right}
              y2={padding.top + graphHeight * (1 - ratio)}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.1"
              className="text-gray-800"
            />
          ))}

          {/* Y-axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
            <text
              key={`y-label-${ratio}`}
              x={padding.left - 15}
              y={padding.top + graphHeight * (1 - ratio) + 5}
              textAnchor="end"
              className="text-xs fill-gray-600 dark:fill-gray-400"
            >
              {Math.round(maxCount * ratio)}
            </text>
          ))}

          {/* Area under line */}
          <defs>
            <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={selectedColor.gradient} stopOpacity="0.3" />
              <stop offset="100%" stopColor={selectedColor.gradient} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          <path d={areaPathData} fill={`url(#gradient-${label})`} />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke={selectedColor.line}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={`point-${idx}`} className="group cursor-pointer">
              <circle
                cx={p.x}
                cy={p.y}
                r="20"
                fill="transparent"
                className="hover:opacity-20"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r="4"
                fill={selectedColor.line}
                stroke="white"
                strokeWidth="2"
              />
              {/* Tooltip */}
              <g>
                <rect
                  x={p.x - 60}
                  y={p.y - 40}
                  width="120"
                  height="32"
                  rx="6"
                  fill="rgb(17, 24, 39)"
                  opacity="0"
                  className="group-hover:opacity-95 transition-opacity"
                />
                <text
                  x={p.x}
                  y={p.y - 22}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-white group-hover:opacity-100 opacity-0 transition-opacity"
                >
                  {p.date}
                </text>
                <text
                  x={p.x}
                  y={p.y - 8}
                  textAnchor="middle"
                  className="text-sm font-bold fill-blue-300 group-hover:opacity-100 opacity-0 transition-opacity"
                >
                  {p.count}
                </text>
              </g>
            </g>
          ))}

          {/* X-axis */}
          <line
            x1={padding.left}
            y1={padding.top + graphHeight}
            x2={svgWidth - padding.right}
            y2={padding.top + graphHeight}
            stroke="currentColor"
            strokeWidth="2"
            className="stroke-gray-400 dark:stroke-gray-500"
          />

          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={padding.top + graphHeight}
            stroke="currentColor"
            strokeWidth="2"
            className="stroke-gray-400 dark:stroke-gray-500"
          />

          {/* X-axis Labels */}
          {points.map((p, idx) => {
            if (filledData.length > 20 && idx % Math.ceil(filledData.length / 6) !== 0) return null;
            if (!p.date) return null;
            return (
              <text
                key={`x-label-${idx}`}
                x={p.x}
                y={svgHeight - 10}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {(() => {
                  const parts = p.date.split('-');
                  if (parts.length !== 3) return p.date;
                  const [year, month, day] = parts;
                  const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                })()}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent mb-2">Reports & Analytics</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive insights into your library operations
          </p>
        </div>
        
        <Button variant="secondary" className="flex items-center space-x-2" onClick={handleExport}>
          <DocumentArrowDownIcon className="w-5 h-5" />
          <span>Export Report</span>
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          Error loading reports: {error}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {reportData.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 opacity-10">
                <ArrowTrendingUpIcon className="w-16 h-16" />
              </div>
              <div className="relative z-10">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {metric.label}
                </p>
                <p className="text-3xl font-bold mb-3">
                  {loading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    reports ? String(reports[metric.key as keyof AnalyticsData]) : '--'
                  )}
                </p>
                <p className={`text-sm font-semibold ${metric.color}`}>
                  {reports && metric.changeKey ? (
                    (() => {
                      const pct = reports[metric.changeKey as keyof AnalyticsData] as number;
                      if (pct === null || pct === undefined) return <span className="text-gray-500">N/A</span>;
                      const sign = pct > 0 ? '+' : '';
                      const cls = pct > 0 ? 'text-green-600 dark:text-green-400' : (pct < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400');
                      return <span className={cls}>{sign}{pct}%</span>;
                    })()
                  ) : ''}
                </p>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Analytics Graphs */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Book Issues Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
              Book Issues Trend
            </h3>
            <LineGraph data={bookIssuesTrend} label="book-issues" color="blue" />
          </Card>
        </motion.div>

        {/* New Books Added Trend */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-600" />
              New Books Added
            </h3>
            <LineGraph data={newBooksTrend} label="new-books" color="green" />
          </Card>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Member Registrations Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <ArrowTrendingUpIcon className="w-5 h-5 text-purple-600" />
              Member Registrations
            </h3>
            <LineGraph data={memberRegistrationsTrend} label="member-registrations" color="purple" />
          </Card>
        </motion.div>

        {/* Popular Books & Daily Trends */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Most Popular Books</h3>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {popularBooks.length === 0 && (
                <p className="text-sm text-gray-500">No data available</p>
              )}
              {popularBooks.map((book, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{book.title}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {book.issues} issues
                    </span>
                    <div className="w-16 h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((book.issues / (popularBooks[0]?.issues || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};