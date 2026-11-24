import React, { useState } from 'react';
import './LoginScreen.css';
import { type UserRole, useComplejo } from '../context/ComplejoContext';
import { authApi } from '../api/endpoints';
import { apiClient } from '../api/client';
import {
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
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

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

  // Validación de formato RFC de email
  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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
      const messageLower = errMsg.toLowerCase();
      const isConnectionError =
        messageLower.includes('failed to fetch') ||
        messageLower.includes('networkerror') ||
        messageLower.includes('fetch');

      const isAccountUnverified =
        err?.details?.requiresVerification === true ||
        messageLower.includes('debes activar tu cuenta') ||
        messageLower.includes('activación a tu casilla');

      if (isAccountUnverified) {
        setOtpEmail(emailTrimmed);
        setOtpCode('');
        setOtpError(null);
        setOtpSuccess(errMsg);
        setIsOtpModalOpen(true);
      } else if (isConnectionError) {
        setLoginError('No se pudo conectar con el servidor. Intentá nuevamente más tarde.');
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
        setOtpSuccess(res.message || '¡Código enviado con éxito! Revisa tu casilla de correo.');
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
    <div className="login-page">
      {/* Decorative ambient lighting */}
      <div className="login-ambient login-ambient--top" />
      <div className="login-ambient login-ambient--bottom" />

      {/* Main Container */}
      <div className="login-card">
        {/* Brand header */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <img src="/logo-ub.png" alt="Logo Complejo Deportivo UB" />
          </div>
          <h1 className="login-brand-title">
            Complejo Deportivo <strong>UB</strong>
          </h1>
          <p className="login-brand-subtitle">
            Pagina de reserva de canchas, torneos y arbitraje
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

            <form onSubmit={handleVerifyOtp} className="login-form">
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
                className="login-primary-button"
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
            <div className="login-tabs">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('login');
                  setLoginError(null);
                }}
                className={`login-tab ${activeTab === 'login' ? 'login-tab--active' : ''}`}
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
                className={`login-tab ${activeTab === 'register' ? 'login-tab--active' : ''}`}
              >
                <IconMail size={15} />
                <span>Registrarse</span>
              </button>
            </div>

            {/* TAB 1: Iniciar Sesión */}
            {activeTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="login-form">
                {/* Campo Correo Electrónico con Icono a la izquierda perfectamente espaciado */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#c0c0c0]">Correo Electrónico Registrado</label>
                  <div
                    className="login-field"
                  >
                    <div className="login-field-icon">
                      <IconMail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="Ingresá tu correo electrónico"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="login-field-input"
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
                    className="login-field"
                  >
                    <div className="login-field-icon">
                      <IconLock size={18} />
                    </div>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="Ingresa tu contraseña"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="login-field-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="login-password-toggle"
                      title={showLoginPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    >
                      {showLoginPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Mensaje de Error en Rojo abajo de los campos */}
                {loginError && (
                  <div className="bg-[#7f1d1d]/90 border border-[#ef4444] p-3 rounded-xl flex items-start gap-2.5 text-xs text-[#fecaca] animate-fadeIn shadow-lg">
                    <IconAlert size={16} className="shrink-0 text-[#ef4444] mt-0.5" />
                    <span className="leading-relaxed font-semibold">{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingLogin}
                  className="login-primary-button"
                >
                  {loadingLogin ? (
                    <>
                      <div className="size-4 border-2 border-[#293827] border-t-transparent rounded-full animate-spin" />
                      <span>Validando credenciales en base de datos...</span>
                    </>
                  ) : (
                    <>
                      <IconCheck size={18} />
                      <span>Ingresar </span>
                    </>
                  )}
                </button>
              </form>
            )}

            {/* TAB 2: Registrarse */}
            {activeTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="login-form">
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
                    className="login-field"
                  >
                    <div className="login-field-icon">
                      <IconUsers size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Nicolás Paiva"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="login-field-input"
                    />
                  </div>
                </div>

                {/* Campo DNI / Documento de Identidad */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#c0c0c0]">DNI / Documento de Identidad</label>
                    <span className="text-[11px] text-[#65c556]">7 u 8 dígitos numéricos</span>
                  </div>
                  <div
                    className="login-field"
                  >
                    <div className="login-field-icon">
                      <IconCheck size={18} />
                    </div>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Ej: 45456123 (sin puntos ni espacios)"
                      value={regDni}
                      onChange={(e) => setRegDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="login-field-input font-mono"
                    />
                  </div>
                  <span className="text-[11px] text-[#a0a0a0]">
                    Requerido para ser identificado en nóminas de torneos y equipos oficiales.
                  </span>
                </div>

                {/* Campo Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#c0c0c0]">Correo Electrónico (Válido con dominio)</label>
                  <div
                    className="login-field"
                  >
                    <div className="login-field-icon">
                      <IconMail size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="ejemplo@correo.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="login-field-input"
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
                      className="login-field"
                    >
                      <div className="login-field-icon">
                        <IconLock size={18} />
                      </div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="login-field-input"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword((prev) => !prev)}
                        className="login-password-toggle"
                        title={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showRegPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Campo Teléfono */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-[#c0c0c0]">Número de teléfono (opcional)</label>
                    <div
                      className="login-field"
                    >
                      <input
                        type="tel"
                        placeholder="+54 ..."
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="login-field-input"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loadingRegister}
                  className="login-primary-button"
                >
                  {loadingRegister ? (
                    <>
                      <div className="size-4 border-2 border-[#293827] border-t-transparent rounded-full animate-spin" />
                      <span>Registrando y enviando código...</span>
                    </>
                  ) : (
                    <>
                      <IconMail size={18} />
                      <span>Crear Cuenta</span>
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
