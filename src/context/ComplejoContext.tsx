import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  type Court,
  type BookingItem,
  type Tournament,
  type TournamentTeam,
  type FixtureMatch,
  type StandingRow,
  type Referee,
  type AuditLogItem,
  type NotificationItem,
  type WaitlistEntry,
  type SportType,
  INITIAL_COURTS,
  INITIAL_USER_BOOKINGS,
  INITIAL_TOURNAMENTS,
  INITIAL_FIXTURES,
  INITIAL_STANDINGS,
  INITIAL_REFEREES,
  INITIAL_AUDIT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_WAITLIST,
  SPORT_PRICING
} from '../data/mockData';

export type UserRole = 'cliente' | 'admin' | 'arbitro';

interface ComplejoContextType {
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

  // Acciones
  bookCourt: (courtId: string, courtName: string, sport: SportType, date: string, time: string) => BookingItem;
  cancelBooking: (bookingId: string) => { refunded: boolean; depositAmount: number; message: string };
  joinWaitlist: (courtName: string, date: string, time: string, userName: string, userPhone: string) => number;
  addCourt: (court: Omit<Court, 'id' | 'nextSlot'>) => void;
  toggleCourtStatus: (courtId: string) => void;
  createTournament: (tourney: Omit<Tournament, 'id' | 'registeredTeams'>) => void;
  deleteTournament: (tournamentId: string) => void;
  registerTeam: (tournamentId: string, teamName: string, players: { name: string; dni: string; position: string }[]) => { success: boolean; error?: string };
  saveMatchResult: (matchId: number, homeScore: number, awayScore: number, status: FixtureMatch['status'], yellowCards?: FixtureMatch['yellowCards'], redCards?: FixtureMatch['redCards'], observations?: string) => void;
  assignReferee: (matchId: number, refereeName: string) => void;
  markAbsence: (clientName: string, courtName: string) => void;
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

export const ComplejoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>(() => loadOr('userRole', 'cliente'));
  const [courts, setCourts] = useState<Court[]>(() => loadOr('courts', INITIAL_COURTS));
  const [bookings, setBookings] = useState<BookingItem[]>(() => loadOr('bookings', INITIAL_USER_BOOKINGS));
  const [tournaments, setTournaments] = useState<Tournament[]>(() => loadOr('tournaments', INITIAL_TOURNAMENTS));
  const [fixtures, setFixtures] = useState<FixtureMatch[]>(() => loadOr('fixtures', INITIAL_FIXTURES));
  const [standings, setStandings] = useState<StandingRow[]>(() => loadOr('standings', INITIAL_STANDINGS));
  const [referees, setReferees] = useState<Referee[]>(() => loadOr('referees', INITIAL_REFEREES));
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>(() => loadOr('waitlist', INITIAL_WAITLIST));
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => loadOr('auditLogs', INITIAL_AUDIT_LOGS));
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => loadOr('notifications', INITIAL_NOTIFICATIONS));
  const [userAbsences, setUserAbsences] = useState<number>(() => loadOr('userAbsences', 0));

  useEffect(() => saveTo('userRole', userRole), [userRole]);
  useEffect(() => saveTo('courts', courts), [courts]);
  useEffect(() => saveTo('bookings', bookings), [bookings]);
  useEffect(() => saveTo('tournaments', tournaments), [tournaments]);
  useEffect(() => saveTo('fixtures', fixtures), [fixtures]);
  useEffect(() => saveTo('standings', standings), [standings]);
  useEffect(() => saveTo('referees', referees), [referees]);
  useEffect(() => saveTo('waitlist', waitlist), [waitlist]);
  useEffect(() => saveTo('auditLogs', auditLogs), [auditLogs]);
  useEffect(() => saveTo('notifications', notifications), [notifications]);
  useEffect(() => saveTo('userAbsences', userAbsences), [userAbsences]);

  const isUserBanned = userAbsences >= 3; // 3 inasistencias consecutivas bloquean 2 semanas

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

  // Reserva de turnos con seña del 30%
  const bookCourt = (courtId: string, courtName: string, sport: SportType, date: string, time: string): BookingItem => {
    const totalPrice = SPORT_PRICING[sport] || 18000;
    const depositPaid = Math.round(totalPrice * 0.3);
    const remainingBalance = totalPrice - depositPaid;

    const newBooking: BookingItem = {
      id: 'res-' + Date.now(),
      courtId,
      courtName,
      sport,
      date,
      time,
      totalPrice,
      depositPaid,
      remainingBalance,
      status: 'Confirmada',
      hoursUntilMatch: date.includes('Hoy') ? 4 : 48,
      clientName: 'Juan Pérez',
      clientEmail: 'juan.perez@ub.edu.ar'
    };

    setBookings((prev) => [newBooking, ...prev]);
    addNotification(
      '¡Turno Reservado con Éxito!',
      `Cancha ${courtName} para el ${date} a las ${time}. Seña abonada: $${depositPaid.toLocaleString()}. Saldo en complejo: $${remainingBalance.toLocaleString()}.`,
      'reserva'
    );
    logAudit('Nueva Reserva de Cancha', `Cliente Juan Pérez reservó ${courtName} (${sport}) para el ${date} a las ${time}. Seña 30%: $${depositPaid}.`, 'reserva');
    return newBooking;
  };

  // Cancelación de reservas con regla de 24 horas
  const cancelBooking = (bookingId: string) => {
    const target = bookings.find((b) => b.id === bookingId);
    if (!target) return { refunded: false, depositAmount: 0, message: 'Reserva no encontrada' };

    const isRefundable = target.hoursUntilMatch > 24;
    const deposit = target.depositPaid;

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
  const joinWaitlist = (courtName: string, date: string, time: string, userName: string, userPhone: string): number => {
    const currentCountForSlot = waitlist.filter((w) => w.courtName === courtName && w.time === time).length;
    const position = currentCountForSlot + 1;
    const entry: WaitlistEntry = {
      id: 'w-' + Date.now(),
      courtName,
      date,
      time,
      userName,
      userPhone,
      position
    };
    setWaitlist((prev) => [...prev, entry]);
    addNotification('Anotado en Lista de Espera', `Estás en la posición #${position} para ${courtName} a las ${time}. Te notificaremos si el turno se libera.`, 'info');
    return position;
  };

  // Gestión de canchas
  const addCourt = (courtData: Omit<Court, 'id' | 'nextSlot'>) => {
    const newCourt: Court = {
      ...courtData,
      id: 'c-' + (courts.length + 1),
      nextSlot: 'Disponible próximo turno'
    };
    setCourts((prev) => [...prev, newCourt]);
    logAudit('Cancha Creada', `Admin dio de alta ${newCourt.name} (${newCourt.sport}) con tarifa fija de $${newCourt.pricePerHour}/h.`, 'cancha');
    addNotification('Nueva Cancha Habilitada', `${newCourt.name} disponible para reservas.`, 'info');
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

  // Creación de torneos
  const createTournament = (tourneyData: Omit<Tournament, 'id' | 'registeredTeams'>) => {
    const newT: Tournament = {
      ...tourneyData,
      id: 't-' + (tournaments.length + 1),
      registeredTeams: []
    };
    setTournaments((prev) => [...prev, newT]);
    logAudit('Torneo Creado', `Se creó el torneo "${newT.name}" (${newT.sport}) con cupo para ${newT.maxTeams} equipos en modalidad Liga.`, 'torneo');
    addNotification('Nuevo Torneo Abierto', `Inscripciones abiertas para "${newT.name}".`, 'torneo');
  };

  // Eliminación de torneos
  const deleteTournament = (tournamentId: string) => {
    const target = tournaments.find((t) => t.id === tournamentId);
    if (!target) return;

    setTournaments((prev) => prev.filter((t) => t.id !== tournamentId));
    setFixtures((prev) => prev.filter((f) => f.tournamentId !== tournamentId && f.tournamentName !== target.name));

    logAudit(
      'Torneo Eliminado',
      `Se eliminó el torneo "${target.name}" (${target.sport}) y todos sus registros vinculados.`,
      'torneo'
    );
    addNotification(
      'Torneo Eliminado',
      `El torneo "${target.name}" fue eliminado del sistema por el Administrador.`,
      'torneo'
    );
  };

  // Inscripción de equipos y control de participación
  const registerTeam = (tournamentId: string, teamName: string, players: { name: string; dni: string; position: string }[]) => {
    const tourney = tournaments.find((t) => t.id === tournamentId);
    if (!tourney) return { success: false, error: 'Torneo no encontrado' };

    // Control de participación (1 jugador no puede participar en >1 equipo del mismo torneo)
    const existingPlayersDni = new Set<string>();
    tourney.registeredTeams.forEach((tm) => {
      tm.players.forEach((p) => existingPlayersDni.add(p.dni.trim()));
    });

    for (const p of players) {
      if (existingPlayersDni.has(p.dni.trim())) {
        return {
          success: false,
          error: `El jugador ${p.name} (DNI ${p.dni}) ya está inscripto en otro equipo de este mismo torneo.`
        };
      }
    }

    const newTeam: TournamentTeam = {
      id: 'tm-' + Date.now(),
      name: teamName,
      captain: players[0]?.name || 'Capitán',
      captainEmail: 'capitan@equipo.com',
      playersCount: players.length,
      players
    };

    setTournaments((prev) =>
      prev.map((t) => (t.id === tournamentId ? { ...t, registeredTeams: [...t.registeredTeams, newTeam] } : t))
    );

    logAudit('Inscripción de Equipo', `Equipo "${teamName}" inscripto en "${tourney.name}" con ${players.length} jugadores validados.`, 'torneo');
    addNotification('Equipo Inscripto', `Tu equipo "${teamName}" fue admitido en "${tourney.name}".`, 'torneo');
    return { success: true };
  };

  // Carga de resultados y actualización automática de tabla de posiciones
  const saveMatchResult = (
    matchId: number,
    homeScore: number,
    awayScore: number,
    status: FixtureMatch['status'],
    yellowCards?: FixtureMatch['yellowCards'],
    redCards?: FixtureMatch['redCards'],
    observations?: string
  ) => {
    let homeTeam = '';
    let awayTeam = '';
    let matchRound = '';

    setFixtures((prev) =>
      prev.map((m) => {
        if (m.id === matchId) {
          homeTeam = m.homeTeam;
          awayTeam = m.awayTeam;
          matchRound = m.round;
          return {
            ...m,
            homeScore,
            awayScore,
            status,
            yellowCards: yellowCards || m.yellowCards,
            redCards: redCards || m.redCards,
            observations: observations || m.observations
          };
        }
        return m;
      })
    );

    // Recalcular tabla de posiciones dinámicamente si disputado
    if (status === 'Disputado' && homeTeam && awayTeam) {
      setStandings((prev) => {
        const table = prev.map((row) => ({ ...row }));
        let hRow = table.find((r) => r.team === homeTeam);
        let aRow = table.find((r) => r.team === awayTeam);

        if (!hRow) {
          hRow = { pos: table.length + 1, team: homeTeam, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
          table.push(hRow);
        }
        if (!aRow) {
          aRow = { pos: table.length + 1, team: awayTeam, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 };
          table.push(aRow);
        }

        hRow.pj += 1;
        aRow.pj += 1;
        hRow.gf += homeScore;
        hRow.gc += awayScore;
        aRow.gf += awayScore;
        aRow.gc += homeScore;

        if (homeScore > awayScore) {
          hRow.pg += 1;
          hRow.pts += 3;
          aRow.pp += 1;
        } else if (homeScore < awayScore) {
          aRow.pg += 1;
          aRow.pts += 3;
          hRow.pp += 1;
        } else {
          hRow.pe += 1;
          hRow.pts += 1;
          aRow.pe += 1;
          aRow.pts += 1;
        }

        // Ordenar por Puntos > Dif Gol > Goles a favor
        table.sort((a, b) => {
          if (b.pts !== a.pts) return b.pts - a.pts;
          const difB = b.gf - b.gc;
          const difA = a.gf - a.gc;
          if (difB !== difA) return difB - difA;
          return b.gf - a.gf;
        });

        return table.map((item, idx) => ({ ...item, pos: idx + 1 }));
      });

      logAudit(
        'Resultado Oficial Registrado',
        `${matchRound}: ${homeTeam} (${homeScore}) - ${awayTeam} (${awayScore}). Tabla de posiciones recalculada en tiempo real.`,
        'partido'
      );
      addNotification(
        'Resultado Actualizado',
        `${homeTeam} ${homeScore} vs ${awayTeam} ${awayScore}. La tabla de posiciones ha sido actualizada.`,
        'torneo'
      );
    }
  };

  // Asignación de árbitros
  const assignReferee = (matchId: number, refereeName: string) => {
    setFixtures((prev) =>
      prev.map((m) => (m.id === matchId ? { ...m, refereeName } : m))
    );
    logAudit('Designación Arbitral', `Árbitro ${refereeName} asignado al partido ID #${matchId}.`, 'torneo');
  };

  // Control de inasistencias (3 consecutivas = suspensión 2 semanas)
  const markAbsence = (clientName: string, courtName: string) => {
    setUserAbsences((prev) => {
      const next = prev + 1;
      if (next >= 3) {
        addNotification(
          '⚠️ SANCIÓN APLICADA: Suspensión por Inasistencias',
          `El usuario ${clientName} ha acumulado 3 inasistencias consecutivas. Cuenta suspendida por 2 semanas para nuevas reservas.`,
          'sancion'
        );
        logAudit(
          'Sanción Automática de Bloqueo',
          `Usuario ${clientName} sancionado con 2 semanas sin poder reservar por acumulación de 3 inasistencias consecutivas.`,
          'sancion'
        );
      } else {
        addNotification(
          'Inasistencia Registrada',
          `Se registró una inasistencia a ${clientName} en ${courtName}. Acumula ${next}/3 faltas consecutivas antes de la sanción.`,
          'sancion'
        );
        logAudit('Inasistencia Registrada', `Inasistencia para ${clientName} en ${courtName}. Total: ${next}/3 faltas.`, 'sancion');
      }
      return next;
    });
  };

  const markNotificationRead = (notifId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const resetDemoData = () => {
    setCourts(INITIAL_COURTS);
    setBookings(INITIAL_USER_BOOKINGS);
    setTournaments(INITIAL_TOURNAMENTS);
    setFixtures(INITIAL_FIXTURES);
    setStandings(INITIAL_STANDINGS);
    setReferees(INITIAL_REFEREES);
    setWaitlist(INITIAL_WAITLIST);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setUserAbsences(0);
    localStorage.clear();
    addNotification('Datos Demo Restablecidos', 'El estado del prototipo ha sido reiniciado a los valores iniciales de cátedra.', 'info');
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
