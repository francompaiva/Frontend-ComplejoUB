import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { type BookingSlotInfo } from '../components/ConfirmacionPagoModal';
import { type SportType, type Tournament, SPORT_PRICING } from '../data/mockData';
import ListaEsperaModal from '../components/ListaEsperaModal';
import TorneoDetalleModal from '../components/TorneoDetalleModal';
import { IconCalendar, IconClock } from '../components/Icons';

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
  const { tournaments, standings, courts, bookings, fixtures, joinWaitlist, isUserBanned, currentUser } = useComplejo();
  const [selectedSport, setSelectedSport] = useState<SportType>('Fútbol 5');
  const [detailModalTorneo, setDetailModalTorneo] = useState<Tournament | null>(null);

  // Fechas de conveniencia
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  })();
  const saturdayStr = (() => {
    const d = new Date();
    const diff = (6 - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  })();
  const sundayStr = (() => {
    const d = new Date();
    const diff = (7 - d.getDay()) % 7 || 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split('T')[0];
  })();

  // Selección de fecha interactiva (por defecto Hoy)
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [shiftFilter, setShiftFilter] = useState<'all' | 'evening' | 'morning'>('all');

  // Modal lista de espera
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

  const dateObj = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 6 = Sábado
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Canchas filtradas por deporte
  const filteredCourts = courts.filter((c) => c.sport === selectedSport);

  // Filtrado de franjas horarias por turno
  const displayedHours = ALL_HOURS.filter((h) => {
    const hourNum = parseInt(h.split(':')[0], 10);
    if (shiftFilter === 'morning') return hourNum >= 9 && hourNum < 17;
    if (shiftFilter === 'evening') return hourNum >= 17;
    return true;
  });

  // Verificación de disponibilidad slot por slot (Cancha y Hora específica)
  const getSlotStatus = (courtName: string, hour: string) => {
    const cleanHour = hour.replace(' hs', '').trim();

    // 0. Horario concluido en el pasado
    const [y, m, d] = selectedDate.split('-').map(Number);
    const hourNum = parseInt(cleanHour.split(':')[0], 10);
    const minuteNum = parseInt(cleanHour.split(':')[1] || '0', 10);
    const slotDateTime = new Date(y, m - 1, d, hourNum, minuteNum, 0);

    if (slotDateTime.getTime() <= Date.now()) {
      return {
        status: 'Pasado' as const,
        label: 'Horario concluido'
      };
    }

    // 1. Partido de torneo en ESA cancha específica y en ESE horario exacto
    const matchOnCourt = fixtures.find(
      (m) =>
        !m.isFreeDate &&
        (m.court === courtName || courtName.includes(m.court) || m.court.includes(courtName)) &&
        m.time?.slice(0, 5) === cleanHour &&
        m.date === selectedDate
    );

    if (matchOnCourt) {
      return {
        status: 'Torneo',
        label: `🏆 ${matchOnCourt.homeTeam} vs ${matchOnCourt.awayTeam}`
      };
    }

    // 2. Reserva activa en ESA cancha específica y en ESE horario en la base de datos
    const bookingOnCourt = bookings.find(
      (b) =>
        (b.courtName === courtName || courtName.includes(b.courtName) || b.courtName.includes(courtName)) &&
        b.time?.slice(0, 5) === cleanHour &&
        b.date === selectedDate &&
        b.status !== 'Cancelada'
    );

    if (bookingOnCourt) {
      return { status: 'Ocupado', label: 'Ocupado' };
    }

    return { status: 'Libre', label: 'Disponible' };
  };

  const handleOpenWaitlist = (courtName: string, hour: string) => {
    setWaitlistModal({
      isOpen: true,
      courtName,
      date: selectedDate,
      time: hour
    });
  };

  // Formato legible para la fecha seleccionada
  const formattedSelectedDate = (() => {
    try {
      const parts = selectedDate.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return selectedDate;
    }
  })();

  return (
    <div className="bg-[#293827] min-h-full w-full font-['Inter',sans-serif] text-white flex flex-col">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#1a2e18] via-[#233821] to-[#293827] py-14 px-6 lg:px-12 text-center border-b border-[#5a7056]/50">
        <span className="inline-block bg-[rgba(101,197,86,0.15)] text-[#65c556] border border-[#65c556]/40 text-xs font-extrabold uppercase px-3 py-1 rounded-full mb-3 tracking-wider">
          Reserva Online con Seña del 30%
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-3">
          ¡Reservá tu Cancha en Segundos!
        </h1>
        <p className="text-sm md:text-base text-[#c0c0c0] max-w-xl mx-auto mb-6">
          Instalaciones de primer nivel para Fútbol 5, Fútbol 8, Fútbol 11, Pádel y Tenis. Turnos de 1 hora con confirmación inmediata.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {(['Fútbol 5', 'Fútbol 8', 'Fútbol 11', 'Pádel', 'Tenis'] as SportType[]).map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                selectedSport === sport
                  ? 'bg-[#65c556] text-[#293827] border-[#65c556] shadow-lg shadow-[rgba(101,197,86,0.25)]'
                  : 'bg-[#1e281d] text-[#c0c0c0] border-[#5a7056] hover:text-white'
              }`}
            >
              {sport} (${(SPORT_PRICING[sport] || 18000).toLocaleString('es-AR')}/h)
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Table Section */}
      <div className="px-6 lg:px-12 py-10 flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">Disponibilidad de Turnos</h2>
              <span className="text-xs bg-[#1e281d] text-[#65c556] border border-[#5a7056] px-2.5 py-0.5 rounded-full capitalize font-semibold">
                {formattedSelectedDate}
              </span>
            </div>
            <p className="text-xs text-[#a0a0a0] mt-1">
              Tarifa fija para {selectedSport}: <strong className="text-[#65c556]">${(SPORT_PRICING[selectedSport] || 18000).toLocaleString('es-AR')}</strong> (Seña 30%: ${Math.round((SPORT_PRICING[selectedSport] || 18000) * 0.3).toLocaleString('es-AR')})
            </p>
          </div>

          {/* Interactive Date & Filter Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick date shortcuts */}
            <div className="flex items-center gap-1 bg-[#1e281d] p-1.5 rounded-xl border border-[#5a7056]">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedDate === todayStr
                    ? 'bg-[#65c556] text-[#293827] font-bold shadow'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(tomorrowStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedDate === tomorrowStr
                    ? 'bg-[#65c556] text-[#293827] font-bold shadow'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                Mañana
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(saturdayStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedDate === saturdayStr
                    ? 'bg-[#65c556] text-[#293827] font-bold shadow'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                Sábado
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(sundayStr)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedDate === sundayStr
                    ? 'bg-[#65c556] text-[#293827] font-bold shadow'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                Domingo
              </button>
            </div>

            {/* Interactive Calendar Date Picker */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border"
              style={{ backgroundColor: '#1e281d', borderColor: '#5a7056' }}
            >
              <IconCalendar size={16} className="text-[#65c556]" />
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-bold"
                style={{ colorScheme: 'dark' }}
                title="Elegir cualquier fecha en el calendario"
              />
            </div>

            {/* Shift Filter (Turno) */}
            <div className="flex items-center gap-1 bg-[#1e281d] p-1.5 rounded-xl border border-[#5a7056]">
              <button
                type="button"
                onClick={() => setShiftFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  shiftFilter === 'all'
                    ? 'bg-[#65c556] text-[#293827] font-bold shadow'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                Todos los Horarios
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('morning')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  shiftFilter === 'morning'
                    ? 'bg-[#65c556] text-[#293827] font-bold shadow'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                Mañana (9-16h)
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('evening')}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                  shiftFilter === 'evening'
                    ? 'bg-[#65c556] text-[#293827] font-bold shadow'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                Tarde/Noche (17-23h)
              </button>
            </div>
          </div>
        </div>

        {/* Banner de Sanción Vigente (RF-05) */}
        {isUserBanned && (
          <div className="bg-[rgba(229,62,62,0.15)] border-2 border-[#e53e3e] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start sm:items-center gap-3.5">
              <span className="text-3xl shrink-0">🚫</span>
              <div>
                <h3 className="font-bold text-base text-[#e53e3e]">
                  Cuenta Suspendida para Nuevas Reservas
                </h3>
                <p className="text-xs text-[#d1d5db] mt-1 leading-relaxed">
                  Has acumulado <strong>3 inasistencias consecutivas</strong> a turnos reservados. De acuerdo a la normativa del complejo deportivo, tu cuenta está bloqueada {currentUser?.suspension_hasta ? `hasta el ${new Date(currentUser.suspension_hasta).toLocaleDateString('es-AR')}` : 'durante 14 días'}. Los botones de reserva permanecerán inhabilitados.
                </p>
              </div>
            </div>
            <span className="bg-[#e53e3e] text-white text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider self-start sm:self-center shrink-0">
              Sanción Activa
            </span>
          </div>
        )}

        {/* Weekend notice if applicable */}
        {isWeekend && (
          <div className="bg-[rgba(245,158,11,0.15)] border border-[#f59e0b] rounded-xl p-3 flex items-center gap-3 text-xs text-[#f59e0b]">
            <span className="text-base">🏆</span>
            <span>
              <strong>Aviso de Torneo Oficial:</strong> Durante el fin de semana se disputan las fechas del torneo oficial en las canchas programadas. Cada partido ocupa únicamente su cancha y horario asignado; todas las demás canchas u horarios libres están 100% habilitados para reservas comunes con el 30% de seña.
            </span>
          </div>
        )}

        {/* Timetable */}
        <div className="bg-[#1e281d] rounded-2xl border border-[#5a7056] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-[#5a7056] bg-[#293827] text-[#a0a0a0]">
                  <th className="py-3 px-4 text-left font-bold w-28">HORARIO</th>
                  {filteredCourts.map((c) => (
                    <th key={c.id} className="py-3 px-4 font-bold text-white">
                      {c.name}
                    </th>
                  ))}
                  {filteredCourts.length === 0 && (
                    <th className="py-3 px-4 font-medium text-gray-400">
                      Canchas de {selectedSport}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#293827]">
                {displayedHours.map((hour) => (
                  <tr key={hour} className="hover:bg-[#293827]/30 transition-colors">
                    <td className="py-4 px-4 text-left font-mono font-bold text-[#65c556] flex items-center gap-1.5">
                      <IconClock size={13} className="text-[#5a7056]" />
                      <span>{hour}</span>
                    </td>

                    {filteredCourts.map((c) => {
                      const { status, label } = getSlotStatus(c.name, hour);
                      return (
                        <td key={c.id} className="py-3 px-3 min-w-[180px]">
                          {status === 'Pasado' ? (
                            <div
                              className="w-full py-2.5 px-2 rounded-xl bg-[#1e281d]/70 text-[#71856d] border border-[#3b4d38] font-bold text-xs select-none shadow-sm"
                              title="Este horario ya ha concluido"
                            >
                              Concluido
                            </div>
                          ) : status === 'Libre' ? (
                            isUserBanned ? (
                              <button
                                type="button"
                                disabled
                                title="No puedes reservar: tu cuenta está suspendida por acumulación de inasistencias"
                                className="w-full py-2.5 rounded-xl bg-red-950/20 text-red-400 border border-red-500/30 font-bold text-xs opacity-60 cursor-not-allowed shadow-sm flex items-center justify-center gap-1"
                              >
                                <span>🚫 Suspendido</span>
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
                                className="w-full py-2.5 rounded-xl bg-[rgba(101,197,86,0.15)] text-[#65c556] border border-[#65c556]/40 hover:bg-[#65c556] hover:text-[#293827] font-bold text-xs transition-all cursor-pointer shadow-sm"
                              >
                                Reservar (${Math.round(c.pricePerHour * 0.3).toLocaleString('es-AR')})
                              </button>
                            )
                          ) : status === 'Torneo' ? (
                            <div
                              className="py-2.5 px-2 rounded-xl border text-xs font-bold shadow-sm"
                              style={{
                                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                borderColor: 'rgba(245, 158, 11, 0.5)',
                                color: '#f59e0b'
                              }}
                              title="Cancha reservada para encuentro oficial de torneo"
                            >
                              {label}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-1">
                              <span className="py-1.5 px-2 rounded-lg bg-[rgba(229,62,62,0.15)] text-[#e53e3e] font-bold text-xs border border-[#e53e3e]/30">
                                Turno Ocupado
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenWaitlist(c.name, hour)}
                                className="text-[10px] text-[#f59e0b] hover:underline cursor-pointer bg-transparent border-none font-semibold"
                              >
                                ⏳ Lista de Espera
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {filteredCourts.length === 0 && (
                      <td className="py-4 text-gray-400">
                        Próximamente turnos disponibles en esta categoría.
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tournaments Section */}
      <div className="px-6 lg:px-12 py-8 bg-[#1e281d] border-t border-[#5a7056]/60 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-extrabold uppercase text-[#65c556] tracking-wider">
              Competencias Oficiales UB
            </span>
            <h2 className="text-2xl font-bold text-white mt-0.5">Torneos de Fin de Semana</h2>
            <p className="text-xs text-[#a0a0a0]">
              Inscripción de equipos, fixtures automáticos y tablas de posiciones actualizadas en vivo.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenInscripcion()}
            className="px-5 py-2.5 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs shadow-lg transition-all cursor-pointer self-start md:self-auto"
          >
            + Inscribir mi Equipo
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-[#293827] border border-[#5a7056] rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-[#65c556]">
                    {t.sport} • {t.format}
                  </span>
                  <span className="bg-[rgba(101,197,86,0.15)] text-[#65c556] text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {t.status}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{t.name}</h3>
                <p className="text-xs text-[#a0a0a0] mt-1">📅 {t.dates}</p>

                <div className="grid grid-cols-2 gap-2 text-xs my-3 bg-[#1e281d] p-3 rounded-xl border border-[#5a7056]/60">
                  <div>
                    <span className="text-[#a0a0a0] block">Inscripción:</span>
                    <span className="text-white font-bold">${t.entryFee.toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <span className="text-[#a0a0a0] block">Equipos:</span>
                    <span className="text-[#65c556] font-bold">{t.registeredTeams.length} / {t.maxTeams}</span>
                  </div>
                </div>

                <p className="text-xs text-[#c0c0c0]">
                  🏆 <strong>Premio:</strong> {t.prize}
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setDetailModalTorneo(t)}
                  className="flex-1 py-2.5 rounded-xl border border-[#5a7056] text-[#c0c0c0] hover:text-white hover:border-[#65c556] font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Ver Detalles
                </button>
                <button
                  type="button"
                  onClick={() => onOpenInscripcion(t.id)}
                  className="flex-1 py-2.5 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs transition-colors cursor-pointer text-center"
                >
                  Inscribir Equipo
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Live Standings Table */}
        <div className="mt-4">
          <h3 className="text-lg font-bold text-white mb-1">
            Tabla de Posiciones Oficial — Copa Apertura Fútbol 5
          </h3>
          <p className="text-xs text-[#a0a0a0] mb-4">
            Actualización inmediata tras la carga de resultados arbitrales.
          </p>

          <div className="bg-[#293827] border border-[#5a7056] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs">
                <thead>
                  <tr className="border-b border-[#5a7056] text-[#a0a0a0] bg-[#1e281d]">
                    <th className="py-3 px-4 text-center">POS</th>
                    <th className="py-3 px-4 text-left">EQUIPO</th>
                    <th className="py-3 px-2">PJ</th>
                    <th className="py-3 px-2">PG</th>
                    <th className="py-3 px-2">PE</th>
                    <th className="py-3 px-2">PP</th>
                    <th className="py-3 px-2">GF</th>
                    <th className="py-3 px-2">GC</th>
                    <th className="py-3 px-2">DIF</th>
                    <th className="py-3 px-4 text-center font-bold text-[#65c556]">PTS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e281d]">
                  {standings.map((s, idx) => (
                    <tr
                      key={s.team}
                      className={`hover:bg-[#1e281d]/50 transition-colors ${
                        idx === 0 ? 'bg-[rgba(101,197,86,0.08)]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-sm text-[#65c556]">
                        {s.pos}° {idx === 0 && '👑'}
                      </td>
                      <td className="py-3 px-4 text-left font-bold text-sm text-white">{s.team}</td>
                      <td className="py-3 px-2 text-[#c0c0c0] font-mono">{s.pj}</td>
                      <td className="py-3 px-2 text-[#c0c0c0] font-mono">{s.pg}</td>
                      <td className="py-3 px-2 text-[#c0c0c0] font-mono">{s.pe}</td>
                      <td className="py-3 px-2 text-[#c0c0c0] font-mono">{s.pp}</td>
                      <td className="py-3 px-2 text-[#c0c0c0] font-mono">{s.gf}</td>
                      <td className="py-3 px-2 text-[#c0c0c0] font-mono">{s.gc}</td>
                      <td className="py-3 px-2 font-mono font-bold text-[#65c556]">
                        {s.gf - s.gc > 0 ? `+${s.gf - s.gc}` : s.gf - s.gc}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-sm text-[#65c556]">
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

      {/* Footer */}
      <footer className="bg-[#141b13] border-t border-[#5a7056] px-6 lg:px-12 py-8 text-xs text-[#a0a0a0] flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <p className="font-bold text-white">Complejo Deportivo UB</p>
          <p className="text-[11px] mt-0.5">Sistema Integral de Gestión Deportiva • Complejo Deportivo UB</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => onNavigate('landing')} className="hover:text-white bg-transparent border-none cursor-pointer">
            Inicio
          </button>
          <button onClick={() => onNavigate('mis-reservas')} className="hover:text-white bg-transparent border-none cursor-pointer">
            Mis Reservas
          </button>
          <button onClick={() => onNavigate('admin-overview')} className="hover:text-white bg-transparent border-none cursor-pointer">
            Acceso Admin
          </button>
          <button onClick={() => onNavigate('arbitro')} className="hover:text-white bg-transparent border-none cursor-pointer">
            Acceso Árbitro
          </button>
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
