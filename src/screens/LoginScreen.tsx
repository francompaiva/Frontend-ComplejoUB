import React, { useState } from 'react';
import { type UserRole, useComplejo } from '../context/ComplejoContext';
import { authApi } from '../api/endpoints';
import { apiClient } from '../api/client';
import {
  IconStadium,
  IconMail,
  IconLock,
  IconCheck,
  IconAlert,
  IconUsers,
  IconEye,
  IconEyeOff,
  IconBall,
  IconCrown,
  IconShield,
  IconWhistle,
  IconBan,
  IconBolt,
  IconInfo,
  IconIdCard,
  IconSmartphone,
  IconArrowLeft,
  IconTrophy,
  IconCalendar
} from '../components/Icons';

export interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { setCurrentUser } = useComplejo();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Formulario Login
  const [loginEmail, setLoginEmail] = useState(import.meta.env.VITE_DEMO_CLIENT_EMAIL || '');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);

  // Formulario Registro
  const [regName, setRegName] = useState('');
  const [regDni, setRegDni] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regPhone, setRegPhone] = useState('');
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Modal Verificación OTP
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleOfflineLogin = (emailToUse?: string) => {
    const emailTarget = (emailToUse || loginEmail || 'lucas@gmail.com').trim().toLowerCase();
    let targetRole: UserRole = 'cliente';
    const clientProfiles: Record<string, { id: number; nombre: string; dni?: string; inasistencias?: number; estado_cuenta?: string; suspension_hasta?: string | null }> = {
      'lucas@gmail.com': { id: 4, nombre: 'Lucas Díaz (Cliente / Capitán)', dni: '40.123.456', inasistencias: 0, estado_cuenta: 'Activa' },
      'mateo@gmail.com': { id: 5, nombre: 'Mateo Fernández (Cliente)', dni: '41.890.123', inasistencias: 1, estado_cuenta: 'Activa' },
      'juan@gmail.com': { id: 6, nombre: 'Juan Paiva', inasistencias: 0, estado_cuenta: 'Activa' },
      'diego@gmail.com': { id: 7, nombre: 'Diego López', inasistencias: 0, estado_cuenta: 'Activa' },
      'gonzalo@gmail.com': { id: 8, nombre: 'Gonzalo Higuaín', inasistencias: 0, estado_cuenta: 'Activa' },
      'julian@gmail.com': { id: 9, nombre: 'Julián Álvarez', inasistencias: 0, estado_cuenta: 'Activa' },
      'enzo@gmail.com': { id: 10, nombre: 'Enzo Fernández', inasistencias: 0, estado_cuenta: 'Activa' },
      'rodrigo@gmail.com': { id: 11, nombre: 'Rodrigo De Paul', inasistencias: 0, estado_cuenta: 'Activa' },
      'sancionado@gmail.com': {
        id: 12,
        nombre: 'Usuario Sancionado Test',
        inasistencias: 3,
        estado_cuenta: 'Suspendida',
        suspension_hasta: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
    };

    const clientMatch = clientProfiles[emailTarget];
    let userObj: any = {
      id: clientMatch?.id || 99,
      nombre: clientMatch?.nombre || emailTarget.split('@')[0],
      email: emailTarget,
      rol: 'Cliente',
      inasistencias: clientMatch?.inasistencias ?? 0,
      estado_cuenta: clientMatch?.estado_cuenta || 'Activa',
      suspension_hasta: clientMatch?.suspension_hasta || null,
    };

    if (emailTarget === 'admin@complejoub.com' || emailTarget === 'complejoub.soporte@gmail.com') {
      targetRole = 'superadmin';
      userObj = {
        id: 15,
        nombre: 'Superadministrador General',
        email: emailTarget,
        rol: 'Superadministrador',
        inasistencias: 0,
        estado_cuenta: 'Activa',
      };
    } else if (emailTarget === 'operador@complejoub.com') {
      targetRole = 'admin';
      userObj = {
        id: 13,
        nombre: 'Administrador de Sede',
        email: 'operador@complejoub.com',
        rol: 'Administrador',
        inasistencias: 0,
        estado_cuenta: 'Activa',
      };
    } else if (emailTarget === 'arbitro@complejoub.com') {
      targetRole = 'arbitro';
      userObj = {
        id: 2,
        nombre: 'Sebastián Norjean (Árbitro)',
        email: 'arbitro@complejoub.com',
        rol: 'Arbitro',
        inasistencias: 0,
        estado_cuenta: 'Activa',
      };
    }

    setCurrentUser(userObj);
    localStorage.setItem('complejo_user', JSON.stringify(userObj));
    onLogin(targetRole);
  };

  const handleQuickFill = (email: string) => {
    setActiveTab('login');
    setLoginEmail(email);
    setLoginPassword('password123');
    setLoginError(null);
    setBackendOffline(false);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const emailTrimmed = loginEmail.trim();

    if (!isValidEmail(emailTrimmed)) {
      setLoginError('Debes ingresar un correo electrónico válido con dominio (ejemplo: usuario@dominio.com).');
      return;
    }

    if (!loginPassword) {
      setLoginError('Ingresa tu contraseña para continuar.');
      return;
    }

    setLoadingLogin(true);

    try {
      const res: any = await authApi.login(emailTrimmed, loginPassword);
      if (res && res.token && res.user) {
        apiClient.setToken(res.token);
        setCurrentUser(res.user);
        localStorage.setItem('complejo_user', JSON.stringify(res.user));

        let targetRole: UserRole = 'cliente';
        if (res.user.rol === 'Superadministrador') targetRole = 'superadmin';
        else if (res.user.rol === 'Administrador') targetRole = 'admin';
        else if (res.user.rol === 'Arbitro') targetRole = 'arbitro';

        onLogin(targetRole);
      } else {
        throw new Error('Respuesta inválida del servidor.');
      }
    } catch (err: any) {
      const errMsg = err?.message || 'Error al autenticar.';
      const isConnectionError =
        errMsg.toLowerCase().includes('failed to fetch') ||
        errMsg.toLowerCase().includes('networkerror') ||
        errMsg.toLowerCase().includes('fetch');

      const isAccountUnverified =
        err?.statusCode === 403 ||
        err?.details?.requiresVerification === true ||
        errMsg.toLowerCase().includes('debes activar tu cuenta') ||
        errMsg.toLowerCase().includes('activación a tu casilla');

      if (isConnectionError) {
        setBackendOffline(true);
        setLoginError(
          'No se pudo conectar con el servidor backend en http://localhost:4000. ' +
          'Ejecuta "npm run dev" en Backend-ComplejoUB o utiliza el Modo Demo a continuación.'
        );
      } else if (isAccountUnverified) {
        setOtpEmail(emailTrimmed);
        setOtpCode('');
        setOtpError(null);
        setOtpSuccess(errMsg);
        setIsOtpModalOpen(true);
      } else {
        setLoginError(errMsg);
      }
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);

    const emailTrimmed = regEmail.trim();
    const cleanDni = regDni.replace(/\D/g, '').trim();

    if (!regName.trim()) {
      setRegisterError('El nombre completo es obligatorio.');
      return;
    }

    if (!cleanDni) {
      setRegisterError('El DNI / Documento es obligatorio para registrarse.');
      return;
    }

    if (cleanDni.length < 7 || cleanDni.length > 8) {
      setRegisterError('El DNI debe contener exactamente 7 u 8 dígitos numéricos sin puntos, letras ni espacios.');
      return;
    }

    if (!isValidEmail(emailTrimmed)) {
      setRegisterError('Ingresa un correo electrónico válido (ej: nombre@dominio.com).');
      return;
    }

    if (regPassword.length < 6) {
      setRegisterError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoadingRegister(true);

    try {
      const res: any = await authApi.register({
        nombre: regName.trim(),
        email: emailTrimmed,
        contrasena: regPassword,
        dni: cleanDni,
        telefono: regPhone.trim() || undefined,
      });

      if (res && res.requiresVerification) {
        setOtpEmail(emailTrimmed);
        setOtpCode('');
        setOtpError(null);
        setOtpSuccess(res.message || 'Código enviado con éxito. Revisa tu casilla de correo.');
        setIsOtpModalOpen(true);
        setResendCooldown(60);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err: any) {
      setRegisterError(err?.message || 'Error al registrar usuario.');
    } finally {
      setLoadingRegister(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError(null);

    if (otpCode.trim().length !== 6) {
      setOtpError('Ingresa el código numérico completo de 6 dígitos.');
      return;
    }

    setLoadingOtp(true);

    try {
      const res: any = await authApi.verificarCodigo(otpEmail, otpCode.trim());
      if (res && res.token && res.user) {
        apiClient.setToken(res.token);
        setCurrentUser(res.user);
        localStorage.setItem('complejo_user', JSON.stringify(res.user));

        setIsOtpModalOpen(false);

        let targetRole: UserRole = 'cliente';
        if (res.user.rol === 'Superadministrador') targetRole = 'superadmin';
        else if (res.user.rol === 'Administrador') targetRole = 'admin';
        else if (res.user.rol === 'Arbitro') targetRole = 'arbitro';

        onLogin(targetRole);
      } else {
        throw new Error('No se pudo verificar el código.');
      }
    } catch (err: any) {
      setOtpError(err?.message || 'Código de verificación inválido o expirado.');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setOtpError(null);
    try {
      const res: any = await authApi.reenviarCodigo(otpEmail);
      setOtpSuccess(res?.message || 'Hemos enviado un nuevo código de 6 dígitos a tu correo.');
      setResendCooldown(60);
      const timer = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err: any) {
      setOtpError(err?.message || 'Error al reenviar el código.');
    }
  };

  return (
    <div className="bg-[#0b120d] flex items-center justify-center min-h-[calc(100vh-61px)] p-4 sm:p-8 text-white font-['Inter',sans-serif] relative overflow-hidden">
      {/* Subtle architectural background grid & glow */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      <div className="absolute -top-32 -left-32 size-[480px] bg-emerald-500/10 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 size-[480px] bg-[#199e1b]/10 rounded-full blur-[130px] pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-[#121c15] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        {/* Left Showcase Panel */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-[#15251a] via-[#101c13] to-[#0b130d] p-10 border-r border-white/[0.08] flex-col justify-between relative overflow-hidden">
          <div className="flex flex-col gap-6 relative z-10">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 w-fit">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-300 tracking-wide uppercase">
                Sede Central Belgrano
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
                Gestión Deportiva <span className="text-emerald-400">Complejo UB</span>
              </h1>
              <p className="text-sm text-slate-300/80 mt-3 leading-relaxed">
                Plataforma integral para la reserva de canchas profesionales, seguimiento de torneos universitarios, designaciones arbitrales y control operativo en tiempo real.
              </p>
            </div>

            <div className="flex flex-col gap-3.5 pt-2">
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <IconCalendar size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Disponibilidad Sincronizada</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Grilla horaria conectada en vivo con la base de datos y reserva inmediata con seña del 30%.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <IconTrophy size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Ligas Oficiales y Fixture</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Inscripción de planteles por DNI, tabla de posiciones automatizada y actas arbitrales.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                  <IconShield size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Auditoría y Roles</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                    Perfiles diferenciados para Clientes, Árbitros, Administradores y Superadministrador.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 relative z-10">
            <span>Universidad de Belgrano</span>
            <span className="text-emerald-400 font-semibold">Fútbol 5 · 8 · 11 · Pádel · Tenis</span>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center gap-6">
          {/* Mobile Brand Header */}
          <div className="flex lg:hidden items-center gap-3 pb-2 border-b border-white/10">
            <div className="size-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <IconStadium size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Complejo Deportivo <span className="text-emerald-400">UB</span>
              </h1>
              <p className="text-xs text-slate-400">Reservas, Torneos y Panel Operativo</p>
            </div>
          </div>

          {isOtpModalOpen ? (
            <div className="flex flex-col gap-5 animate-in">
              <div className="flex items-center gap-3.5 pb-4 border-b border-white/10">
                <div className="size-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <IconMail size={22} />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Paso 2 de 2</span>
                  <h3 className="text-lg font-bold text-white tracking-tight">Verificación de Correo</h3>
                  <p className="text-xs text-slate-400">Ingresa el código de seguridad de 6 dígitos</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Enviamos un código de activación a{' '}
                <strong className="text-white font-mono bg-white/[0.06] px-2 py-0.5 rounded border border-white/10">
                  {otpEmail}
                </strong>
                . Ingrésalo a continuación para habilitar tu cuenta.
              </p>

              {otpSuccess && (
                <div className="bg-emerald-950/60 border border-emerald-500/40 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200">
                  <IconCheck size={16} className="text-emerald-400 shrink-0" />
                  <span>{otpSuccess}</span>
                </div>
              )}

              {otpError && (
                <div className="bg-red-950/60 border border-red-500/40 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-red-200">
                  <IconAlert size={16} className="text-red-400 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                <div className="flex flex-col items-center gap-2 my-2">
                  <label className="text-xs font-semibold text-slate-400">Código numérico de 6 dígitos</label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="bg-[#0b120d] border-2 border-emerald-500/60 focus:border-emerald-400 rounded-2xl text-center text-3xl font-mono font-bold tracking-[12px] py-3.5 px-4 text-white focus:outline-none shadow-inner w-full max-w-[260px]"
                  />
                  <span className="text-[11px] text-slate-400">Válido durante 15 minutos</span>
                </div>

                <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/10 flex items-start gap-2.5 text-[11px] text-slate-300 leading-relaxed">
                  <IconInfo size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-emerald-400">Verificación de prueba:</strong> Para evaluación académica o entornos locales, también puedes utilizar el código universal <strong>123456</strong>.
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold disabled:text-slate-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : '¿No recibiste el código? Reenviar'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsOtpModalOpen(false);
                      setActiveTab('register');
                    }}
                    className="text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1"
                  >
                    <IconArrowLeft size={14} />
                    <span>Modificar datos</span>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loadingOtp || otpCode.length !== 6}
                  className="w-full py-3.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-sm shadow-lg shadow-[#199e1b]/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
                >
                  {loadingOtp ? (
                    <>
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={18} />
                      <span>Verificar y Acceder</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Header & Tab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                    {activeTab === 'login' ? 'Acceso a tu cuenta' : 'Registro de nuevo usuario'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeTab === 'login'
                      ? 'Ingresa tus credenciales o selecciona un perfil de prueba'
                      : 'Completa tus datos personales para reservar e inscribirte'}
                  </p>
                </div>

                <div className="grid grid-cols-2 p-1 bg-[#0b120d] rounded-xl border border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('login');
                      setLoginError(null);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'login'
                        ? 'bg-[#199e1b] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <IconLock size={14} />
                    <span>Ingresar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setRegisterError(null);
                    }}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      activeTab === 'register'
                        ? 'bg-[#199e1b] text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <IconMail size={14} />
                    <span>Registrarse</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: Iniciar Sesión */}
              {activeTab === 'login' && (
                <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                  {backendOffline && (
                    <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-4 flex flex-col gap-3 text-xs text-white shadow-xl animate-in">
                      <div className="flex items-start gap-3">
                        <div className="size-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0 text-red-400">
                          <IconAlert size={17} />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-xs text-red-300">Servidor backend desconectado</h4>
                          <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                            Para conectar con MySQL real, inicia el servidor en <code className="text-emerald-300">Backend-ComplejoUB</code>, o accede directamente en Modo Demo:
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOfflineLogin(loginEmail)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-md"
                      >
                        <IconBolt size={15} />
                        <span>Continuar en Modo Demo Local</span>
                      </button>
                    </div>
                  )}

                  {/* Campo Correo Electrónico */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Correo electrónico</label>
                    <div className="rounded-xl border border-white/10 bg-[#0b120d] focus-within:border-emerald-500 transition px-3.5 py-3 flex items-center gap-3">
                      <IconMail size={17} className="text-slate-400 shrink-0" />
                      <input
                        type="email"
                        required
                        placeholder="usuario@dominio.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                      />
                    </div>
                  </div>

                  {/* Campo Contraseña */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Contraseña</label>
                      <span className="text-[11px] text-slate-400">Mínimo 6 caracteres</span>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-[#0b120d] focus-within:border-emerald-500 transition px-3.5 py-3 flex items-center gap-3">
                      <IconLock size={17} className="text-slate-400 shrink-0" />
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        required
                        placeholder="Ingresa tu contraseña"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((prev) => !prev)}
                        className="text-slate-400 hover:text-emerald-400 transition cursor-pointer shrink-0 p-0.5 flex items-center justify-center"
                        title={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showLoginPassword ? <IconEyeOff size={17} /> : <IconEye size={17} />}
                      </button>
                    </div>
                  </div>

                  {loginError && (
                    <div className="bg-red-950/60 border border-red-500/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in">
                      <IconAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
                      <span className="leading-relaxed font-medium">{loginError}</span>
                    </div>
                  )}

                  {/* Cuentas de Acceso Rápido */}
                  <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <IconCheck size={13} />
                        <span>Perfiles de Acceso Rápido</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Autocompletar correo</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickFill('lucas@gmail.com')}
                        className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition flex items-center gap-2 cursor-pointer truncate ${
                          loginEmail === 'lucas@gmail.com'
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#0b120d] hover:bg-white/[0.06] border-white/10 text-slate-200'
                        }`}
                        title="Lucas Díaz (Cliente / Capitán)"
                      >
                        <IconBall size={14} className="text-emerald-400 shrink-0" />
                        <span className="truncate">Lucas (Cliente 1)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickFill('mateo@gmail.com')}
                        className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition flex items-center gap-2 cursor-pointer truncate ${
                          loginEmail === 'mateo@gmail.com'
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#0b120d] hover:bg-white/[0.06] border-white/10 text-slate-200'
                        }`}
                        title="Mateo Fernández (Segundo Cliente para verificar reservas cruzadas)"
                      >
                        <IconUsers size={14} className="text-sky-400 shrink-0" />
                        <span className="truncate">Mateo (Cliente 2)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickFill('complejoub.soporte@gmail.com')}
                        className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition flex items-center gap-2 cursor-pointer truncate ${
                          loginEmail === 'complejoub.soporte@gmail.com'
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                            : 'bg-[#0b120d] hover:bg-white/[0.06] border-white/10 text-slate-200'
                        }`}
                        title="Superadministrador General"
                      >
                        <IconCrown size={14} className="text-amber-400 shrink-0" />
                        <span className="truncate">Superadmin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickFill('operador@complejoub.com')}
                        className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition flex items-center gap-2 cursor-pointer truncate ${
                          loginEmail === 'operador@complejoub.com'
                            ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#0b120d] hover:bg-white/[0.06] border-white/10 text-slate-200'
                        }`}
                        title="Administrador de Sede"
                      >
                        <IconShield size={14} className="text-emerald-400 shrink-0" />
                        <span className="truncate">Administrador</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickFill('arbitro@complejoub.com')}
                        className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition flex items-center gap-2 cursor-pointer truncate ${
                          loginEmail === 'arbitro@complejoub.com'
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                            : 'bg-[#0b120d] hover:bg-white/[0.06] border-white/10 text-slate-200'
                        }`}
                        title="Sebastián Norjean (Árbitro Oficial)"
                      >
                        <IconWhistle size={14} className="text-amber-400 shrink-0" />
                        <span className="truncate">Árbitro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickFill('sancionado@gmail.com')}
                        className={`px-2.5 py-2 rounded-xl border text-[11px] font-semibold transition flex items-center gap-2 cursor-pointer truncate ${
                          loginEmail === 'sancionado@gmail.com'
                            ? 'bg-red-500/20 border-red-500/50 text-red-200'
                            : 'bg-red-950/25 hover:bg-red-950/40 border-red-500/25 text-red-300'
                        }`}
                        title="Usuario Sancionado Test (3 inasistencias)"
                      >
                        <IconBan size={14} className="text-red-400 shrink-0" />
                        <span className="truncate">Sancionado</span>
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingLogin}
                    className="mt-1 w-full py-3.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-sm shadow-lg shadow-[#199e1b]/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loadingLogin ? (
                      <>
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Validando credenciales...</span>
                      </>
                    ) : (
                      <>
                        <IconCheck size={18} />
                        <span>Ingresar a la Plataforma</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: Registrarse */}
              {activeTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
                  {registerError && (
                    <div className="bg-red-950/60 border border-red-500/40 p-3 rounded-xl flex items-start gap-2.5 text-xs text-red-200 animate-in">
                      <IconAlert size={16} className="shrink-0 text-red-400 mt-0.5" />
                      <span className="leading-relaxed">{registerError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-300">Nombre y Apellido</label>
                      <div className="rounded-xl border border-white/10 bg-[#0b120d] focus-within:border-emerald-500 transition px-3.5 py-2.5 flex items-center gap-2.5">
                        <IconUsers size={16} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          required
                          placeholder="Ej: Nicolás Paiva"
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-300">DNI</label>
                        <span className="text-[10px] text-emerald-400">7 u 8 dígitos</span>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-[#0b120d] focus-within:border-emerald-500 transition px-3.5 py-2.5 flex items-center gap-2.5">
                        <IconIdCard size={16} className="text-slate-400 shrink-0" />
                        <input
                          type="text"
                          required
                          inputMode="numeric"
                          maxLength={8}
                          placeholder="Sin puntos (ej: 40123456)"
                          value={regDni}
                          onChange={(e) => setRegDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                          className="w-full bg-transparent border-none outline-none text-white text-sm font-mono placeholder-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">Correo electrónico</label>
                    <div className="rounded-xl border border-white/10 bg-[#0b120d] focus-within:border-emerald-500 transition px-3.5 py-2.5 flex items-center gap-2.5">
                      <IconMail size={16} className="text-slate-400 shrink-0" />
                      <input
                        type="email"
                        required
                        placeholder="nombre@ejemplo.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Recibirás un código de seguridad de 6 dígitos para activar tu cuenta.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-300">Contraseña</label>
                      <div className="rounded-xl border border-white/10 bg-[#0b120d] focus-within:border-emerald-500 transition px-3.5 py-2.5 flex items-center gap-2.5">
                        <IconLock size={16} className="text-slate-400 shrink-0" />
                        <input
                          type={showRegPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Mínimo 6 caracteres"
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword((prev) => !prev)}
                          className="text-slate-400 hover:text-emerald-400 transition cursor-pointer shrink-0"
                        >
                          {showRegPassword ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-300">Teléfono móvil (opcional)</label>
                      <div className="rounded-xl border border-white/10 bg-[#0b120d] focus-within:border-emerald-500 transition px-3.5 py-2.5 flex items-center gap-2.5">
                        <IconSmartphone size={16} className="text-slate-400 shrink-0" />
                        <input
                          type="tel"
                          placeholder="+54 11 ..."
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          className="w-full bg-transparent border-none outline-none text-white text-sm placeholder-slate-500"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingRegister}
                    className="mt-2 w-full py-3.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-sm shadow-lg shadow-[#199e1b]/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loadingRegister ? (
                      <>
                        <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Registrando y enviando código...</span>
                      </>
                    ) : (
                      <>
                        <IconMail size={17} />
                        <span>Crear Cuenta y Recibir Código</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
