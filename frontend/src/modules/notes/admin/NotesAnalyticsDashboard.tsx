import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '../../../components/ui/Card';
import { notesAnalyticsService } from '../../../services/notesAnalyticsService';

type Summary = {
  total_notes?: number;
  total_downloads?: number;
  unique_downloaders_7d?: number;
};

const NotesAnalyticsDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({});
  const [mostDownloaded, setMostDownloaded] = useState<Array<any>>([]);
  const [downloadsPerDay, setDownloadsPerDay] = useState<Array<{ date: string; downloads: number }>>([]);
  const [viewsPerDay, setViewsPerDay] = useState<Array<{ date: string; views: number }>>([]);
  const [topContributors, setTopContributors] = useState<Array<any>>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, md, dpd, vc, tc] = await Promise.all([
        notesAnalyticsService.getSummary(),
        notesAnalyticsService.getMostDownloaded(10),
        notesAnalyticsService.getDownloadsPerDay(7),
        notesAnalyticsService.getViewsPerDay(7),
        notesAnalyticsService.getTopContributors(10)
      ]);
      setSummary(s || {});
      setMostDownloaded(md || []);
      // normalize downloadsPerDay shape from backend to local naming
      setDownloadsPerDay((dpd || []).map((d: any) => ({ date: d.date || d.day, downloads: d.downloads ?? d.count ?? 0 })));
      setViewsPerDay((vc || []).map((d: any) => ({ date: d.date || d.day, views: d.views ?? d.count ?? 0 })));
      setTopContributors(tc || []);
    } catch (err: any) {
      console.error('Failed to load notes analytics', err);
      setError(err?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // poll downloads per day to keep graph in sync
  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const [dpd, vpd] = await Promise.all([
          notesAnalyticsService.getDownloadsPerDay(7),
          notesAnalyticsService.getViewsPerDay(7)
        ]);
        if (!cancelled) {
          setDownloadsPerDay((dpd || []).map((d: any) => ({ date: d.date || d.day, downloads: d.downloads ?? d.count ?? 0 })));
          setViewsPerDay((vpd || []).map((d: any) => ({ date: d.date || d.day, views: d.views ?? d.count ?? 0 })));
        }
      } catch (e) {
        // ignore polling errors silently
      }
    };

    const id = setInterval(refresh, 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 dark:text-white">Notes Analytics</h2>

      {loading ? (
        <div className="p-4">Loading analytics...</div>
      ) : error ? (
        <div className="p-4 text-red-600">Error: {error}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold">Total Notes</h3>
              <p className="text-3xl font-bold mt-2">{summary.total_notes ?? '—'}</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold">Total Downloads</h3>
              <p className="text-3xl font-bold mt-2">{summary.total_downloads ?? '—'}</p>
            </Card>
            <Card className="p-4">
              <h3 className="font-semibold">Unique Downloaders (7d)</h3>
              <p className="text-3xl font-bold mt-2">{summary.unique_downloaders_7d ?? '—'}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Most Downloaded Notes</h3>
              {mostDownloaded.length === 0 ? (
                <p className="text-sm text-gray-500">No data</p>
              ) : (
                <ol className="list-decimal pl-5">
                  {mostDownloaded.map((n: any) => (
                    <li key={n.note_id || n.title} className="py-1">
                      <div className="font-medium">{n.title}</div>
                      <div className="text-sm text-gray-600">{n.downloads ?? n.count ?? 0} downloads</div>
                    </li>
                  ))}
                </ol>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Top Contributors</h3>
              {topContributors.length === 0 ? (
                <p className="text-sm text-gray-500">No contributors yet</p>
              ) : (
                <ul>
                  {topContributors.map((u: any) => (
                    <li key={u.user_id || u.id} className="py-1">
                      <div className="font-medium">{u.name ?? u.full_name ?? u.username ?? u.user_id}</div>
                      <div className="text-sm text-gray-600">{u.count ?? u.uploads ?? 0} uploads</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <Card className="p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold mb-2">Downloads (last 7 days)</h3>
                <div>
                  <button
                    className="text-sm px-2 py-1 border rounded bg-white hover:bg-gray-50"
                    onClick={() => loadAll()}
                  >
                    Refresh
                  </button>
                </div>
              </div>
              {downloadsPerDay.length === 0 ? (
                <p className="text-sm text-gray-500">No activity</p>
              ) : (
                <div>
                  <div className="w-full overflow-x-auto">
                    <svg viewBox="0 0 600 160" className="w-full h-40">
                      {/* horizontal grid lines */}
                      {[0,1,2,3,4].map(i => (
                        <line key={i} x1={0} x2={600} y1={(i*32)+8} y2={(i*32)+8} stroke="#eee" strokeWidth={1} />
                      ))}

                      {/* compute polyline points from real backend data */}
                      {(() => {
                        const data = downloadsPerDay.map(d => Number(d.downloads || 0));
                        const w = 560; const h = 120; const padX = 20; const padY = 8;
                        const max = data.length ? Math.max(...data) : 1;
                        const step = data.length > 1 ? w / (data.length - 1) : w;
                        const points = data.map((v, idx) => {
                          const x = padX + idx * step;
                          const y = padY + (h - Math.round((v / Math.max(max,1)) * h));
                          return `${x},${y}`;
                        }).join(' ');

                        return (
                          <>
                            <polyline fill="none" stroke="#3b82f6" strokeWidth={2} points={points} />
                            {data.map((v, idx) => {
                              const x = padX + idx * step;
                              const y = padY + (h - Math.round((v / Math.max(max,1)) * h));
                              return <circle key={idx} cx={x} cy={y} r={3} fill="#1d4ed8" />;
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-2 text-xs text-gray-600">
                    {downloadsPerDay.map((d) => (
                      <div key={d.date} className="text-center">
                        <div className="font-medium">{d.downloads}</div>
                        <div>{new Date(d.date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-2">Views (last 7 days)</h3>
              {viewsPerDay.length === 0 ? (
                <p className="text-sm text-gray-500">No activity</p>
              ) : (
                <div>
                  <div className="w-full overflow-x-auto">
                    <svg viewBox="0 0 600 160" className="w-full h-40">
                      {[0,1,2,3,4].map(i => (
                        <line key={i} x1={0} x2={600} y1={(i*32)+8} y2={(i*32)+8} stroke="#f3f4f6" strokeWidth={1} />
                      ))}

                      {(() => {
                        const data = viewsPerDay.map(d => Number(d.views || 0));
                        const w = 560; const h = 120; const padX = 20; const padY = 8;
                        const max = data.length ? Math.max(...data) : 1;
                        const step = data.length > 1 ? w / (data.length - 1) : w;
                        const points = data.map((v, idx) => {
                          const x = padX + idx * step;
                          const y = padY + (h - Math.round((v / Math.max(max,1)) * h));
                          return `${x},${y}`;
                        }).join(' ');

                        return (
                          <>
                            <polyline fill="none" stroke="#10b981" strokeWidth={2} points={points} />
                            {data.map((v, idx) => {
                              const x = padX + idx * step;
                              const y = padY + (h - Math.round((v / Math.max(max,1)) * h));
                              return <circle key={idx} cx={x} cy={y} r={3} fill="#059669" />;
                            })}
                          </>
                        );
                      })()}
                    </svg>
                  </div>

                  <div className="mt-3 grid grid-cols-7 gap-2 text-xs text-gray-600">
                    {viewsPerDay.map((d) => (
                      <div key={d.date} className="text-center">
                        <div className="font-medium">{d.views}</div>
                        <div>{new Date(d.date).toLocaleDateString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

        </div>
      )}
    </div>
  );
};

export default NotesAnalyticsDashboard;
