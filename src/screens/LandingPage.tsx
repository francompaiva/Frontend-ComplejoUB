import React, { useState, useMemo, useEffect } from 'react';
import { useComplejo, type Court } from '../context/ComplejoContext';
import { type BookingSlotInfo } from '../components/ConfirmacionPagoModal';
import { type SportType, type Tournament, SPORT_PRICING } from '../data/mockData';
import ListaEsperaModal from '../components/ListaEsperaModal';
import TorneoDetalleModal from '../components/TorneoDetalleModal';
import {
  IconCalendar,
  IconClock,
  IconTrophy,
  IconBan,
  IconHourglass,
  IconCrown,
  IconStadium,
  IconCheck,
  IconRefresh,
  IconPlus,
  IconBolt
} from '../components/Icons';
import { getQuickDatesBuenosAires, formatDateSpanish, normalizeBookingDate } from '../utils/dateUtils';

export interface LandingPageProps {
  onNavigate: (screen: string) => void;
  onOpenInscripcion: (tournamentId?: string) => void;
  onOpenPago: (slotData: BookingSlotInfo) => void;
}

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

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenInscripcion,
  onOpenPago
}) => {
  const {
    tournaments,
    standings,
    courts,
    bookings,
    sharedBookings,
    courtAvailability,
    fetchAvailabilityForDate,
    fixtures,
    joinWaitlist,
    isUserBanned,
    currentUser
  } = useComplejo();

  const [selectedSport, setSelectedSport] = useState<SportType>('Fútbol 5');
  const [detailModalTorneo, setDetailModalTorneo] = useState<Tournament | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const { today: todayStr, tomorrow: tomorrowStr, saturday: saturdayStr, sunday: sundayStr } = useMemo(
    () => getQuickDatesBuenosAires(),
    []
  );

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [shiftFilter, setShiftFilter] = useState<'all' | 'evening' | 'morning'>('all');

  const [waitlistModal, setWaitlistModal] = useState<{
    isOpen: boolean;
    courtName: string;
    date: string;
    time: string;
  }>({
    isOpen: false,
    courtName: '',
    date: '',
    time: ''
  });

  // Sincronizar disponibilidad real desde el backend cada vez que cambia la fecha o el usuario activo
  useEffect(() => {
    let active = true;
    const sync = async () => {
      setIsSyncing(true);
      await fetchAvailabilityForDate(selectedDate);
      if (active) setIsSyncing(false);
    };
    sync();
    return () => {
      active = false;
    };
  }, [selectedDate, currentUser?.id, courts.length, fetchAvailabilityForDate]);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await fetchAvailabilityForDate(selectedDate);
    setIsSyncing(false);
  };

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const filteredCourts = courts.filter((c) => c.sport === selectedSport);

  const displayedHours = ALL_HOURS.filter((h) => {
    const hourNum = parseInt(h.split(':')[0], 10);
    if (shiftFilter === 'morning') return hourNum >= 9 && hourNum < 17;
    if (shiftFilter === 'evening') return hourNum >= 17;
    return true;
  });

  const courtMatchesName = (a?: string, b?: string) => {
    if (!a || !b) return false;
    const normA = a.trim().toLowerCase();
    const normB = b.trim().toLowerCase();
    return normA === normB || normA.includes(normB) || normB.includes(normA);
  };

  // Verificación de disponibilidad real slot por slot (conectado a /canchas/:id/disponibilidad + reservas compartidas)
  const getSlotStatus = (court: Court, hour: string) => {
    const cleanHour = hour.replace(' hs', '').trim().slice(0, 5);
    const courtName = court.name;
    const numericId = String(parseInt(String(court.id).replace(/\D/g, ''), 10) || 1);

    // 0. Cancha en mantenimiento
    if (court.status === 'mantenimiento') {
      return {
        status: 'Mantenimiento' as const,
        label: 'En Mantenimiento'
      };
    }

    // 1. Horario concluido en el pasado (zona horaria oficial del Complejo: UTC-3)
    const hourNum = parseInt(cleanHour.split(':')[0], 10);
    const minuteNum = parseInt(cleanHour.split(':')[1] || '0', 10);
    const hourFormatted = `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}:00`;
    const slotDateTime = new Date(`${selectedDate}T${hourFormatted}-03:00`);

    if (slotDateTime.getTime() <= Date.now()) {
      return {
        status: 'Pasado' as const,
        label: 'Concluido'
      };
    }

    // 2. Partido de torneo en esa cancha y horario
    const matchOnCourt = fixtures.find(
      (m) =>
        !m.isFreeDate &&
        m.status !== 'Suspendido' &&
        (m.courtId === String(court.id) || m.courtId === numericId || courtMatchesName(m.court, courtName)) &&
        m.time?.slice(0, 5) === cleanHour &&
        normalizeBookingDate(m.date) === selectedDate
    );

    if (matchOnCourt) {
      return {
        status: 'Torneo' as const,
        label: `${matchOnCourt.homeTeam} vs ${matchOnCourt.awayTeam}`
      };
    }

    // 3. Consultar disponibilidad pública devuelta por el backend (/api/v1/canchas/:id/disponibilidad)
    const dispSlot =
      courtAvailability[`${court.id}_${selectedDate}`]?.[cleanHour] ||
      courtAvailability[`${numericId}_${selectedDate}`]?.[cleanHour] ||
      courtAvailability[`${courtName.toLowerCase()}_${selectedDate}`]?.[cleanHour];

    if (dispSlot?.estado === 'DeshabilitadoTorneo') {
      return {
        status: 'Torneo' as const,
        label: 'Fecha de Torneo Oficial'
      };
    }

    if (dispSlot?.estado === 'Mantenimiento') {
      return {
        status: 'Mantenimiento' as const,
        label: 'En Mantenimiento'
      };
    }

    // 4. Verificar si la reserva pertenece al usuario en sesión
    const myBooking = bookings.find(
      (b) =>
        b.status !== 'Cancelada' &&
        (b.courtId === String(court.id) || b.courtId === numericId || courtMatchesName(b.courtName, courtName)) &&
        b.time?.slice(0, 5) === cleanHour &&
        normalizeBookingDate(b.date) === selectedDate
    );

    if (myBooking) {
      const isMine =
        !currentUser?.email ||
        !myBooking.clientEmail ||
        myBooking.clientEmail.toLowerCase() === currentUser.email.toLowerCase();

      if (isMine) {
        return { status: 'MiReserva' as const, label: 'Tu Reserva' };
      }
      return { status: 'Ocupado' as const, label: 'Reservado' };
    }

    // 5. Verificar en el registro compartido entre usuarios (sharedBookings) o en dispSlot del backend
    const sharedMatch = sharedBookings.find(
      (b) =>
        b.status !== 'Cancelada' &&
        (b.courtId === String(court.id) || b.courtId === numericId || courtMatchesName(b.courtName, courtName)) &&
        b.time?.slice(0, 5) === cleanHour &&
        normalizeBookingDate(b.date) === selectedDate
    );

    if (sharedMatch) {
      if (currentUser?.email && sharedMatch.clientEmail?.toLowerCase() === currentUser.email.toLowerCase()) {
        return { status: 'MiReserva' as const, label: 'Tu Reserva' };
      }
      return { status: 'Ocupado' as const, label: 'Reservado' };
    }

    if (dispSlot?.estado === 'Ocupado') {
      return { status: 'Ocupado' as const, label: 'Reservado' };
    }

    return { status: 'Libre' as const, label: 'Disponible' };
  };

  const handleOpenWaitlist = (courtName: string, hour: string) => {
    setWaitlistModal({
      isOpen: true,
      courtName,
      date: selectedDate,
      time: hour
    });
  };

  const formattedSelectedDate = useMemo(() => formatDateSpanish(selectedDate), [selectedDate]);

  return (
    <div className="bg-[#f4f6f4] min-h-full w-full font-['Inter',sans-serif] text-slate-900 flex flex-col">
      {/* Modern Architectural Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0d1510] via-[#132017] to-[#17281c] py-12 px-6 lg:px-12 text-white border-b border-emerald-500/20">
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[11px] font-bold uppercase px-3 py-1 rounded-full mb-4 tracking-wider">
              <IconBolt size={13} />
              <span>Reserva Online • Seña del 30%</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Reservá tu cancha en tiempo real
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-3 leading-relaxed">
              Instalaciones profesionales de Fútbol 5, Fútbol 8, Fútbol 11, Pádel y Tenis. Turnos de 1 hora sincronizados con disponibilidad inmediata.
            </p>
          </div>

          {/* Sport Selector Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(['Fútbol 5', 'Fútbol 8', 'Fútbol 11', 'Pádel', 'Tenis'] as SportType[]).map((sport) => {
              const isSelected = selectedSport === sport;
              const price = SPORT_PRICING[sport] || 18000;
              return (
                <button
                  key={sport}
                  type="button"
                  onClick={() => setSelectedSport(sport)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border flex flex-col items-start gap-0.5 ${
                    isSelected
                      ? 'bg-[#199e1b] text-white border-emerald-400 shadow-lg shadow-[#199e1b]/25'
                      : 'bg-white/[0.05] text-slate-300 border-white/10 hover:bg-white/[0.1] hover:text-white'
                  }`}
                >
                  <span className="font-bold">{sport}</span>
                  <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    ${price.toLocaleString('es-AR')}/h
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Schedule Section */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6">
        {/* Toolbar Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Grilla de Disponibilidad</h2>
              <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-0.5 rounded-full capitalize font-semibold">
                {formattedSelectedDate}
              </span>
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                title="Sincronizar disponibilidad con la base de datos"
              >
                <IconRefresh size={13} className={isSyncing ? 'animate-spin text-emerald-600' : 'text-slate-600'} />
                <span>{isSyncing ? 'Sincronizando...' : 'Actualizar'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Tarifa {selectedSport}: <strong className="text-slate-800">${(SPORT_PRICING[selectedSport] || 18000).toLocaleString('es-AR')}</strong>/hora · Seña obligatoria (30%):{' '}
              <strong className="text-emerald-700">${Math.round((SPORT_PRICING[selectedSport] || 18000) * 0.3).toLocaleString('es-AR')}</strong>
            </p>
          </div>

          {/* Date & Shift Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Dates */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    selectedDate === d.val
                      ? 'bg-[#199e1b] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white">
              <IconCalendar size={15} className="text-emerald-600" />
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-transparent text-xs text-slate-800 focus:outline-none cursor-pointer font-semibold"
                title="Seleccionar fecha en el calendario"
              />
            </div>

            {/* Shift Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'morning', label: 'Mañana (9-16h)' },
                { id: 'evening', label: 'Tarde/Noche (17-23h)' },
              ].map((sh) => (
                <button
                  key={sh.id}
                  type="button"
                  onClick={() => setShiftFilter(sh.id as any)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                    shiftFilter === sh.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sh.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs text-slate-600">
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-emerald-500" />
              <span>Disponible</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-sky-500" />
              <span>Tu Reserva</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-rose-500" />
              <span>Reservado (Ocupado)</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-amber-500" />
              <span>Torneo Oficial</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-slate-300" />
              <span>Horario Concluido</span>
            </span>
          </div>
        </div>

        {/* Banner de Sanción Vigente (RF-05) */}
        {isUserBanned && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="size-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <IconBan size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-800">
                  Cuenta Suspendida para Nuevas Reservas
                </h3>
                <p className="text-xs text-red-600/90 mt-0.5 leading-relaxed">
                  Has acumulado <strong>3 inasistencias consecutivas</strong> a turnos reservados. Según la normativa del complejo, tu cuenta se encuentra inhabilitada{' '}
                  {currentUser?.suspension_hasta
                    ? `hasta el ${new Date(currentUser.suspension_hasta).toLocaleDateString('es-AR')}`
                    : 'temporalmente por 14 días'}
                  .
                </p>
              </div>
            </div>
            <span className="bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-center shrink-0">
              Sanción Activa
            </span>
          </div>
        )}

        {/* Weekend Tournament Notice */}
        {isWeekend && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-amber-900">
            <div className="size-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <IconTrophy size={16} />
            </div>
            <span>
              <strong>Cronograma de Fin de Semana:</strong> Los partidos oficiales de torneo bloquean únicamente la cancha y hora asignada. Todos los demás turnos continúan habilitados para reservas con seña del 30%.
            </span>
          </div>
        )}

        {/* Timetable Matrix */}
        <div className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                  <th className="py-3.5 px-4 text-left font-bold uppercase tracking-wider text-[11px] w-32 border-r border-slate-200/60">
                    Horario
                  </th>
                  {filteredCourts.map((c) => (
                    <th key={c.id} className="py-3.5 px-4 font-bold text-slate-900 min-w-[190px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-xs font-bold text-slate-900">{c.name}</span>
                        <span className="text-[10px] font-medium text-slate-500">
                          {c.surface} · {c.hasLighting ? 'Iluminación LED' : 'Diurna'}
                        </span>
                      </div>
                    </th>
                  ))}
                  {filteredCourts.length === 0 && (
                    <th className="py-3.5 px-4 font-medium text-slate-400">
                      Canchas de {selectedSport}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedHours.map((hour) => (
                  <tr key={hour} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 text-left font-mono font-bold text-slate-700 border-r border-slate-100 bg-slate-50/30">
                      <div className="flex items-center gap-2">
                        <IconClock size={14} className="text-emerald-600 shrink-0" />
                        <span>{hour}</span>
                      </div>
                    </td>

                    {filteredCourts.map((c) => {
                      const { status, label } = getSlotStatus(c, hour);
                      return (
                        <td key={c.id} className="py-2.5 px-3 min-w-[190px]">
                          {status === 'Pasado' ? (
                            <div
                              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-400 border border-slate-200/70 font-semibold text-xs select-none"
                              title="Este horario ya ha concluido"
                            >
                              Concluido
                            </div>
                          ) : status === 'Mantenimiento' ? (
                            <div
                              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 text-slate-500 border border-slate-300 font-semibold text-xs select-none"
                              title="Cancha temporalmente en mantenimiento"
                            >
                              Mantenimiento
                            </div>
                          ) : status === 'Libre' ? (
                            isUserBanned ? (
                              <button
                                type="button"
                                disabled
                                title="Cuenta suspendida por acumulación de inasistencias"
                                className="w-full py-2.5 px-3 rounded-xl bg-red-50 text-red-400 border border-red-200 font-semibold text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
                              >
                                <IconBan size={13} />
                                <span>Suspendido</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  onOpenPago({
                                    court: c.name,
                                    courtId: c.id,
                                    sport: selectedSport,
                                    date: selectedDate,
                                    time: hour,
                                    price: c.pricePerHour
                                  })
                                }
                                className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-[#199e1b] text-emerald-800 hover:text-white border border-emerald-200 hover:border-[#199e1b] font-semibold text-xs transition-all cursor-pointer shadow-xs flex items-center justify-between gap-2 group"
                              >
                                <span className="font-bold">Disponible</span>
                                <span className="text-[11px] font-mono bg-white/80 group-hover:bg-white/20 text-emerald-700 group-hover:text-white px-2 py-0.5 rounded-md transition-colors">
                                  Seña ${Math.round(c.pricePerHour * 0.3).toLocaleString('es-AR')}
                                </span>
                              </button>
                            )
                          ) : status === 'MiReserva' ? (
                            <div
                              onClick={() => onNavigate('mis-reservas')}
                              className="w-full py-2.5 px-3 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
                              title="Reservado por tu cuenta — Ver en Mis Reservas"
                            >
                              <IconCheck size={14} className="text-sky-600" />
                              <span>{label}</span>
                            </div>
                          ) : status === 'Torneo' ? (
                            <div
                              className="py-2.5 px-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5"
                              title="Cancha asignada a partido oficial de torneo"
                            >
                              <IconTrophy size={13} className="text-amber-600 shrink-0" />
                              <span className="truncate">{label}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-1.5 py-2 px-3 rounded-xl bg-rose-50 border border-rose-200">
                              <span className="text-rose-700 font-bold text-xs flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-rose-500" />
                                <span>Reservado</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenWaitlist(c.name, hour)}
                                className="text-[11px] text-amber-700 hover:text-amber-900 bg-amber-100/80 hover:bg-amber-200/80 px-2 py-0.5 rounded-md cursor-pointer font-semibold transition flex items-center gap-1"
                                title="Anotarme en lista de espera por si se libera"
                              >
                                <IconHourglass size={11} />
                                <span>Espera</span>
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {filteredCourts.length === 0 && (
                      <td className="py-6 text-slate-400">
                        Próximamente turnos disponibles en esta categoría.
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Tournaments & Standings Section */}
      <section className="bg-white border-t border-slate-200/80 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase text-emerald-700 tracking-wider">
                Competencias Oficiales UB
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                Torneos Universitarios y Ligas
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Inscripción de equipos con validación de DNI, fixture oficial y tabla de posiciones en vivo.
              </p>
            </div>

            <button
              type="button"
              onClick={() => onOpenInscripcion()}
              className="px-5 py-2.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs shadow-md shadow-[#199e1b]/15 transition-all cursor-pointer flex items-center gap-2 self-start md:self-auto"
            >
              <IconPlus size={15} />
              <span>Inscribir Equipo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="bg-slate-50/70 border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] uppercase font-bold text-emerald-700 tracking-wide">
                      {t.sport} · {t.format}
                    </span>
                    <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      {t.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900 mt-1.5 tracking-tight">{t.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <IconCalendar size={14} className="text-slate-400" />
                    <span>{t.dates}</span>
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs my-4 bg-white p-3.5 rounded-xl border border-slate-200/80">
                    <div>
                      <span className="text-slate-400 text-[11px] block">Costo de inscripción</span>
                      <span className="text-slate-900 font-bold text-sm">
                        ${Number(t.entryFee || 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[11px] block">Cupos confirmados</span>
                      <span className="text-emerald-700 font-bold text-sm">
                        {(t.registeredTeams || []).length} / {t.maxTeams || 8} equipos
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 flex items-center gap-1.5">
                    <IconTrophy size={14} className="text-amber-500 shrink-0" />
                    <span>
                      <strong className="text-slate-800">Premio oficial:</strong> {t.prize}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setDetailModalTorneo(t)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer text-center"
                  >
                    Ver Detalles
                  </button>
                  <button
                    type="button"
                    onClick={() => onOpenInscripcion(t.id)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs transition-colors cursor-pointer text-center shadow-xs"
                  >
                    Inscribir Equipo
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Live Standings Table */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
                  Tabla de Posiciones Oficial
                </h3>
                <p className="text-xs text-slate-500">
                  Recálculo automático mediante actas arbitrales registradas en el sistema.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4 text-center font-bold">Pos</th>
                      <th className="py-3 px-4 text-left font-bold">Equipo</th>
                      <th className="py-3 px-2 font-bold">PJ</th>
                      <th className="py-3 px-2 font-bold">PG</th>
                      <th className="py-3 px-2 font-bold">PE</th>
                      <th className="py-3 px-2 font-bold">PP</th>
                      <th className="py-3 px-2 font-bold">GF</th>
                      <th className="py-3 px-2 font-bold">GC</th>
                      <th className="py-3 px-2 font-bold">DIF</th>
                      <th className="py-3 px-4 text-center font-extrabold text-emerald-700">PTS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {standings.map((s, idx) => (
                      <tr
                        key={s.team}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          idx === 0 ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold text-xs text-slate-700">
                          <span className="inline-flex items-center gap-1">
                            <span>{s.pos}°</span>
                            {idx === 0 && <IconCrown size={13} className="text-amber-500" />}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-left font-bold text-xs text-slate-900">{s.team}</td>
                        <td className="py-3 px-2 text-slate-600 font-mono">{s.pj}</td>
                        <td className="py-3 px-2 text-slate-600 font-mono">{s.pg}</td>
                        <td className="py-3 px-2 text-slate-600 font-mono">{s.pe}</td>
                        <td className="py-3 px-2 text-slate-600 font-mono">{s.pp}</td>
                        <td className="py-3 px-2 text-slate-600 font-mono">{s.gf}</td>
                        <td className="py-3 px-2 text-slate-600 font-mono">{s.gc}</td>
                        <td className="py-3 px-2 font-mono font-bold text-emerald-700">
                          {s.gf - s.gc > 0 ? `+${s.gf - s.gc}` : s.gf - s.gc}
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-sm text-emerald-700">
                          {s.pts}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0d1510] border-t border-white/10 px-6 lg:px-12 py-8 text-xs text-slate-400 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <IconStadium size={16} />
            </div>
            <div>
              <p className="font-bold text-white">Complejo Deportivo UB</p>
              <p className="text-[11px] text-slate-400">Plataforma Integral de Reservas y Competencias Universitarias</p>
            </div>
          </div>
          <div className="flex gap-5 font-medium">
            <button onClick={() => onNavigate('landing')} className="hover:text-white bg-transparent border-none cursor-pointer">
              Turnos
            </button>
            <button onClick={() => onNavigate('mis-reservas')} className="hover:text-white bg-transparent border-none cursor-pointer">
              Mis Reservas
            </button>
            <button onClick={() => onNavigate('mis-torneos')} className="hover:text-white bg-transparent border-none cursor-pointer">
              Torneos
            </button>
          </div>
        </div>
      </footer>

      {/* Modal Lista de Espera */}
      <ListaEsperaModal
        isOpen={waitlistModal.isOpen}
        courtName={waitlistModal.courtName}
        date={waitlistModal.date}
        time={waitlistModal.time}
        onClose={() => setWaitlistModal({ ...waitlistModal, isOpen: false })}
        onConfirm={(name, phone) => {
          joinWaitlist(waitlistModal.courtName, waitlistModal.date, waitlistModal.time, name, phone);
        }}
      />

      {/* Modal Detalle de Torneo */}
      <TorneoDetalleModal
        isOpen={!!detailModalTorneo}
        torneo={detailModalTorneo}
        onClose={() => setDetailModalTorneo(null)}
        onInscribir={(id) => {
          setDetailModalTorneo(null);
          onOpenInscripcion(id);
        }}
      />
    </div>
  );
};

export default LandingPage;
