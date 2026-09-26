import React, { useState, useEffect } from 'react';
import { ComplejoProvider, useComplejo, type UserRole } from './context/ComplejoContext';
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
import AdminLayout from './screens/AdminLayout';
import ConfirmacionPagoModal, { type BookingSlotInfo } from './components/ConfirmacionPagoModal';
import InscripcionTorneoModal from './components/InscripcionTorneoModal';
import MisTorneos from './screens/MisTorneos';

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
  | 'admin-auditoria';

interface AccountConfig {
  role: UserRole;
  name: string;
  title: string;
  badge: string;
  icon: string;
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
    icon: '⚽',
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
    icon: '🟨',
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
    icon: '🛡️',
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
  }
};

const AppContent: React.FC = () => {
  const { userRole, setUserRole, bookCourt, resetDemoData, unreadNotifsCount } = useComplejo();
  const [currentScreen, setCurrentScreen] = useState<ScreenId>('login');
  const [adminSection, setAdminSection] = useState<string>('agenda');
  const [isInscripcionOpen, setIsInscripcionOpen] = useState(false);
  const [isPagoOpen, setIsPagoOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlotInfo | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  // Control de accesos por cuenta: Si la pantalla actual no está permitida para el rol activo, redirigir
  useEffect(() => {
    if (currentScreen === 'login') return;
    const allowed = ACCOUNTS[userRole].allowedScreens;
    if (!allowed.includes(currentScreen)) {
      setCurrentScreen(ACCOUNTS[userRole].primaryScreen);
    }
  }, [userRole, currentScreen]);

  // Login handler
  const handleLogin = (role: UserRole) => {
    setUserRole(role);
    if (role === 'admin') {
      setCurrentScreen('admin-agenda');
      setAdminSection('agenda');
    } else if (role === 'arbitro') {
      setCurrentScreen('arbitro');
    } else {
      setCurrentScreen('landing');
    }
  };

  // Cambio directo de cuenta desde el selector
  const handleSwitchAccount = (newRole: UserRole) => {
    setUserRole(newRole);
    if (newRole === 'admin') {
      setCurrentScreen('admin-agenda');
      setAdminSection('agenda');
    } else if (newRole === 'arbitro') {
      setCurrentScreen('arbitro');
    } else {
      setCurrentScreen('landing');
    }
    setIsAccountModalOpen(false);
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

  const currentAccount = ACCOUNTS[userRole];

  return (
    <div className="size-full min-h-screen bg-[#293827] flex flex-col font-['Inter',sans-serif]">
      {/* Top Header Bar: Deliberate Action Buttons, Zero Sliders / Zero Horizontal Scrollbars */}
      <header className="bg-[#141b13] border-b border-[#3b4d38] px-4 py-2.5 flex items-center justify-between gap-4 text-xs z-50 sticky top-0">
        {/* Left: Brand & Active Account Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[#65C556] tracking-tight text-sm">COMPLEJO UB</span>
          </div>

          {currentScreen !== 'login' && (
            <button
              type="button"
              onClick={() => setIsAccountModalOpen(true)}
              className="bg-[#1e281d] hover:bg-[#293827] text-white px-2.5 py-1 rounded-lg border border-[#5a7056] flex items-center gap-1.5 transition cursor-pointer"
              title="Haz clic para cambiar de cuenta o rol"
            >
              <span>{currentAccount.icon}</span>
              <span className="font-semibold">{currentAccount.name}</span>
              <span className="bg-[#293827] text-[#65c556] px-1.5 py-0.2 rounded text-[10px] font-bold border border-[#65c556]/40 uppercase">
                {currentAccount.badge}
              </span>
              <span className="text-[#a0a0a0] text-[10px]">▾</span>
            </button>
          )}
        </div>

        {/* Center: Action Navigation Buttons based on Role (No Slider, No Overflow) */}
        {currentScreen === 'login' ? (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-[#a0a0a0] text-[11px]">Acceso rápido demo:</span>
            <button
              type="button"
              onClick={() => handleLogin('cliente')}
              className="bg-[#1e281d] hover:bg-[#65c556] hover:text-[#293827] text-[#c0c0c0] px-2 py-1 rounded text-[11px] font-semibold transition border border-[#3b4d38] cursor-pointer"
            >
              ⚽ Cliente
            </button>
            <button
              type="button"
              onClick={() => handleLogin('arbitro')}
              className="bg-[#1e281d] hover:bg-[#65c556] hover:text-[#293827] text-[#c0c0c0] px-2 py-1 rounded text-[11px] font-semibold transition border border-[#3b4d38] cursor-pointer"
            >
              🟨 Árbitro
            </button>
            <button
              type="button"
              onClick={() => handleLogin('admin')}
              className="bg-[#1e281d] hover:bg-[#65c556] hover:text-[#293827] text-[#c0c0c0] px-2 py-1 rounded text-[11px] font-semibold transition border border-[#3b4d38] cursor-pointer"
            >
              🛡️ Admin
            </button>
          </div>
        ) : (
          <nav className="flex items-center gap-1.5 flex-wrap">
            {/* Nav Buttons for CLIENTE */}
            {userRole === 'cliente' && (
              <>
                <button
                  type="button"
                  onClick={() => setCurrentScreen('landing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'landing'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>🏟️</span>
                  <span>Canchas & Turnos</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('mis-reservas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'mis-reservas'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>📋</span>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'mis-torneos'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>🏆</span>
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'arbitro'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>⏱️</span>
                  <span>Planilla Arbitral</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('mis-torneos')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 border ${
                    currentScreen === 'mis-torneos'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.2)]'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>🏆</span>
                  <span>Fixture & Posiciones</span>
                </button>
              </>
            )}

            {/* Nav Buttons for ADMIN */}
            {userRole === 'admin' && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAdminNavigate('agenda')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 border ${
                    currentScreen === 'admin-agenda'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>📅</span>
                  <span>Agenda</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('overview')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 border ${
                    currentScreen === 'admin-overview'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>📊</span>
                  <span>Dashboard</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('canchas')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 border ${
                    currentScreen === 'admin-canchas'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>⚽</span>
                  <span>Canchas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('torneo')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 border ${
                    currentScreen === 'admin-torneo'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>🏆</span>
                  <span>Torneos</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('resultados')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 border ${
                    currentScreen === 'admin-resultados'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>📝</span>
                  <span>Resultados</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('reportes')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 border ${
                    currentScreen === 'admin-reportes'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>📈</span>
                  <span>Reportes</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAdminNavigate('auditoria')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 border ${
                    currentScreen === 'admin-auditoria'
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold'
                      : 'bg-[#1e281d] text-[#c0c0c0] border-[#3b4d38] hover:border-[#65c556] hover:text-white'
                  }`}
                >
                  <span>🛡️</span>
                  <span>Auditoría</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCurrentScreen('landing')}
                  className="px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 border border-[#5a7056] bg-[#293827] text-[#65c556] hover:bg-[#3b4d38] hover:text-white"
                  title="Inspeccionar la experiencia de usuario del portal"
                >
                  <span>👁️</span>
                  <span>Vista Portal</span>
                </button>
              </div>
            )}
          </nav>
        )}

        {/* Right: Global Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAccountModalOpen(true)}
            className="bg-[#293827] hover:bg-[#3b4d38] text-white px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#5a7056] hover:border-[#65c556] cursor-pointer flex items-center gap-1.5 transition"
            title="Cambiar de cuenta o rol de usuario"
          >
            <span>👥</span>
            <span>Cambiar Cuenta</span>
          </button>

          <button
            type="button"
            onClick={resetDemoData}
            title="Restablece las reservas y fixtures a los valores iniciales"
            className="bg-[#293827] hover:bg-[#3b4d38] text-[#c0c0c0] hover:text-white px-2 py-1.5 rounded-lg text-xs border border-[#5a7056] cursor-pointer transition hidden md:inline"
          >
            🔄 Reiniciar Demo
          </button>

          {currentScreen !== 'login' && (
            <button
              type="button"
              onClick={() => setCurrentScreen('login')}
              className="bg-[#3d2424] hover:bg-[#c53030] text-[#ff8080] hover:text-white px-2.5 py-1.5 rounded-lg font-semibold transition border border-[rgba(229,62,62,0.3)] cursor-pointer text-xs"
            >
              Salir
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
            onOpenInscripcion={() => setIsInscripcionOpen(true)}
            onOpenPago={handleOpenPago}
          />
        )}

        {currentScreen === 'mis-reservas' && (
          <MisReservas onNavigate={(screen) => setCurrentScreen(screen as ScreenId)} />
        )}

        {currentScreen === 'mis-torneos' && (
          <MisTorneos
            onNavigate={(screen) => setCurrentScreen(screen as ScreenId)}
            onOpenInscripcion={() => setIsInscripcionOpen(true)}
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
              onOpenInscripcion={() => setIsInscripcionOpen(true)}
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
            <AdminTorneo onOpenInscripcion={() => setIsInscripcionOpen(true)} />
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
      </main>

      {/* Account Switcher Modal: Distinct accesses per account */}
      {isAccountModalOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setIsAccountModalOpen(false)}
        >
          <div
            className="bg-[#1e281d] border border-[#5a7056] rounded-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl flex flex-col gap-5 text-white my-auto relative"
            style={{ maxWidth: '640px', width: '100%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-[rgba(101,197,86,0.15)] border border-[#65c556] flex items-center justify-center text-xl shrink-0">
                  👥
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">Cuentas y Accesos por Rol</h2>
                  <p className="text-xs text-[#a0a0a0] mt-0.5">
                    Cada cuenta posee permisos y pantallas restringidas según su rol en el complejo.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="text-[#a0a0a0] hover:text-white size-8 flex items-center justify-center rounded-lg bg-[#293827] border border-[#5a7056] cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            {/* Account List */}
            <div className="flex flex-col gap-3">
              {(['cliente', 'arbitro', 'admin'] as UserRole[]).map((r) => {
                const acc = ACCOUNTS[r];
                const isActive = userRole === r && currentScreen !== 'login';
                return (
                  <div
                    key={r}
                    className={`p-4 rounded-xl border transition-all ${
                      isActive
                        ? 'bg-[#293827] border-[#65c556] shadow-md shadow-[rgba(101,197,86,0.15)]'
                        : 'bg-[#141b13] border-[#3b4d38] hover:border-[#5a7056]'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl shrink-0">{acc.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{acc.name}</span>
                            <span className="bg-[#1e281d] text-[#65c556] px-2 py-0.5 rounded text-[10px] font-bold border border-[#5a7056]">
                              {acc.badge}
                            </span>
                            {isActive && (
                              <span className="bg-[#65c556] text-[#293827] px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide">
                                Sesión Actual
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#a0a0a0]">{acc.title}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleSwitchAccount(r)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isActive
                            ? 'bg-[#65c556] text-[#293827] shadow'
                            : 'bg-[#293827] hover:bg-[#65c556] text-white hover:text-[#293827] border border-[#5a7056]'
                        }`}
                      >
                        {isActive ? '✓ Cuenta Activa' : 'Ingresar con esta Cuenta →'}
                      </button>
                    </div>

                    <p className="text-xs text-[#c0c0c0] mb-2">{acc.description}</p>

                    <div className="flex flex-wrap gap-1.5">
                      {acc.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className="bg-[#1e281d] text-[#a0a0a0] text-[10px] px-2 py-0.5 rounded border border-[#3b4d38]"
                        >
                          • {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[#3b4d38]">
              <button
                type="button"
                onClick={() => {
                  setCurrentScreen('login');
                  setIsAccountModalOpen(false);
                }}
                className="text-xs text-[#ff8080] hover:underline cursor-pointer bg-transparent border-none font-semibold flex items-center gap-1"
              >
                <span>←</span> Ir a Pantalla de Autenticación / Login
              </button>
              <button
                type="button"
                onClick={() => setIsAccountModalOpen(false)}
                className="bg-[#293827] hover:bg-[#3b4d38] text-white px-4 py-2 rounded-xl text-xs font-bold border border-[#5a7056] cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <InscripcionTorneoModal
        isOpen={isInscripcionOpen}
        onClose={() => setIsInscripcionOpen(false)}
        onSubmit={() => {
          // Success handled in modal
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
