import React, { useState, useMemo } from 'react';
import { useComplejo, type BookingItem } from '../context/ComplejoContext';
import {
  IconCalendar,
  IconClock,
  IconCheck,
  IconAlert,
  IconTrophy,
  IconBall
} from '../components/Icons';

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
    fixtures,
    refreshAllData,
    confirmarAsistencia,
    markAbsence,
    userAbsences,
    isUserBanned
  } = useComplejo();

  // Fechas dinámicas de referencia
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);
  const saturdayStr = useMemo(() => {
    const d = new Date();
    const diff = (6 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }, []);
  const sundayStr = useMemo(() => {
    const d = new Date();
    const diff = (7 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  }, []);

  // Filtros de fecha, deporte y franja horaria
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedSport, setSelectedSport] = useState<string>('Todos');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'evening'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'warn' } | null>(null);

  const notify = (text: string, type: 'success' | 'warn' = 'warn') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3800);
  };

  // Cálculo de día de la semana
  const dateObj = useMemo(() => new Date(selectedDate + 'T00:00:00'), [selectedDate]);
  const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Formato en español para el título
  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  // Navegación día anterior / posterior
  const handleStepDay = (step: number) => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + step);
      setSelectedDate(d.toISOString().split('T')[0]);
    } catch {
      // ignore
    }
  };

  // Filtrado de canchas
  const filteredCourts = useMemo(() => {
    if (selectedSport === 'Todos') return courts;
    return courts.filter((c) => c.sport === selectedSport);
  }, [courts, selectedSport]);

  // Filtrado de franjas horarias
  const displayedHours = useMemo(() => {
    return ALL_HOURS.filter((h) => {
      const hourNum = parseInt(h.split(':')[0], 10);
      if (shiftFilter === 'morning') return hourNum >= 9 && hourNum < 17;
      if (shiftFilter === 'evening') return hourNum >= 17;
      return true;
    });
  }, [shiftFilter]);

  // Torneos del día seleccionado
  const weekendMatchesForDate = useMemo(() => {
    return fixtures.filter((f) => f.date === selectedDate && !f.isFreeDate);
  }, [fixtures, selectedDate]);

  // Sincronización manual en vivo con MySQL
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshAllData('admin');
      notify('Agenda sincronizada con MySQL exitosamente.', 'success');
    } catch (err: any) {
      notify('Error al sincronizar con el servidor.', 'warn');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Confirmar asistencia en MySQL
  const handleConfirmAttendance = async (booking: BookingItem) => {
    try {
      await confirmarAsistencia(booking.id);
      await refreshAllData('admin');
      notify(`Asistencia confirmada para ${booking.clientName}. Se resetean inasistencias consecutivas.`, 'success');
    } catch (err: any) {
      notify(`Error al registrar asistencia: ${err?.message || 'Error inesperado'}`, 'warn');
    }
  };

  // Registrar inasistencia en MySQL
  const handleMarkAbsent = async (booking: BookingItem) => {
    try {
      await markAbsence(booking.clientName, booking.courtName, booking.id);
      await refreshAllData('admin');
      notify(`Inasistencia registrada para ${booking.clientName}. Penalización computada en MySQL.`, 'warn');
    } catch (err: any) {
      notify(`Error al registrar inasistencia: ${err?.message || 'Error inesperado'}`, 'warn');
    }
  };

  // Verificación de disponibilidad de cada celda
  const getSlotDetails = (courtName: string, courtId: string, hour: string) => {
    const cleanHour = hour.replace(' hs', '').trim();

    // 1. Torneo Oficial asignado a esta cancha y hora en MySQL
    const matchOnCourt = fixtures.find(
      (m) =>
        !m.isFreeDate &&
        m.date === selectedDate &&
        m.time?.slice(0, 5) === cleanHour &&
        (m.court === courtName || courtName.includes(m.court) || m.court.includes(courtName))
    );

    if (matchOnCourt) {
      return {
        type: 'tournament' as const,
        title: `🏆 ${matchOnCourt.homeTeam} vs ${matchOnCourt.awayTeam}`,
        subtitle: `${matchOnCourt.round || 'Torneo Oficial'} • Árb: ${matchOnCourt.refereeName || 'Sin designar'}`,
        match: matchOnCourt
      };
    }

    // 2. Reserva registrada en MySQL para esta cancha y hora
    const bookingOnCourt = bookings.find(
      (b) =>
        b.date === selectedDate &&
        b.time?.slice(0, 5) === cleanHour &&
        (b.courtId === courtId || b.courtName === courtName || courtName.includes(b.courtName) || b.courtName.includes(courtName)) &&
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

    // 3. Celda libre y disponible
    return {
      type: 'free' as const,
      title: 'Disponible'
    };
  };

  // Métricas rápidas del día
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
  }, [filteredCourts, displayedHours, selectedDate, bookings, fixtures]);

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-[#293827] min-h-full text-white font-['Inter',sans-serif]">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-14 right-6 z-50 bg-[#1e281d] border-2 ${
            toastMsg.type === 'success' ? 'border-[#65c556] text-[#65c556]' : 'border-[#f59e0b] text-[#f59e0b]'
          } px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md animate-fadeIn`}
        >
          {toastMsg.type === 'success' ? (
            <IconCheck size={18} className="shrink-0 text-[#65c556]" />
          ) : (
            <IconAlert size={18} className="shrink-0 text-[#f59e0b]" />
          )}
          <span className="text-xs font-bold">{toastMsg.text}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#3b4d38] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-[rgba(101,197,86,0.15)] border border-[#65c556] flex items-center justify-center text-[#65c556]">
              <IconCalendar size={22} />
            </div>
            <h1 className="font-extrabold text-2xl text-white tracking-tight">
              Agenda Diaria y Gestión Operativa
            </h1>
          </div>
          <p className="font-normal text-xs text-[#a0a0a0] mt-1 capitalize">
            {formattedSelectedDate} • Sincronizado en tiempo real con MySQL
          </p>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Contador de Inasistencias */}
          <div className="flex items-center gap-2 bg-[#1e281d] border border-[#5a7056] px-3.5 py-2 rounded-xl text-xs shadow-sm">
            <span className="text-[#a0a0a0]">Faltas consecutivas:</span>
            <span
              className={`font-black px-2 py-0.5 rounded-full ${
                userAbsences >= 3
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : userAbsences > 0
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {userAbsences} / 3
            </span>
          </div>

          {/* Botón Sincronizar en Vivo */}
          <button
            type="button"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-3.5 py-2 rounded-xl bg-[#1e281d] hover:bg-[#344732] border border-[#5a7056] text-xs font-bold text-white transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            title="Recarga reservas y fixtures desde la base de datos MySQL"
          >
            <div className={`size-3.5 border-2 border-white border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Actualizando...' : 'Recargar MySQL'}</span>
          </button>
        </div>
      </div>

      {/* Alerta de Sanción si el usuario de prueba está suspendido */}
      {isUserBanned && (
        <div className="bg-[rgba(229,62,62,0.15)] border-2 border-[#e53e3e] rounded-2xl p-4 flex items-center justify-between gap-4 animate-fadeIn shadow-lg">
          <div className="flex items-center gap-3">
            <IconAlert size={24} className="text-[#e53e3e] shrink-0" />
            <div>
              <p className="font-bold text-sm text-[#e53e3e]">
                Usuario Sancionado por Inasistencias Consecutivas (3/3)
              </p>
              <p className="text-xs text-[#c0c0c0] mt-0.5 leading-relaxed">
                El usuario ha acumulado 3 inasistencias sin previo aviso. Cuenta suspendida por 14 días. Las reservas se encuentran bloqueadas.
              </p>
            </div>
          </div>
          <span className="bg-[#e53e3e] text-white text-[11px] font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider shrink-0">
            Suspendido
          </span>
        </div>
      )}

      {/* Regla de Negocio: Torneo de Fin de Semana */}
      {isWeekend && (
        <div className="bg-[rgba(245,158,11,0.12)] border border-[#f59e0b] rounded-2xl p-4 flex items-start sm:items-center gap-3.5 text-xs text-[#f59e0b] shadow-md animate-fadeIn">
          <div className="size-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0 text-[#f59e0b]">
            <IconTrophy size={18} />
          </div>
          <div className="flex-1 leading-relaxed">
            <strong className="font-bold text-white">Regla de Negocio (Torneos de Fin de Semana): </strong>
            {weekendMatchesForDate.length > 0 ? (
              <span>
                Se detectaron <strong>{weekendMatchesForDate.length} partidos oficiales</strong> para este {dayOfWeek === 6 ? 'Sábado' : 'Domingo'}.
                Las canchas y horarios asignados al torneo quedan reservadas para los equipos. <strong>Las canchas e intervalos libres permanecen 100% habilitados</strong> para reservas normales de clientes.
              </span>
            ) : (
              <span>
                Este fin de semana no cuenta con fixture oficial programado en este día. <strong>Todas las canchas se encuentran liberadas</strong> para reservas comunes de clientes.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Barra de Filtros: Selector de Fecha + Turnos + Deportes */}
      <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Selector de Fechas Rápido y Personalizado */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#65c556] flex items-center gap-1.5 uppercase tracking-wider mr-1">
              <IconCalendar size={15} />
              Fecha:
            </span>

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedDate === todayStr
                  ? 'bg-[#65c556] text-[#293827] border-[#65c556] shadow-sm'
                  : 'bg-[#293827] text-[#c0c0c0] border-[#5a7056] hover:text-white'
              }`}
            >
              Hoy
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(tomorrowStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedDate === tomorrowStr
                  ? 'bg-[#65c556] text-[#293827] border-[#65c556] shadow-sm'
                  : 'bg-[#293827] text-[#c0c0c0] border-[#5a7056] hover:text-white'
              }`}
            >
              Mañana
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(saturdayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedDate === saturdayStr
                  ? 'bg-[#65c556] text-[#293827] border-[#65c556] shadow-sm'
                  : 'bg-[#293827] text-[#c0c0c0] border-[#5a7056] hover:text-white'
              }`}
            >
              Sábado
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(sundayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                selectedDate === sundayStr
                  ? 'bg-[#65c556] text-[#293827] border-[#65c556] shadow-sm'
                  : 'bg-[#293827] text-[#c0c0c0] border-[#5a7056] hover:text-white'
              }`}
            >
              Domingo
            </button>

            {/* Input Fecha Completo */}
            <div className="flex items-center gap-1 bg-[#293827] border border-[#5a7056] rounded-xl px-2 py-1">
              <button
                type="button"
                onClick={() => handleStepDay(-1)}
                className="px-2 py-0.5 text-xs text-[#a0a0a0] hover:text-white transition cursor-pointer"
                title="Día anterior"
              >
                ◀
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-white outline-none cursor-pointer font-mono"
              />
              <button
                type="button"
                onClick={() => handleStepDay(1)}
                className="px-2 py-0.5 text-xs text-[#a0a0a0] hover:text-white transition cursor-pointer"
                title="Día siguiente"
              >
                ▶
              </button>
            </div>
          </div>

          {/* Filtro por Franja Horaria (Turno Mañana vs Tarde/Noche) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#c0c0c0] flex items-center gap-1.5 mr-1">
              <IconClock size={15} />
              Turno:
            </span>
            <div className="inline-flex rounded-xl bg-[#293827] p-1 border border-[#5a7056]">
              <button
                type="button"
                onClick={() => setShiftFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  shiftFilter === 'all'
                    ? 'bg-[#65c556] text-[#293827] shadow-sm'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                Todos (09-23 hs)
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('morning')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  shiftFilter === 'morning'
                    ? 'bg-[#65c556] text-[#293827] shadow-sm'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                Mañana (09-16 hs)
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('evening')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  shiftFilter === 'evening'
                    ? 'bg-[#65c556] text-[#293827] shadow-sm'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                Tarde/Noche (17-23 hs)
              </button>
            </div>
          </div>
        </div>

        {/* Filtro por Deporte */}
        <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-[#3b4d38]">
          <span className="text-xs font-bold text-[#a0a0a0] mr-1 flex items-center gap-1.5">
            <IconBall size={15} />
            Deporte:
          </span>
          {['Todos', 'Fútbol 5', 'Fútbol 8', 'Fútbol 11', 'Pádel', 'Tenis'].map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer border ${
                selectedSport === sport
                  ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-sm'
                  : 'bg-[#293827] text-[#c0c0c0] border-[#5a7056] hover:text-white'
              }`}
            >
              {sport} {sport === 'Todos' ? `(${courts.length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Tarjetas de Resumen Estadístico del Día */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] font-bold text-[#a0a0a0] uppercase">Canchas Filtradas</span>
          <span className="text-xl font-extrabold text-white">{filteredCourts.length}</span>
          <span className="text-[10px] text-[#71856d]">{displayedHours.length} franjas horarias</span>
        </div>

        <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] font-bold text-[#65c556] uppercase">Turnos Reservados</span>
          <span className="text-xl font-extrabold text-[#65c556]">{dayStats.bookedCount}</span>
          <span className="text-[10px] text-[#71856d]">Clientes confirmados</span>
        </div>

        <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] font-bold text-[#f59e0b] uppercase">Partidos Torneo</span>
          <span className="text-xl font-extrabold text-[#f59e0b]">{dayStats.tournamentCount}</span>
          <span className="text-[10px] text-[#71856d]">Fixture oficial</span>
        </div>

        <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-3.5 flex flex-col gap-1">
          <span className="text-[11px] font-bold text-[#38bdf8] uppercase">Turnos Libres</span>
          <span className="text-xl font-extrabold text-[#38bdf8]">{dayStats.freeCount}</span>
          <span className="text-[10px] text-[#71856d]">Disponibles para reserva</span>
        </div>
      </div>

      {/* Grilla Operativa Completa de Canchas y Horarios */}
      <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#5a7056] text-[#a0a0a0] bg-[#293827]">
                <th className="py-3.5 px-4 font-bold tracking-wider sticky left-0 bg-[#293827] z-20 border-r border-[#5a7056] min-w-[110px]">
                  HORARIO
                </th>
                {filteredCourts.map((c) => (
                  <th key={c.id} className="py-3.5 px-4 font-bold min-w-[240px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-white text-xs">{c.name}</span>
                      <span className="text-[10px] font-normal text-[#65c556]">
                        {c.sport} • ${c.pricePerHour.toLocaleString()}/h
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#293827]">
              {displayedHours.map((hour) => (
                <tr key={hour} className="hover:bg-[#293827]/40 transition-colors">
                  {/* Celda Hora Sticky */}
                  <td className="py-4 px-4 font-mono font-bold text-[#65c556] whitespace-nowrap sticky left-0 bg-[#1e281d] z-10 border-r border-[#5a7056]/60 shadow-sm">
                    {hour}
                  </td>

                  {/* Celdas por Cancha */}
                  {filteredCourts.map((court) => {
                    const slot = getSlotDetails(court.name, court.id, hour);

                    if (slot.type === 'tournament') {
                      return (
                        <td key={court.id} className="py-3.5 px-3 min-w-[240px]">
                          <div className="bg-[rgba(245,158,11,0.12)] border border-[#f59e0b]/50 rounded-xl p-3 flex flex-col gap-1.5 shadow-sm">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-extrabold text-[#f59e0b] text-xs truncate">
                                {slot.title}
                              </span>
                              <span className="bg-[#f59e0b] text-[#1e281d] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                Torneo
                              </span>
                            </div>
                            <span className="text-[11px] text-[#fcd34d]/90 font-medium">
                              {slot.subtitle}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    if (slot.type === 'booking') {
                      const b = slot.booking;
                      return (
                        <td key={court.id} className="py-3.5 px-3 min-w-[240px]">
                          <div
                            className={`rounded-xl p-3 border flex flex-col gap-2 shadow-sm ${
                              slot.isAttended
                                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                                : slot.isAbsent
                                ? 'bg-[rgba(229,62,62,0.18)] border-[#e53e3e] text-[#fecaca]'
                                : 'bg-[rgba(101,197,86,0.12)] border-[#65c556]/50 text-white'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="flex flex-col">
                                <span className="font-bold text-xs text-white truncate max-w-[170px]" title={b.clientName}>
                                  {b.clientName}
                                </span>
                                <span className="text-[10px] text-[#a0a0a0]">
                                  Reserva #{b.id} • Seña: ${b.depositPaid?.toLocaleString()}
                                </span>
                              </div>

                              {slot.isAttended ? (
                                <span className="bg-[#22c55e] text-[#141b13] text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                  Asistió
                                </span>
                              ) : slot.isAbsent ? (
                                <span className="bg-[#e53e3e] text-white text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                                  Inasistencia
                                </span>
                              ) : (
                                <span className="size-2 rounded-full bg-[#65c556] shrink-0 mt-1" />
                              )}
                            </div>

                            {/* Botones de Control de Asistencia en MySQL */}
                            {!slot.isAttended && !slot.isAbsent && (
                              <div className="flex items-center gap-2 pt-1.5 border-t border-[#5a7056]/40 mt-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleConfirmAttendance(b)}
                                  className="flex-1 py-1 px-2 rounded-lg bg-[#65c556]/15 hover:bg-[#65c556]/30 text-[#65c556] border border-[#65c556]/40 text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
                                  title="Registra asistencia y resetea a 0 las faltas consecutivas"
                                >
                                  <IconCheck size={12} />
                                  <span>Asistió</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMarkAbsent(b)}
                                  className="flex-1 py-1 px-2 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 border border-red-500/40 text-[10px] font-bold transition cursor-pointer flex items-center justify-center gap-1"
                                  title="Registra inasistencia (acumula hacia suspensión de 14 días)"
                                >
                                  <IconAlert size={12} />
                                  <span>Inasistió</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    }

                    // Celda Libre
                    return (
                      <td key={court.id} className="py-3.5 px-3 min-w-[240px]">
                        <div className="bg-[#293827]/60 border border-[#5a7056]/40 rounded-xl p-3 flex items-center justify-between hover:border-[#65c556]/50 transition-colors">
                          <span className="text-xs font-semibold text-[#71856d]">Disponible</span>
                          <span className="text-[10px] text-[#65c556] font-mono font-bold">Libre</span>
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
