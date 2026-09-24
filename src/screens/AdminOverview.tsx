import React from 'react';
import { useComplejo } from '../context/ComplejoContext';

export interface AdminOverviewProps {
  onNavigate: (section: string) => void;
  onOpenInscripcion: () => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  onNavigate,
  onOpenInscripcion
}) => {
  const { courts, tournaments, bookings, auditLogs, fixtures } = useComplejo();

  const activeCourts = courts.filter((c) => c.status === 'activa').length;
  const maintenanceCourts = courts.filter((c) => c.status === 'mantenimiento').length;
  const activeTournaments = tournaments.filter((t) => t.status === 'En curso').length;

  const kpis = [
    {
      title: 'Canchas Operativas',
      value: `${activeCourts} / ${courts.length}`,
      sub: `${maintenanceCourts} en mantenimiento`,
      icon: '🏟️',
      color: '#65c556'
    },
    {
      title: 'Torneos Activos',
      value: String(tournaments.length),
      sub: `${activeTournaments} en curso hoy`,
      icon: '🏆',
      color: '#f59e0b'
    },
    {
      title: 'Reservas del Día',
      value: String(bookings.length + 18),
      sub: '88% ocupación estimada',
      icon: '📅',
      color: '#3b82f6'
    },
    {
      title: 'Acciones Auditadas',
      value: String(auditLogs.length),
      sub: 'Trazabilidad de eventos',
      icon: '🛡️',
      color: '#a855f7'
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-[#293827] min-h-full text-white font-['Inter',sans-serif]">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-2xl text-white">Panel General de Control</h1>
            <span className="bg-[#65c556] text-[#293827] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
              ADMIN UB
            </span>
          </div>
          <p className="font-normal text-sm text-[#a0a0a0] mt-1">
            Visión unificada de ocupación de canchas, torneos en disputa y eventos recientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('canchas')}
            className="px-4 py-2 rounded-xl bg-[#293827] border border-[#5a7056] text-xs font-semibold hover:border-[#65c556] transition-colors cursor-pointer"
          >
            Configurar Canchas
          </button>
          <button
            type="button"
            onClick={onOpenInscripcion}
            className="px-4 py-2 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs shadow transition-colors cursor-pointer"
          >
            + Inscribir Equipo
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#a0a0a0] uppercase">{kpi.title}</span>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <div>
              <span className="text-3xl font-black text-white">{kpi.value}</span>
              <p className="text-xs text-[#65c556] mt-1">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Próximos Partidos del Fixture */}
        <div className="lg:col-span-7 bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Partidos Oficiales del Fixture</h2>
              <p className="text-xs text-[#a0a0a0]">Próximos cruces con árbitros designados.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('torneo')}
              className="text-xs text-[#65c556] font-bold hover:underline cursor-pointer bg-transparent border-none"
            >
              Ver Fixture Completo →
            </button>
          </div>

          <div className="divide-y divide-[#293827]">
            {fixtures.slice(0, 4).map((f) => (
              <div key={f.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#65c556]">{f.round}</span>
                    <span className="text-xs text-[#a0a0a0]">• {f.court}</span>
                  </div>
                  <p className="text-sm font-bold text-white mt-0.5">
                    {f.isFreeDate ? `Fecha Libre: ${f.freeTeamName}` : `${f.homeTeam} vs ${f.awayTeam}`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold bg-[#293827] px-2.5 py-1 rounded-lg border border-[#5a7056] text-[#c0c0c0]">
                    {f.status}
                  </span>
                  <p className="text-[11px] text-[#a0a0a0] mt-1">{f.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Últimos Registros de Auditoría */}
        <div className="lg:col-span-5 bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Auditoría Reciente</h2>
              <p className="text-xs text-[#a0a0a0]">Últimos movimientos del sistema.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('auditoria')}
              className="text-xs text-[#65c556] font-bold hover:underline cursor-pointer bg-transparent border-none"
            >
              Ver Todo →
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="bg-[#293827] p-3 rounded-xl border border-[#5a7056] flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{log.action}</span>
                  <span className="text-[10px] text-[#a0a0a0] font-mono">{log.timestamp}</span>
                </div>
                <p className="text-xs text-[#a0a0a0] line-clamp-2">{log.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
