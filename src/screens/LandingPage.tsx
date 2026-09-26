import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { type BookingSlotInfo } from '../components/ConfirmacionPagoModal';
import { type SportType, SPORT_PRICING } from '../data/mockData';
import ListaEsperaModal from '../components/ListaEsperaModal';

export interface LandingPageProps {
  onNavigate: (screen: string) => void;
  onOpenInscripcion: () => void;
  onOpenPago: (slotData: BookingSlotInfo) => void;
}

const HOURS = ['17:00 hs', '18:00 hs', '19:00 hs', '20:00 hs', '21:00 hs', '22:00 hs'];

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenInscripcion,
  onOpenPago
}) => {
  const { tournaments, standings, courts, bookings, fixtures, unreadNotifsCount, joinWaitlist } = useComplejo();
  const [selectedSport, setSelectedSport] = useState<SportType>('Fútbol 5');
  const [selectedDay, setSelectedDay] = useState<'Hoy' | 'Mañana' | 'Sábado' | 'Domingo'>('Hoy');

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

  const isWeekend = selectedDay === 'Sábado' || selectedDay === 'Domingo';

  // Canchas filtradas por deporte
  const filteredCourts = courts.filter((c) => c.sport === selectedSport);

  const getTargetDate = (day: 'Hoy' | 'Mañana' | 'Sábado' | 'Domingo'): string => {
    const d = new Date();
    if (day === 'Mañana') {
      d.setDate(d.getDate() + 1);
    } else if (day === 'Sábado') {
      const diff = (6 - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + diff);
    } else if (day === 'Domingo') {
      const diff = (7 - d.getDay()) % 7 || 7;
      d.setDate(d.getDate() + diff);
    }
    return d.toISOString().split('T')[0];
  };

  const targetDateStr = getTargetDate(selectedDay);

  const getSlotStatus = (courtName: string, hour: string) => {
    const cleanHour = hour.replace(' hs', '').trim();

    // 1. Partido de torneo en esa cancha y horario
    const matchOnCourt = fixtures.find(
      (m) =>
        !m.isFreeDate &&
        (m.court === courtName || courtName.includes(m.court) || m.court.includes(courtName)) &&
        m.time?.slice(0, 5) === cleanHour &&
        (m.date === targetDateStr || isWeekend)
    );

    if (matchOnCourt) {
      return {
        status: 'Torneo',
        label: `🏆 ${matchOnCourt.homeTeam} vs ${matchOnCourt.awayTeam}`
      };
    }

    // 2. Reserva activa en esa cancha y horario en la base de datos
    const bookingOnCourt = bookings.find(
      (b) =>
        (b.courtName === courtName || courtName.includes(b.courtName) || b.courtName.includes(courtName)) &&
        b.time?.slice(0, 5) === cleanHour &&
        (b.date === targetDateStr || b.date === selectedDay) &&
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
      date: selectedDay,
      time: hour
    });
  };

  return (
    <div className="bg-[#293827] min-h-full w-full font-['Inter',sans-serif] text-white flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-[#1e281d] border-b border-[#5a7056] px-6 lg:px-12 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-[rgba(101,197,86,0.15)] flex items-center justify-center rounded-xl size-9 border border-[#65c556] text-xl">
            ⚽
          </div>
          <div>
            <span className="font-extrabold text-base tracking-tight text-white">
              Complejo Deportivo <strong className="text-[#65c556]">UB</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="text-xs font-bold text-[#65c556] cursor-pointer bg-transparent border-none"
          >
            Canchas
          </button>
          <button
            type="button"
            onClick={() => onNavigate('mis-reservas')}
            className="text-xs font-semibold text-[#c0c0c0] hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          >
            Mis Reservas
          </button>
          <button
            type="button"
            onClick={() => onNavigate('mis-torneos')}
            className="text-xs font-semibold text-[#c0c0c0] hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          >
            Torneos
          </button>
          <button
            type="button"
            onClick={() => onNavigate('mis-reservas')}
            className="text-xs font-semibold text-[#c0c0c0] hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          >
            Mi Perfil
          </button>

          {/* Notification Indicator */}
          <div
            onClick={() => onNavigate('mis-reservas')}
            className="relative cursor-pointer flex items-center justify-center size-8 rounded-full bg-[#293827] border border-[#5a7056] hover:border-[#65c556]"
            title="Centro de Notificaciones"
          >
            <span>🔔</span>
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#e53e3e] text-white text-[9px] font-black size-4 rounded-full flex items-center justify-center">
                {unreadNotifsCount}
              </span>
            )}
          </div>
        </div>
      </nav>

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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Disponibilidad de Turnos</h2>
            <p className="text-xs text-[#a0a0a0] mt-0.5">
              Tarifa fija para {selectedSport}: <strong className="text-[#65c556]">${(SPORT_PRICING[selectedSport] || 18000).toLocaleString('es-AR')}</strong> (Seña 30%: ${Math.round((SPORT_PRICING[selectedSport] || 18000) * 0.3).toLocaleString('es-AR')})
            </p>
          </div>

          {/* Day filter */}
          <div className="flex items-center gap-1.5 bg-[#1e281d] p-1.5 rounded-xl border border-[#5a7056]">
            {(['Hoy', 'Mañana', 'Sábado', 'Domingo'] as const).map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedDay === day
                    ? 'bg-[#65c556] text-[#293827] font-bold'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* Weekend notice if applicable */}
        {isWeekend && (
          <div className="bg-[rgba(245,158,11,0.15)] border border-[#f59e0b] rounded-xl p-3 flex items-center gap-3 text-xs text-[#f59e0b]">
            <span className="text-base">🏆</span>
            <span>
              <strong>Aviso de Fin de Semana:</strong> Durante el fin de semana se disputan las fechas del torneo oficial en las canchas principales. Los horarios afectados están reservados exclusivamente para los partidos de liga.
            </span>
          </div>
        )}

        {/* Timetable */}
        <div className="bg-[#1e281d] rounded-2xl border border-[#5a7056] overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-[#5a7056] bg-[#293827] text-[#a0a0a0]">
                  <th className="py-3 px-4 text-left font-bold w-24">HORARIO</th>
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
                {HOURS.map((hour) => (
                  <tr key={hour} className="hover:bg-[#293827]/30 transition-colors">
                    <td className="py-4 px-4 text-left font-mono font-bold text-[#65c556]">
                      {hour}
                    </td>

                    {filteredCourts.map((c) => {
                      const { status, label } = getSlotStatus(c.name, hour);
                      return (
                        <td key={c.id} className="py-3 px-3 min-w-[180px]">
                          {status === 'Libre' ? (
                            <button
                              type="button"
                              onClick={() =>
                                onOpenPago({
                                  court: c.name,
                                  courtId: c.id,
                                  sport: selectedSport,
                                  date: targetDateStr,
                                  time: hour,
                                  price: c.pricePerHour
                                })
                              }
                              className="w-full py-2.5 rounded-xl bg-[rgba(101,197,86,0.15)] text-[#65c556] border border-[#65c556]/40 hover:bg-[#65c556] hover:text-[#293827] font-bold text-xs transition-all cursor-pointer shadow-sm"
                            >
                              Reservar (${Math.round(c.pricePerHour * 0.3).toLocaleString('es-AR')})
                            </button>
                          ) : status === 'Torneo' ? (
                            <div className="py-2.5 px-2 rounded-xl bg-[rgba(245,158,11,0.15)] border border-[#f59e0b]/40 text-[#f59e0b] font-bold text-xs">
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
            onClick={onOpenInscripcion}
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

              <button
                type="button"
                onClick={onOpenInscripcion}
                className="w-full py-2.5 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs transition-colors cursor-pointer"
              >
                Inscribir Equipo a este Torneo
              </button>
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
          <p className="text-[11px] mt-0.5">Proyecto de Construcción de Software • Docente: Prof. Lic. María Julia Monasterio</p>
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
    </div>
  );
};

export default LandingPage;
