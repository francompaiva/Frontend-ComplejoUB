
import React, { useState, useMemo, useEffect } from 'react';
import './LandingPage.css';
import { useComplejo } from '../context/ComplejoContext';
import { canchasApi } from '../api/endpoints';
import { type BookingSlotInfo } from '../components/ConfirmacionPagoModal';
import { type SportType, type Tournament, SPORT_PRICING } from '../data/mockData';
import ListaEsperaModal from '../components/ListaEsperaModal';
import TorneoDetalleModal from '../components/TorneoDetalleModal';
import { IconCalendar, IconClock } from '../components/Icons';
import { getQuickDatesBuenosAires, formatDateSpanish } from '../utils/dateUtils';

export interface LandingPageProps {

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

type AvailabilitySlot = {
  hora: string;
  estado: 'Libre' | 'Ocupado' | 'DeshabilitadoTorneo' | 'Mantenimiento';
  motivo?: string;
};

type AvailabilityState = {
  key: string;
  byCourt: Record<string, AvailabilitySlot[]>;
  error: boolean;
};

export const LandingPage: React.FC<LandingPageProps> = ({

  onOpenInscripcion,
  onOpenPago
}) => {
  const { tournaments, standings, courts, bookings, fixtures, joinWaitlist, isUserBanned, currentUser } = useComplejo();
  const [selectedSport, setSelectedSport] = useState<SportType>('Fútbol 5');
  const [detailModalTorneo, setDetailModalTorneo] = useState<Tournament | null>(null);

  // Fechas de conveniencia sincronizadas con la zona horaria del complejo (Argentina UTC-3)
  const { today: todayStr, tomorrow: tomorrowStr, saturday: saturdayStr, sunday: sundayStr } = useMemo(
    () => getQuickDatesBuenosAires(),
    []
  );

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
  const filteredCourts = useMemo(
    () => courts.filter((c) => c.sport === selectedSport),
    [courts, selectedSport]
  );

  // La disponibilidad pública del backend incluye reservas de TODOS los clientes.
  // Evitamos usar 'getMisReservas()' para determinar si un turno está libre.
  const availabilityKey = `${selectedDate}|${selectedSport}|${filteredCourts.map((c) => c.id).join(',')}`;
  const [availabilityState, setAvailabilityState] = useState<AvailabilityState | null>(null);

  useEffect(() => {
    let cancelled = false;
    let latestRequest = 0;

    const loadAvailability = async () => {
      const requestId = ++latestRequest;
      setAvailabilityState(null);

      try {
        const entries = await Promise.all(filteredCourts.map(async (court) => {
          const data: { slots?: AvailabilitySlot[] } = await canchasApi.getDisponibilidad(Number(court.id), selectedDate);
          if (!Array.isArray(data?.slots)) {
            throw new Error(`Disponibilidad sin datos para la cancha ${court.id}`);
          }
          return [court.id, data.slots] as const;
        }));

        if (!cancelled && requestId === latestRequest) {
          setAvailabilityState({ key: availabilityKey, byCourt: Object.fromEntries(entries), error: false });
        }
      } catch (error) {
        console.warn('[LandingPage] No se pudo consultar disponibilidad:', error);
        if (!cancelled && requestId === latestRequest) {
          // Si la API falla, no mostrar horarios como libres por error.
          setAvailabilityState({ key: availabilityKey, byCourt: {}, error: true });
        }
      }
    };

    void loadAvailability();
    const refreshOnFocus = () => {
      if (document.visibilityState === 'visible') void loadAvailability();
    };
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnFocus);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnFocus);
    };
  }, [availabilityKey, selectedDate, filteredCourts, bookings]);

  // Filtrado de franjas horarias por turno
  const displayedHours = ALL_HOURS.filter((h) => {
    const hourNum = parseInt(h.split(':')[0], 10);
    if (shiftFilter === 'morning') return hourNum >= 9 && hourNum < 17;
    if (shiftFilter === 'evening') return hourNum >= 17;
    return true;
  });

  // Los estados Libre/Ocupado/Torneo vienen de la disponibilidad global de MySQL.
  const getSlotStatus = (courtId: string, courtName: string, hour: string) => {
    const cleanHour = hour.replace(' hs', '').trim();

    // Un horario que ya pasó nunca se puede reservar.
    const hourNum = parseInt(cleanHour.split(':')[0], 10);
    const minuteNum = parseInt(cleanHour.split(':')[1] || '0', 10);
    const hourFormatted = `${hourNum.toString().padStart(2, '0')}:${minuteNum.toString().padStart(2, '0')}:00`;
    const slotDateTime = new Date(`${selectedDate}T${hourFormatted}-03:00`);
    if (slotDateTime.getTime() <= Date.now()) {
      return { status: 'Pasado' as const, label: 'Horario concluido' };
    }

    if (!availabilityState || availabilityState.key !== availabilityKey) {
      return { status: 'Consultando' as const, label: 'Consultando...' };
    }
    if (availabilityState.error) {
      return { status: 'Error' as const, label: 'Sin conexión' };
    }

    const slot = availabilityState.byCourt[courtId]?.find((s) => s.hora === cleanHour);
    if (!slot) {
      return { status: 'Error' as const, label: 'Sin datos' };
    }

    if (slot.estado === 'DeshabilitadoTorneo') {
      // El backend determina el bloqueo; el fixture aporta el nombre de los equipos si lo tenemos.
      const matchOnCourt = fixtures.find(
        (m) =>
          !m.isFreeDate &&
          Boolean(m.courtId === courtId || (m.court && (m.court === courtName || courtName.includes(m.court) || m.court.includes(courtName)))) &&
          m.time?.slice(0, 5) === cleanHour &&
          m.date === selectedDate
      );
      return {
        status: 'Torneo' as const,
        label: matchOnCourt ? `🏆 ${matchOnCourt.homeTeam} vs ${matchOnCourt.awayTeam}` : '🏆 Turno de torneo'
      };
    }
    if (slot.estado === 'Ocupado' || slot.estado === 'Mantenimiento') {
      return { status: 'Ocupado' as const, label: 'Ocupado' };
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

  // Formato legible para la fecha seleccionada
  const formattedSelectedDate = useMemo(() => formatDateSpanish(selectedDate), [selectedDate]);

  return (
    <div className="lp-page">
      {/* Hero Banner */}
      <div className="lp-hero">
        
        <h1 className="lp-hero-title">
          ¡Reservá tu Cancha en Segundos!
        </h1>
        <p className="lp-hero-description">
          Instalaciones de primer nivel para Fútbol 5, Fútbol 8, Fútbol 11, Pádel y Tenis. Turnos de 1 hora con confirmación inmediata.
        </p>
        

        
        <span className="lp-hero-badge">
          Reserva Online con Seña del 30%
        </span>
      </div>

      {/* Schedule Table Section */}
      <div className="lp-schedule-section">
        <div className="lp-schedule-head">
          <div>
            <div className="lp-schedule-title-row">
              <h2 className="lp-section-title">Disponibilidad de Turnos</h2>
              <span className="lp-selected-date">
                {formattedSelectedDate}
              </span>
            </div>
            <p className="lp-schedule-caption">
              Tarifa fija para {selectedSport}: <strong className="lp-price">${(SPORT_PRICING[selectedSport] || 18000).toLocaleString('es-AR')}</strong> (Seña 30%: ${Math.round((SPORT_PRICING[selectedSport] || 18000) * 0.3).toLocaleString('es-AR')})
            </p>
            <div className="lp-sport-list">
          {(['Fútbol 5', 'Fútbol 8', 'Fútbol 11', 'Pádel', 'Tenis'] as SportType[]).map((sport) => (
            <button
              key={sport}
              type="button"
              onClick={() => setSelectedSport(sport)}
              className={`lp-sport-button${selectedSport === sport ? " is-active" : ""}`}
            >
              {sport} (${(SPORT_PRICING[sport] || 18000).toLocaleString('es-AR')}/h)
            </button>
          ))}
        </div>
          </div>

          {/* Interactive Date & Filter Controls */}
          <div className="lp-filter-toolbar">
            {/* Quick date shortcuts */}
            <div className="lp-filter-group">
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={`lp-date-button${selectedDate === todayStr ? " is-active" : ""}`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(tomorrowStr)}
                className={`lp-date-button${selectedDate === tomorrowStr ? " is-active" : ""}`}
              >
                Mañana
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(saturdayStr)}
                className={`lp-date-button${selectedDate === saturdayStr ? " is-active" : ""}`}
              >
                Sábado
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(sundayStr)}
                className={`lp-date-button${selectedDate === sundayStr ? " is-active" : ""}`}
              >
                Domingo
              </button>
            </div>

            {/* Interactive Calendar Date Picker */}
            <div className="lp-calendar-control">
              <IconCalendar size={16} className="lp-calendar-icon" />
              <input
                type="date"
                min={todayStr}
                value={selectedDate}
                onChange={(e) => {
                  if (e.target.value) setSelectedDate(e.target.value);
                }}
                className="lp-calendar-input"
                title="Elegir cualquier fecha en el calendario"
              />
            </div>

            {/* Shift Filter (Turno) */}
            <div className="lp-filter-group">
              <button
                type="button"
                onClick={() => setShiftFilter('all')}
                className={`lp-shift-button${shiftFilter === "all" ? " is-active" : ""}`}
              >
                Todos los Horarios
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('morning')}
                className={`lp-shift-button${shiftFilter === "morning" ? " is-active" : ""}`}
              >
                Mañana (9-16h)
              </button>
              <button
                type="button"
                onClick={() => setShiftFilter('evening')}
                className={`lp-shift-button${shiftFilter === "evening" ? " is-active" : ""}`}
              >
                Tarde/Noche (17-23h)
              </button>
            </div>
          </div>
        </div>

        {/* Banner de Sanción Vigente (RF-05) */}
        {isUserBanned && (
          <div className="lp-ban-banner">
            <div className="lp-ban-main">
              <span className="lp-ban-icon">🚫</span>
              <div>
                <h3 className="lp-ban-title">
                  Cuenta Suspendida para Nuevas Reservas
                </h3>
                <p className="lp-ban-text">
                  Has acumulado <strong>3 inasistencias consecutivas</strong> a turnos reservados. De acuerdo a la normativa del complejo deportivo, tu cuenta está bloqueada {currentUser?.suspension_hasta ? `hasta el ${new Date(currentUser.suspension_hasta).toLocaleDateString('es-AR')}` : 'durante 14 días'}. Los botones de reserva permanecerán inhabilitados.
                </p>
              </div>
            </div>
            <span className="lp-ban-pill">
              Sanción Activa
            </span>
          </div>
        )}

        {/* Weekend notice if applicable */}
        {isWeekend && (
          <div className="lp-weekend-banner">
            <span className="lp-weekend-icon">🏆</span>
            <span>
              <strong>Aviso de Torneo Oficial:</strong> Durante el fin de semana se disputan las fechas del torneo oficial en las canchas programadas. Cada partido ocupa únicamente su cancha y horario asignado; todas las demás canchas u horarios libres están 100% habilitados para reservas comunes con el 30% de seña.
            </span>
          </div>
        )}

        {/* Timetable */}
        <div className="lp-schedule-card">
          <div className="lp-scroll-x">
            <table className="lp-data-table">
              <thead>
                <tr className="lp-schedule-table-head">
                  <th className="lp-time-header">HORARIO</th>
                  {filteredCourts.map((c) => (
                    <th key={c.id} className="lp-court-header">
                      {c.name}
                    </th>
                  ))}
                  {filteredCourts.length === 0 && (
                    <th className="lp-empty-header">
                      Canchas de {selectedSport}
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="lp-schedule-table-body">
                {displayedHours.map((hour) => (
                  <tr key={hour} className="lp-slot-row">
                    <td className="lp-time-cell">
                      <IconClock size={13} className="lp-clock-icon" />
                      <span>{hour}</span>
                    </td>

                    {filteredCourts.map((c) => {
                      const { status, label } = getSlotStatus(c.id, c.name, hour);
                      return (
                        <td key={c.id} className="lp-slot-cell">
                          {status === 'Pasado' ? (
                            <div
                              className="lp-slot-past"
                              title="Este horario ya ha concluido"
                            >
                              Concluido
                            </div>
                          ) : status === 'Consultando' || status === 'Error' ? (
                            <div className="lp-slot-past" title={status === 'Error' ? 'No se pudo verificar la disponibilidad en el servidor' : 'Consultando la disponibilidad en el servidor'}>
                              {label}
                            </div>
                          ) : status === 'Libre' ? (
                            isUserBanned ? (
                              <button
                                type="button"
                                disabled
                                title="No puedes reservar: tu cuenta está suspendida por acumulación de inasistencias"
                                className="lp-slot-suspended"
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
                                className="lp-slot-book"
                              >
                                Reservar (${Math.round(c.pricePerHour * 0.3).toLocaleString('es-AR')})
                              </button>
                            )
                          ) : status === 'Torneo' ? (
                            <div
                              className="lp-slot-tournament"
                              title="Cancha reservada para encuentro oficial de torneo"
                            >
                              {label}
                            </div>
                          ) : (
                            <div className="lp-slot-occupied-wrapper">
                              <span className="lp-slot-occupied">
                                Turno Ocupado
                              </span>
                              <button
                                type="button"
                                onClick={() => handleOpenWaitlist(c.name, hour)}
                                className="lp-waitlist-btn"
                              >
                                ⏳ Lista de Espera
                              </button>
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {filteredCourts.length === 0 && (
                      <td className="lp-empty-cell">
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
      <div className="lp-tournaments-section">
        <div className="lp-tournaments-head">
          <div>
            <span className="lp-eyebrow">
              Competencias Oficiales UB
            </span>
            <h2 className="lp-tournaments-title">Torneos de Fin de Semana</h2>
            <p className="lp-tournaments-description">
              Inscripción de equipos, fixtures automáticos y tablas de posiciones actualizadas en vivo.
            </p>
          </div>

          
          {tournaments.some(t =>
            t.status === 'Inscripciones abiertas' &&
            (t.registeredTeams || []).length < t.maxTeams
          ) && (
            <button
              type="button"
              onClick={() => onOpenInscripcion()}
              className="lp-join-team-btn"
            >
              + Inscribir mi Equipo
            </button>
          )}

        </div>

        <div className="lp-tournament-list">
          {tournaments.filter(t => t.status !== 'Finalizado').map((t) => (
            <div
              key={t.id}
              className="lp-tournament-card"
            >
              <div>
                <div className="lp-tournament-topline">
                  <span className="lp-tournament-category">
                    {t.sport} • {t.format}
                  </span>
                  <span className="lp-tournament-status">
                    {t.status}
                  </span>
                </div>
                <h3 className="lp-tournament-name">{t.name}</h3>
                <p className="lp-tournament-dates"> {t.dates}</p>

                <div className="lp-tournament-stats">
                  <div>
                    <span className="lp-stat-label">Inscripción:</span>
                    <span className="lp-stat-value">${Number(t.entryFee || 0).toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <span className="lp-stat-label">Equipos:</span>
                    <span className="lp-stat-value-accent">{(t.registeredTeams || []).length} / {t.maxTeams || 8}</span>
                  </div>
                </div>

                <p className="lp-tournament-prize">
                  <strong>Premio:</strong> {t.prize}
                </p>
              </div>

              <div className="lp-tournament-actions">
                <button
                  type="button"
                  onClick={() => setDetailModalTorneo(t)}
                  className="lp-tournament-details"
                >
                  Ver Detalles
                </button>
               
                {t.status === 'Inscripciones abiertas' &&
                  (t.registeredTeams || []).length < t.maxTeams && (
                  <button
                    type="button"
                    onClick={() => onOpenInscripcion(t.id)}
                    className="lp-tournament-enroll"
                  >
                    Inscribir Equipo
                  </button>
                )}

              </div>
            </div>
          ))}
        </div>

        {/* Live Standings Table */}
        <div className="lp-standings-section">
          <h3 className="lp-standings-title">
            Tabla de Posiciones Oficial — Copa Apertura Fútbol 5
          </h3>
          <p className="lp-standings-description">
            Actualización inmediata tras la carga de resultados arbitrales.
          </p>

          <div className="lp-standings-card">
            <div className="lp-scroll-x">
              <table className="lp-data-table">
                <thead>
                  <tr className="lp-standings-header">
                    <th className="lp-pos-header">POS</th>
                    <th className="lp-team-header">EQUIPO</th>
                    <th className="lp-number-header">PJ</th>
                    <th className="lp-number-header">PG</th>
                    <th className="lp-number-header">PE</th>
                    <th className="lp-number-header">PP</th>
                    <th className="lp-number-header">GF</th>
                    <th className="lp-number-header">GC</th>
                    <th className="lp-number-header">DIF</th>
                    <th className="lp-points-header">PTS</th>
                  </tr>
                </thead>
                <tbody className="lp-standings-body">
                  {standings.map((s, idx) => (
                    <tr
                      key={s.team}
                      className={`lp-standing-row${idx === 0 ? " is-first" : ""}`}
                    >
                      <td className="lp-ranking-cell">
                        {s.pos}° {idx === 0 && '👑'}
                      </td>
                      <td className="lp-team-cell">{s.team}</td>
                      <td className="lp-stat-cell">{s.pj}</td>
                      <td className="lp-stat-cell">{s.pg}</td>
                      <td className="lp-stat-cell">{s.pe}</td>
                      <td className="lp-stat-cell">{s.pp}</td>
                      <td className="lp-stat-cell">{s.gf}</td>
                      <td className="lp-stat-cell">{s.gc}</td>
                      <td className="lp-diff-cell">
                        {s.gf - s.gc > 0 ? `+${s.gf - s.gc}` : s.gf - s.gc}
                      </td>
                      <td className="lp-points-cell">
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

     

      {/* Modal Lista de Espera */}
      <ListaEsperaModal
        isOpen={waitlistModal.isOpen}
        courtName={waitlistModal.courtName}
        date={waitlistModal.date}
        time={waitlistModal.time}
        onClose={() => setWaitlistModal({ ...waitlistModal, isOpen: false })}
        onConfirm={(name, phone) =>
          joinWaitlist(
            waitlistModal.courtName,
            waitlistModal.date,
            waitlistModal.time,
            name,
            phone
          )
        }
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
