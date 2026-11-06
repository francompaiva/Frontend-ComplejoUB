import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { type AuditLogItem } from '../data/mockData';
import { IconClock } from '../components/Icons';

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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'torneo':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'partido':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'sancion':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'reserva':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-slate-50 min-h-full text-slate-900 font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
            Seguridad y Trazabilidad
          </span>
          <h1 className="font-bold text-2xl text-slate-900 tracking-tight mt-0.5">
            Registro de Auditoría
          </h1>
          <p className="font-normal text-sm text-slate-500 mt-1">
            Historial inmutable de las operaciones administrativas realizadas en la plataforma.
          </p>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200 flex-wrap shadow-2xs">
          {['todos', 'cancha', 'torneo', 'partido', 'sancion', 'reserva'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                filter === f
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <span className="text-sm font-bold text-slate-900">Eventos Registrados ({filteredLogs.length})</span>
          <span className="text-xs text-slate-500">Orden cronológico descendente</span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <span className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-md border shrink-0 mt-0.5 ${getTypeBadge(log.type)}`}>
                  {log.type}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-slate-900">{log.action}</p>
                    <span className="text-xs text-slate-500">• Por: {log.adminName}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{log.detail}</p>
                </div>
              </div>

              <span className="text-xs font-mono text-slate-500 shrink-0 self-start md:self-center flex items-center gap-1.5">
                <IconClock size={13} className="text-slate-400" />
                {log.timestamp}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminAuditoria;
