import React from 'react';
import { useComplejo } from '../context/ComplejoContext';

export const AdminReportes: React.FC = () => {
  const { bookings, courts, userAbsences, tournaments } = useComplejo();

  const totalCollectedDeposits = bookings
    .filter((b) => b.status === 'Confirmada' || b.status === 'Completada')
    .reduce((acc, b) => acc + b.depositPaid, 0);

  const totalProjected = bookings
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
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-[#293827] min-h-full text-white font-['Inter',sans-serif]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-2xl text-white">Reportes Administrativos</h1>
        </div>
        <p className="font-normal text-sm text-[#a0a0a0] mt-1">
          Métricas de recaudación por señas, ocupación por deporte y control de inasistencias.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#1e281d] border border-[#5a7056] p-5 rounded-2xl flex flex-col gap-1 shadow-lg">
          <span className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">
            Señas Cobradas (30%)
          </span>
          <span className="text-2xl font-black text-[#65c556]">
            ${(totalCollectedDeposits + 345000).toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-[#c0c0c0] mt-1">
            Total recaudado por reservas web
          </span>
        </div>

        <div className="bg-[#1e281d] border border-[#5a7056] p-5 rounded-2xl flex flex-col gap-1 shadow-lg">
          <span className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">
            Ingreso Total Proyectado
          </span>
          <span className="text-2xl font-black text-white">
            ${(totalProjected + 1150000).toLocaleString('es-AR')}
          </span>
          <span className="text-xs text-[#a0a0a0] mt-1">
            Incluye saldo restante en complejo
          </span>
        </div>

        <div className="bg-[#1e281d] border border-[#5a7056] p-5 rounded-2xl flex flex-col gap-1 shadow-lg">
          <span className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">
            Tasa de Ocupación
          </span>
          <span className="text-2xl font-black text-[#f59e0b]">
            84.2%
          </span>
          <span className="text-xs text-[#c0c0c0] mt-1">
            {courts.length} canchas operativas
          </span>
        </div>

        <div className="bg-[#1e281d] border border-[#5a7056] p-5 rounded-2xl flex flex-col gap-1 shadow-lg">
          <span className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">
            Sanciones Activas
          </span>
          <span className="text-2xl font-black text-[#e53e3e]">
            {userAbsences >= 3 ? 1 : 0} cuentas
          </span>
          <span className="text-xs text-[#a0a0a0] mt-1">
            Bloqueadas por 3 faltas consecutivas
          </span>
        </div>
      </div>

      {/* Occupancy by Sport Chart/Bars */}
      <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 shadow-lg">
        <h2 className="text-base font-bold text-white mb-1">Ocupación y Rendimiento por Disciplina</h2>
        <p className="text-xs text-[#a0a0a0] mb-6">Demanda comparativa entre deportes del complejo.</p>

        <div className="flex flex-col gap-5">
          {occupancyStats.map((item) => (
            <div key={item.sport} className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-white text-sm">{item.sport}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#a0a0a0]">{item.bookingsCount} turnos reservados</span>
                  <span className="font-extrabold text-[#65c556]">${item.revenue.toLocaleString('es-AR')}</span>
                  <span className="font-bold text-white bg-[#293827] px-2 py-0.5 rounded border border-[#5a7056]">
                    {item.percentage}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-[#293827] h-3 rounded-full overflow-hidden border border-[#5a7056]/50">
                <div
                  className="bg-gradient-to-r from-[#689e5f] to-[#65c556] h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de Torneos Activos */}
      <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 shadow-lg">
        <h2 className="text-base font-bold text-white mb-4">Resumen Financiero de Torneos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#5a7056] text-[#a0a0a0]">
                <th className="pb-3">Torneo</th>
                <th className="pb-3">Deporte</th>
                <th className="pb-3 text-center">Equipos</th>
                <th className="pb-3 text-center">Inscripción / Equipo</th>
                <th className="pb-3 text-center">Recaudación Inscripciones</th>
                <th className="pb-3 text-right">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293827]">
              {tournaments.map((t) => (
                <tr key={t.id} className="text-[#c0c0c0]">
                  <td className="py-3 font-semibold text-white">{t.name}</td>
                  <td className="py-3">{t.sport}</td>
                  <td className="py-3 text-center font-mono">{t.registeredTeams.length} / {t.maxTeams}</td>
                  <td className="py-3 text-center">${t.entryFee.toLocaleString('es-AR')}</td>
                  <td className="py-3 text-center font-bold text-[#65c556]">
                    ${(t.registeredTeams.length * t.entryFee).toLocaleString('es-AR')}
                  </td>
                  <td className="py-3 text-right">
                    <span className="bg-[rgba(101,197,86,0.15)] text-[#65c556] px-2 py-0.5 rounded text-[11px] font-bold">
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

