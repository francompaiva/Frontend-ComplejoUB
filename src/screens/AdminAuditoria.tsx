import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { type AuditLogItem } from '../data/mockData';

export const AdminAuditoria: React.FC = () => {
  const { auditLogs } = useComplejo();
  const [filter, setFilter] = useState<string>('todos');

  const filteredLogs = auditLogs.filter((log) => {
    if (filter === 'todos') return true;
    return log.type === filter;
  });

  const getTypeBadge = (type: AuditLogItem['type']) => {
    switch (type) {
      case 'cancha':
        return 'bg-[rgba(101,197,86,0.15)] text-[#65c556] border-[rgba(101,197,86,0.3)]';
      case 'torneo':
        return 'bg-[rgba(59,130,246,0.15)] text-[#3b82f6] border-[rgba(59,130,246,0.3)]';
      case 'partido':
        return 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border-[rgba(245,158,11,0.3)]';
      case 'sancion':
        return 'bg-[rgba(229,62,62,0.15)] text-[#e53e3e] border-[rgba(229,62,62,0.3)]';
      case 'reserva':
        return 'bg-[rgba(168,85,247,0.15)] text-[#a855f7] border-[rgba(168,85,247,0.3)]';
      default:
        return 'bg-[#293827] text-white border-[#5a7056]';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-[#293827] min-h-full text-white font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-2xl text-white">Registro de Auditoría</h1>
          </div>
          <p className="font-normal text-sm text-[#a0a0a0] mt-1">
            Historial inmutable de las operaciones administrativas realizadas en la plataforma.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 bg-[#1e281d] p-1.5 rounded-xl border border-[#5a7056] flex-wrap">
          {['todos', 'cancha', 'torneo', 'partido', 'sancion', 'reserva'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-[#65c556] text-[#293827]'
                  : 'text-[#a0a0a0] hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-[#5a7056] flex items-center justify-between">
          <span className="text-sm font-bold text-white">Eventos Registrados ({filteredLogs.length})</span>
          <span className="text-xs text-[#a0a0a0]">Orden cronológico descendente</span>
        </div>

        <div className="divide-y divide-[#293827]">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#293827]/40 transition-colors">
              <div className="flex items-start gap-4">
                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border shrink-0 mt-0.5 ${getTypeBadge(log.type)}`}>
                  {log.type}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-white">{log.action}</p>
                    <span className="text-xs text-[#a0a0a0]">• Por: {log.adminName}</span>
                  </div>
                  <p className="text-xs text-[#c0c0c0] mt-1 leading-relaxed">{log.detail}</p>
                </div>
              </div>

              <span className="text-xs font-mono text-[#a0a0a0] shrink-0 self-start md:self-center">
                🕒 {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAuditoria;

