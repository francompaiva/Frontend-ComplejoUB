import React from 'react';
import { useComplejo } from '../context/ComplejoContext';

export const AdminReportes: React.FC = () => {
  const { bookings, sharedBookings, courts, userAbsences, tournaments } = useComplejo();

  const effectiveBookings = sharedBookings.length > 0 ? sharedBookings : bookings;

  const totalCollectedDeposits = effectiveBookings
    .filter((b) => b.status === 'Confirmada' || b.status === 'Completada')
    .reduce((acc, b) => acc + b.depositPaid, 0);

  const totalProjected = effectiveBookings
    .filter((b) => b.status === 'Confirmada' || b.status === 'Completada')
    .reduce((acc, b) => acc + b.totalPrice, 0);

  const occupancyStats = [
    { sport: 'Fútbol 5', percentage: 92, bookingsCount: 38, revenue: 684000 },
    { sport: 'Pádel', percentage: 88, bookingsCount: 26, revenue: 312000 },
    { sport: 'Tenis', percentage: 65, bookingsCount: 14, revenue: 196000 },
    { sport: 'Fútbol 8', percentage: 75, bookingsCount: 9, revenue: 216000 },
    { sport: 'Fútbol 11', percentage: 60, bookingsCount: 6, revenue: 210000 }
  ];

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-slate-50 min-h-full text-slate-900 font-['Inter',sans-serif]">
      {/* Header */}
      <div>
        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700">
          Inteligencia de Negocio
        </span>
        <h1 className="font-bold text-2xl text-slate-900 tracking-tight mt-0.5">
          Reportes Administrativos
        </h1>
        <p className="font-normal text-sm text-slate-500 mt-1">
          Métricas de recaudación por señas, ocupación por deporte y control de inasistencias.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-1 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Señas Cobradas (30%)
          </span>
          <span className="text-2xl font-black text-emerald-700">
            ${(totalCollectedDeposits + 345000).toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Total recaudado por reservas web
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-1 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Ingreso Total Proyectado
          </span>
          <span className="text-2xl font-black text-slate-900">
            ${(totalProjected + 1150000).toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Incluye saldo restante en complejo
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-1 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Tasa de Ocupación
          </span>
          <span className="text-2xl font-black text-amber-600">
            84.2%
          </span>
          <span className="text-xs text-slate-500 mt-1">
            {courts.length} canchas operativas
          </span>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col gap-1 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Sanciones Activas
          </span>
          <span className="text-2xl font-black text-red-600">
            {userAbsences >= 3 ? 1 : 0} cuentas
          </span>
          <span className="text-xs text-slate-500 mt-1">
            Bloqueadas por 3 faltas consecutivas
          </span>
        </div>
      </div>

      {/* Occupancy by Sport Chart/Bars */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">Ocupación y Rendimiento por Disciplina</h2>
        <p className="text-xs text-slate-500 mb-6">Demanda comparativa entre deportes del complejo.</p>

        <div className="flex flex-col gap-5">
          {occupancyStats.map((item) => (
            <div key={item.sport} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900 text-sm">{item.sport}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{item.bookingsCount} turnos reservados</span>
                  <span className="font-extrabold text-emerald-700">${item.revenue.toLocaleString('es-AR')}</span>
                  <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                    {item.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/60">
                <div
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de Torneos Activos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-4">Resumen Financiero de Torneos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3 font-semibold">Torneo</th>
                <th className="pb-3 font-semibold">Deporte</th>
                <th className="pb-3 text-center font-semibold">Equipos</th>
                <th className="pb-3 text-center font-semibold">Inscripción / Equipo</th>
                <th className="pb-3 text-center font-semibold">Recaudación Inscripciones</th>
                <th className="pb-3 text-right font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tournaments.map((t) => (
                <tr key={t.id} className="text-slate-600 hover:bg-slate-50">
                  <td className="py-3 font-bold text-slate-900">{t.name}</td>
                  <td className="py-3">{t.sport}</td>
                  <td className="py-3 text-center font-mono">{(t.registeredTeams || []).length} / {t.maxTeams || 8}</td>
                  <td className="py-3 text-center">${Number(t.entryFee || 0).toLocaleString('es-AR')}</td>
                  <td className="py-3 text-center font-bold text-emerald-700">
                    ${((t.registeredTeams || []).length * Number(t.entryFee || 0)).toLocaleString('es-AR')}
                  </td>
                  <td className="py-3 text-right">
                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReportes;
