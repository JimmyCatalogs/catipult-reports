import React from 'react';
import { LoadingBar } from '../LoadingBar';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function CallsAnalyticsView({ 
  callsAnalytics,
  analyticsProgress
}) {
  // Prepare chart data with daily view
  const chartData = {
    labels: callsAnalytics?.timeBasedStats?.map(stat => stat.date) || [],
    datasets: [
      {
        label: 'Total Calls',
        data: callsAnalytics?.timeBasedStats?.map(stat => stat.total) || [],
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Call Volume (Daily View)',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <div className="space-y-6 relative">
      {analyticsProgress > 0 && analyticsProgress < 1 && (
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg w-64">
            <LoadingBar progress={analyticsProgress} height={4} />
            <p className="text-center mt-2 text-sm text-gray-600">
              Loading data... {Math.round(analyticsProgress * 100)}%
            </p>
          </div>
        </div>
      )}
      {/* Overall Stats */}
      <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Overall Statistics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div style={{ background: 'var(--primary-background)', color: 'var(--primary)' }} className="p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Total Calls</h3>
            <p className="text-2xl font-bold">{callsAnalytics?.totalCalls || 0}</p>
          </div>
          <div style={{ background: 'var(--success-background)', color: 'var(--success)' }} className="p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Avg Duration</h3>
            <p className="text-2xl font-bold">{callsAnalytics?.averageDuration || 0}s</p>
          </div>
          <div style={{ background: 'var(--primary-background)', color: 'var(--primary)' }} className="p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Inbound</h3>
            <p className="text-2xl font-bold">{callsAnalytics?.byDirection.inbound || 0}</p>
          </div>
          <div style={{ background: 'var(--success-background)', color: 'var(--success)' }} className="p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Outbound</h3>
            <p className="text-2xl font-bold">{callsAnalytics?.byDirection.outbound || 0}</p>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ background: 'var(--background)' }} className="p-6 rounded-lg shadow-sm">
        <Bar options={chartOptions} data={chartData} />
      </div>

      {/* User Stats */}
      <div style={{ background: 'var(--background)' }} className="rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--foreground)' }}>User Statistics</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--border)' }}>
            <thead style={{ background: 'var(--muted-background)' }}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Total Calls
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Avg Duration
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Inbound
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Outbound
                </th>
              </tr>
            </thead>
            <tbody style={{ background: 'var(--background)', borderColor: 'var(--border)' }} className="divide-y">
              {callsAnalytics?.userStats.map((user) => (
                <tr key={user.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                    {user.totalCalls}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                    {user.averageDuration}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                    {user.inbound}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--foreground)' }}>
                    {user.outbound}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
