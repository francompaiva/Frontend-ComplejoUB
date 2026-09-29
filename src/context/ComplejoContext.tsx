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
  SPORT_PRICING,
  INITIAL_COURTS,
  INITIAL_TOURNAMENTS
} from '../data/mockData';
import {
  authApi,
  torneosApi,
  canchasApi,
  reservasApi,
  equiposApi,
  partidosApi,
  listaEsperaApi,
  notificacionesApi,
  reportesApi
} from '../api/endpoints';
import { apiClient } from '../api/client';

export type {
  Court,
  BookingItem,
  Tournament,
  FixtureMatch,
  StandingRow,
  Referee,
  AuditLogItem,
  NotificationItem,
  WaitlistEntry,
  SportType
} from '../data/mockData';

export type UserRole = 'cliente' | 'admin' | 'arbitro' | 'superadmin';

export interface CurrentUser {
  id: number;
  nombre: string;
  email: string;
  rol: string;
  token?: string;
}

export const DEMO_EMAILS: Record<UserRole, string> = {
  cliente: 'lucas@gmail.com',
  admin: 'operador@complejoub.com',
  arbitro: 'arbitro@complejoub.com',
  superadmin: 'admin@complejoub.com',
};

export interface ComplejoContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole, userToSet?: CurrentUser | null) => void;
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
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
  refreshAllData: (currentRole?: UserRole) => Promise<void>;
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
  confirmarAsistencia: (bookingId: string) => Promise<void>;
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
    clientName: r.usuario_nombre || 'Cliente',
    clientEmail: r.usuario_email || '',
    rawStatus: r.estado,
    asistencia_confirmada: r.asistencia_confirmada !== undefined && r.asistencia_confirmada !== null ? Boolean(r.asistencia_confirmada) : null,
  };
}

const DEFAULT_REFEREES: Referee[] = [
  { id: '2', name: 'Sebastian Norjean (Árbitro)', badgeNumber: 'ARB-F5-091', sport: 'Fútbol 5', activeMatches: 3 },
  { id: '3', name: 'Marcos Perez del Cerro', badgeNumber: 'ARB-PAD-042', sport: 'Pádel', activeMatches: 2 },
];

export const ComplejoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<UserRole>(() => loadOr('userRole', 'cliente'));
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    try {
      const stored = localStorage.getItem('complejo_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [courts, setCourts] = useState<Court[]>(INITIAL_COURTS);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>(INITIAL_TOURNAMENTS);
  const [fixtures, setFixtures] = useState<FixtureMatch[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [referees] = useState<Referee[]>(DEFAULT_REFEREES);
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [userAbsences, setUserAbsences] = useState<number>(0);

  // Helper para autenticar automáticamente según el rol activo SOLO si no hay usuario en sesión
  const authenticateRole = useCallback(async (role: UserRole) => {
    const storedUserRaw = localStorage.getItem('complejo_user');
    const token = apiClient.getToken();
    if (storedUserRaw && token) {
      try {
        const parsed = JSON.parse(storedUserRaw);
        const parsedRole = (parsed.rol || '').toLowerCase();
        const roleMatches =
          (role === 'cliente' && parsedRole === 'cliente') ||
          (role === 'arbitro' && parsedRole === 'arbitro') ||
          (role === 'admin' && (parsedRole === 'administrador' || parsedRole === 'admin')) ||
          (role === 'superadmin' && (parsedRole === 'superadministrador' || parsedRole === 'superadmin'));

        if (roleMatches) {
          setCurrentUser(parsed);
          return;
        }
      } catch {
        // ignore
      }
    }

    try {
      const email = DEMO_EMAILS[role];
      const res: any = await authApi.login(email, 'password123');
      if (res && res.token && res.user) {
        apiClient.setToken(res.token);
        localStorage.setItem('complejo_user', JSON.stringify(res.user));
        setCurrentUser(res.user);
      }
    } catch (err: any) {
      console.warn(`[ComplejoContext] Error al autenticar como ${role}:`, err?.message);
    }
  }, []);

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

  // Carga y sincronización con la API backend (Base de Datos MySQL)
  const refreshAllData = useCallback(async (currentRole = userRole) => {
    try {
      const isRoleAdmin = currentRole === 'admin' || currentRole === 'superadmin';
      const [canchas, torneos, resReservas, notifs, logs] = await Promise.all([
        canchasApi.getAll().catch(() => []),
        torneosApi.getAll().catch(() => []),
        (isRoleAdmin ? reservasApi.getAll() : reservasApi.getMisReservas()).catch(() => []),
        notificacionesApi.getMisNotificaciones().catch(() => []),
        (isRoleAdmin ? reportesApi.getAuditoria() : Promise.resolve([])).catch(() => []),
      ]);

      if (Array.isArray(canchas) && canchas.length > 0) {
        setCourts(canchas.map(mapCanchaFromApi));
      }

      if (Array.isArray(torneos) && torneos.length > 0) {
        // Enriquecer torneos con sus equipos inscriptos reales desde MySQL
        const mappedTorneos = await Promise.all(
          torneos.map(async (t: any) => {
            const base = mapTorneoFromApi(t);
            try {
              const equipos = await equiposApi.getAll(t.id);
              if (Array.isArray(equipos)) {
                base.registeredTeams = equipos.map((eq: any) => ({
                  id: String(eq.id),
                  name: eq.nombre,
                  captain: eq.capitan_nombre || 'Capitán',
                  captainEmail: eq.capitan_email || 'capitan@gmail.com',
                  playersCount: eq.jugadores?.length || 5,
                  players: eq.jugadores || []
                }));
              }
            } catch {
              // fallback
            }
            return base;
          })
        );

        setTournaments(mappedTorneos);

        // Seleccionar por defecto el torneo en curso (ej. Copa Verano) para mostrar fixtures y posiciones reales
        const defaultActive = mappedTorneos.find((t) => t.status === 'En curso') || mappedTorneos[0];
        if (defaultActive) {
          await fetchTorneoData(defaultActive.id);
        }
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
  }, [fetchTorneoData, userRole]);

  // Cambio de rol con autenticación instantánea en backend
  const setUserRole = useCallback(async (newRole: UserRole, userToSet?: CurrentUser | null) => {
    setUserRoleState(newRole);
    saveTo('userRole', newRole);
    if (userToSet) {
      setCurrentUser(userToSet);
      localStorage.setItem('complejo_user', JSON.stringify(userToSet));
    } else {
      await authenticateRole(newRole);
    }
    await refreshAllData(newRole);
  }, [authenticateRole, refreshAllData]);

  // Inicialización en montaje: si hay usuario previo en localStorage, restaurarlo; si no, esperar login
  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      const storedUserRaw = localStorage.getItem('complejo_user');
      const token = apiClient.getToken();
      if (storedUserRaw && token) {
        try {
          const parsed = JSON.parse(storedUserRaw);
          setCurrentUser(parsed);
          if (isMounted) {
            await refreshAllData(userRole);
          }
          return;
        } catch {
          // ignore
        }
      }
      if (isMounted) {
        await refreshAllData(userRole);
      }
    };
    init();
    return () => {
      isMounted = false;
    };
  }, []);

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
    const now = new Date();
    if (date === 'Hoy') {
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      cleanDate = `${year}-${month}-${day}`;
    } else if (date === 'Mañana') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      cleanDate = `${year}-${month}-${day}`;
    } else if (date === 'Sábado') {
      const diff = (6 - now.getDay() + 7) % 7 || 7;
      const d = new Date();
      d.setDate(d.getDate() + diff);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      cleanDate = `${year}-${month}-${day}`;
    } else if (date === 'Domingo') {
      const diff = (7 - now.getDay()) % 7 || 7;
      const d = new Date();
      d.setDate(d.getDate() + diff);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      cleanDate = `${year}-${month}-${day}`;
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
        await refreshAllData();
      }
    } catch (err: any) {
      console.warn('[bookCourt] Error al guardar en MySQL:', err?.message);
      alert(`No se pudo completar la reserva en la base de datos: ${err?.message || 'Error al persistir turno'}`);
      throw err;
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
      clientName: currentUser?.nombre || 'Cliente',
      clientEmail: currentUser?.email || ''
    };

    setBookings((prev) => [newBooking, ...prev.filter(b => b.id !== createdId)]);
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
          await refreshAllData();
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
      logAudit('Cancelación con Reintegro', `Reserva #${bookingId} cancelada con anticipación > 24hs. Devolución de seña de $${deposit}.`, 'reserva');
    } else {
      msg = `Reserva cancelada con menos de 24 hs de anticipación. De acuerdo a la política del complejo, no corresponde reintegro de la seña ($${deposit.toLocaleString()}).`;
      addNotification('Cancelación sin Reintegro', msg, 'sancion');
      logAudit('Cancelación Fuera de Término', `Reserva #${bookingId} cancelada con menos de 24hs. Seña de $${deposit} retenida como penalización.`, 'sancion');
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

  // Gestión de canchas en MySQL
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
        await refreshAllData();
        logAudit('Cancha Creada', `Admin dio de alta ${courtData.name} (${courtData.sport}) en base de datos.`, 'cancha');
        addNotification('Nueva Cancha Habilitada', `${courtData.name} disponible para reservas.`, 'info');
        return;
      }
    } catch (err: any) {
      console.warn('[ComplejoContext] canchasApi.create falló:', err?.message);
      alert(`Error al crear cancha en MySQL: ${err?.message || 'Permiso denegado'}`);
      throw err;
    }
  };

  const toggleCourtStatus = async (courtId: string) => {
    const numId = parseInt(courtId.replace(/\D/g, ''), 10);
    const target = courts.find((c) => c.id === courtId);
    if (!target) return;
    const nextStatus = target.status === 'activa' ? 'mantenimiento' : 'activa';
    const nextActiva = nextStatus === 'activa';

    if (!isNaN(numId)) {
      try {
        await canchasApi.update(numId, { activa: nextActiva });
        await refreshAllData();
      } catch (err: any) {
        console.warn('[toggleCourtStatus] Error al actualizar en MySQL:', err?.message);
      }
    }

    setCourts((prev) =>
      prev.map((c) => {
        if (c.id === courtId) {
          return {
            ...c,
            status: nextStatus,
            nextSlot: nextActiva ? 'Libre próximo turno' : 'Bloqueada por mantenimiento'
          };
        }
        return c;
      })
    );
    logAudit(
      'Cambio Estado de Cancha',
      `${target.name} pasó a estado: ${nextActiva ? 'Operativa' : 'En Mantenimiento'}.`,
      'cancha'
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
        await refreshAllData();
        logAudit('Torneo Creado', `Se creó el torneo "${created.nombre || tourneyData.name}" (${tourneyData.sport}) en base de datos.`, 'torneo');
        addNotification('Nuevo Torneo Abierto', `Inscripciones abiertas para "${created.nombre || tourneyData.name}".`, 'torneo');
        return;
      }
    } catch (err: any) {
      console.warn('[ComplejoContext] torneosApi.create falló:', err?.message);
      alert(`Error al crear torneo en MySQL: ${err?.message || 'Error inesperado'}`);
      throw err;
    }
  };

  // Eliminación de torneos en MySQL
  const deleteTournament = async (tournamentId: string) => {
    const target = tournaments.find((t) => t.id === tournamentId);
    if (!target) return;

    const numericId = parseInt(tournamentId.replace(/\D/g, ''), 10);
    if (!isNaN(numericId)) {
      try {
        await torneosApi.delete(numericId);
        await refreshAllData();
        logAudit('Torneo Eliminado', `Se eliminó el torneo "${target.name}" de la base de datos.`, 'torneo');
        addNotification('Torneo Eliminado', `Se eliminó "${target.name}".`, 'info');
      } catch (err: any) {
        console.warn('[ComplejoContext] torneosApi.delete falló:', err?.message);
        alert(`Error al eliminar torneo de MySQL: ${err?.message}`);
      }
    }
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
        await refreshAllData();
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
      await refreshAllData();

      logAudit(
        'Resultado Oficial Registrado en BD',
        `Partido #${matchId} finalizado ${homeScore}-${awayScore}. Posiciones recalculadas automáticamente.`,
        'partido'
      );
      addNotification('Resultado Guardado', `Partido #${matchId} actualizado: ${homeScore} a ${awayScore}.`, 'torneo');
    } catch (err: any) {
      console.warn('[saveMatchResult] API error:', err?.message);
      alert(`Error al registrar resultado en MySQL: ${err?.message || 'Permiso denegado'}`);
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
      await refreshAllData();
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
    let targetBookingId = bookingId;
    if (!targetBookingId) {
      const b = bookings.find(
        (item) =>
          item.status !== 'Cancelada' &&
          (item.clientName?.toLowerCase().includes(clientName.toLowerCase()) ||
           clientName.toLowerCase().includes(item.clientName?.toLowerCase()))
      );
      if (b) targetBookingId = b.id;
    }
    if (!targetBookingId && bookings.length > 0) {
      const b = bookings.find((item) => item.status !== 'Cancelada') || bookings[0];
      targetBookingId = b.id;
    }

    if (targetBookingId) {
      const numId = parseInt(targetBookingId.replace(/\D/g, ''), 10);
      if (!isNaN(numId)) {
        try {
          await reservasApi.registrarInasistencia(numId);
          await refreshAllData();
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
        return 0; // Se resetea el contador tras aplicar la suspensión (corrección docente)
      } else {
        addNotification(
          'Inasistencia Registrada',
          `Se registró una inasistencia a ${clientName} en ${courtName}. Acumula ${next}/3 faltas consecutivas.`,
          'sancion'
        );
        return next;
      }
    });
  };

  const confirmarAsistencia = async (bookingId: string): Promise<void> => {
    const numId = parseInt(bookingId.replace(/\D/g, ''), 10);
    if (!isNaN(numId)) {
      try {
        await reservasApi.confirmarAsistencia(numId);
        await refreshAllData();
      } catch (err: any) {
        console.warn('[confirmarAsistencia] API error:', err?.message);
      }
    }
    setUserAbsences(0); // Resetea contador consecutivo de inasistencias al asistir
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'Completada' } : b))
    );
    addNotification('Asistencia Confirmada', 'Se confirmó la asistencia y se restableció a 0 el contador de inasistencias consecutivas.', 'reserva');
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
        currentUser,
        setCurrentUser,
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
        confirmarAsistencia,
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
