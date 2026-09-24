import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import CancelacionConfirmModal from '../components/CancelacionConfirmModal';
import { type BookingItem } from '../data/mockData';

export interface MisReservasProps {
  onNavigate: (screen: string) => void;
}

export const MisReservas: React.FC<MisReservasProps> = ({ onNavigate }) => {
  const {
    bookings,
    cancelBooking,
    userAbsences,
    isUserBanned,
    notifications,
    markAllNotificationsRead
  } = useComplejo();

  const [activeTab, setActiveTab] = useState<'activos' | 'historial' | 'perfil' | 'notificaciones'>('activos');
  const [bookingToCancel, setBookingToCancel] = useState<BookingItem | null>(null);

  // Invitaciones demo
  const [invitations, setInvitations] = useState([
    { id: 'inv-1', team: 'Pico y Pala FC', captain: 'Carlos Tévez', tournament: 'Copa Apertura F5', role: 'Delantero' },
    { id: 'inv-2', team: 'Volea Perfecta', captain: 'Guillermo Vilas', tournament: 'Torneo Relámpago Pádel', role: 'Drive' }
  ]);

  const activeBookings = bookings.filter((b) => b.status === 'Confirmada' || b.status === 'Pendiente');
  const pastBookings = bookings.filter((b) => b.status === 'Completada' || b.status === 'Cancelada');

  const handleConfirmCancel = () => {
    if (bookingToCancel) {
      cancelBooking(bookingToCancel.id);
      setBookingToCancel(null);
    }
  };

  const handleAcceptInvite = (id: string, team: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
    alert(`¡Aceptaste la invitación para sumarte a "${team}"!`);
  };

  const handleRejectInvite = (id: string) => {
    setInvitations((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="bg-[#293827] min-h-full w-full font-['Inter',sans-serif] text-white flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-[#1e281d] border-b border-[#5a7056] px-6 lg:px-12 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="bg-[rgba(101,197,86,0.15)] flex items-center justify-center rounded-xl size-9 border border-[#65c556] text-xl">
            ⚽
          </div>
          <span className="font-extrabold text-base tracking-tight text-white">
            Complejo Deportivo <strong className="text-[#65c556]">UB</strong>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="text-xs font-semibold text-[#c0c0c0] hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          >
            ← Volver a Canchas
          </button>
          <button
            type="button"
            onClick={() => onNavigate('mis-torneos')}
            className="text-xs font-semibold text-[#c0c0c0] hover:text-white transition-colors cursor-pointer bg-transparent border-none"
          >
            🏆 Torneos
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('activos')}
            className={`text-xs font-bold transition-colors cursor-pointer bg-transparent border-none ${
              activeTab === 'activos' ? 'text-[#65c556]' : 'text-[#c0c0c0]'
            }`}
          >
            Mis Reservas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`text-xs font-bold transition-colors cursor-pointer bg-transparent border-none ${
              activeTab === 'perfil' ? 'text-[#65c556]' : 'text-[#c0c0c0]'
            }`}
          >
            Mi Perfil
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notificaciones')}
            className={`text-xs font-bold transition-colors cursor-pointer bg-transparent border-none flex items-center gap-1 ${
              activeTab === 'notificaciones' ? 'text-[#65c556]' : 'text-[#c0c0c0]'
            }`}
          >
            <span>🔔</span> Notificaciones
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="px-6 lg:px-12 py-8 flex flex-col gap-6 max-w-6xl mx-auto w-full">
        {/* Absence Warning Banner */}
        {isUserBanned ? (
          <div className="bg-[rgba(229,62,62,0.15)] border-2 border-[#e53e3e] rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🚫</span>
              <div>
                <h3 className="font-bold text-base text-[#e53e3e]">
                  Cuenta Suspendida para Nuevas Reservas
                </h3>
                <p className="text-xs text-[#c0c0c0] mt-0.5">
                  Has acumulado <strong>3 inasistencias consecutivas</strong> a turnos reservados. De acuerdo a la normativa del complejo, tu cuenta está bloqueada durante 2 semanas.
                </p>
              </div>
            </div>
            <span className="bg-[#e53e3e] text-white text-xs font-black px-3 py-1 rounded-full uppercase">
              Sanción Vigente
            </span>
          </div>
        ) : userAbsences > 0 ? (
          <div className="bg-[rgba(245,158,11,0.15)] border border-[#f59e0b] rounded-2xl p-4 flex items-center gap-3 text-xs text-[#f59e0b]">
            <span className="text-xl">⚠️</span>
            <span>
              <strong>Atención:</strong> Registrás <strong>{userAbsences}/3 inasistencias consecutivas</strong>. Si acumulás 3 faltas sin aviso previo, no podrás reservar canchas durante dos semanas.
            </span>
          </div>
        ) : null}

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Panel de Cliente y Capitán</h1>
            <p className="text-xs text-[#a0a0a0] mt-0.5">
              Gestión de reservas activas, política de seña del 30%, ficha deportiva e invitaciones a equipos.
            </p>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-1.5 bg-[#1e281d] p-1.5 rounded-xl border border-[#5a7056] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('activos')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'activos'
                  ? 'bg-[#65c556] text-[#293827] font-bold'
                  : 'text-[#a0a0a0] hover:text-white'
              }`}
            >
              Próximos Turnos ({activeBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('historial')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'historial'
                  ? 'bg-[#65c556] text-[#293827] font-bold'
                  : 'text-[#a0a0a0] hover:text-white'
              }`}
            >
              Historial ({pastBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('perfil')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-[#65c556] text-[#293827] font-bold'
                  : 'text-[#a0a0a0] hover:text-white'
              }`}
            >
              Mi Ficha & Equipos
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('notificaciones')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'notificaciones'
                  ? 'bg-[#65c556] text-[#293827] font-bold'
                  : 'text-[#a0a0a0] hover:text-white'
              }`}
            >
              Notificaciones
            </button>
          </div>
        </div>

        {/* TAB 1: TURNOS ACTIVOS */}
        {activeTab === 'activos' && (
          <div className="flex flex-col gap-4">
            {activeBookings.length === 0 ? (
              <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-10 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">🏟️</span>
                <p className="text-base font-bold text-white">No tenés reservas activas en este momento</p>
                <p className="text-xs text-[#a0a0a0]">Elegí una cancha y horario para realizar tu reserva online.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#65c556] text-[#293827] font-bold text-xs"
                >
                  Ver Canchas Disponibles
                </button>
              </div>
            ) : (
              activeBookings.map((b) => {
                const canRefund = b.hoursUntilMatch > 24;
                return (
                  <div
                    key={b.id}
                    className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-[#65c556]/60 transition-all"
                  >
                    <div className="flex flex-col gap-2 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-extrabold uppercase text-[#65c556]">
                          {b.sport}
                        </span>
                        <span className="text-xs text-[#a0a0a0]">• Código: {b.id}</span>
                        <span className="bg-[rgba(101,197,86,0.15)] text-[#65c556] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#65c556]/30">
                          {b.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white">{b.courtName}</h3>

                      <div className="flex items-center gap-4 text-xs text-[#c0c0c0]">
                        <span>📅 {b.date}</span>
                        <span>⏰ {b.time}</span>
                        <span>⏱️ Duración: 1 hora</span>
                      </div>

                      {/* 30% deposit badge & breakdown */}
                      <div className="bg-[#293827] border border-[#5a7056] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs mt-1">
                        <div>
                          <span className="text-[#a0a0a0] block text-[11px]">Tarifa total fija:</span>
                          <span className="font-bold text-white">${b.totalPrice.toLocaleString('es-AR')}</span>
                        </div>
                        <div>
                          <span className="text-[#65c556] block text-[11px] font-semibold">Seña abonada (30%):</span>
                          <span className="font-extrabold text-[#65c556]">${b.depositPaid.toLocaleString('es-AR')}</span>
                        </div>
                        <div>
                          <span className="text-[#a0a0a0] block text-[11px]">Saldo en el predio (70%):</span>
                          <span className="font-bold text-white">${b.remainingBalance.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action & Cancellation Notice */}
                    <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setBookingToCancel(b)}
                        className="px-4 py-2.5 rounded-xl border border-[#e53e3e] text-[#e53e3e] hover:bg-[#e53e3e] hover:text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Cancelar Turno
                      </button>

                      <span className="text-[11px] text-[#a0a0a0]">
                        {canRefund ? (
                          <span className="text-[#65c556]">✓ Reintegro 100% de la seña disponible</span>
                        ) : (
                          <span className="text-[#f59e0b]">⚠️ Falta menos de 24h: seña no reembolsable</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: HISTORIAL DE TURNOS */}
        {activeTab === 'historial' && (
          <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-[#5a7056] flex justify-between items-center bg-[#293827]/40">
              <span className="font-bold text-sm text-white">Historial de Turnos Pasados</span>
              <span className="text-xs text-[#a0a0a0]">{pastBookings.length} turnos registrados</span>
            </div>

            <div className="divide-y divide-[#293827]">
              {pastBookings.map((b) => (
                <div key={b.id} className="p-5 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#65c556]">{b.sport}</span>
                      <span className="text-xs text-[#a0a0a0]">• {b.date} • {b.time}</span>
                    </div>
                    <p className="text-sm font-bold text-white mt-0.5">{b.courtName}</p>
                    <p className="text-xs text-[#a0a0a0] mt-0.5">
                      Tarifa: ${b.totalPrice.toLocaleString('es-AR')} (Seña: ${b.depositPaid.toLocaleString('es-AR')})
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      b.status === 'Completada'
                        ? 'bg-[rgba(101,197,86,0.15)] text-[#65c556]'
                        : 'bg-[rgba(229,62,62,0.15)] text-[#e53e3e]'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: FICHA DE JUGADOR & EQUIPOS */}
        {activeTab === 'perfil' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player Card */}
            <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-[#65c556] text-[#293827] font-black text-2xl flex items-center justify-center">
                  JP
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Juan Pérez</h3>
                  <p className="text-xs text-[#65c556] font-semibold">Capitán / Jugador Registrado</p>
                  <p className="text-xs text-[#a0a0a0]">DNI: 40.123.456 • juan.perez@ub.edu.ar</p>
                </div>
              </div>

              <div className="border-t border-[#3b4d38] pt-4 flex flex-col gap-2">
                <span className="text-xs font-bold text-[#a0a0a0] uppercase">
                  Historial de Equipos y Torneos
                </span>
                <div className="bg-[#293827] p-3.5 rounded-xl border border-[#5a7056] flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-white">Los Galácticos FC</span>
                    <span className="text-xs text-[#65c556] font-bold">Activo (Capitán)</span>
                  </div>
                  <p className="text-xs text-[#a0a0a0]">
                    Torneo: Copa Apertura Fútbol 5 • Rol: Delantero (#10)
                  </p>
                </div>

                <div className="bg-[#293827] p-3.5 rounded-xl border border-[#5a7056] flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-white">Deportivo Agronomía</span>
                    <span className="text-xs text-gray-400">Torneo 2025 (Finalizado)</span>
                  </div>
                  <p className="text-xs text-[#a0a0a0]">
                    Torneo Clausura Fútbol 8 • Subcampeón
                  </p>
                </div>
              </div>
            </div>

            {/* Invitations to other teams */}
            <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">Invitaciones de Equipos</h3>
                </div>
                <p className="text-xs text-[#a0a0a0] mt-0.5">
                  Capitanes que te convocaron para sumarte a sus planteles oficiales.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {invitations.length === 0 ? (
                  <p className="text-xs text-[#a0a0a0] italic py-4 text-center">
                    No tenés invitaciones pendientes.
                  </p>
                ) : (
                  invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-[#293827] p-4 rounded-xl border border-[#5a7056] flex flex-col gap-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-white">{inv.team}</h4>
                          <p className="text-xs text-[#a0a0a0]">
                            Capitán: <strong className="text-[#c0c0c0]">{inv.captain}</strong> • {inv.tournament}
                          </p>
                        </div>
                        <span className="bg-[#1e281d] text-[#65c556] text-[10px] font-bold px-2 py-0.5 rounded border border-[#5a7056]">
                          Posición: {inv.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-1 border-t border-[#3b4d38]">
                        <button
                          type="button"
                          onClick={() => handleAcceptInvite(inv.id, inv.team)}
                          className="flex-1 py-1.5 rounded-lg bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs cursor-pointer transition-colors"
                        >
                          ✓ Aceptar Invitación
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectInvite(inv.id)}
                          className="px-3 py-1.5 rounded-lg border border-[#5a7056] text-[#a0a0a0] hover:text-white font-semibold text-xs cursor-pointer"
                        >
                          ✕ Rechazar
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NOTIFICACIONES */}
        {activeTab === 'notificaciones' && (
          <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#5a7056] pb-3">
              <div>
                <h3 className="text-base font-bold text-white">Centro de Notificaciones</h3>
                <p className="text-xs text-[#a0a0a0]">Avisos de reservas, señas, sanciones y torneos.</p>
              </div>
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-xs text-[#65c556] font-bold hover:underline cursor-pointer bg-transparent border-none"
              >
                Marcar todas como leídas
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                    !n.read
                      ? 'bg-[#293827] border-[#65c556]/60'
                      : 'bg-[#293827]/40 border-[#5a7056]'
                  }`}
                >
                  <span className="text-xl">
                    {n.type === 'reserva' ? '⚽' : n.type === 'torneo' ? '🏆' : n.type === 'sancion' ? '⚠️' : 'ℹ️'}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white">{n.title}</h4>
                      <span className="text-[10px] text-[#a0a0a0] font-mono">{n.timeAgo}</span>
                    </div>
                    <p className="text-xs text-[#c0c0c0] mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal de Cancelación con regla de 24hs */}
      <CancelacionConfirmModal
        isOpen={!!bookingToCancel}
        bookingName={bookingToCancel ? `${bookingToCancel.courtName} (${bookingToCancel.date} • ${bookingToCancel.time})` : ''}
        hoursUntilMatch={bookingToCancel?.hoursUntilMatch ?? 48}
        depositAmount={bookingToCancel?.depositPaid ?? 5400}
        onClose={() => setBookingToCancel(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};

export default MisReservas;
