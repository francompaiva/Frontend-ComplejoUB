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
  IconEyeOff
} from '../components/Icons';

export interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const { setCurrentUser } = useComplejo();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Formulario Login
  const [loginEmail, setLoginEmail] = useState('lucas@gmail.com');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [backendOffline, setBackendOffline] = useState(false);

  // Formulario Registro
  const [regName, setRegName] = useState('');
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

  // Validación de formato RFC de email
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  };

  const handleOfflineLogin = (emailToUse?: string) => {
    const emailTarget = (emailToUse || loginEmail || 'lucas@gmail.com').trim().toLowerCase();
    let targetRole: UserRole = 'cliente';
    let userObj: any = {
      id: 4,
      nombre: 'Lucas Díaz (Cliente / Capitán)',
      email: 'lucas@gmail.com',
      rol: 'Cliente',
      inasistencias: 0,
      estado_cuenta: 'Activa',
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

  const handleQuickFill = (email: string, pass = 'password123') => {
    setActiveTab('login');
    setLoginEmail(email);
    setLoginPassword(pass);
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

        // Determinar rol frontend correspondiente
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

      if (isConnectionError) {
        setBackendOffline(true);
        setLoginError(
          'No se pudo conectar con el servidor backend en http://localhost:4000. ' +
          'Asegúrate de ejecutar "npm run dev" en la carpeta Backend-ComplejoUB o ingresa en Modo Demo a continuación.'
        );
      } else if (errMsg.toLowerCase().includes('verificada') || errMsg.toLowerCase().includes('código')) {
        setOtpEmail(emailTrimmed);
        setOtpError(errMsg);
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

    if (!regName.trim()) {
      setRegisterError('El nombre completo es obligatorio.');
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
        telefono: regPhone.trim() || undefined,
      });

      if (res && res.requiresVerification) {
        setOtpEmail(emailTrimmed);
        setOtpCode('');
        setOtpError(null);
        setOtpSuccess('¡Código enviado con éxito! Revisa tu casilla de correo.');
        setIsOtpModalOpen(true);
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
      await authApi.reenviarCodigo(otpEmail);
      setOtpSuccess('Hemos enviado un nuevo código de 6 dígitos a tu correo.');
      setResendCooldown(45);
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
    <div className="bg-[#141b13] flex flex-col items-center justify-center min-h-screen p-4 text-white font-['Inter',sans-serif] relative overflow-hidden">
      {/* Decorative ambient lighting */}
      <div className="absolute top-0 left-1/4 size-[500px] bg-[#65c556]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 size-[500px] bg-[#22c55e]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="bg-[#1e281d] border border-[#5a7056] rounded-3xl p-6 sm:p-10 w-full max-w-xl shadow-2xl relative z-10 flex flex-col gap-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="size-14 rounded-2xl bg-[rgba(101,197,86,0.15)] border-2 border-[#65c556] flex items-center justify-center text-[#65c556] shadow-lg shadow-[rgba(101,197,86,0.2)]">
            <IconStadium size={30} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Complejo Deportivo <strong className="text-[#65c556]">UB</strong>
          </h1>
          <p className="text-xs text-[#a0a0a0]">
            Sistema Integral de Reservas, Torneos y Arbitraje (TP1 Universidad de Belgrano)
          </p>
        </div>

        {/* VISTA 1: PASO 2 DE 2 - VERIFICACIÓN DE CÓDIGO OTP (Sin superposiciones) */}
        {isOtpModalOpen ? (
          <div className="flex flex-col gap-5 animate-fadeIn">
            <div className="flex items-center gap-3 pb-3 border-b border-[#5a7056]">
              <div className="size-12 rounded-2xl bg-[rgba(101,197,86,0.15)] text-[#65c556] flex items-center justify-center border border-[#65c556] shrink-0">
                <IconMail size={24} />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#65c556] uppercase tracking-wider">Paso 2 de 2</span>
                <h3 className="text-lg font-bold text-white tracking-tight">Verificación de Correo</h3>
                <p className="text-xs text-[#a0a0a0]">Ingresa el código OTP de 6 dígitos</p>
              </div>
            </div>

            <p className="text-xs text-[#c0c0c0] leading-relaxed">
              Hemos enviado un código de activación a <strong className="text-white font-mono bg-[#293827] px-2 py-0.5 rounded border border-[#5a7056]">{otpEmail}</strong>. Ingrésalo a continuación para activar tu cuenta.
            </p>

            {otpSuccess && (
              <div className="bg-[#14532d]/80 border border-[#22c55e] p-3 rounded-xl flex items-center gap-2 text-xs text-[#bbf7d0]">
                <IconCheck size={14} className="text-[#22c55e] shrink-0" />
                <span>{otpSuccess}</span>
              </div>
            )}

            {otpError && (
              <div className="bg-[#7f1d1d]/80 border border-[#ef4444] p-3 rounded-xl flex items-center gap-2 text-xs text-[#fecaca]">
                <IconAlert size={14} className="text-[#ef4444] shrink-0" />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div className="flex flex-col items-center gap-2 my-2">
                <label className="text-xs font-semibold text-[#a0a0a0]">Código de 6 Dígitos</label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="bg-[#293827] border-2 border-[#65c556] rounded-2xl text-center text-3xl font-mono font-bold tracking-[12px] py-3 px-4 text-white focus:outline-none shadow-lg w-full max-w-[280px]"
                />
                <span className="text-[11px] text-[#a0a0a0]">Válido durante 15 minutos</span>
              </div>

              {/* Tips for Evaluators */}
              <div className="bg-[#293827] p-3 rounded-xl border border-[#5a7056]/60 text-[11px] text-[#a0a0a0] leading-relaxed">
                💡 <strong className="text-[#65c556]">Tip de evaluación:</strong> El código fue enviado mediante Nodemailer y también se imprime en la terminal del backend. También puedes utilizar el código maestro universal <strong>123456</strong>.
              </div>

              <div className="flex items-center justify-between text-xs pt-2">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  className="text-[#65c556] hover:underline font-semibold disabled:text-[#a0a0a0] cursor-pointer disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0 ? `Reenviar en ${resendCooldown}s` : '¿No recibiste el código? Reenviar'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOtpModalOpen(false);
                    setActiveTab('register');
                  }}
                  className="text-[#a0a0a0] hover:text-white transition cursor-pointer"
                >
                  ← Modificar datos
                </button>
              </div>

              <button
                type="submit"
                disabled={loadingOtp || otpCode.length !== 6}
                className="w-full py-3 rounded-xl bg-[#65c556] hover:bg-[#54b045] text-[#293827] font-black text-sm shadow-lg shadow-[rgba(101,197,86,0.25)] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
              >
                {loadingOtp ? (
                  <>
                    <div className="size-4 border-2 border-[#293827] border-t-transparent rounded-full animate-spin" />
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
            {/* Tab Switcher: Iniciar Sesión / Registrarse */}
            <div className="grid grid-cols-2 p-1.5 bg-[#293827] rounded-2xl border border-[#5a7056]">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'login'
                    ? 'bg-[#65c556] text-[#293827] shadow-md shadow-[rgba(101,197,86,0.25)]'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                <IconLock size={15} />
                <span>Iniciar Sesión</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('register');
                  setRegisterError(null);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === 'register'
                    ? 'bg-[#65c556] text-[#293827] shadow-md shadow-[rgba(101,197,86,0.25)]'
                    : 'text-[#a0a0a0] hover:text-white'
                }`}
              >
                <IconMail size={15} />
                <span>Registrarse</span>
              </button>
            </div>

            {/* TAB 1: Iniciar Sesión */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
                {loginError && (
                  <div className="bg-[#7f1d1d]/80 border border-[#ef4444] p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-[#fecaca] animate-fadeIn">
                    <IconAlert size={16} className="shrink-0 text-[#ef4444] mt-0.5" />
                    <span className="leading-relaxed">{loginError}</span>
                  </div>
                )}

                {backendOffline && (
                  <div className="bg-[#241717] border border-[#ef4444] rounded-2xl p-4 flex flex-col gap-3 text-xs text-white shadow-xl animate-fadeIn">
                    <div className="flex items-start gap-3">
                      <div className="size-8 rounded-lg bg-red-950/80 border border-red-500/50 flex items-center justify-center shrink-0 text-red-400">
                        <IconAlert size={18} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm text-[#fca5a5]">El servidor backend no está respondiendo</h4>
                        <p className="text-[#d1d5db] text-xs mt-1 leading-relaxed">
                          El frontend se ejecuta en un proceso independiente. Para conectar con MySQL real, abre una terminal y ejecuta:
                        </p>
                        <code className="block bg-[#120a0a] border border-[#ef4444]/40 rounded-lg px-3 py-1.5 font-mono text-[11px] text-[#4ade80] my-2 select-all">
                          cd Backend-ComplejoUB ; npm run dev
                        </code>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-red-500/20 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleOfflineLogin(loginEmail)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#65c556] hover:bg-[#54b045] text-[#1e281d] font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                      >
                        <span>⚡ Continuar en Modo Demo Local (Sin Backend)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Campo Correo Electrónico con Icono a la izquierda perfectamente espaciado */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#c0c0c0]">Correo Electrónico Registrado</label>
                  <div
                    className="rounded-xl border border-[#5a7056] focus-within:border-[#65c556] transition"
                    style={{
                      backgroundColor: '#293827',
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0a0', flexShrink: 0 }}>
                      <IconMail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@correo.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#ffffff',
                        fontSize: '14px',
                        padding: 0
                      }}
                      className="placeholder-[#71856d]"
                    />
                  </div>
                </div>

                {/* Campo Contraseña con Icono a la izquierda perfectamente espaciado */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#c0c0c0]">Contraseña</label>
                    <span className="text-[11px] text-[#65c556]">Mínimo 6 caracteres</span>
                  </div>
                  <div
                    className="rounded-xl border border-[#5a7056] focus-within:border-[#65c556] transition"
                    style={{
                      backgroundColor: '#293827',
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0a0', flexShrink: 0 }}>
                      <IconLock size={18} />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#ffffff',
                        fontSize: '14px',
                        padding: 0
                      }}
                      className="placeholder-[#71856d]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="text-[#a0a0a0] hover:text-[#65c556] transition cursor-pointer shrink-0 p-1 flex items-center justify-center"
                      title={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showLoginPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Accesos de Demostración para Evaluación (autocompleta campos para validar en BD) */}
                <div className="bg-[#293827] border border-[#5a7056]/60 rounded-2xl p-3.5 flex flex-col gap-2 mt-1">
                  <span className="text-[11px] font-bold text-[#65c556] uppercase tracking-wider flex items-center gap-1.5">
                    <IconCheck size={14} />
                    Accesos de Demostración para Evaluación
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickFill('lucas@gmail.com', 'password123')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1e281d] hover:bg-[#344732] border border-[#5a7056] text-[11px] font-semibold text-white transition text-center cursor-pointer truncate"
                      title="Lucas Díaz (Cliente / Capitán)"
                    >
                      ⚽ Lucas (Cliente)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('complejoub.soporte@gmail.com', 'admin123')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1e281d] hover:bg-[#344732] border border-[#5a7056] text-[11px] font-semibold text-white transition text-center cursor-pointer truncate"
                      title="Superadministrador Titular"
                    >
                      👑 Superadmin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('operador@complejoub.com', 'password123')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1e281d] hover:bg-[#344732] border border-[#5a7056] text-[11px] font-semibold text-white transition text-center cursor-pointer truncate"
                      title="Administrador de Sede"
                    >
                      🛡️ Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickFill('arbitro@complejoub.com', 'password123')}
                      className="px-2.5 py-1.5 rounded-lg bg-[#1e281d] hover:bg-[#344732] border border-[#5a7056] text-[11px] font-semibold text-white transition text-center cursor-pointer truncate"
                      title="Sebastián Norjean (Árbitro)"
                    >
                      🟨 Árbitro
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingLogin}
                  className="mt-2 w-full py-3 rounded-xl bg-[#65c556] hover:bg-[#54b045] text-[#293827] font-black text-sm shadow-lg shadow-[rgba(101,197,86,0.25)] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingLogin ? (
                    <>
                      <div className="size-4 border-2 border-[#293827] border-t-transparent rounded-full animate-spin" />
                      <span>Validando credenciales en base de datos...</span>
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
              <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-4">
                {registerError && (
                  <div className="bg-[#7f1d1d]/80 border border-[#ef4444] p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-[#fecaca] animate-fadeIn">
                    <IconAlert size={16} className="shrink-0 text-[#ef4444] mt-0.5" />
                    <span className="leading-relaxed">{registerError}</span>
                  </div>
                )}

                {/* Campo Nombre */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#c0c0c0]">Nombre y Apellido</label>
                  <div
                    className="rounded-xl border border-[#5a7056] focus-within:border-[#65c556] transition"
                    style={{
                      backgroundColor: '#293827',
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0a0', flexShrink: 0 }}>
                      <IconUsers size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Nicolás Paiva"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#ffffff',
                        fontSize: '14px',
                        padding: 0
                      }}
                      className="placeholder-[#71856d]"
                    />
                  </div>
                </div>

                {/* Campo Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#c0c0c0]">Correo Electrónico (Válido con dominio)</label>
                  <div
                    className="rounded-xl border border-[#5a7056] focus-within:border-[#65c556] transition"
                    style={{
                      backgroundColor: '#293827',
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0a0', flexShrink: 0 }}>
                      <IconMail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="nombre@ejemplo.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      style={{
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: '#ffffff',
                        fontSize: '14px',
                        padding: 0
                      }}
                      className="placeholder-[#71856d]"
                    />
                  </div>
                  <span className="text-[11px] text-[#a0a0a0]">
                    Te enviaremos un código de seguridad de 6 dígitos para verificar tu cuenta.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Campo Contraseña */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#c0c0c0]">Contraseña</label>
                    <div
                      className="rounded-xl border border-[#5a7056] focus-within:border-[#65c556] transition"
                      style={{
                        backgroundColor: '#293827',
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0a0a0', flexShrink: 0 }}>
                        <IconLock size={18} />
                      </div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: '#ffffff',
                          fontSize: '14px',
                          padding: 0
                        }}
                        className="placeholder-[#71856d]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        className="text-[#a0a0a0] hover:text-[#65c556] transition cursor-pointer shrink-0 p-1 flex items-center justify-center"
                        title={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showRegPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Campo Teléfono */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#c0c0c0]">Teléfono Móvil (Opcional)</label>
                    <div
                      className="rounded-xl border border-[#5a7056] focus-within:border-[#65c556] transition"
                      style={{
                        backgroundColor: '#293827',
                        padding: '14px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                      }}
                    >
                      <input
                        type="tel"
                        placeholder="+54 11 ..."
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        style={{
                          width: '100%',
                          backgroundColor: 'transparent',
                          border: 'none',
                          outline: 'none',
                          color: '#ffffff',
                          fontSize: '14px',
                          padding: 0
                        }}
                        className="placeholder-[#71856d]"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingRegister}
                  className="mt-2 w-full py-3 rounded-xl bg-[#65c556] hover:bg-[#54b045] text-[#293827] font-black text-sm shadow-lg shadow-[rgba(101,197,86,0.25)] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingRegister ? (
                    <>
                      <div className="size-4 border-2 border-[#293827] border-t-transparent rounded-full animate-spin" />
                      <span>Registrando y enviando código...</span>
                    </>
                  ) : (
                    <>
                      <IconMail size={18} />
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
  );
};

export default LoginScreen;
