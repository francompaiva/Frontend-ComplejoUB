import React, { useState, useEffect } from 'react';
import { ComplejoProvider, useComplejo, type UserRole } from './context/ComplejoContext';
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
  IconLogout
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

const ACCOUNTS: Record<UserRole, AccountConfig> = {
  cliente: {
    role: 'cliente',
    name: 'Lucas Díaz',
    title: 'Cliente / Capitán',
    badge: 'Cliente',
    iconNode: <IconBall size={18} className="text-[#65c556]" />,
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
    name: 'Sebastian Norjean',
    title: 'Árbitro Oficial AFA/UB',
    badge: 'Árbitro',
    iconNode: <IconWhistle size={18} className="text-yellow-400" />,
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
    iconNode: <IconShield size={18} className="text-[#65c556]" />,
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
    iconNode: <IconCrown size={18} className="text-yellow-400" />,
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
  const { userRole, setUserRole, currentUser, setCurrentUser, bookCourt, unreadNotifsCount } = useComplejo();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('login');
  const [adminSection, setAdminSection] = useState<string>('agenda');
  const [isInscripcionOpen, setIsInscripcionOpen] = useState(false);
  const [selectedTourneyIdForModal, setSelectedTourneyIdForModal] = useState<string | undefined>(undefined);
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlotInfo | null>(null);

  // Control de accesos por cuenta: Si la pantalla actual no está permitida para el rol activo, redirigir
  useEffect(() => {
    if (currentScreen === 'login') return;
    const allowed = ACCOUNTS[userRole].allowedScreens;
    if (!allowed.includes(currentScreen)) {
      setCurrentScreen(ACCOUNTS[userRole].primaryScreen);
    }
  }, [userRole, currentScreen]);

  const handleOpenInscripcion = (tourneyId?: string) => {
    setSelectedTourneyIdForModal(tourneyId);
    setIsInscripcionOpen(true);
  };

  // Login handler
  const handleLogin = async (role: UserRole) => {
    await setUserRole(role);
    if (role === 'admin' || role === 'superadmin') {
      setCurrentScreen('admin-agenda');
      setAdminSection('agenda');
    } else if (role === 'arbitro') {
      setCurrentScreen('arbitro');
    } else {
      setCurrentScreen('landing');
    }
  };

  // Cierre de sesión y retorno a pantalla de login
  const handleLogout = () => {
    apiClient.setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('complejo_user');
    setCurrentScreen('login');
  };

  // Admin section switcher
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
    }
    setIsPagoOpen(false);
    setSelectedSlot(null);
    setCurrentScreen('mis-reservas');
  };

  const currentAccount = ACCOUNTS[userRole] || ACCOUNTS.cliente;
  const isAdminOrSuper = userRole === 'admin' || userRole === 'superadmin';

  return (
    <div className="size-full min-h-screen bg-[#293827] flex flex-col font-['Inter',sans-serif]">
      {/* Top Header Bar: Solid opaque background, high z-index */}
      <header
        className="border-b border-[#3b4d38] px-5 py-3 flex items-center justify-between gap-4 text-xs shadow-2xl"
        style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#141b13',
          zIndex: 999,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)'
        }}
      >
        {/* Left: Brand & Active Account Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            onClick={() => {
              if (isAdminOrSuper) setCurrentScreen('admin-agenda');
              else if (userRole === 'arbitro') setCurrentScreen('arbitro');
              else setCurrentScreen('landing');
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Complejo Deportivo UB - Ir al inicio"
          >
            <div className="size-9 rounded-xl bg-[rgba(101,197,86,0.15)] border border-[#65c556] flex items-center justify-center text-[#65c556] shadow-sm group-hover:scale-105 transition-transform">
              <IconStadium size={20} />
            </div>
            <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
              Complejo Deportivo <strong className="text-[#65c556]">UB</strong>
            </span>
          </div>

          {currentScreen !== 'login' && (
            <div className="bg-[#1e281d] text-white px-3 py-1.5 rounded-xl border border-[#5a7056] flex items-center gap-2 shadow-sm">
              <span>{currentAccount.iconNode}</span>
              <span className="font-semibold">{currentUser?.nombre || currentAccount.name}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                  userRole === 'superadmin'
                    ? 'bg-amber-400/20 text-yellow-300 border-amber-400/40'
                    : 'bg-[#293827] text-[#65c556] border-[#65c556]/40'
                }`}
              >
                {currentAccount.badge}
              </span>
            </div>
          )}
        </div>

        {/* Center: Action Navigation Buttons based on Role (Spacious gap-3, vector icons) */}
        {currentScreen === 'login' ? (
          <div className="text-[#a0a0a0] text-xs font-medium">
            Acceso seguro con verificación de cuenta por correo electrónico
          </div>
        ) : (
          <nav className="flex items-center gap-3 flex-wrap">
            {/* Nav Buttons for CLIENTE */}
            {userRole === 'cliente' && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('landing')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                    currentScreen === 'landing'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconStadium size={16} />
                  <span>Canchas & Turnos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('mis-reservas')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                    currentScreen === 'mis-reservas'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconClipboard size={16} />
                  <span>Mis Reservas</span>
                  {unreadNotifsCount > 0 && (
                    <span className="bg-[#e53e3e] text-white px-1.5 py-0.2 rounded-full text-[10px] font-black">
                      {unreadNotifsCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('mis-torneos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                    currentScreen === 'mis-torneos'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconTrophy size={16} />
                  <span>Torneos & Fixture</span>
                </button>
              </>
            )}

            {/* Nav Buttons for ARBITRO */}
            {userRole === 'arbitro' && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('arbitro')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                    currentScreen === 'arbitro'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconWhistle size={16} />
                  <span>Planilla Arbitral</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('mis-torneos')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 border ${
                    currentScreen === 'mis-torneos'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconTrophy size={16} />
                  <span>Fixture & Posiciones</span>
                </button>
              </>
            )}

            {/* Nav Buttons for ADMIN / SUPERADMIN with generous spacing (gap-3) */}
            {isAdminOrSuper && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAdminNavigate('agenda')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-agenda'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconCalendar size={15} />
                  <span>Agenda</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('overview')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-overview'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconChartBar size={15} />
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('canchas')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-canchas'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconBall size={15} />
                  <span>Canchas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('torneo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-torneo'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconTrophy size={15} />
                  <span>Torneos</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('resultados')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-resultados'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconClipboard size={15} />
                  <span>Resultados</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('reportes')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-reportes'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconChartBar size={15} />
                  <span>Reportes</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('auditoria')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'admin-auditoria'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <IconShield size={15} />
                  <span>Auditoría</span>
                </button>

                {/* Exclusive Button for Superadmin: Gestión de Administradores */}
                {userRole === 'superadmin' && (
                  <button
                    type="button"
                    onClick={() => handleAdminNavigate('usuarios')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 border ${
                      currentScreen === 'admin-usuarios'
                        ? 'bg-amber-400 text-[#141b13] border-amber-400 font-extrabold shadow-md shadow-amber-400/25'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25 hover:text-white'
                    }`}
                  >
                    <IconCrown size={15} />
                    <span>Gestión Admins</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setCurrentScreen('landing')}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border border-[#5a7056] bg-[#293827] text-[#65c556] hover:bg-[#3b4d38] hover:text-white"
                  title="Ver portal como cliente"
                >
                  <IconStadium size={15} />
                  <span>Vista Portal</span>
                </button>
              </div>
            )}
          </nav>
        )}

        {/* Right: Global Actions */}
        {/* Right: Global Actions */}
        <div className="flex items-center gap-2.5 shrink-0">
          {currentScreen !== 'login' && (
            <button
              type="button"
              onClick={handleLogout}
              className="bg-[#3d2424] hover:bg-[#c53030] text-[#ff8080] hover:text-white px-3.5 py-1.5 rounded-xl font-semibold transition border border-[rgba(229,62,62,0.3)] cursor-pointer text-xs flex items-center gap-1.5 shadow-sm"
              title="Cerrar sesión"
            >
              <IconLogout size={14} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Screen Rendering */}
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

      {/* Global Modals */}
      <InscripcionTorneoModal
        isOpen={isInscripcionOpen}
        tournamentId={selectedTourneyIdForModal}
        onClose={() => {
          setIsInscripcionOpen(false);
          setSelectedTourneyIdForModal(undefined);
        }}
        onSubmit={() => {
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
