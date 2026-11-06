import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import CancelacionConfirmModal from '../components/CancelacionConfirmModal';
import { type BookingItem } from '../data/mockData';
import { formatTimeAgo } from '../utils/dateUtils';
import { authApi } from '../api/endpoints';
import {
  IconClipboard,
  IconUser,
  IconBell,
  IconArrowLeft,
  IconBan,
  IconAlert,
  IconStadium,
  IconCalendar,
  IconClock,
  IconIdCard,
  IconCheck,
  IconClose,
  IconBall,
  IconTrophy,
  IconInfo
} from '../components/Icons';

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
    markAllNotificationsRead,
    invitations,
    responderInvitacion,
    currentUser,
    setCurrentUser,
    userParticipations
  } = useComplejo();

  const [activeTab, setActiveTab] = useState<'activos' | 'historial' | 'perfil' | 'notificaciones'>('activos');
  const [bookingToCancel, setBookingToCancel] = useState<BookingItem | null>(null);
  const [isResponding, setIsResponding] = useState<Record<string, boolean>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [isEditingDni, setIsEditingDni] = useState(false);
  const [dniInput, setDniInput] = useState(currentUser?.dni ? String(currentUser.dni).replace(/\D/g, '') : '');
  const [dniUpdating, setDniUpdating] = useState(false);
  const [dniError, setDniError] = useState<string | null>(null);
  const [dniSuccess, setDniSuccess] = useState<string | null>(null);

  const activeBookings = bookings.filter((b) => b.status === 'Confirmada' || b.status === 'Pendiente');
  const pastBookings = bookings.filter((b) => b.status === 'Completada' || b.status === 'Cancelada');

  const handleConfirmCancel = () => {
    if (bookingToCancel) {
      cancelBooking(bookingToCancel.id);
      setBookingToCancel(null);
    }
  };

  const handleAcceptInvite = async (id: string, team: string) => {
    setIsResponding((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await responderInvitacion(id, 'ACEPTADA');
      setFeedbackMsg({
        text: res.message || `Aceptaste la invitación para sumarte a "${team}".`,
        type: 'success'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        text: err?.message || 'Error al procesar la respuesta a la invitación.',
        type: 'error'
      });
    } finally {
      setIsResponding((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleRejectInvite = async (id: string, team: string) => {
    setIsResponding((prev) => ({ ...prev, [id]: true }));
    try {
      const res = await responderInvitacion(id, 'RECHAZADA');
      setFeedbackMsg({
        text: res.message || `Rechazaste la invitación de "${team}".`,
        type: 'success'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({
        text: err?.message || 'Error al procesar la respuesta a la invitación.',
        type: 'error'
      });
    } finally {
      setIsResponding((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSaveDni = async (e: React.FormEvent) => {
    e.preventDefault();
    setDniError(null);
    setDniSuccess(null);
    const cleanDni = dniInput.replace(/\D/g, '').trim();
    if (!cleanDni) {
      setDniError('Ingresa tu número de DNI.');
      return;
    }
    if (cleanDni.length < 7 || cleanDni.length > 8) {
      setDniError('El DNI debe tener exactamente 7 u 8 dígitos numéricos.');
      return;
    }

    setDniUpdating(true);
    try {
      await authApi.actualizarDni(cleanDni);
      if (currentUser) {
        const updatedUser = { ...currentUser, dni: cleanDni };
        setCurrentUser(updatedUser);
        localStorage.setItem('complejo_user', JSON.stringify(updatedUser));
      }
      setDniSuccess('DNI actualizado y verificado con éxito.');
      setIsEditingDni(false);
      setTimeout(() => setDniSuccess(null), 4000);
    } catch (err: any) {
      setDniError(err?.message || 'Error al guardar el DNI.');
    } finally {
      setDniUpdating(false);
    }
  };

  return (
    <div className="bg-[#f4f6f4] min-h-full w-full font-['Inter',sans-serif] text-slate-900 flex flex-col">
      {/* Subheader */}
      <div className="bg-white border-b border-slate-200">
        <div className="px-4 sm:px-6 lg:px-8 py-5 max-w-6xl mx-auto w-full flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Panel de Cliente y Capitán</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión de turnos reservados, señas del 30%, ficha deportiva e invitaciones a planteles.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('landing')}
            className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center gap-1.5"
          >
            <IconArrowLeft size={14} />
            <span>Volver a Grilla de Canchas</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 max-w-6xl mx-auto w-full">
        {/* Absence Warning Banner */}
        {isUserBanned ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <IconBan size={20} />
              </div>
              <div>
                <h3 className="font-bold text-sm text-red-800">
                  Cuenta Suspendida para Nuevas Reservas
                </h3>
                <p className="text-xs text-red-600/90 mt-0.5">
                  Has acumulado <strong>3 inasistencias consecutivas</strong> a turnos reservados. Según el reglamento del complejo, tu cuenta permanece suspendida por 2 semanas.
                </p>
              </div>
            </div>
            <span className="bg-red-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase">
              Sanción Vigente
            </span>
          </div>
        ) : userAbsences > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
            <IconAlert size={18} className="text-amber-600 shrink-0" />
            <span>
              <strong>Atención:</strong> Registrás <strong>{userAbsences}/3 inasistencias consecutivas</strong>. Si acumulás 3 faltas sin cancelación previa, tu cuenta se suspenderá por 14 días.
            </span>
          </div>
        ) : null}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-xs flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab('activos')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'activos'
                ? 'bg-[#199e1b] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <IconClipboard size={15} />
            <span>Próximos Turnos ({activeBookings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('historial')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'historial'
                ? 'bg-[#199e1b] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <IconClock size={15} />
            <span>Historial ({pastBookings.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('perfil')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'perfil'
                ? 'bg-[#199e1b] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <IconUser size={15} />
            <span>Mi Ficha y Equipos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('notificaciones')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'notificaciones'
                ? 'bg-[#199e1b] text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <IconBell size={15} />
            <span>Notificaciones</span>
          </button>
        </div>

        {/* TAB 1: TURNOS ACTIVOS */}
        {activeTab === 'activos' && (
          <div className="flex flex-col gap-4">
            {activeBookings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center gap-3 shadow-xs">
                <div className="size-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <IconStadium size={24} />
                </div>
                <p className="text-base font-bold text-slate-900">No tenés reservas activas en este momento</p>
                <p className="text-xs text-slate-500">Seleccioná una cancha y horario en la grilla principal para reservar tu turno.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('landing')}
                  className="mt-2 px-5 py-2.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs cursor-pointer shadow-sm"
                >
                  Ver Canchas Disponibles
                </button>
              </div>
            ) : (
              activeBookings.map((b) => {
                const canRefund = Boolean(b.aplicaDevolucion);
                return (
                  <div
                    key={b.id}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-emerald-300 transition-all"
                  >
                    <div className="flex flex-col gap-2.5 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-bold uppercase text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          {b.sport}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Código #{b.id}</span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {b.status}
                        </span>
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900">{b.courtName}</h3>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <IconCalendar size={14} className="text-emerald-600" />
                          <span>{b.date}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <IconClock size={14} className="text-emerald-600" />
                          <span>{b.time} (1 hora)</span>
                        </span>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs mt-1">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Tarifa total del turno</span>
                          <span className="font-bold text-slate-900">${b.totalPrice.toLocaleString('es-AR')}</span>
                        </div>
                        <div>
                          <span className="text-emerald-700 block text-[11px] font-semibold">Seña abonada (30%)</span>
                          <span className="font-extrabold text-emerald-700">${b.depositPaid.toLocaleString('es-AR')}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Saldo en complejo (70%)</span>
                          <span className="font-bold text-slate-900">${b.remainingBalance.toLocaleString('es-AR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setBookingToCancel(b)}
                        className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white font-bold text-xs transition-colors cursor-pointer"
                      >
                        Cancelar Turno
                      </button>

                      <span className="text-[11px]">
                        {canRefund ? (
                          <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                            <IconCheck size={13} />
                            <span>Reintegro 100% de la seña disponible</span>
                          </span>
                        ) : (
                          <span className="text-amber-700 font-medium inline-flex items-center gap-1">
                            <IconAlert size={13} />
                            <span>Menos de 24h: seña no reembolsable</span>
                          </span>
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
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-sm text-slate-900">Historial de Turnos Pasados</span>
              <span className="text-xs text-slate-500">{pastBookings.length} registros</span>
            </div>

            {pastBookings.length === 0 ? (
              <div className="p-10 text-center text-xs text-slate-500">
                No registrás turnos finalizados o cancelados aún.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pastBookings.map((b) => (
                  <div key={b.id} className="p-5 flex items-center justify-between gap-4 flex-wrap hover:bg-slate-50/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-emerald-700">{b.sport}</span>
                        <span className="text-xs text-slate-500">· {b.date} · {b.time}</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 mt-0.5">{b.courtName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Tarifa: ${b.totalPrice.toLocaleString('es-AR')} (Seña: ${b.depositPaid.toLocaleString('es-AR')})
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        b.status === 'Completada'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: FICHA DE JUGADOR & EQUIPOS */}
        {activeTab === 'perfil' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="size-14 rounded-2xl bg-[#199e1b] text-white font-extrabold text-xl flex items-center justify-center shrink-0">
                  {currentUser?.nombre
                    ? currentUser.nombre
                        .split(' ')
                        .filter(Boolean)
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()
                    : 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{currentUser?.nombre || 'Usuario Registrado'}</h3>
                  <p className="text-xs text-emerald-700 font-semibold">
                    {userParticipations.some(p => p.isCaptain) ? 'Capitán / Jugador Oficial' : 'Jugador Registrado'}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <p className="text-xs text-slate-500">
                      DNI: <strong className={currentUser?.dni ? 'text-slate-900 font-mono' : 'text-amber-600 font-bold'}>{currentUser?.dni || 'Sin registrar'}</strong> · {currentUser?.email || 'Sin especificar'}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setDniInput(currentUser?.dni ? String(currentUser.dni).replace(/\D/g, '') : '');
                        setIsEditingDni((prev) => !prev);
                        setDniError(null);
                        setDniSuccess(null);
                      }}
                      className="text-[11px] text-emerald-700 hover:underline cursor-pointer bg-transparent border-none font-bold"
                    >
                      {currentUser?.dni ? (isEditingDni ? 'Cancelar' : 'Modificar DNI') : '+ Cargar DNI'}
                    </button>
                  </div>
                </div>
              </div>

              {(!currentUser?.dni || isEditingDni) && (
                <form onSubmit={handleSaveDni} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <IconIdCard size={15} className="text-emerald-600" />
                      <span>{currentUser?.dni ? 'Modificar DNI Oficial' : 'Completar DNI de Cuenta'}</span>
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">7 u 8 dígitos</span>
                  </div>

                  {!currentUser?.dni && !isEditingDni && (
                    <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
                      Tu cuenta no posee un DNI registrado. Es necesario completarlo para figurar en las nóminas oficiales de torneos.
                    </p>
                  )}

                  {dniError && (
                    <div className="bg-red-50 border border-red-200 p-2.5 rounded-lg text-xs text-red-700">
                      {dniError}
                    </div>
                  )}

                  {dniSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg text-xs text-emerald-800">
                      {dniSuccess}
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      maxLength={8}
                      placeholder="Ej: 38123456"
                      value={dniInput}
                      onChange={(e) => setDniInput(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600"
                    />
                    <button
                      type="submit"
                      disabled={dniUpdating}
                      className="px-4 py-2 bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer border-none disabled:opacity-50"
                    >
                      {dniUpdating ? 'Guardando...' : 'Guardar DNI'}
                    </button>
                  </div>
                </form>
              )}

              <div className="border-t border-slate-100 pt-4 flex flex-col gap-2.5">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Historial de Equipos y Torneos
                </span>
                {userParticipations.length === 0 ? (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                    <p className="text-xs text-slate-500">
                      Aún no integrás ningún equipo de torneo.
                    </p>
                  </div>
                ) : (
                  userParticipations.map((part) => (
                    <div key={part.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-sm text-slate-900">{part.teamName}</span>
                        <span
                          className={`text-xs font-bold ${
                            part.status === 'Activo' ? 'text-emerald-700' : 'text-slate-500'
                          }`}
                        >
                          {part.status === 'Activo'
                            ? `Activo (${part.isCaptain ? 'Capitán' : 'Miembro'})`
                            : `Torneo ${part.year || ''} (${part.status})`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        Torneo: {part.tournamentName} · Rol: {part.role}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Invitations to other teams */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Invitaciones de Equipos</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Capitanes que te convocaron para sumarte a sus planteles oficiales.
                </p>
              </div>

              {feedbackMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
                    feedbackMsg.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {feedbackMsg.type === 'success' ? <IconCheck size={15} /> : <IconAlert size={15} />}
                  <span>{feedbackMsg.text}</span>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {invitations.length === 0 ? (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                    No tenés invitaciones pendientes en este momento.
                  </div>
                ) : (
                  invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{inv.team}</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Capitán: <strong className="text-slate-700">{inv.captain}</strong> · {inv.tournament}
                          </p>
                        </div>
                        <span className="bg-white text-emerald-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200">
                          {inv.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200/70">
                        <button
                          type="button"
                          disabled={isResponding[inv.id]}
                          onClick={() => handleAcceptInvite(inv.id, inv.team)}
                          className="flex-1 py-2 px-4 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <IconCheck size={14} />
                          <span>{isResponding[inv.id] ? 'Procesando...' : 'Aceptar Invitación'}</span>
                        </button>
                        <button
                          type="button"
                          disabled={isResponding[inv.id]}
                          onClick={() => handleRejectInvite(inv.id, inv.team)}
                          className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:text-red-700 hover:border-red-200 hover:bg-red-50 font-semibold text-xs cursor-pointer transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <IconClose size={14} />
                          <span>Rechazar</span>
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
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Centro de Notificaciones</h3>
                <p className="text-xs text-slate-500">Avisos de reservas, señas, sanciones y torneos.</p>
              </div>
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-xs text-emerald-700 font-bold hover:underline cursor-pointer bg-transparent border-none"
              >
                Marcar todas como leídas
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500">
                  No tenés notificaciones registradas.
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 rounded-xl border flex items-start gap-3.5 transition-colors ${
                      !n.read
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div
                      className={`size-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        n.type === 'reserva'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                          : n.type === 'torneo'
                          ? 'bg-amber-50 border-amber-200 text-amber-600'
                          : n.type === 'sancion'
                          ? 'bg-red-50 border-red-200 text-red-600'
                          : 'bg-sky-50 border-sky-200 text-sky-600'
                      }`}
                    >
                      {n.type === 'reserva' ? (
                        <IconBall size={16} />
                      ) : n.type === 'torneo' ? (
                        <IconTrophy size={16} />
                      ) : n.type === 'sancion' ? (
                        <IconAlert size={16} />
                      ) : (
                        <IconInfo size={16} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900">{n.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{formatTimeAgo(n.createdAt || n.timeAgo)}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <CancelacionConfirmModal
        isOpen={!!bookingToCancel}
        bookingName={bookingToCancel ? `${bookingToCancel.courtName} (${bookingToCancel.date} · ${bookingToCancel.time})` : ''}
        isRefundable={bookingToCancel?.aplicaDevolucion ?? false}
        hoursUntilMatch={bookingToCancel?.hoursUntilMatch}
        depositAmount={bookingToCancel?.depositPaid ?? 5400}
        onClose={() => setBookingToCancel(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};

export default MisReservas;
