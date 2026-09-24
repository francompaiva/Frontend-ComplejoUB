export type SportType = 'Fútbol 5' | 'Fútbol 8' | 'Fútbol 11' | 'Pádel' | 'Tenis';

export interface Court {
  id: string;
  name: string;
  sport: SportType;
  surface: string;
  hasLighting: boolean;
  pricePerHour: number;
  status: 'activa' | 'mantenimiento';
  nextSlot: string;
}

export interface BookingItem {
  id: string;
  courtId: string;
  courtName: string;
  sport: SportType;
  date: string;
  time: string;
  totalPrice: number;
  depositPaid: number; // 30%
  remainingBalance: number; // 70%
  status: 'Confirmada' | 'Pendiente' | 'Completada' | 'Cancelada';
  hoursUntilMatch: number; // para verificar regla de 24 horas
  clientName: string;
  clientEmail: string;
}

export interface TournamentTeam {
  id: string;
  name: string;
  captain: string;
  captainEmail: string;
  playersCount: number;
  players: { name: string; dni: string; position: string }[];
}

export interface Tournament {
  id: string;
  name: string;
  sport: SportType;
  status: 'Inscripciones abiertas' | 'En curso' | 'Finalizado';
  entryFee: number;
  matchFee: number;
  maxTeams: number;
  registeredTeams: TournamentTeam[];
  dates: string;
  prize: string;
  format: 'Liga (Todos contra todos)';
}

export interface FixtureMatch {
  id: number;
  tournamentId: string;
  tournamentName: string;
  round: string; // e.g. 'Fecha 1', 'Fecha 2'
  homeTeam: string;
  awayTeam: string;
  isFreeDate?: boolean; // Fecha libre rotativa para número impar de equipos
  freeTeamName?: string;
  date: string;
  time: string;
  court: string;
  refereeName?: string;
  status: 'Programado' | 'Disputado' | 'Suspendido' | 'Reprogramado';
  homeScore?: number;
  awayScore?: number;
  yellowCards?: { team: string; player: string; minute: number }[];
  redCards?: { team: string; player: string; minute: number; reason: string }[];
  observations?: string;
}

export interface StandingRow {
  pos: number;
  team: string;
  pj: number;
  pg: number;
  pe: number;
  pp: number;
  gf: number;
  gc: number;
  pts: number;
}

export interface Referee {
  id: string;
  name: string;
  badgeNumber: string;
  sport: SportType;
  activeMatches: number;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  detail: string;
  type: 'cancha' | 'torneo' | 'partido' | 'sancion' | 'reserva';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timeAgo: string;
  read: boolean;
  type: 'reserva' | 'torneo' | 'sancion' | 'info';
}

// LÍMITES DE JUGADORES POR DEPORTE
export const SQUAD_LIMITS: Record<SportType, { min: number; max: number }> = {
  'Fútbol 5': { min: 5, max: 10 },
  'Fútbol 8': { min: 8, max: 14 },
  'Fútbol 11': { min: 11, max: 18 },
  'Pádel': { min: 2, max: 4 },
  'Tenis': { min: 1, max: 4 }
};

// PRECIOS FIJOS POR HORA POR DEPORTE
export const SPORT_PRICING: Record<SportType, number> = {
  'Fútbol 5': 18000,
  'Fútbol 8': 24000,
  'Fútbol 11': 35000,
  'Pádel': 12000,
  'Tenis': 14000
};

// CANCHAS INICIALES
export const INITIAL_COURTS: Court[] = [
  { id: 'c1', name: 'Cancha 1 – Fútbol 5', sport: 'Fútbol 5', surface: 'Césped sintético Forbex', hasLighting: true, pricePerHour: 18000, status: 'activa', nextSlot: 'Libre 19:00 hs' },
  { id: 'c2', name: 'Cancha 2 – Fútbol 5 Pro', sport: 'Fútbol 5', surface: 'Sintético techado', hasLighting: true, pricePerHour: 18000, status: 'activa', nextSlot: 'Ocupada 20:00 hs' },
  { id: 'c3', name: 'Cancha 3 – Fútbol 8 Principal', sport: 'Fútbol 8', surface: 'Césped sintético monofilamento', hasLighting: true, pricePerHour: 24000, status: 'activa', nextSlot: 'Libre 21:00 hs' },
  { id: 'c4', name: 'Cancha 4 – Fútbol 11 Reglamentaria', sport: 'Fútbol 11', surface: 'Césped natural nivel profesional', hasLighting: true, pricePerHour: 35000, status: 'activa', nextSlot: 'Libre 22:00 hs' },
  { id: 'c5', name: 'Pádel Cristal 1', sport: 'Pádel', surface: 'Césped azul texturado', hasLighting: true, pricePerHour: 12000, status: 'activa', nextSlot: 'Libre 18:00 hs' },
  { id: 'c6', name: 'Pádel Cristal 2', sport: 'Pádel', surface: 'Césped azul panorámica', hasLighting: true, pricePerHour: 12000, status: 'mantenimiento', nextSlot: 'Mantenimiento Red' },
  { id: 'c7', name: 'Tenis Central – Polvo de Ladrillo', sport: 'Tenis', surface: 'Polvo de ladrillo compactado', hasLighting: true, pricePerHour: 14000, status: 'activa', nextSlot: 'Libre 17:00 hs' },
  { id: 'c8', name: 'Tenis Rápida 2', sport: 'Tenis', surface: 'Cemento Hard Court', hasLighting: true, pricePerHour: 14000, status: 'activa', nextSlot: 'Ocupada 19:00 hs' }
];

// RESERVAS DEL CLIENTE DEMO
export const INITIAL_USER_BOOKINGS: BookingItem[] = [
  {
    id: 'res-101',
    courtId: 'c1',
    courtName: 'Cancha 1 – Fútbol 5',
    sport: 'Fútbol 5',
    date: 'Sábado 24 Octubre',
    time: '20:00 hs',
    totalPrice: 18000,
    depositPaid: 5400, // 30%
    remainingBalance: 12600, // 70%
    status: 'Confirmada',
    hoursUntilMatch: 36, // Más de 24h -> devuelve seña
    clientName: 'Juan Pérez',
    clientEmail: 'juan.perez@ub.edu.ar'
  },
  {
    id: 'res-102',
    courtId: 'c5',
    courtName: 'Pádel Cristal 1',
    sport: 'Pádel',
    date: 'Hoy',
    time: '21:00 hs',
    totalPrice: 12000,
    depositPaid: 3600,
    remainingBalance: 8400,
    status: 'Confirmada',
    hoursUntilMatch: 3, // Menos de 24h -> no devuelve seña
    clientName: 'Juan Pérez',
    clientEmail: 'juan.perez@ub.edu.ar'
  },
  {
    id: 'res-103',
    courtId: 'c7',
    courtName: 'Tenis Central – Polvo de Ladrillo',
    sport: 'Tenis',
    date: 'Viernes 18 Sep',
    time: '18:00 hs',
    totalPrice: 14000,
    depositPaid: 4200,
    remainingBalance: 9800,
    status: 'Completada',
    hoursUntilMatch: -100,
    clientName: 'Juan Pérez',
    clientEmail: 'juan.perez@ub.edu.ar'
  }
];

// TORNEOS DEMO
export const INITIAL_TOURNAMENTS: Tournament[] = [
  {
    id: 't1',
    name: 'Copa Apertura Fútbol 5 UB',
    sport: 'Fútbol 5',
    status: 'En curso',
    entryFee: 15000,
    matchFee: 4000,
    maxTeams: 6,
    dates: 'Sábados y Domingos de Septiembre',
    prize: '$80.000 + Trofeo Oficial UB',
    format: 'Liga (Todos contra todos)',
    registeredTeams: [
      {
        id: 'tm-1',
        name: 'Los Galácticos FC',
        captain: 'Juan Pérez',
        captainEmail: 'juan.perez@ub.edu.ar',
        playersCount: 7,
        players: [
          { name: 'Juan Pérez', dni: '40.123.456', position: 'Delantero' },
          { name: 'Matías Rodríguez', dni: '39.882.114', position: 'Arquero' },
          { name: 'Lucas Paiva', dni: '41.229.400', position: 'Defensor' },
          { name: 'Sebastián Norjean', dni: '42.110.339', position: 'Mediocampista' },
          { name: 'Nicolás Marco', dni: '40.887.652', position: 'Defensor' },
          { name: 'Tomás Cerro', dni: '41.554.912', position: 'Delantero' },
          { name: 'Santiago López', dni: '40.901.233', position: 'Mediocampista' }
        ]
      },
      {
        id: 'tm-2',
        name: 'La Naranja Mecánica',
        captain: 'Esteban Quito',
        captainEmail: 'esteban@gmail.com',
        playersCount: 6,
        players: [
          { name: 'Esteban Quito', dni: '38.991.222', position: 'Delantero' },
          { name: 'Martín Palermo', dni: '37.112.445', position: 'Delantero' },
          { name: 'Fabián Cubero', dni: '39.102.934', position: 'Defensor' },
          { name: 'Juan Román', dni: '38.455.123', position: 'Mediocampista' },
          { name: 'Roberto Abbondanzieri', dni: '36.887.123', position: 'Arquero' },
          { name: 'Rolando Schiavi', dni: '37.554.109', position: 'Defensor' }
        ]
      },
      {
        id: 'tm-3',
        name: 'Pico y Pala FC',
        captain: 'Carlos Tévez',
        captainEmail: 'tevez@gmail.com',
        playersCount: 6,
        players: [
          { name: 'Carlos Tévez', dni: '37.882.110', position: 'Delantero' },
          { name: 'Gabriel Heinze', dni: '36.991.002', position: 'Defensor' },
          { name: 'Javier Mascherano', dni: '37.221.455', position: 'Mediocampista' },
          { name: 'Gonzalo Higuaín', dni: '38.109.223', position: 'Delantero' },
          { name: 'Pablo Zabaleta', dni: '37.443.910', position: 'Defensor' },
          { name: 'Sergio Romero', dni: '38.902.118', position: 'Arquero' }
        ]
      },
      {
        id: 'tm-4',
        name: 'Aston Birra',
        captain: 'Marcos Rojo',
        captainEmail: 'rojo@gmail.com',
        playersCount: 6,
        players: [
          { name: 'Marcos Rojo', dni: '39.001.992', position: 'Defensor' },
          { name: 'Enzo Pérez', dni: '38.112.450', position: 'Mediocampista' },
          { name: 'Franco Armani', dni: '37.994.120', position: 'Arquero' },
          { name: 'Nacho Fernández', dni: '38.776.321', position: 'Mediocampista' },
          { name: 'Lucas Pratto', dni: '37.884.221', position: 'Delantero' },
          { name: 'Milton Casco', dni: '38.223.901', position: 'Defensor' }
        ]
      },
      {
        id: 'tm-5',
        name: 'Real Bañil',
        captain: 'Darío Benedetto',
        captainEmail: 'dario@gmail.com',
        playersCount: 5,
        players: [
          { name: 'Darío Benedetto', dni: '39.554.210', position: 'Delantero' },
          { name: 'Frank Fabra', dni: '38.776.992', position: 'Defensor' },
          { name: 'Agustín Rossi', dni: '40.112.334', position: 'Arquero' },
          { name: 'Alan Varela', dni: '42.991.442', position: 'Mediocampista' },
          { name: 'Luca Langoni', dni: '43.110.229', position: 'Delantero' }
        ]
      }
    ]
  },
  {
    id: 't2',
    name: 'Torneo Relámpago Pádel Dobles',
    sport: 'Pádel',
    status: 'Inscripciones abiertas',
    entryFee: 8000,
    matchFee: 2500,
    maxTeams: 8,
    dates: 'Sábado 26 de Septiembre – 14:00 hs',
    prize: '$40.000 en órdenes de compra',
    format: 'Liga (Todos contra todos)',
    registeredTeams: [
      {
        id: 'tmp-1',
        name: 'Los Smashers',
        captain: 'Nicolás Marco',
        captainEmail: 'nicolas.marco@ub.edu.ar',
        playersCount: 2,
        players: [
          { name: 'Nicolás Marco', dni: '40.887.652', position: 'Revés' },
          { name: 'Tomás Cerro', dni: '41.554.912', position: 'Drive' }
        ]
      },
      {
        id: 'tmp-2',
        name: 'Volea Perfecta',
        captain: 'Guillermo Vilas',
        captainEmail: 'vilas@gmail.com',
        playersCount: 2,
        players: [
          { name: 'Guillermo Vilas', dni: '25.112.334', position: 'Drive' },
          { name: 'José Luis Clerc', dni: '26.882.110', position: 'Revés' }
        ]
      }
    ]
  }
];

// FIXTURE DE PARTIDOS
export const INITIAL_FIXTURES: FixtureMatch[] = [
  {
    id: 1,
    tournamentId: 't1',
    tournamentName: 'Copa Apertura F5',
    round: 'Fecha 1',
    homeTeam: 'Los Galácticos FC',
    awayTeam: 'La Naranja Mecánica',
    date: 'Sábado 12 Sep',
    time: '18:00 hs',
    court: 'Cancha 1 – Fútbol 5',
    refereeName: 'Carlos Castrilli',
    status: 'Disputado',
    homeScore: 4,
    awayScore: 2,
    yellowCards: [
      { team: 'Los Galácticos FC', player: 'Nicolás Marco', minute: 14 },
      { team: 'La Naranja Mecánica', player: 'Rolando Schiavi', minute: 28 }
    ],
    redCards: [],
    observations: 'Partido disputado con normalidad. Excelente nivel deportivo.'
  },
  {
    id: 2,
    tournamentId: 't1',
    tournamentName: 'Copa Apertura F5',
    round: 'Fecha 1',
    homeTeam: 'Pico y Pala FC',
    awayTeam: 'Aston Birra',
    date: 'Sábado 12 Sep',
    time: '19:00 hs',
    court: 'Cancha 2 – Fútbol 5 Pro',
    refereeName: 'Carlos Castrilli',
    status: 'Disputado',
    homeScore: 3,
    awayScore: 3,
    yellowCards: [{ team: 'Aston Birra', player: 'Marcos Rojo', minute: 35 }],
    redCards: [],
    observations: 'Empate electrizante sobre el final del encuentro.'
  },
  {
    id: 3,
    tournamentId: 't1',
    tournamentName: 'Copa Apertura F5',
    round: 'Fecha 1',
    homeTeam: 'Real Bañil',
    awayTeam: '',
    isFreeDate: true,
    freeTeamName: 'Real Bañil',
    date: 'Sábado 12 Sep',
    time: '-',
    court: '-',
    status: 'Disputado',
    observations: 'Fecha libre rotativa asignada por cantidad impar de equipos.'
  },
  {
    id: 4,
    tournamentId: 't1',
    tournamentName: 'Copa Apertura F5',
    round: 'Fecha 2',
    homeTeam: 'Los Galácticos FC',
    awayTeam: 'Real Bañil',
    date: 'Hoy',
    time: '20:30 hs',
    court: 'Cancha 1 – Fútbol 5',
    refereeName: 'Carlos Castrilli',
    status: 'Programado',
    observations: 'Partido clave por la punta del torneo.'
  },
  {
    id: 5,
    tournamentId: 't1',
    tournamentName: 'Copa Apertura F5',
    round: 'Fecha 2',
    homeTeam: 'La Naranja Mecánica',
    awayTeam: 'Pico y Pala FC',
    date: 'Hoy',
    time: '21:45 hs',
    court: 'Cancha 2 – Fútbol 5 Pro',
    refereeName: 'Horacio Elizondo',
    status: 'Programado'
  },
  {
    id: 6,
    tournamentId: 't1',
    tournamentName: 'Copa Apertura F5',
    round: 'Fecha 2',
    homeTeam: 'Aston Birra',
    awayTeam: '',
    isFreeDate: true,
    freeTeamName: 'Aston Birra',
    date: 'Hoy',
    time: '-',
    court: '-',
    status: 'Programado',
    observations: 'Fecha libre rotativa.'
  }
];

// TABLA DE POSICIONES
export const INITIAL_STANDINGS: StandingRow[] = [
  { pos: 1, team: 'Los Galácticos FC', pj: 1, pg: 1, pe: 0, pp: 0, gf: 4, gc: 2, pts: 3 },
  { pos: 2, team: 'Pico y Pala FC', pj: 1, pg: 0, pe: 1, pp: 0, gf: 3, gc: 3, pts: 1 },
  { pos: 3, team: 'Aston Birra', pj: 1, pg: 0, pe: 1, pp: 0, gf: 3, gc: 3, pts: 1 },
  { pos: 4, team: 'Real Bañil', pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, pts: 0 },
  { pos: 5, team: 'La Naranja Mecánica', pj: 1, pg: 0, pe: 0, pp: 1, gf: 2, gc: 4, pts: 0 }
];

// PADRÓN DE ÁRBITROS
export const INITIAL_REFEREES: Referee[] = [
  { id: 'arb-1', name: 'Carlos Castrilli', badgeNumber: 'ARB-F5-091', sport: 'Fútbol 5', activeMatches: 2 },
  { id: 'arb-2', name: 'Horacio Elizondo', badgeNumber: 'ARB-F11-012', sport: 'Fútbol 11', activeMatches: 1 },
  { id: 'arb-3', name: 'Héctor Baldassi', badgeNumber: 'ARB-F8-044', sport: 'Fútbol 8', activeMatches: 1 },
  { id: 'arb-4', name: 'Florencia Romano', badgeNumber: 'ARB-PAD-019', sport: 'Pádel', activeMatches: 0 },
  { id: 'arb-5', name: 'Javier Castrilli', badgeNumber: 'ARB-TEN-003', sport: 'Tenis', activeMatches: 1 }
];

// REGISTRO DE AUDITORÍA
export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-1',
    timestamp: 'Hoy, 16:42 hs',
    adminName: 'Admin General',
    action: 'Carga de Resultado',
    detail: 'Marcador registrado: Los Galácticos FC (4) - La Naranja Mecánica (2). Tabla recalculada.',
    type: 'partido'
  },
  {
    id: 'aud-2',
    timestamp: 'Hoy, 15:10 hs',
    adminName: 'Admin General',
    action: 'Designación Arbitral',
    detail: 'Árbitro Carlos Castrilli asignado a Fecha 2 (Los Galácticos vs Real Bañil).',
    type: 'torneo'
  },
  {
    id: 'aud-3',
    timestamp: 'Ayer, 19:30 hs',
    adminName: 'Admin General',
    action: 'Bloqueo Fin de Semana',
    detail: 'Canchas 1 y 2 reservadas para fixture de torneo los sábados de 18 a 23 hs.',
    type: 'cancha'
  },
  {
    id: 'aud-4',
    timestamp: 'Ayer, 11:00 hs',
    adminName: 'Admin General',
    action: 'Registro de Inasistencia',
    detail: 'Usuario Tomás V. no se presentó a su turno de las 10:00 hs. Acumula 2 inasistencias consecutivas.',
    type: 'sancion'
  }
];

// NOTIFICACIONES
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: '¡Reserva Confirmada!',
    message: 'Tu turno para Cancha 1 (Fútbol 5) fue confirmado. Seña del 30% ($5.400) acreditada.',
    timeAgo: 'Hace 10 minutos',
    read: false,
    type: 'reserva'
  },
  {
    id: 'notif-2',
    title: 'Fecha 2 de Copa Apertura',
    message: 'Tu equipo "Los Galácticos FC" juega hoy a las 20:30 hs en Cancha 1 frente a Real Bañil.',
    timeAgo: 'Hace 1 hora',
    read: false,
    type: 'torneo'
  },
  {
    id: 'notif-3',
    title: 'Política de Cancelación',
    message: 'Recordá que para recuperar el 100% de la seña debés cancelar con más de 24 horas de anticipación.',
    timeAgo: 'Hace 1 día',
    read: true,
    type: 'info'
  }
];

// LISTA DE ESPERA
export interface WaitlistEntry {
  id: string;
  courtName: string;
  date: string;
  time: string;
  userName: string;
  userPhone: string;
  position: number;
}

export const INITIAL_WAITLIST: WaitlistEntry[] = [
  { id: 'w1', courtName: 'Cancha 1 – Fútbol 5', date: 'Hoy', time: '21:00 hs', userName: 'Gonzalo Martínez', userPhone: '11-4567-8901', position: 1 },
  { id: 'w2', courtName: 'Pádel Cristal 1', date: 'Hoy', time: '20:00 hs', userName: 'Rodrigo De Paul', userPhone: '11-9876-5432', position: 1 }
];
