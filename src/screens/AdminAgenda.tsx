import React, { useState, useMemo, useEffect } from 'react';
import { useComplejo, type BookingItem } from '../context/ComplejoContext';
import {
  IconCalendar,
  IconClock,
  IconCheck,
  IconAlert,
  IconTrophy,
  IconBall,
  IconRefresh,
  IconArrowLeft,
  IconArrowRight
} from '../components/Icons';
import {
  getQuickDatesBuenosAires,
  formatDateSpanish,
  addDaysToDate,
  getDayOfWeekFromDateStr,
  normalizeBookingDate
} from '../utils/dateUtils';

const ALL_HOURS = [
  '09:00 hs',
  '10:00 hs',
  '11:00 hs',
  '12:00 hs',
  '13:00 hs',
  '14:00 hs',
  '15:00 hs',
  '16:00 hs',
  '17:00 hs',
  '18:00 hs',
  '19:00 hs',
  '20:00 hs',
  '21:00 hs',
  '22:00 hs',
  '23:00 hs'
];

export const AdminAgenda: React.FC = () => {
  const {
    courts,
    bookings,
    sharedBookings,
    courtAvailability,
    fetchAvailabilityForDate,
    fixtures,
    refreshAllData,
    confirmarAsistencia,
    markAbsence,
    userAbsences,
    isUserBanned
  } = useComplejo();

  const { today: todayStr, tomorrow: tomorrowStr, saturday: saturdayStr, sunday: sundayStr } = useMemo(
    () => getQuickDatesBuenosAires(),
    []
  );

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSport, setSelectedSport] = useState<string>('Todos');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'evening'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  useEffect(() => {
    fetchAvailabilityForDate(selectedDate);
  }, [selectedDate, fetchAvailabilityForDate]);

  const notify = (text: string, type: 'success' | 'warn' = 'warn') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3800);
  };

  const dayOfWeek = useMemo(() => getDayOfWeekFromDateStr(selectedDate), [selectedDate]);
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const formattedSelectedDate = useMemo(() => formatDateSpanish(selectedDate), [selectedDate]);

  const handleStepDay = (step: number) => {
    setSelectedDate((prev) => addDaysToDate(prev, step));
  };

  const filteredCourts = useMemo(() => {
    if (selectedSport === 'Todos') return courts;
    return courts.filter((c) => c.sport === selectedSport);
  }, [courts, selectedSport]);

  const displayedHours = useMemo(() => {
    return ALL_HOURS.filter((h) => {
      const hourNum = parseInt(h.split(':')[0], 10);
      if (shiftFilter === 'morning') return hourNum >= 9 && hourNum < 17;
      if (shiftFilter === 'evening') return hourNum >= 17;
      return true;
    });
  }, [shiftFilter]);

  const weekendMatchesForDate = useMemo(() => {
    return fixtures.filter((f) => normalizeBookingDate(f.date) === selectedDate && !f.isFreeDate);
  }, [fixtures, selectedDate]);

  const allActiveBookings = useMemo(() => {
    const map = new Map<string, BookingItem>();
    for (const b of sharedBookings) {
      if (b.status !== 'Cancelada') {
        map.set(`${b.courtName.toLowerCase()}_${normalizeBookingDate(b.date)}_${b.time.slice(0, 5)}`, b);
      }
    }
    for (const b of bookings) {
      if (b.status !== 'Cancelada') {
        map.set(`${b.courtName.toLowerCase()}_${normalizeBookingDate(b.date)}_${b.time.slice(0, 5)}`, b);
      }
    }
    return Array.from(map.values());
  }, [bookings, sharedBookings]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllData('admin');
      await fetchAvailabilityForDate(selectedDate);
      notify('Agenda sincronizada con MySQL exitosamente.', 'success');
    } catch {
      notify('Error al sincronizar con el servidor.', 'warn');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleConfirmAttendance = async (booking: BookingItem) => {
    try {
      await confirmarAsistencia(booking.id);
      await refreshAllData('admin');
      notify(`Asistencia confirmada para ${booking.clientName}.`, 'success');
    } catch (err: any) {
      notify(`Error al registrar asistencia: ${err?.message || 'Error inesperado'}`, 'warn');
    }
  };

  const handleMarkAbsent = async (booking: BookingItem) => {
    try {
      await markAbsence(booking.clientName, booking.courtName, booking.id);
      await refreshAllData('admin');
      notify(`Inasistencia registrada para ${booking.clientName}.`, 'warn');
    } catch (err: any) {
      notify(`Error al registrar inasistencia: ${err?.message || 'Error inesperado'}`, 'warn');
    }
  };

  const getSlotDetails = (courtName: string, courtId: string, hour: string) => {
    const cleanHour = hour.replace(' hs', '').trim().slice(0, 5);
    const numericId = String(parseInt(String(courtId).replace(/\D/g, ''), 10) || 1);

    const matchOnCourt = fixtures.find(
      (m) =>
        !m.isFreeDate &&
        normalizeBookingDate(m.date) === selectedDate &&
        m.time?.slice(0, 5) === cleanHour &&
        (m.court === courtName || courtName.includes(m.court) || m.court.includes(courtName))
    );

    if (matchOnCourt) {
      return {
        type: 'tournament' as const,
        title: `${matchOnCourt.homeTeam} vs ${matchOnCourt.awayTeam}`,
        subtitle: `${matchOnCourt.round || 'Torneo Oficial'} · Árb: ${matchOnCourt.refereeName || 'Sin designar'}`,
        match: matchOnCourt
      };
    }

    const bookingOnCourt = allActiveBookings.find(
      (b) =>
        normalizeBookingDate(b.date) === selectedDate &&
        b.time?.slice(0, 5) === cleanHour &&
        (b.courtId === courtId || b.courtId === numericId || b.courtName === courtName || courtName.includes(b.courtName) || b.courtName.includes(courtName)) &&
        b.status !== 'Cancelada'
    );

    if (bookingOnCourt) {
      return {
        type: 'booking' as const,
        booking: bookingOnCourt,
        isAttended: bookingOnCourt.asistencia_confirmada === true || bookingOnCourt.rawStatus === 'FINALIZADA' || bookingOnCourt.status === 'Completada',
        isAbsent: bookingOnCourt.asistencia_confirmada === false || bookingOnCourt.rawStatus === 'INASISTENCIA'
      };
    }

    const dispSlot =
      courtAvailability[`${courtId}_${selectedDate}`]?.[cleanHour] ||
      courtAvailability[`${numericId}_${selectedDate}`]?.[cleanHour] ||
      courtAvailability[`${courtName.toLowerCase()}_${selectedDate}`]?.[cleanHour];

    if (dispSlot?.estado === 'Ocupado' && dispSlot.motivo !== 'Horario concluido') {
      const syntheticBooking: BookingItem = {
        id: `db-${numericId}-${cleanHour}`,
        courtId,
        courtName,
        sport: 'Fútbol 5',
        date: selectedDate,
        time: `${cleanHour} hs`,
        totalPrice: 18000,
        depositPaid: 5400,
        remainingBalance: 12600,
        status: 'Confirmada',
        hoursUntilMatch: 24,
        clientName: 'Reserva Confirmada (BD)',
        clientEmail: ''
      };
      return {
        type: 'booking' as const,
        booking: syntheticBooking,
        isAttended: false,
        isAbsent: false
      };
    }

    return {
      type: 'free' as const,
      title: 'Disponible'
    };
  };

  const dayStats = useMemo(() => {
    let bookedCount = 0;
    let tournamentCount = 0;
    let freeCount = 0;

    for (const court of filteredCourts) {
      for (const h of displayedHours) {
        const slot = getSlotDetails(court.name, court.id, h);
        if (slot.type === 'booking') bookedCount++;
        else if (slot.type === 'tournament') tournamentCount++;
        else freeCount++;
      }
    }
    return { bookedCount, tournamentCount, freeCount, total: filteredCourts.length * displayedHours.length };
  }, [filteredCourts, displayedHours, selectedDate, allActiveBookings, fixtures, courtAvailability]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 min-h-full text-slate-900 font-['Inter',sans-serif]">
      {toastMsg && (
        <div
          className={`fixed top-16 right-6 z-50 bg-slate-900 border ${
            toastMsg.type === 'success' ? 'border-emerald-500/50 text-emerald-400' : 'border-amber-500/50 text-amber-400'
          } px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in`}
        >
          {toastMsg.type === 'success' ? (
            <IconCheck size={18} className="shrink-0" />
          ) : (
            <IconAlert size={18} className="shrink-0" />
          )}
          <span className="text-xs font-bold text-white">{toastMsg.text}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <IconCalendar size={20} />
            </div>
            <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">
              Agenda Diaria y Gestión Operativa
            </h1>
          </div>
          <p className="font-normal text-xs text-slate-500 mt-1 capitalize">
            {formattedSelectedDate} · Sincronizado en tiempo real con MySQL
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-3.5 py-2 rounded-xl text-xs shadow-xs">
            <span className="text-slate-500">Faltas consecutivas:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-full border ${
                userAbsences >= 3
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : userAbsences > 0
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {userAbsences} / 3
            </span>
          </div>

          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <IconRefresh size={14} className={isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-600'} />
            <span>{isRefreshing ? 'Actualizando...' : 'Recargar MySQL'}</span>
          </button>
        </div>
      </div>

      {isUserBanned && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <IconAlert size={20} className="text-red-600 shrink-0" />
            <div>
              <p className="font-bold text-sm text-red-800">
                Usuario Sancionado por Inasistencias Consecutivas (3/3)
              </p>
              <p className="text-xs text-red-600/90 mt-0.5 leading-relaxed">
                El usuario ha acumulado 3 inasistencias sin previo aviso. Cuenta suspendida por 14 días.
              </p>
            </div>
          </div>
          <span className="bg-red-600 text-white text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shrink-0">
            Suspendido
          </span>
        </div>
      )}

      {isWeekend && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start sm:items-center gap-3.5 text-xs text-amber-900">
          <div className="size-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
            <IconTrophy size={16} />
          </div>
          <div className="flex-1 leading-relaxed">
            <strong className="font-bold text-amber-950">Torneos de Fin de Semana: </strong>
            {weekendMatchesForDate.length > 0 ? (
              <span>
                Se detectaron <strong>{weekendMatchesForDate.length} partidos oficiales</strong> para este {dayOfWeek === 6 ? 'Sábado' : 'Domingo'}.
                Los horarios libres permanecen habilitados para reservas normales.
              </span>
            ) : (
              <span>
                Este fin de semana no cuenta con fixture programado en esta fecha. Todas las canchas se encuentran liberadas.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-wider mr-1">
              <IconCalendar size={15} className="text-emerald-600" />
              <span>Fecha:</span>
            </span>

            {[
              { label: 'Hoy', val: todayStr },
              { label: 'Mañana', val: tomorrowStr },
              { label: 'Sábado', val: saturdayStr },
              { label: 'Domingo', val: sundayStr },
            ].map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setSelectedDate(d.val)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                  selectedDate === d.val
                    ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                {d.label}
              </button>
            ))}

            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => handleStepDay(-1)}
                className="p-1 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                title="Día anterior"
              >
                <IconArrowLeft size={13} />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-slate-800 outline-none cursor-pointer font-mono font-semibold"
              />
              <button
                type="button"
                onClick={() => handleStepDay(1)}
                className="p-1 text-slate-500 hover:text-slate-900 transition cursor-pointer"
                title="Día siguiente"
              >
                <IconArrowRight size={13} />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-1">
              <IconClock size={15} className="text-emerald-600" />
              <span>Turno:</span>
            </span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
              {[
                { id: 'all', label: 'Todos (09-23 hs)' },
                { id: 'morning', label: 'Mañana (09-16 hs)' },
                { id: 'evening', label: 'Tarde/Noche (17-23 hs)' },
              ].map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => setShiftFilter(sh.id as any)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    shiftFilter === sh.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sh.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1.5">
            <IconBall size={15} className="text-emerald-600" />
            <span>Deporte:</span>
          </span>
          {['Todos', 'Fútbol 5', 'Fútbol 8', 'Fútbol 11', 'Pádel', 'Tenis'].map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                selectedSport === sport
                  ? 'bg-[#199e1b] text-white border-[#199e1b] font-bold shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
              }`}
            >
              {sport} {sport === 'Todos' ? `(${courts.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Canchas Filtradas</span>
          <span className="text-2xl font-extrabold text-slate-900">{filteredCourts.length}</span>
          <span className="text-[11px] text-slate-500">{displayedHours.length} franjas horarias</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase">Turnos Reservados</span>
          <span className="text-2xl font-extrabold text-emerald-700">{dayStats.bookedCount}</span>
          <span className="text-[11px] text-slate-500">Clientes confirmados</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
          <span className="text-[11px] font-bold text-amber-600 uppercase">Partidos Torneo</span>
          <span className="text-2xl font-extrabold text-amber-600">{dayStats.tournamentCount}</span>
          <span className="text-[11px] text-slate-500">Fixture oficial</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 shadow-xs">
          <span className="text-[11px] font-bold text-sky-600 uppercase">Turnos Libres</span>
          <span className="text-2xl font-extrabold text-sky-600">{dayStats.freeCount}</span>
          <span className="text-[11px] text-slate-500">Disponibles para reserva</span>
        </div>
      </div>

      {/* Grilla Operativa */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50">
                <th className="py-3.5 px-4 font-bold tracking-wider sticky left-0 bg-slate-50 z-20 border-r border-slate-200 min-w-[110px]">
                  HORARIO
                </th>
                {filteredCourts.map((c) => (
                  <th key={c.id} className="py-3.5 px-4 font-bold min-w-[230px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-slate-900 text-xs">{c.name}</span>
                      <span className="text-[10px] font-semibold text-emerald-700">
                        {c.sport} · ${c.pricePerHour.toLocaleString()}/h
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedHours.map((hour) => (
                <tr key={hour} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-4 font-mono font-bold text-slate-700 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-slate-100">
                    {hour}
                  </td>

                  {filteredCourts.map((court) => {
                    const slot = getSlotDetails(court.name, court.id, hour);

                    if (slot.type === 'tournament') {
                      return (
                        <td key={court.id} className="py-3 px-3 min-w-[230px]">
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex flex-col gap-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-amber-900 text-xs truncate flex items-center gap-1">
                                <IconTrophy size={13} className="text-amber-600 shrink-0" />
                                <span className="truncate">{slot.title}</span>
                              </span>
                              <span className="bg-amber-200 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
                                Torneo
                              </span>
                            </div>
                            <span className="text-[11px] text-amber-800/80 font-medium">
                              {slot.subtitle}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    if (slot.type === 'booking') {
                      const b = slot.booking;
                      return (
                        <td key={court.id} className="py-3 px-3 min-w-[230px]">
                          <div
                            className={`rounded-xl p-3 border flex flex-col gap-2 ${
                              slot.isAttended
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : slot.isAbsent
                                ? 'bg-red-50 border-red-200 text-red-900'
                                : 'bg-sky-50/70 border-sky-200 text-slate-900'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-slate-900 truncate max-w-[165px]" title={b.clientName}>
                                  {b.clientName}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  Reserva #{b.id} · Seña: ${b.depositPaid?.toLocaleString()}
                                </span>
                              </div>

                              {slot.isAttended ? (
                                <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                  Asistió
                                </span>
                              ) : slot.isAbsent ? (
                                <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                                  Inasistencia
                                </span>
                              ) : (
                                <span className="size-2 rounded-full bg-emerald-500 shrink-0 mt-1" />
                              )}
                            </div>

                            {!slot.isAttended && !slot.isAbsent && !String(b.id).startsWith('db-') && (
                              <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200/60">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmAttendance(b)}
                                  className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <IconCheck size={11} />
                                  <span>Asistió</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMarkAbsent(b)}
                                  className="flex-1 py-1 px-2 rounded-lg bg-white hover:bg-red-50 text-red-600 border border-red-200 text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
                                >
                                  <IconAlert size={11} />
                                  <span>Inasistió</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={court.id} className="py-3 px-3 min-w-[230px]">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-400">Disponible</span>
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md font-bold">
                            Libre
                          </span>
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
