import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { IconAlert, IconCheck, IconTrophy, IconCalendar } from '../components/Icons';

interface AgendaRow {
  hour: string;
  c1: { text: string; client?: string; occupied: boolean; absent?: boolean; attended?: boolean; tournament?: boolean };
  c2: { text: string; client?: string; occupied: boolean; absent?: boolean; attended?: boolean; tournament?: boolean };
  c3: { text: string; client?: string; occupied: boolean; absent?: boolean; attended?: boolean; tournament?: boolean };
  c4: { text: string; client?: string; occupied: boolean; absent?: boolean; attended?: boolean; tournament?: boolean };
}

const INITIAL_SCHEDULE: AgendaRow[] = [
  {
    hour: '17:00 hs',
    c1: { text: 'Reservado (Martínez)', client: 'Tomás Martínez', occupied: true },
    c2: { text: 'Disponible', occupied: false },
    c3: { text: 'Reservado (Clase Tenis)', client: 'Mariano Zabaleta', occupied: true },
    c4: { text: 'Mantenimiento (Redes)', occupied: false }
  },
  {
    hour: '18:00 hs',
    c1: { text: 'Torneo Oficial UB (Fecha 1)', occupied: true, tournament: true },
    c2: { text: 'Torneo Oficial UB (Fecha 1)', occupied: true, tournament: true },
    c3: { text: 'Disponible', occupied: false },
    c4: { text: 'Mantenimiento (Luminaria)', occupied: false }
  },
  {
    hour: '19:00 hs',
    c1: { text: 'Torneo Oficial UB (Fecha 1)', occupied: true, tournament: true },
    c2: { text: 'Torneo Oficial UB (Fecha 1)', occupied: true, tournament: true },
    c3: { text: 'Reservado (Pádel Cristal)', client: 'Lucas Gómez', occupied: true },
    c4: { text: 'Disponible', occupied: false }
  },
  {
    hour: '20:00 hs',
    c1: { text: 'Reservado (Juan Pérez)', client: 'Juan Pérez', occupied: true },
    c2: { text: 'Reservado (Sánchez)', client: 'Martín Sánchez', occupied: true },
    c3: { text: 'Disponible', occupied: false },
    c4: { text: 'Disponible', occupied: false }
  },
  {
    hour: '21:00 hs',
    c1: { text: 'Reservado (FC Stars)', client: 'Tomás Norjean', occupied: true },
    c2: { text: 'Disponible', occupied: false },
    c3: { text: 'Reservado (Final Pádel)', client: 'Nicolás Marco', occupied: true },
    c4: { text: 'Disponible', occupied: false }
  }
];

export const AdminAgenda: React.FC = () => {
  const { markAbsence, confirmarAsistencia, userAbsences, isUserBanned } = useComplejo();
  const [rows, setRows] = useState<AgendaRow[]>(INITIAL_SCHEDULE);
  const [weekendTournamentActive, setWeekendTournamentActive] = useState(true);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  const notify = (text: string, type: 'success' | 'warn' = 'warn') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3800);
  };

  const handleMarkAbsent = (hour: string, courtKey: 'c1' | 'c2' | 'c3' | 'c4', clientName: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.hour === hour) {
          return {
            ...r,
            [courtKey]: {
              ...r[courtKey],
              absent: true,
              attended: false,
              text: `Inasistencia (${clientName})`
            }
          };
        }
        return r;
      })
    );
    markAbsence(clientName, `Cancha ${courtKey.toUpperCase()}`);
    notify(`Inasistencia registrada para ${clientName}. Faltas consecutivas: ${Math.min(userAbsences + 1, 3)}/3`, 'warn');
  };

  const handleConfirmAttendance = async (hour: string, courtKey: 'c1' | 'c2' | 'c3' | 'c4', clientName: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.hour === hour) {
          return {
            ...r,
            [courtKey]: {
              ...r[courtKey],
              attended: true,
              absent: false,
              text: `Asistió (${clientName})`
            }
          };
        }
        return r;
      })
    );
    await confirmarAsistencia('1');
    notify(`Asistencia confirmada para ${clientName}. Contador de inasistencias consecutivas reiniciado a 0.`, 'success');
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-[#293827] min-h-full text-white font-['Inter',sans-serif]">
      {toastMsg && (
        <div
          className={`fixed top-14 right-6 z-50 bg-[#1e281d] border-2 ${
            toastMsg.type === 'success' ? 'border-[#65c556] text-[#65c556]' : 'border-[#f59e0b] text-[#f59e0b]'
          } px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md`}
        >
          {toastMsg.type === 'success' ? (
            <IconCheck size={18} className="shrink-0 text-white" />
          ) : (
            <IconAlert size={18} className="shrink-0 text-white" />
          )}
          <span className="text-xs font-bold">{toastMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <IconCalendar size={24} className="text-[#65c556] shrink-0" />
            <h1 className="font-bold text-2xl text-white">Agenda Diaria de Turnos</h1>
          </div>
          <p className="font-normal text-sm text-[#a0a0a0] mt-1">
            Control de disponibilidad, inasistencias reiteradas y bloqueo por torneos de fin de semana.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Absences Counter Live Badge */}
          <div className="flex items-center gap-2 bg-[#1e281d] border border-[#5a7056] px-3.5 py-2 rounded-xl text-xs">
            <span className="text-neutral-400">Faltas Juan Pérez:</span>
            <span
              className={`font-black px-2 py-0.5 rounded-full ${
                userAbsences >= 3
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : userAbsences > 0
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {userAbsences} / 3 consecutivas
            </span>
          </div>

          {/* Weekend Tournament Switcher */}
          <div className="flex items-center gap-3 bg-[#1e281d] border border-[#5a7056] px-4 py-2 rounded-xl">
            <span className="text-xs font-semibold text-[#c0c0c0]">
              Torneo Fin de Semana:
            </span>
            <button
              type="button"
              onClick={() => {
                setWeekendTournamentActive(!weekendTournamentActive);
                notify(
                  !weekendTournamentActive
                    ? 'Fin de semana con torneo: Canchas 1 y 2 bloqueadas para reservas comunes.'
                    : 'Sin torneos: Horarios de fin de semana liberados para reservas normales.',
                  'warn'
                );
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                weekendTournamentActive
                  ? 'bg-[#65c556] text-[#293827] border-[#65c556]'
                  : 'bg-[#293827] text-[#a0a0a0] border-[#5a7056]'
              }`}
            >
              {weekendTournamentActive ? '✓ Torneo Activo (Bloqueo)' : '✕ Sin Torneo (Libre)'}
            </button>
          </div>
        </div>
      </div>

      {/* User Suspension Alert */}
      {isUserBanned && (
        <div className="bg-[rgba(229,62,62,0.15)] border-2 border-[#e53e3e] rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <IconAlert size={24} className="text-[#e53e3e] shrink-0" />
            <div>
              <p className="font-bold text-sm text-[#e53e3e]">
                Sanción Activa por Inasistencias Consecutivas
              </p>
              <p className="text-xs text-[#c0c0c0]">
                El usuario demo Juan Pérez ha alcanzado <strong>3 inasistencias consecutivas</strong>. Cuenta suspendida por 14 días. Tras la aplicación de la sanción, el contador se restableció a 0.
              </p>
            </div>
          </div>
          <span className="bg-[#e53e3e] text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
            Suspendido
          </span>
        </div>
      )}

      {/* Weekend tournament notice badge */}
      {weekendTournamentActive && (
        <div className="bg-[rgba(245,158,11,0.15)] border border-[#f59e0b] rounded-xl p-3 flex items-start sm:items-center gap-3 text-xs text-[#f59e0b] shadow-md">
          <IconTrophy size={18} className="shrink-0 mt-0.5 sm:mt-0 text-[#f59e0b]" />
          <span className="leading-relaxed">
            <strong className="font-bold">Torneo Activo:</strong> El sistema detectó torneos programados para este fin de semana. Las reservas comunes quedan deshabilitadas en horarios asignados al fixture.
          </span>
        </div>
      )}

      {/* Grid of schedule */}
      <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#5a7056] text-[#a0a0a0] bg-[#293827]">
                <th className="py-3 px-4 font-bold">HORA</th>
                <th className="py-3 px-4 font-bold">Cancha 1 (Fútbol 5)</th>
                <th className="py-3 px-4 font-bold">Cancha 2 (Fútbol 5 Pro)</th>
                <th className="py-3 px-4 font-bold">Pádel Cristal 1</th>
                <th className="py-3 px-4 font-bold">Tenis Polvo Ladrillo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293827]">
              {rows.map((row) => (
                <tr key={row.hour} className="hover:bg-[#293827]/30 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-[#65c556] whitespace-nowrap">
                    {row.hour}
                  </td>

                  {(['c1', 'c2', 'c3', 'c4'] as const).map((colKey) => {
                    const slot = row[colKey];
                    return (
                      <td key={colKey} className="py-4 px-4 min-w-[220px]">
                        <div
                          className={`p-3 rounded-xl border flex flex-col gap-2 ${
                            slot.tournament
                              ? 'bg-[rgba(245,158,11,0.12)] border-[#f59e0b]/40 text-[#f59e0b]'
                              : slot.absent
                              ? 'bg-[rgba(229,62,62,0.15)] border-[#e53e3e] text-[#e53e3e]'
                              : slot.attended
                              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                              : slot.occupied
                              ? 'bg-[rgba(101,197,86,0.12)] border-[#65c556]/40 text-white'
                              : slot.text.includes('Mantenimiento')
                              ? 'bg-[rgba(160,160,160,0.1)] border-gray-600 text-gray-400'
                              : 'bg-[#293827] border-[#5a7056] text-[#65c556]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs">{slot.text}</span>
                            {slot.occupied && !slot.tournament && !slot.absent && (
                              <span className="size-2 rounded-full bg-[#65c556]" />
                            )}
                          </div>

                          {/* Action buttons: confirm attendance or mark absence */}
                          {slot.occupied && !slot.tournament && !slot.absent && !slot.attended && slot.client && (
                            <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-[#5a7056]/30">
                              <button
                                type="button"
                                onClick={() => handleConfirmAttendance(row.hour, colKey, slot.client!)}
                                className="inline-flex items-center gap-1 text-[11px] text-[#65c556] hover:bg-[#65c556]/20 px-2 py-0.5 rounded cursor-pointer transition-colors bg-transparent border border-[#65c556]/30 font-semibold"
                                title="Registra asistencia y resetea a 0 las faltas consecutivas"
                              >
                                <IconCheck size={12} className="text-[#65c556] shrink-0" />
                                Asistió
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkAbsent(row.hour, colKey, slot.client!)}
                                className="inline-flex items-center gap-1 text-[11px] text-[#e53e3e] hover:bg-[#e53e3e]/20 px-2 py-0.5 rounded cursor-pointer transition-colors bg-transparent border border-[#e53e3e]/30 font-semibold"
                                title="Si acumula 3 faltas consecutivas se suspende por 14 días"
                              >
                                <IconAlert size={12} className="text-[#e53e3e] shrink-0" />
                                Inasistencia
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


export default AdminAgenda;
