import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  type Court,
  type BookingItem,
  type Tournament,
  type FixtureMatch,
  type StandingRow,
  type Referee,
  type AuditLogItem,
  type NotificationItem,
  type WaitlistEntry,
  type SportType,
  SPORT_PRICING
} from '../data/mockData';
import {
  torneosApi,
  canchasApi,
  reservasApi,
  equiposApi,
  partidosApi,
  listaEsperaApi,
  notificacionesApi,
  reportesApi
} from '../api/endpoints';

export type UserRole = 'cliente' | 'admin' | 'arbitro';

export interface ComplejoContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  courts: Court[];
  bookings: BookingItem[];
  tournaments: Tournament[];
  fixtures: FixtureMatch[];
  standings: StandingRow[];
  referees: Referee[];
  waitlist: WaitlistEntry[];
  auditLogs: AuditLogItem[];
  notifications: NotificationItem[];
  unreadNotifsCount: number;
  userAbsences: number;
  isUserBanned: boolean;

  // Acciones y sincronización con API
  fetchTorneoData: (torneoId: string | number) => Promise<void>;
  refreshAllData: () => Promise<void>;
  bookCourt: (courtId: string, courtName: string, sport: SportType, date: string, time: string) => Promise<BookingItem>;
  cancelBooking: (bookingId: string) => Promise<{ refunded: boolean; depositAmount: number; message: string }>;
  joinWaitlist: (courtName: string, date: string, time: string, userName: string, userPhone: string) => Promise<number>;
  addCourt: (court: Omit<Court, 'id' | 'nextSlot'>) => Promise<void>;
  toggleCourtStatus: (courtId: string) => void;
  createTournament: (tourney: Omit<Tournament, 'id' | 'registeredTeams'>) => Promise<void>;
  deleteTournament: (tournamentId: string) => Promise<void>;
  registerTeam: (tournamentId: string, teamName: string, players: { name: string; dni: string; position: string }[]) => Promise<{ success: boolean; error?: string }>;
  saveMatchResult: (matchId: number, homeScore: number, awayScore: number, status: FixtureMatch['status'], yellowCards?: FixtureMatch['yellowCards'], redCards?: FixtureMatch['redCards'], observations?: string) => Promise<void>;
  assignReferee: (matchId: number, refereeName: string) => Promise<void>;
  markAbsence: (clientName: string, courtName: string, bookingId?: string) => Promise<void>;
  markNotificationRead: (notifId: string) => void;
  markAllNotificationsRead: () => void;
  resetDemoData: () => void;
}

const ComplejoContext = createContext<ComplejoContextType | undefined>(undefined);

const STORAGE_PREFIX = 'complejo_ub_';

function loadOr<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(STORAGE_PREFIX + key);
    if (saved) return JSON.parse(saved);
  } catch {
    // ignore
  }
  return fallback;
}

function saveTo<T>(key: string, val: T) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

function mapSportFromApi(s: string): SportType {
  const norm = (s || '').toLowerCase();
  if (norm.includes('5')) return 'Fútbol 5';
  if (norm.includes('8')) return 'Fútbol 8';
  if (norm.includes('11')) return 'Fútbol 11';
  if (norm.includes('padel') || norm.includes('pádel')) return 'Pádel';
  if (norm.includes('tenis')) return 'Tenis';
  return 'Fútbol 5';
}

function mapTorneoFromApi(t: any): Tournament {
  const estadoMap: Record<string, Tournament['status']> = {
    'INSCRIPCION_ABIERTA': 'Inscripciones abiertas',
    'EN_CURSO': 'En curso',
    'FINALIZADO': 'Finalizado',
    'CANCELADO': 'Finalizado',
  };

  let formattedDates = 'Octubre - Noviembre 2026';
  if (t.fecha_inicio && t.fecha_fin) {
    try {
      const d1 = new Date(t.fecha_inicio).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
      const d2 = new Date(t.fecha_fin).toLocaleDateString('es-AR', { month: 'short', day: 'numeric' });
      formattedDates = `${d1} al ${d2}`;
    } catch {
      // fallback
    }
  }

  return {
    id: String(t.id),
    name: t.nombre,
    sport: mapSportFromApi(t.deporte),
    status: estadoMap[t.estado] || 'Inscripciones abiertas',
    entryFee: Number(t.costo_inscripcion) || 15000,
    matchFee: Number(t.valor_partido) || 4000,
    maxTeams: Number(t.max_equipos) || 8,
    registeredTeams: [],
    dates: formattedDates,
    prize: t.reglamento || '$100.000 + Medallas y Trofeo Oficial',
    format: 'Liga (Todos contra todos)',
  };
}

function mapCanchaFromApi(c: any): Court {
  return {
    id: String(c.id),
    name: c.nombre,
    sport: mapSportFromApi(c.deporte),
    surface: c.superficie || 'Sintético',
    hasLighting: Boolean(c.iluminacion),
    pricePerHour: Number(c.precio_hora) || 15000,
    status: c.activa ? 'activa' : 'mantenimiento',
    nextSlot: '19:00 hs',
  };
}

function mapPartidoFromApi(p: any, torneoNombre = ''): FixtureMatch {
  const isFree = !p.fk_equipo_visitante_id || p.equipo_visitante === 'Fecha Libre';
  const statusMap: Record<string, FixtureMatch['status']> = {
    'PROGRAMADO': 'Programado',
    'DISPUTADO': 'Disputado',
    'SUSPENDIDO': 'Suspendido',
    'REPROGRAMADO': 'Reprogramado',
  };

  let formattedDate = p.fecha ? String(p.fecha).split('T')[0] : '';
  let formattedTime = p.hora ? String(p.hora).slice(0, 5) + ' hs' : '';

  return {
    id: Number(p.id),
    tournamentId: String(p.fk_torneo_id),
    tournamentName: p.torneo_nombre || torneoNombre || `Torneo #${p.fk_torneo_id}`,
    round: `Fecha ${p.numero_fecha}`,
    homeTeam: p.equipo_local || 'Local',
    awayTeam: isFree ? 'Fecha Libre' : (p.equipo_visitante || 'Visitante'),
    isFreeDate: isFree,
    freeTeamName: isFree ? p.equipo_local : undefined,
    date: formattedDate,
    time: formattedTime,
    court: p.cancha_nombre || (isFree ? 'Fecha Libre' : 'Cancha Oficial'),
    refereeName: p.arbitro_nombre || 'Sin designar',
    status: statusMap[p.estado] || 'Programado',
    homeScore: p.goles_local !== null && p.goles_local !== undefined ? Number(p.goles_local) : undefined,
    awayScore: p.goles_visitante !== null && p.goles_visitante !== undefined ? Number(p.goles_visitante) : undefined,
    observations: p.observaciones || undefined,
  };
}

function mapStandingFromApi(row: any, index: number): StandingRow {
  return {
    pos: index + 1,
    team: row.nombre,
    pj: Number(row.partidos_jugados) || 0,
    pg: Number(row.partidos_ganados) || 0,
    pe: Number(row.partidos_empatados) || 0,
    pp: Number(row.partidos_perdidos) || 0,
    gf: Number(row.goles_favor) || 0,
    gc: Number(row.goles_contra) || 0,
    pts: Number(row.puntos) || 0,
  };
}

function mapReservaFromApi(r: any): BookingItem {
  const statusMap: Record<string, BookingItem['status']> = {
    'CONFIRMADA': 'Confirmada',
    'CANCELADA': 'Cancelada',
    'FINALIZADA': 'Completada',
    'INASISTENCIA': 'Cancelada',
  };
  const total = Number(r.monto_total) || 18000;
  const sena = Number(r.monto_sena) || Math.round(total * 0.3);
  return {
    id: String(r.id),
    courtId: String(r.fk_cancha_id),
    courtName: r.cancha_nombre || `Cancha #${r.fk_cancha_id}`,
    sport: mapSportFromApi(r.cancha_deporte || 'Futbol 5'),
    date: r.fecha ? String(r.fecha).split('T')[0] : 'Hoy',
    time: r.hora ? String(r.hora).slice(0, 5) + ' hs' : '19:00 hs',
    totalPrice: total,
    depositPaid: sena,
    remainingBalance: total - sena,
    status: statusMap[r.estado] || 'Confirmada',
    hoursUntilMatch: 48,
    clientName: r.usuario_nombre || 'Lucas Díaz',
    clientEmail: r.usuario_email || 'lucas@gmail.com',
  };
}

const DEFAULT_REFEREES: Referee[] = [
  { id: '2', name: 'Sebastian Norjean (Árbitro)', badgeNumber: 'ARB-F5-091', sport: 'Fútbol 5', activeMatches: 3 },
  { id: '3', name: 'Marcos Perez del Cerro', badgeNumber: 'ARB-PAD-042', sport: 'Pádel', activeMatches: 2 },
];

export const ComplejoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>(() => loadOr('userRole', 'cliente'));
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [fixtures, setFixtures] = useState<FixtureMatch[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [referees] = useState<Referee[]>(DEFAULT_REFEREES);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userAbsences, setUserAbsences] = useState<number>(0);

  // Carga de fixture y tabla de posiciones para un torneo desde la BD
  const fetchTorneoData = useCallback(async (torneoId: string | number) => {
    const numId = typeof torneoId === 'number' ? torneoId : parseInt(String(torneoId).replace(/\D/g, ''), 10);
    if (isNaN(numId) || numId <= 0) return;

    try {
      const [fixData, standData] = await Promise.all([
        torneosApi.getFixture(numId),
        torneosApi.getTablaPosiciones(numId),
      ]);

      if (Array.isArray(fixData)) {
        setFixtures(fixData.map((p: any) => mapPartidoFromApi(p)));
      }
      if (Array.isArray(standData)) {
        setStandings(standData.map((s: any, idx: number) => mapStandingFromApi(s, idx)));
      }
    } catch (err: any) {
      console.warn(`[ComplejoContext] Error al cargar detalles del torneo #${numId}:`, err?.message);
    }
  }, []);

  // Carga y sincronización inicial con la API backend (Base de Datos MySQL)
  const refreshAllData = useCallback(async () => {
    try {
      const [canchas, torneos, resReservas, notifs, logs] = await Promise.all([
        canchasApi.getAll().catch(() => []),
        torneosApi.getAll().catch(() => []),
        reservasApi.getAll().catch(() => []),
        notificacionesApi.getMisNotificaciones().catch(() => []),
        reportesApi.getAuditoria().catch(() => []),
      ]);

      if (Array.isArray(canchas) && canchas.length > 0) {
        setCourts(canchas.map(mapCanchaFromApi));
      }

      if (Array.isArray(torneos) && torneos.length > 0) {
        const mappedTorneos = torneos.map(mapTorneoFromApi);
        setTournaments(mappedTorneos);
        // Cargar fixture y tabla del primer torneo (e.g. Copa Verano)
        await fetchTorneoData(mappedTorneos[0].id);
      }

      if (Array.isArray(resReservas) && resReservas.length > 0) {
        setBookings(resReservas.map(mapReservaFromApi));
      }

      if (Array.isArray(notifs) && notifs.length > 0) {
        setNotifications(
          notifs.map((n: any) => ({
            id: String(n.id),
            title: n.titulo,
            message: n.mensaje,
            timeAgo: 'Reciente',
            read: Boolean(n.leida),
            type: n.tipo?.toLowerCase().includes('sancion') ? 'sancion' : n.tipo?.toLowerCase().includes('torneo') ? 'torneo' : 'reserva',
          }))
        );
      }

      if (Array.isArray(logs) && logs.length > 0) {
        setAuditLogs(
          logs.map((l: any) => ({
            id: String(l.id),
            timestamp: l.created_at ? new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hs' : 'Hoy',
            adminName: l.usuario_nombre || 'Administrador General',
            action: l.accion,
            detail: typeof l.detalles === 'string' ? l.detalles : JSON.stringify(l.detalles || {}),
            type: l.entidad_afectada as any,
          }))
        );
      }
    } catch (err: any) {
      console.warn('[ComplejoContext] Error en sincronización general con API:', err?.message);
    }
  }, [fetchTorneoData]);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  useEffect(() => saveTo('userRole', userRole), [userRole]);

  const isUserBanned = userAbsences >= 3;

  const logAudit = (action: string, detail: string, type: AuditLogItem['type']) => {
    const newLog: AuditLogItem = {
      id: 'aud-' + Date.now(),
      timestamp: 'Hoy, ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' hs',
      adminName: userRole === 'admin' ? 'Administrador General' : 'Sistema Automático',
      action,
      detail,
      type
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const addNotification = (title: string, message: string, type: NotificationItem['type']) => {
    const newNotif: NotificationItem = {
      id: 'notif-' + Date.now(),
      title,
      message,
      timeAgo: 'Recién',
      read: false,
      type
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Reserva de turnos con seña del 30% en MySQL
  const bookCourt = async (courtId: string, courtName: string, sport: SportType, date: string, time: string): Promise<BookingItem> => {
    const totalPrice = SPORT_PRICING[sport] || 18000;
    const depositPaid = Math.round(totalPrice * 0.3);
    const remainingBalance = totalPrice - depositPaid;
    const numCanchaId = parseInt(courtId.replace(/\D/g, ''), 10) || 1;

    let cleanDate = date;
    if (date === 'Hoy') {
      cleanDate = new Date().toISOString().split('T')[0];
    } else if (date === 'Mañana') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      cleanDate = d.toISOString().split('T')[0];
    }

    const cleanHour = time.replace(' hs', '').trim() + (time.includes(':') ? (time.split(':').length === 2 ? ':00' : '') : ':00:00');

    let createdId = 'res-' + Date.now();
    try {
      const apiRes: any = await reservasApi.create({
        canchaId: numCanchaId,
        fecha: cleanDate,
        hora: cleanHour
      });
      if (apiRes && apiRes.id) {
        createdId = String(apiRes.id);
      }
    } catch (err: any) {
      console.warn('[bookCourt] Error al guardar en MySQL:', err?.message);
    }

    const newBooking: BookingItem = {
      id: createdId,
      courtId,
      courtName,
      sport,
      date: cleanDate,
      time,
      totalPrice,
      depositPaid,
      remainingBalance,
      status: 'Confirmada',
      hoursUntilMatch: 48,
      clientName: 'Lucas Díaz',
      clientEmail: 'lucas@gmail.com'
    };

    setBookings((prev) => [newBooking, ...prev]);
    addNotification(
      '¡Turno Reservado con Éxito!',
      `Cancha ${courtName} para el ${cleanDate} a las ${time}. Seña abonada: $${depositPaid.toLocaleString()}. Saldo en complejo: $${remainingBalance.toLocaleString()}.`,
      'reserva'
    );
    logAudit('Nueva Reserva de Cancha', `Cliente reservó ${courtName} (${sport}) para el ${cleanDate} a las ${time}. Seña 30%: $${depositPaid}.`, 'reserva');
    return newBooking;
  };

  // Cancelación de reservas con regla de 24 horas en MySQL
  const cancelBooking = async (bookingId: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    const numId = parseInt(bookingId.replace(/\D/g, ''), 10);

    let isRefundable = target ? target.hoursUntilMatch > 24 : true;
    let deposit = target ? target.depositPaid : 5400;

    if (!isNaN(numId)) {
      try {
        const res: any = await reservasApi.cancelar(numId, 'Cancelado por solicitud del cliente');
        if (res) {
          isRefundable = Boolean(res.aplicaDevolucion);
          if (res.montoSenaDevuelto !== undefined) deposit = Number(res.montoSenaDevuelto);
        }
      } catch (err: any) {
        console.warn('[cancelBooking] Error al cancelar en MySQL:', err?.message);
      }
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelada' } : b))
    );

    let msg = '';
    if (isRefundable) {
      msg = `Reserva cancelada con más de 24 hs de anticipación. Se reintegra el 100% de la seña ($${deposit.toLocaleString()}) al medio de pago original.`;
      addNotification('Cancelación con Reembolso', msg, 'reserva');
      logAudit('Cancelación con Reintegro', `Reserva ${bookingId} cancelada con anticipación > 24hs. Devolución de seña de $${deposit}.`, 'reserva');
    } else {
      msg = `Reserva cancelada con menos de 24 hs de anticipación. De acuerdo a la política del complejo, no corresponde reintegro de la seña ($${deposit.toLocaleString()}).`;
      addNotification('Cancelación sin Reintegro', msg, 'sancion');
      logAudit('Cancelación Fuera de Término', `Reserva ${bookingId} cancelada con menos de 24hs. Seña de $${deposit} retenida como penalización.`, 'sancion');
    }

    return { refunded: isRefundable, depositAmount: deposit, message: msg };
  };

  // Lista de espera
  const joinWaitlist = async (courtName: string, date: string, time: string, userName: string, userPhone: string): Promise<number> => {
    const position = waitlist.length + 1;
    const cleanHour = time.replace(' hs', '').trim() + ':00';
    let cleanDate = date === 'Hoy' ? new Date().toISOString().split('T')[0] : date;

    try {
      const canchaTarget = courts.find(c => c.name.toLowerCase() === courtName.toLowerCase());
      const cId = canchaTarget ? parseInt(canchaTarget.id, 10) : 1;
      await listaEsperaApi.unirse({ canchaId: cId, fecha: cleanDate, hora: cleanHour });
    } catch (err: any) {
      console.warn('[joinWaitlist] API error:', err?.message);
    }

    const entry: WaitlistEntry = {
      id: 'w-' + Date.now(),
      courtName,
      date: cleanDate,
      time,
      userName,
      userPhone,
      position
    };
    setWaitlist((prev) => [...prev, entry]);
    addNotification('Anotado en Lista de Espera', `Estás en la posición #${position} para ${courtName} a las ${time}.`, 'info');
    return position;
  };

  // Gestión de canchas
  const addCourt = async (courtData: Omit<Court, 'id' | 'nextSlot'>) => {
    try {
      const created = await canchasApi.create({
        nombre: courtData.name,
        deporte: courtData.sport.replace('ú', 'u').replace('á', 'a'),
        superficie: courtData.surface,
        iluminacion: courtData.hasLighting,
        precio_hora: courtData.pricePerHour
      });
      if (created) {
        const mapped = mapCanchaFromApi(created);
        setCourts((prev) => [...prev, mapped]);
        logAudit('Cancha Creada', `Admin dio de alta ${mapped.name} (${mapped.sport}) en base de datos.`, 'cancha');
        addNotification('Nueva Cancha Habilitada', `${mapped.name} disponible para reservas.`, 'info');
        return;
      }
    } catch (err: any) {
      console.warn('[ComplejoContext] canchasApi.create falló:', err?.message);
    }

    const newCourt: Court = {
      ...courtData,
      id: 'c-' + (courts.length + 1),
      nextSlot: 'Disponible próximo turno'
    };
    setCourts((prev) => [...prev, newCourt]);
  };

  const toggleCourtStatus = (courtId: string) => {
    setCourts((prev) =>
      prev.map((c) => {
        if (c.id === courtId) {
          const next = c.status === 'activa' ? 'mantenimiento' : 'activa';
          logAudit(
            'Cambio Estado de Cancha',
            `${c.name} pasó a estado: ${next === 'activa' ? 'Operativa' : 'En Mantenimiento'}.`,
            'cancha'
          );
          return {
            ...c,
            status: next,
            nextSlot: next === 'activa' ? 'Libre próximo turno' : 'Bloqueada por mantenimiento'
          };
        }
        return c;
      })
    );
  };

  // Creación de torneos en MySQL
  const createTournament = async (tourneyData: Omit<Tournament, 'id' | 'registeredTeams'>) => {
    try {
      const created = await torneosApi.create({
        nombre: tourneyData.name,
        deporte: tourneyData.sport.replace('ú', 'u').replace('á', 'a'),
        costo_inscripcion: tourneyData.entryFee,
        valor_partido: tourneyData.matchFee,
        max_equipos: tourneyData.maxTeams,
        reglamento: tourneyData.prize
      });
      if (created) {
        const mapped = mapTorneoFromApi(created);
        setTournaments((prev) => [mapped, ...prev]);
        logAudit('Torneo Creado', `Se creó el torneo "${mapped.name}" (${mapped.sport}) en base de datos.`, 'torneo');
        addNotification('Nuevo Torneo Abierto', `Inscripciones abiertas para "${mapped.name}".`, 'torneo');
        return;
      }
    } catch (err: any) {
      console.warn('[ComplejoContext] torneosApi.create falló:', err?.message);
    }

    const newT: Tournament = {
      ...tourneyData,
      id: 't-' + (tournaments.length + 1),
      registeredTeams: []
    };
    setTournaments((prev) => [newT, ...prev]);
  };

  // Eliminación de torneos en MySQL
  const deleteTournament = async (tournamentId: string) => {
    const target = tournaments.find((t) => t.id === tournamentId);
    if (!target) return;

    const numericId = parseInt(tournamentId.replace(/\D/g, ''), 10);
    if (!isNaN(numericId)) {
      try {
        await torneosApi.delete(numericId);
      } catch (err: any) {
        console.warn('[ComplejoContext] torneosApi.delete falló:', err?.message);
      }
    }

    setTournaments((prev) => prev.filter((t) => t.id !== tournamentId));
    setFixtures((prev) => prev.filter((f) => f.tournamentId !== tournamentId));
    logAudit('Torneo Eliminado', `Se eliminó el torneo "${target.name}" de la base de datos.`, 'torneo');
  };

  // Inscripción de equipos y control de participación en MySQL
  const registerTeam = async (
    tournamentId: string,
    teamName: string,
    players: { name: string; dni: string; position: string }[]
  ): Promise<{ success: boolean; error?: string }> => {
    const numTorneoId = parseInt(tournamentId.replace(/\D/g, ''), 10);
    if (!isNaN(numTorneoId)) {
      try {
        await equiposApi.inscribir({
          torneoId: numTorneoId,
          nombreEquipo: teamName
        });
        await fetchTorneoData(numTorneoId);
        logAudit('Inscripción de Equipo', `Equipo "${teamName}" inscripto con éxito (${players.length} jugadores registrados).`, 'torneo');
        addNotification('Equipo Inscripto', `Tu equipo "${teamName}" fue admitido en el torneo.`, 'torneo');
        return { success: true };
      } catch (err: any) {
        console.warn('[registerTeam] API error:', err?.message);
        return {
          success: false,
          error: err?.message || 'Error al inscribir equipo en base de datos'
        };
      }
    }
    return { success: false, error: 'ID de torneo inválido' };
  };

  // Carga de resultados oficial conectada a MySQL y triggers
  const saveMatchResult = async (
    matchId: number,
    homeScore: number,
    awayScore: number,
    status: FixtureMatch['status'],
    yellowCards?: FixtureMatch['yellowCards'],
    redCards?: FixtureMatch['redCards'],
    observations?: string
  ): Promise<void> => {
    try {
      const cardDetails = [
        yellowCards && yellowCards.length > 0 ? `${yellowCards.length} amarillas` : '',
        redCards && redCards.length > 0 ? `${redCards.length} rojas` : ''
      ].filter(Boolean).join(', ');

      const finalObs = observations || (cardDetails ? `Tarjetas: ${cardDetails}` : 'Resultado registrado oficialmente por colegiado.');

      await partidosApi.registrarResultado(matchId, {
        golesLocal: homeScore,
        golesVisitante: awayScore,
        observaciones: finalObs
      });

      // Recargar fixture y tabla de posiciones actualizadas en MySQL vía trigger
      const targetMatch = fixtures.find(f => f.id === matchId);
      if (targetMatch && targetMatch.tournamentId) {
        await fetchTorneoData(targetMatch.tournamentId);
      }

      logAudit(
        'Resultado Oficial Registrado en BD',
        `Partido #${matchId} finalizado ${homeScore}-${awayScore}. Posiciones recalculadas automáticamente.`,
        'partido'
      );
      addNotification('Resultado Guardado', `Partido #${matchId} actualizado: ${homeScore} a ${awayScore}.`, 'torneo');
    } catch (err: any) {
      console.warn('[saveMatchResult] API error:', err?.message);
      // Fallback local visual
      setFixtures((prev) =>
        prev.map((m) =>
          m.id === matchId
            ? { ...m, homeScore, awayScore, status, observations: observations || m.observations }
            : m
        )
      );
    }
  };

  // Asignación de árbitros conectada a MySQL
  const assignReferee = async (matchId: number, refereeName: string): Promise<void> => {
    const ref = referees.find((r) => r.name.toLowerCase().includes(refereeName.toLowerCase())) || referees[0];
    const arbitroId = ref ? parseInt(ref.id, 10) : 2;

    try {
      await partidosApi.asignarArbitro(matchId, arbitroId);
      const targetMatch = fixtures.find(f => f.id === matchId);
      if (targetMatch && targetMatch.tournamentId) {
        await fetchTorneoData(targetMatch.tournamentId);
      }
      logAudit('Designación Arbitral', `Árbitro ${refereeName} asignado al partido ID #${matchId} en base de datos.`, 'torneo');
    } catch (err: any) {
      console.warn('[assignReferee] API error:', err?.message);
      setFixtures((prev) =>
        prev.map((m) => (m.id === matchId ? { ...m, refereeName } : m))
      );
    }
  };

  // Control de inasistencias en MySQL
  const markAbsence = async (clientName: string, courtName: string, bookingId?: string): Promise<void> => {
    if (bookingId) {
      const numId = parseInt(bookingId.replace(/\D/g, ''), 10);
      if (!isNaN(numId)) {
        try {
          await reservasApi.registrarInasistencia(numId);
        } catch (err: any) {
          console.warn('[markAbsence] API error:', err?.message);
        }
      }
    }

    setUserAbsences((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        addNotification(
          '⚠️ SANCIÓN APLICADA: Suspensión por Inasistencias',
          `El usuario ${clientName} ha acumulado 3 inasistencias consecutivas. Cuenta suspendida por 2 semanas en MySQL.`,
          'sancion'
        );
      } else {
        addNotification(
          'Inasistencia Registrada',
          `Se registró una inasistencia a ${clientName} en ${courtName}. Acumula ${next}/3 faltas.`,
          'sancion'
        );
      }
      return next;
    });
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
    const numId = parseInt(notifId.replace(/\D/g, ''), 10);
    if (!isNaN(numId)) {
      notificacionesApi.marcarLeida(numId).catch(() => {});
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    notificacionesApi.marcarTodas().catch(() => {});
  };

  const resetDemoData = () => {
    localStorage.clear();
    refreshAllData();
    addNotification('Datos Sincronizados', 'Se recargaron los registros de la base de datos MySQL.', 'info');
  };

  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  return (
    <ComplejoContext.Provider
      value={{
        userRole,
        setUserRole,
        courts,
        bookings,
        tournaments,
        fixtures,
        standings,
        referees,
        waitlist,
        auditLogs,
        notifications,
        unreadNotifsCount,
        userAbsences,
        isUserBanned,
        fetchTorneoData,
        refreshAllData,
        bookCourt,
        cancelBooking,
        joinWaitlist,
        addCourt,
        toggleCourtStatus,
        createTournament,
        deleteTournament,
        registerTeam,
        saveMatchResult,
        assignReferee,
        markAbsence,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoData
      }}
    >
      {children}
    </ComplejoContext.Provider>
  );
};

export const useComplejo = (): ComplejoContextType => {
  const context = useContext(ComplejoContext);
  if (!context) {
    throw new Error('useComplejo must be used within a ComplejoProvider');
  }
  return context;
};
