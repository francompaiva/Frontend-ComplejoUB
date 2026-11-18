import React from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { IconStadium, IconTrophy, IconCalendar, IconShield, IconPlus, IconArrowRight } from '../components/Icons';

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
      icon: <IconStadium size={20} className="text-emerald-600" />,
      bgIcon: 'bg-emerald-50 border-emerald-200'
    },
    {
      title: 'Torneos Activos',
      value: String(tournaments.length),
      sub: `${activeTournaments} en curso hoy`,
      icon: <IconTrophy size={20} className="text-amber-600" />,
      bgIcon: 'bg-amber-50 border-amber-200'
    },
    {
      title: 'Reservas del Día',
      value: String(bookings.length + 18),
      sub: '88% ocupación estimada',
      icon: <IconCalendar size={20} className="text-sky-600" />,
      bgIcon: 'bg-sky-50 border-sky-200'
    },
    {
      title: 'Acciones Auditadas',
      value: String(auditLogs.length),
      sub: 'Trazabilidad de eventos',
      icon: <IconShield size={20} className="text-indigo-600" />,
      bgIcon: 'bg-indigo-50 border-indigo-200'
    }
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 min-h-full text-slate-900 font-['Inter',sans-serif]">
      {/* Top Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">Panel General de Control</h1>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              ADMIN UB
            </span>
          </div>
          <p className="font-normal text-xs sm:text-sm text-slate-500 mt-1">
            Visión unificada de ocupación de canchas, torneos en disputa y eventos recientes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('canchas')}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Configurar Canchas
          </button>
          <button
            type="button"
            onClick={onOpenInscripcion}
            className="px-4 py-2.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <IconPlus size={15} />
            <span>Inscribir Equipo</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{kpi.title}</span>
              <div className={`size-9 rounded-xl border flex items-center justify-center ${kpi.bgIcon}`}>
                {kpi.icon}
              </div>
            </div>
            <div>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</span>
              <p className="text-xs text-emerald-700 font-semibold mt-1">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Próximos Partidos del Fixture */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Partidos Oficiales del Fixture</h2>
              <p className="text-xs text-slate-500">Próximos cruces con árbitros designados.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('torneo')}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer bg-transparent border-none flex items-center gap-1"
            >
              <span>Ver Fixture Completo</span>
              <IconArrowRight size={13} />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {fixtures.slice(0, 4).map((f) => (
              <div key={f.id} className="py-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-700">{f.round}</span>
                    <span className="text-xs text-slate-400">· {f.court}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {f.isFreeDate ? `Fecha Libre: ${f.freeTeamName}` : `${f.homeTeam} vs ${f.awayTeam}`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                    {f.status}
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1">{f.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Últimos Registros de Auditoría */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Auditoría Reciente</h2>
              <p className="text-xs text-slate-500">Últimos movimientos del sistema.</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('auditoria')}
              className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer bg-transparent border-none flex items-center gap-1"
            >
              <span>Ver Todo</span>
              <IconArrowRight size={13} />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">{log.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
