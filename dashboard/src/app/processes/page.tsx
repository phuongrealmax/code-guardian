import { Activity, Server, Wifi, WifiOff, Cpu, HardDrive } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Mock data - in real app, this would come from process module
const ports = [
  { port: 3000, name: 'Dev Server', status: 'in_use', pid: 12345 },
  { port: 3333, name: 'CCG Dashboard', status: 'available', pid: null },
  { port: 5432, name: 'PostgreSQL', status: 'in_use', pid: 1234 },
  { port: 6379, name: 'Redis', status: 'available', pid: null },
];

const processes = [
  { pid: 12345, name: 'node', command: 'npm run dev', port: 3000, uptime: '2h 15m' },
  { pid: 1234, name: 'postgres', command: 'postgres -D /data', port: 5432, uptime: '5d 3h' },
];

export default function ProcessesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Activity className="w-8 h-8 text-ccg-primary" />
          Processes
        </h1>
        <p className="text-gray-500 mt-1">Port and process management</p>
      </div>

      {/* Port Status */}
      <div className="card">
        <h2 className="card-header flex items-center gap-2">
          <Server className="w-5 h-5 text-ccg-primary" />
          Port Status
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {ports.map((p) => (
            <div
              key={p.port}
              className={`p-4 rounded-lg border-2 ${
                p.status === 'in_use'
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{p.port}</span>
                {p.status === 'in_use' ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <p className="text-sm text-gray-600">{p.name}</p>
              <p className="text-xs text-gray-400 mt-1">
                {p.status === 'in_use' ? `PID: ${p.pid}` : 'Available'}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Running Processes */}
      <div className="card">
        <h2 className="card-header flex items-center gap-2">
          <Cpu className="w-5 h-5 text-ccg-primary" />
          Running Processes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="pb-3 font-medium">PID</th>
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Command</th>
                <th className="pb-3 font-medium">Port</th>
                <th className="pb-3 font-medium">Uptime</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {processes.map((p) => (
                <tr key={p.pid} className="text-sm">
                  <td className="py-3 font-mono text-gray-600">{p.pid}</td>
                  <td className="py-3 font-medium text-gray-900">{p.name}</td>
                  <td className="py-3 text-gray-600 font-mono text-xs">{p.command}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-ccg-primary/10 text-ccg-primary rounded text-xs">
                      {p.port}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{p.uptime}</td>
                  <td className="py-3">
                    <button className="text-xs text-red-600 hover:text-red-800">
                      Kill
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="card-header">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
            <Server className="w-5 h-5 text-ccg-primary mb-2" />
            <p className="font-medium text-gray-900 text-sm">Check All Ports</p>
            <p className="text-xs text-gray-500">Scan configured ports</p>
          </button>
          <button className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
            <Activity className="w-5 h-5 text-green-500 mb-2" />
            <p className="font-medium text-gray-900 text-sm">Spawn Process</p>
            <p className="text-xs text-gray-500">Start new process</p>
          </button>
          <button className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
            <HardDrive className="w-5 h-5 text-amber-500 mb-2" />
            <p className="font-medium text-gray-900 text-sm">List Processes</p>
            <p className="text-xs text-gray-500">View all tracked</p>
          </button>
          <button className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left">
            <Activity className="w-5 h-5 text-red-500 mb-2" />
            <p className="font-medium text-gray-900 text-sm">Cleanup All</p>
            <p className="text-xs text-gray-500">Kill CCG processes</p>
          </button>
        </div>
      </div>
    </div>
  );
}
