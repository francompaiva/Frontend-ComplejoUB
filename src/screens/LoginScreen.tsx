import React, { useState } from 'react';
import { type UserRole } from '../context/ComplejoContext';

export interface LoginScreenProps {
  onLogin: (role: UserRole) => void;
}

const ROLES_INFO: Record<
  UserRole,
  { title: string; email: string; desc: string; icon: string; badge: string }
> = {
  cliente: {
    title: 'Cliente / Capitán',
    email: 'juan.perez@ub.edu.ar',
    desc: 'Reservar canchas, pagar 30% de seña, cancelar con reintegro, inscribir equipos y ver posiciones.',
    icon: '⚽',
    badge: 'Perfil Cliente'
  },
  admin: {
    title: 'Administrador General',
    email: 'admin@complejodeportivoub.com',
    desc: 'ABM de canchas, tarifas fijas, agenda diaria, control de inasistencias, torneos, reportes y auditoría.',
    icon: '🏟️',
    badge: 'Acceso Total'
  },
  arbitro: {
    title: 'Árbitro Oficial',
    email: 'arbitro.castrilli@asociacion.org',
    desc: 'Planilla digital de partidos asignados, carga de marcadores, tarjetas amarillas/rojas e informe disciplinario.',
    icon: '🟨',
    badge: 'Colegiado'
  }
};

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [role, setRole] = useState<UserRole>('cliente');
  const [email, setEmail] = useState(ROLES_INFO.cliente.email);
  const [password, setPassword] = useState('••••••••');

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    setEmail(ROLES_INFO[newRole].email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(role);
  };

  return (
    <div className="bg-[#293827] flex flex-col items-center justify-center min-h-screen p-4 text-white font-['Inter',sans-serif] relative overflow-hidden">
      {/* Decorative background glow circles */}
      <div className="absolute top-0 left-1/4 size-96 bg-[#65c556]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 size-96 bg-[#689e5f]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Login Box */}
      <div className="bg-[#1e281d] border border-[#5a7056] rounded-3xl p-8 sm:p-10 w-full max-w-lg shadow-2xl relative z-10 flex flex-col gap-6">
        {/* Brand header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="size-14 rounded-2xl bg-[rgba(101,197,86,0.15)] border-2 border-[#65c556] flex items-center justify-center text-3xl shadow-lg shadow-[rgba(101,197,86,0.2)]">
            🏟️
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Complejo Deportivo <strong className="text-[#65c556]">UB</strong>
          </h1>
          <p className="text-xs text-[#a0a0a0]">
            Sistema de Gestión de Reservas y Torneos (TP1 - Univ. de Belgrano)
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wider">
            Seleccionar Perfil de Usuario para la Demostración
          </label>

          <div className="grid grid-cols-3 gap-2 bg-[#293827] p-1.5 rounded-2xl border border-[#5a7056]">
            {(['cliente', 'admin', 'arbitro'] as UserRole[]).map((r) => {
              const isSel = role === r;
              const info = ROLES_INFO[r];
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRoleChange(r)}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl transition-all cursor-pointer border ${
                    isSel
                      ? 'bg-[#65c556] text-[#293827] border-[#65c556] font-bold shadow-md shadow-[rgba(101,197,86,0.25)]'
                      : 'border-transparent text-[#a0a0a0] hover:text-white hover:bg-[#1e281d]'
                  }`}
                >
                  <span className="text-lg mb-0.5">{info.icon}</span>
                  <span className="text-xs">{r === 'cliente' ? 'Cliente' : r === 'admin' ? 'Admin' : 'Árbitro'}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-[#293827] p-3 rounded-xl border border-[#5a7056]/60 text-xs text-[#c0c0c0] mt-1">
            <span className="font-bold text-[#65c556] block mb-0.5">{ROLES_INFO[role].title}:</span>
            {ROLES_INFO[role].desc}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#65c556]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#65c556]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-black text-sm transition-all shadow-lg shadow-[rgba(101,197,86,0.25)] cursor-pointer mt-2 flex items-center justify-center gap-2"
          >
            <span>Ingresar como {ROLES_INFO[role].title}</span>
            <span>→</span>
          </button>
        </form>

        <div className="border-t border-[#3b4d38] pt-4 text-center">
          <p className="text-[11px] text-[#a0a0a0]">
            Universidad de Belgrano • Facultad: Ing. y Tecnología Informática
          </p>
          <p className="text-[10px] text-[#689e5f] mt-0.5">
            Norjean, Marco, Pérez del Cerro y Paiva
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
