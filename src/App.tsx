import React, { useState, useEffect } from 'react';
import { ComplejoProvider, useComplejo, type UserRole, type CurrentUser } from './context/ComplejoContext';
import { apiClient } from './api/client';
import LoginScreen from './screens/LoginScreen';
import LandingPage from './screens/LandingPage';
import MisReservas from './screens/MisReservas';
import ArbitroPanel from './screens/ArbitroPanel';
import AdminAgenda from './screens/AdminAgenda';
import AdminOverview from './screens/AdminOverview';
import AdminCanchas from './screens/AdminCanchas';
import AdminTorneo from './screens/AdminTorneo';
import AdminResultados from './screens/AdminResultados';
import AdminReportes from './screens/AdminReportes';
import AdminAuditoria from './screens/AdminAuditoria';
import { AdminGestionUsuarios } from './screens/AdminGestionUsuarios';
import AdminLayout from './screens/AdminLayout';
import ConfirmacionPagoModal, { type BookingSlotInfo } from './components/ConfirmacionPagoModal';
import InscripcionTorneoModal from './components/InscripcionTorneoModal';
import MisTorneos from './screens/MisTorneos';
import ErrorBoundary from './components/ErrorBoundary';
import NotificationDropdown from './components/NotificationDropdown';
import {
  IconStadium,
  IconBall,
  IconTrophy,
  IconCalendar,
  IconClipboard,
  IconChartBar,
  IconShield,
  IconCrown,
  IconWhistle,
  IconLogout,
  IconLock
} from './components/Icons';

export type ScreenId =
  | 'login'
  | 'landing'
  | 'mis-reservas'
  | 'mis-torneos'
  | 'arbitro'
  | 'admin-agenda'
  | 'admin-overview'
  | 'admin-canchas'
  | 'admin-torneo'
  | 'admin-resultados'
  | 'admin-reportes'
  | 'admin-auditoria'
  | 'admin-usuarios';

interface AccountConfig {
  role: UserRole;
  name: string;
  title: string;
  badge: string;
  iconNode: React.ReactNode;
  primaryScreen: ScreenId;
  allowedScreens: ScreenId[];
  description: string;
  permissions: string[];
}

export const ROLE_ACCOUNTS: Record<UserRole, AccountConfig> = {
  cliente: {
    role: 'cliente',
    name: 'Cliente',
    title: 'Cliente / Capitán',
    badge: 'Cliente',
    iconNode: <IconBall size={16} className="text-emerald-400" />,
    primaryScreen: 'landing',
    allowedScreens: ['landing', 'mis-reservas', 'mis-torneos'],
    description: 'Gestión personal de reservas, pago de señas, cancelaciones y nómina de torneos.',
    permissions: [
      'Reserva de turnos con seña del 30%',
      'Cancelación con reintegro (>24h)',
      'Inscripción de equipos en torneos',
      'Consulta de posiciones y fixture'
    ]
  },
  arbitro: {
    role: 'arbitro',
    name: 'Árbitro',
    title: 'Árbitro Oficial AFA/UB',
    badge: 'Árbitro',
    iconNode: <IconWhistle size={16} className="text-amber-400" />,
    primaryScreen: 'arbitro',
    allowedScreens: ['arbitro', 'mis-torneos'],
    description: 'Planilla digital oficial de partidos asignados, tarjetas y actas de disciplina.',
    permissions: [
      'Planilla digital de partidos asignados',
      'Carga de marcadores finales',
      'Registro de amonestados y expulsados',
      'Consulta de fixture y posiciones'
    ]
  },
  admin: {
    role: 'admin',
    name: 'Administración General',
    title: 'Administrador Complejo UB',
    badge: 'Admin',
    iconNode: <IconShield size={16} className="text-emerald-400" />,
    primaryScreen: 'admin-agenda',
    allowedScreens: [
      'admin-agenda',
      'admin-overview',
      'admin-canchas',
      'admin-torneo',
      'admin-resultados',
      'admin-reportes',
      'admin-auditoria',
      'landing',
      'mis-torneos',
      'arbitro'
    ],
    description: 'Control integral de canchas, tarifas, agenda, sanciones, reportes y auditoría.',
    permissions: [
      'Agenda operativa y control de inasistencias',
      'ABM de canchas, iluminación y precios',
      'Creación de torneos y fixture Round-Robin',
      'Métricas de facturación y logs de auditoría'
    ]
  },
  superadmin: {
    role: 'superadmin',
    name: 'Superadministrador',
    title: 'Superadmin Cátedra UB',
    badge: 'Superadmin',
    iconNode: <IconCrown size={16} className="text-amber-400" />,
    primaryScreen: 'admin-agenda',
    allowedScreens: [
      'admin-agenda',
      'admin-overview',
      'admin-canchas',
      'admin-torneo',
      'admin-resultados',
      'admin-reportes',
      'admin-auditoria',
      'admin-usuarios',
      'landing',
      'mis-torneos',
      'arbitro'
    ],
    description: 'Control absoluto del complejo y gestión jerárquica de administradores por email.',
    permissions: [
      'Alta y creación de cuentas administrativas',
      'Promoción de usuarios registrados a Administrador',
      'Revocación de privilegios administrativos',
      'Acceso total a agenda, torneos, canchas y auditoría'
    ]
  }
};

const AppContent: React.FC = () => {
  const { userRole, setUserRole, currentUser, setCurrentUser, bookCourt, unreadNotifsCount, isUserBanned } = useComplejo();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('login');
  const [adminSection, setAdminSection] = useState<string>('agenda');
  const [isInscripcionOpen, setIsInscripcionOpen] = useState(false);
  const [selectedTourneyIdForModal, setSelectedTourneyIdForModal] = useState<string | undefined>(undefined);
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlotInfo | null>(null);

  useEffect(() => {
    if (currentScreen === 'login') return;
    const allowed = ROLE_ACCOUNTS[userRole].allowedScreens;
    if (!allowed.includes(currentScreen)) {
      setCurrentScreen(ROLE_ACCOUNTS[userRole].primaryScreen);
    }
  }, [userRole, currentScreen]);

  const handleOpenInscripcion = (tourneyId?: string) => {
    setSelectedTourneyIdForModal(tourneyId);
    setIsInscripcionOpen(true);
  };

  const handleLogin = async (role: UserRole) => {
    let userObj: CurrentUser | null = currentUser;
    if (!userObj) {
      const stored = localStorage.getItem('complejo_user');
      if (stored) {
        try {
          userObj = JSON.parse(stored);
        } catch {
          userObj = null;
        }
      }
    }
    await setUserRole(role, userObj);
    if (role === 'admin' || role === 'superadmin') {
      setCurrentScreen('admin-agenda');
      setAdminSection('agenda');
    } else if (role === 'arbitro') {
      setCurrentScreen('arbitro');
    } else {
      setCurrentScreen('landing');
    }
  };

  // Cierre de sesión preservando disponibilidad compartida de reservas
  const handleLogout = () => {
    apiClient.setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('complejo_user');
    localStorage.removeItem('complejo_ub_token');
    localStorage.removeItem('complejo_userParticipations');
    localStorage.removeItem('complejo_invitations');
    setCurrentScreen('login');
  };

  const handleAdminNavigate = (section: string) => {
    setAdminSection(section);
    if (section === 'agenda') setCurrentScreen('admin-agenda');
    else if (section === 'overview') setCurrentScreen('admin-overview');
    else if (section === 'canchas') setCurrentScreen('admin-canchas');
    else if (section === 'torneo') setCurrentScreen('admin-torneo');
    else if (section === 'resultados') setCurrentScreen('admin-resultados');
    else if (section === 'reportes') setCurrentScreen('admin-reportes');
    else if (section === 'auditoria') setCurrentScreen('admin-auditoria');
    else if (section === 'usuarios') setCurrentScreen('admin-usuarios');
  };

  const handleOpenPago = (slotData: BookingSlotInfo) => {
    if (isUserBanned) {
      alert('Tu cuenta se encuentra suspendida temporalmente por acumulación de inasistencias. No puedes realizar reservas.');
      return;
    }
    setSelectedSlot(slotData);
    setIsPagoOpen(true);
  };

  const handleConfirmPago = async () => {
    if (selectedSlot) {
      await bookCourt(
        selectedSlot.courtId || '1',
        selectedSlot.court,
        (selectedSlot.sport as any) || 'Fútbol 5',
        selectedSlot.date,
        selectedSlot.time
      );
      setIsPagoOpen(false);
      setSelectedSlot(null);
      setCurrentScreen('mis-reservas');
    }
  };

  const currentAccount = ROLE_ACCOUNTS[userRole] || ROLE_ACCOUNTS.cliente;
  const isAdminOrSuper = userRole === 'admin' || userRole === 'superadmin';

  return (
    <div className="size-full min-h-screen bg-[#f4f6f4] flex flex-col font-['Inter',sans-serif]">
      {/* Institutional Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#0d1510]/95 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 py-3 flex items-center justify-between gap-4 text-xs shadow-lg">
        {/* Left: Brand & Active Account Badge */}
        <div className="flex items-center gap-3.5 shrink-0">
          <div
            onClick={() => {
              if (currentScreen === 'login') return;
              if (isAdminOrSuper) setCurrentScreen('admin-agenda');
              else if (userRole === 'arbitro') setCurrentScreen('arbitro');
              else setCurrentScreen('landing');
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Complejo Deportivo UB"
          >
            <div className="size-9 rounded-xl bg-[#199e1b]/15 border border-[#199e1b]/40 flex items-center justify-center text-emerald-400 shadow-sm group-hover:border-emerald-400 transition-colors">
              <IconStadium size={19} />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-white tracking-tight leading-none">
                Complejo <span className="text-emerald-400">UB</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide mt-0.5 hidden sm:inline">
                Gestión Deportiva Universitaria
              </span>
            </div>
          </div>

          {currentScreen !== 'login' && (
            <div className="hidden md:flex items-center gap-2 bg-white/[0.05] text-slate-200 px-3 py-1.5 rounded-xl border border-white/10">
              <span>{currentAccount.iconNode}</span>
              <span className="font-semibold text-xs text-white">{currentUser?.nombre || currentAccount.name}</span>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                  userRole === 'superadmin'
                    ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {currentAccount.badge}
              </span>
            </div>
          )}
        </div>

        {/* Center: Navigation Pills */}
        {currentScreen === 'login' ? (
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-xs font-medium">
            <IconLock size={14} className="text-emerald-400" />
            <span>Plataforma oficial con verificación de seguridad y reservas en tiempo real</span>
          </div>
        ) : (
          <nav className="flex items-center gap-1.5 flex-wrap">
            {userRole === 'cliente' && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('landing')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border ${
                    currentScreen === 'landing'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm shadow-[#199e1b]/30'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconStadium size={15} />
                  <span>Canchas y Turnos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('mis-reservas')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border ${
                    currentScreen === 'mis-reservas'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm shadow-[#199e1b]/30'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconClipboard size={15} />
                  <span>Mis Reservas</span>
                  {unreadNotifsCount > 0 && (
                    <span className="bg-emerald-400 text-[#0d1510] px-1.5 py-0.2 rounded-full text-[10px] font-extrabold">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('mis-torneos')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border ${
                    currentScreen === 'mis-torneos'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm shadow-[#199e1b]/30'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconTrophy size={15} />
                  <span>Torneos y Fixture</span>
                </button>
              </>
            )}

            {userRole === 'arbitro' && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('arbitro')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border ${
                    currentScreen === 'arbitro'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm shadow-[#199e1b]/30'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconWhistle size={15} />
                  <span>Planilla Arbitral</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('mis-torneos')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 border ${
                    currentScreen === 'mis-torneos'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm shadow-[#199e1b]/30'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconTrophy size={15} />
                  <span>Fixture y Posiciones</span>
                </button>
              </>
            )}

            {isAdminOrSuper && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAdminNavigate('agenda')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-agenda'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconCalendar size={14} />
                  <span>Agenda</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('overview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-overview'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconChartBar size={14} />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('canchas')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-canchas'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconBall size={14} />
                  <span>Canchas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('torneo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-torneo'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconTrophy size={14} />
                  <span>Torneos</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('resultados')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-resultados'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconClipboard size={14} />
                  <span>Resultados</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('reportes')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-reportes'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconChartBar size={14} />
                  <span>Reportes</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('auditoria')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-auditoria'
                      ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-sm'
                      : 'bg-white/[0.04] text-slate-300 border-white/10 hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <IconShield size={14} />
                  <span>Auditoría</span>
                </button>

                {userRole === 'superadmin' && (
                  <button
                    type="button"
                    onClick={() => handleAdminNavigate('usuarios')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                      currentScreen === 'admin-usuarios'
                        ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold shadow-sm'
                        : 'bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/20 hover:text-white'
                    }`}
                  >
                    <IconCrown size={14} />
                    <span>Gestión Admins</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCurrentScreen('landing')}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-white"
                  title="Ver portal público de reservas"
                >
                  <IconStadium size={14} />
                  <span>Vista Portal</span>
                </button>
              </div>
            )}
          </nav>
        )}

        {/* Right: Notifications & Logout */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentScreen !== 'login' && (
            <>
              <NotificationDropdown />
              <button
                type="button"
                onClick={handleLogout}
                className="bg-red-500/10 hover:bg-red-600 text-red-300 hover:text-white px-3.5 py-2 rounded-xl font-semibold transition border border-red-500/25 cursor-pointer text-xs flex items-center gap-1.5"
                title="Cerrar sesión"
              >
                <IconLogout size={14} />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Screen Rendering */}
      <ErrorBoundary>
        <main className="flex-1 flex flex-col">
          {currentScreen === 'login' && <LoginScreen onLogin={handleLogin} />}

          {currentScreen === 'landing' && (
            <LandingPage
              onNavigate={(screen) => setCurrentScreen(screen as ScreenId)}
              onOpenInscripcion={handleOpenInscripcion}
              onOpenPago={handleOpenPago}
            />
          )}

          {currentScreen === 'mis-reservas' && (
            <MisReservas onNavigate={(screen) => setCurrentScreen(screen as ScreenId)} />
          )}

          {currentScreen === 'mis-torneos' && (
            <MisTorneos
              onNavigate={(screen) => setCurrentScreen(screen as ScreenId)}
              onOpenInscripcion={handleOpenInscripcion}
            />
          )}

          {currentScreen === 'arbitro' && (
            <ArbitroPanel onNavigate={(screen) => setCurrentScreen(screen as ScreenId)} />
          )}

          {currentScreen === 'admin-agenda' && (
            <AdminLayout activeSection={adminSection} onNavigate={handleAdminNavigate}>
              <AdminAgenda />
            </AdminLayout>
          )}

          {currentScreen === 'admin-overview' && (
            <AdminLayout activeSection={adminSection} onNavigate={handleAdminNavigate}>
              <AdminOverview
                onNavigate={handleAdminNavigate}
                onOpenInscripcion={handleOpenInscripcion}
              />
            </AdminLayout>
          )}

          {currentScreen === 'admin-canchas' && (
            <AdminLayout activeSection={adminSection} onNavigate={handleAdminNavigate}>
              <AdminCanchas />
            </AdminLayout>
          )}

          {currentScreen === 'admin-torneo' && (
            <AdminLayout activeSection={adminSection} onNavigate={handleAdminNavigate}>
              <AdminTorneo onOpenInscripcion={handleOpenInscripcion} />
            </AdminLayout>
          )}

          {currentScreen === 'admin-resultados' && (
            <AdminLayout activeSection={adminSection} onNavigate={handleAdminNavigate}>
              <AdminResultados />
            </AdminLayout>
          )}

          {currentScreen === 'admin-reportes' && (
            <AdminLayout activeSection={adminSection} onNavigate={handleAdminNavigate}>
              <AdminReportes />
            </AdminLayout>
          )}

          {currentScreen === 'admin-auditoria' && (
            <AdminLayout activeSection={adminSection} onNavigate={handleAdminNavigate}>
              <AdminAuditoria />
            </AdminLayout>
          )}

          {currentScreen === 'admin-usuarios' && (
            <AdminLayout activeSection={adminSection} onNavigate={handleAdminNavigate}>
              <AdminGestionUsuarios />
            </AdminLayout>
          )}
        </main>
      </ErrorBoundary>

      {/* Global Modals */}
      <InscripcionTorneoModal
        isOpen={isInscripcionOpen}
        tournamentId={selectedTourneyIdForModal}
        onClose={() => {
          setIsInscripcionOpen(false);
          setSelectedTourneyIdForModal(undefined);
        }}
      />

      <ConfirmacionPagoModal
        isOpen={isPagoOpen}
        slot={selectedSlot}
        onClose={() => {
          setIsPagoOpen(false);
          setSelectedSlot(null);
        }}
        onConfirm={handleConfirmPago}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ComplejoProvider>
      <AppContent />
    </ComplejoProvider>
  );
};

export default App;
