import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import CancelacionConfirmModal from '../components/CancelacionConfirmModal';
import type { BookingItem } from '../data/mockData';
import { formatTimeAgo } from '../utils/dateUtils';
import { authApi } from '../api/endpoints';
import './MisReservas.css';

export interface MisReservasProps {
  onNavigate: (screen: string) => void;
}

type ReservaTab = 'activos' | 'historial' | 'perfil' | 'notificaciones';

const dinero = (monto: number) => `$${monto.toLocaleString('es-AR')}`;


const fechaReservaLegible = (fecha: string) => {
  const match = String(fecha).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return fecha;

  const [, anio, mes, dia] = match;

  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(Number(anio), Number(mes) - 1, Number(dia), 12));
};

const nombreCanchaSinDeporte = (nombre: string, deporte: string) => {
  const sufijo = ` (${deporte})`;

  return nombre.toLocaleLowerCase('es-AR').endsWith(
    sufijo.toLocaleLowerCase('es-AR')
  )
    ? nombre.slice(0, -sufijo.length)
    : nombre;
};


export const MisReservas: React.FC<MisReservasProps> = ({ onNavigate }) => {
  const {
    bookings, cancelBooking, userAbsences, isUserBanned,
    notifications, markAllNotificationsRead, invitations, responderInvitacion,
    currentUser, setCurrentUser, userParticipations
  } = useComplejo();

  const [activeTab, setActiveTab] = useState<ReservaTab>('activos');
  const [bookingToCancel, setBookingToCancel] = useState<BookingItem | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isResponding, setIsResponding] = useState<Record<string, boolean>>({});
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isEditingDni, setIsEditingDni] = useState(false);
  const [dniInput, setDniInput] = useState(currentUser?.dni ? String(currentUser.dni).replace(/\D/g, '') : '');
  const [dniUpdating, setDniUpdating] = useState(false);
  const [dniError, setDniError] = useState<string | null>(null);
  const [dniSuccess, setDniSuccess] = useState<string | null>(null);


  const yaPasoLaReserva = (b: BookingItem): boolean => {
    const fecha = String(b.date).match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
    const hora = String(b.time).match(/^(\d{1,2}):(\d{2})/);

    if (!fecha || !hora) return false;

    const inicio = new Date(
      `${fecha}T${hora[1].padStart(2, '0')}:${hora[2]}:00-03:00`
    );

    if (Number.isNaN(inicio.getTime())) return false;

    // Cada turno dura una hora.
    const fin = inicio.getTime() + 60 * 60 * 1000;

    return Date.now() >= fin;
  };

  const activeBookings = bookings.filter(
    b =>
      (b.status === 'Confirmada' || b.status === 'Pendiente') &&
      !yaPasoLaReserva(b)
  );

  const pastBookings = bookings.filter(
    b =>
      b.status === 'Completada' ||
      b.status === 'Cancelada' ||
      yaPasoLaReserva(b)
  );



  const handleConfirmCancel = async () => {
    if (!bookingToCancel || isCancelling) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      await cancelBooking(bookingToCancel.id);

      // Cerrar solamente cuando el backend confirmó.
      setBookingToCancel(null);
    } catch (err: unknown) {
      setCancelError(
        err instanceof Error
          ? err.message
          : 'No se pudo cancelar la reserva. Intentá nuevamente.'
      );
    } finally {
      setIsCancelling(false);
    }
  };


  const handleRespondInvite = async (id: string, team: string, response: 'ACEPTADA' | 'RECHAZADA') => {
    setIsResponding(prev => ({ ...prev, [id]: true }));
    try {
      const res = await responderInvitacion(id, response);
      setFeedbackMsg({
        text: res.message || (response === 'ACEPTADA'
          ? `¡Aceptaste la invitación para sumarte a "${team}"!`
          : `Rechazaste la invitación de "${team}".`),
        type: 'success'
      });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      setFeedbackMsg({ text: err?.message || 'Error al procesar la invitación.', type: 'error' });
    } finally {
      setIsResponding(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSaveDni = async (e: React.FormEvent) => {
    e.preventDefault();
    setDniError(null);
    setDniSuccess(null);
    const cleanDni = dniInput.replace(/\D/g, '').trim();
    if (!cleanDni) {
      setDniError('Ingresá tu número de DNI.');
      return;
    }
    if (cleanDni.length < 7 || cleanDni.length > 8) {
      setDniError('El DNI debe tener 7 u 8 dígitos numéricos.');
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
      setDniSuccess('¡DNI actualizado y verificado con éxito!');
      setIsEditingDni(false);
      setTimeout(() => setDniSuccess(null), 4000);
    } catch (err: any) {
      setDniError(err?.message || 'Error al guardar el DNI.');
    } finally {
      setDniUpdating(false);
    }
  };

  const iniciales = currentUser?.nombre
    ? currentUser.nombre.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <div className="mr-page">
      <header className="mr-header">
        <div className="mr-header-top">
          <div>
            <p className="mr-eyebrow">MI CUENTA</p>
            <h1 className="mr-title">Mis Reservas</h1>
            <p className="mr-description">
              Administrá tus próximos turnos, consultá tu historial y revisá tu perfil.
            </p>
          </div>
          <button type="button" className="mr-book-button" onClick={() => onNavigate('landing')}>
            + Nueva Reserva
          </button>
        </div>

        <nav className="mr-tabs" aria-label="Secciones de Mis Reservas">
          <button type="button" className={`mr-tab${activeTab === 'activos' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('activos')} aria-pressed={activeTab === 'activos'}>
            Próximos Turnos ({activeBookings.length})
          </button>
          <button type="button" className={`mr-tab${activeTab === 'historial' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('historial')} aria-pressed={activeTab === 'historial'}>
            Historial ({pastBookings.length})
          </button>
          <button type="button" className={`mr-tab${activeTab === 'perfil' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('perfil')} aria-pressed={activeTab === 'perfil'}>
            Mi Perfil y Equipos
          </button>
          <button type="button" className={`mr-tab${activeTab === 'notificaciones' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('notificaciones')} aria-pressed={activeTab === 'notificaciones'}>
            Notificaciones
          </button>
        </nav>
      </header>

      <main className="mr-main">
        {isUserBanned ? (
          <div className="mr-alert mr-alert--danger" role="alert">
            <span className="mr-alert-icon" aria-hidden="true">🚫</span>
            <div className="mr-alert-content">
              <h2>Cuenta suspendida para nuevas reservas</h2>
              <p>Has acumulado <strong>3 inasistencias consecutivas</strong>. De acuerdo a la normativa del complejo, tu cuenta está bloqueada durante dos semanas.</p>
            </div>
            <span className="mr-alert-label">Sanción vigente</span>
          </div>
        ) : userAbsences > 0 ? (
          <div className="mr-alert mr-alert--warning" role="status">
            <span className="mr-alert-icon" aria-hidden="true">⚠️</span>
            <p><strong>Atención:</strong> registrás <strong>{userAbsences}/3 inasistencias consecutivas</strong>. Si acumulás 3 faltas sin aviso previo, no podrás reservar durante dos semanas.</p>
          </div>
        ) : null}

        {activeTab === 'activos' && (
          <section className="mr-reservations" aria-label="Próximos turnos">
            {activeBookings.length === 0 ? (
              <div className="mr-empty">
                
                <h2>No tenés reservas activas en este momento</h2>
                <p>Elegí una cancha y un horario para realizar tu reserva online.</p>
                <button type="button" className="mr-primary-btn" onClick={() => onNavigate('landing')}>
                  Ver canchas disponibles
                </button>
              </div>
            ) : activeBookings.map(b => (
              
            <article className="mr-booking-card" key={b.id}>
              <div className="mr-booking-top">
                <div className="mr-booking-info">
                  <div className="mr-booking-tags">
                    <span className="mr-sport">{b.sport}</span>

                    <span className="mr-booking-id">
                      Reserva #{b.id}
                    </span>

                    <span
                      className={`mr-status ${
                        b.status === 'Pendiente'
                          ? 'mr-status--pending'
                          : 'mr-status--confirmed'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>

                  <h2 className="mr-booking-title">
                    {nombreCanchaSinDeporte(b.courtName, b.sport)}
                  </h2>

                  <div className="mr-booking-meta">
                    <span>📅 {fechaReservaLegible(b.date)}</span>
                    <span>⏰ {b.time} · 1 hora</span>
                  </div>
                </div>

                <div className="mr-booking-actions">
                  <button
                    type="button"
                    className="mr-cancel-btn"
                    onClick={() => {
                    setCancelError(null);
                    setBookingToCancel(b);
                  }}
                  >
                    Cancelar turno
                  </button>

                  <p
                    className={
                      b.aplicaDevolucion
                        ? 'mr-refund mr-refund--yes'
                        : 'mr-refund mr-refund--no'
                    }
                  >
                    {b.aplicaDevolucion
                      ? '✓ Reintegro del 100% de la seña disponible'
                      : '⚠️ Seña no reembolsable (menos de 24 h)'}
                  </p>
                </div>
              </div>

              <div className="mr-payment-summary">
                <div>
                  <span className="mr-payment-label">Tarifa total</span>
                  <strong>{dinero(b.totalPrice)}</strong>
                </div>

                <div className="mr-payment-paid">
                  <span className="mr-payment-label">
                    Seña abonada (30%)
                  </span>
                  <strong className="mr-payment-accent">
                    {dinero(b.depositPaid)}
                  </strong>
                </div>

                <div>
                  <span className="mr-payment-label">
                    Saldo en el predio (70%)
                  </span>
                  <strong>{dinero(b.remainingBalance)}</strong>
                </div>
              </div>
            </article>

            ))}
          </section>
        )}

        {activeTab === 'historial' && (
          <section className="mr-panel" aria-label="Historial de turnos">
            <div className="mr-panel-header">
              <h2>Historial de turnos pasados</h2>
              <span>{pastBookings.length} turnos registrados</span>
            </div>
            {pastBookings.length === 0 ? (
              <p className="mr-panel-empty">Todavía no hay reservas finalizadas o canceladas.</p>
            ) : (
              <div className="mr-history-list">
                {pastBookings.map(b => (
                  <article className="mr-history-item" key={b.id}>
                    <div>
                      <div className="mr-history-meta">
                        <strong>{b.sport}</strong>
                        <span>• {b.date} • {b.time}</span>
                      </div>
                      <h3>{b.courtName}</h3>
                      <p>Tarifa: {dinero(b.totalPrice)} (Seña: {dinero(b.depositPaid)})</p>
                    </div>
                    <span
                      className={`mr-status ${
                        b.status === 'Cancelada'
                          ? 'mr-status--cancelled'
                          : yaPasoLaReserva(b) && b.status !== 'Completada'
                            ? 'mr-status--past'
                            : 'mr-status--confirmed'
                      }`}
                    >
                      {b.status === 'Cancelada'
                        ? 'Cancelada'
                        : yaPasoLaReserva(b) && b.status !== 'Completada'
                          ? 'Turno finalizado'
                          : b.status}
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'perfil' && (
          <section className="mr-profile-grid" aria-label="Perfil y equipos">
            <article className="mr-panel mr-panel--padded">
              <div className="mr-user-heading">
                <div className="mr-avatar" aria-hidden="true">{iniciales}</div>
                <div className="mr-user-summary">
                  <h2>{currentUser?.nombre || 'Usuario Registrado'}</h2>
                  <p className="mr-user-role">
                    {userParticipations.some(p => p.isCaptain)
                      ? 'Capitán / Jugador Registrado'
                      : 'Jugador Registrado'}
                  </p>
                  <div className="mr-user-data">
                    <p>DNI: <strong className={currentUser?.dni ? '' : 'mr-missing-dni'}>
                      {currentUser?.dni || 'Sin registrar'}
                    </strong> • {currentUser?.email || 'Sin especificar'}</p>
                    <button type="button" className="mr-text-btn" onClick={() => {
                      setDniInput(currentUser?.dni ? String(currentUser.dni).replace(/\D/g, '') : '');
                      setIsEditingDni(prev => !prev);
                      setDniError(null);
                      setDniSuccess(null);
                    }}>
                      {currentUser?.dni ? (isEditingDni ? '✕ Cancelar' : '✎ Modificar') : '+ Cargar DNI'}
                    </button>
                  </div>
                </div>
              </div>

              {(!currentUser?.dni || isEditingDni) && (
                <form className="mr-dni-form" onSubmit={handleSaveDni}>
                  <div className="mr-dni-heading">
                    <strong>🪪 {currentUser?.dni ? 'Modificar DNI oficial' : 'Completar DNI de cuenta'}</strong>
                    <span>7 u 8 dígitos</span>
                  </div>
                  {!currentUser?.dni && !isEditingDni && (
                    <p className="mr-dni-notice">⚠️ Necesitás registrar tu DNI para integrar las nóminas oficiales de torneos.</p>
                  )}
                  {dniError && <p className="mr-message mr-message--error" role="alert">{dniError}</p>}
                  {dniSuccess && <p className="mr-message mr-message--success">{dniSuccess}</p>}
                  <div className="mr-dni-input-row">
                    <input type="text" inputMode="numeric" maxLength={8} required
                      aria-label="Número de DNI" placeholder="Ej.: 38123456"
                      value={dniInput}
                      onChange={e => setDniInput(e.target.value.replace(/\D/g, '').slice(0, 8))}/>
                    <button type="submit" className="mr-primary-btn" disabled={dniUpdating}>
                      {dniUpdating ? 'Guardando...' : 'Guardar DNI'}
                    </button>
                  </div>
                </form>
              )}
              {dniSuccess && <p className="mr-message mr-message--success" role="status">{dniSuccess}</p>}

              <div className="mr-team-history">
                <h3>Historial de equipos y torneos</h3>
                {userParticipations.length === 0 ? (
                  <p className="mr-panel-empty">Aún no integrás ningún equipo.</p>
                ) : userParticipations.map(part => (
                  <div key={part.id} className="mr-team-row">
                    <div className="mr-team-row-header">
                      <strong>{part.teamName}</strong>
                      <span className={part.status === 'Activo' ? 'mr-team-active' : ''}>
                        {part.status === 'Activo'
                          ? `Activo (${part.isCaptain ? 'Capitán' : 'Miembro'})`
                          : `Torneo ${part.year || ''} (${part.status})`}
                      </span>
                    </div>
                    <p>Torneo: {part.tournamentName} • Rol: {part.role}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="mr-panel mr-panel--padded">
              <h2>Invitaciones de equipos</h2>
              <p className="mr-section-description">Capitanes que te convocaron para sumarte a sus planteles oficiales.</p>
              {feedbackMsg && (
                <p className={`mr-message mr-message--${feedbackMsg.type}`} role="status">
                  {feedbackMsg.type === 'success' ? '✅' : '⚠️'} {feedbackMsg.text}
                </p>
              )}
              <div className="mr-invitations">
                {invitations.length === 0 ? (
                  <p className="mr-panel-empty">No tenés invitaciones pendientes.</p>
                ) : invitations.map(inv => (
                  <div key={inv.id} className="mr-invitation-card">
                    <div className="mr-invitation-heading">
                      <div>
                        <h3>{inv.team}</h3>
                        <p>Capitán: <strong>{inv.captain}</strong> • {inv.tournament}</p>
                      </div>
                      <span>Posición: {inv.role}</span>
                    </div>
                    <div className="mr-invitation-actions">
                      <button type="button" className="mr-primary-btn" disabled={isResponding[inv.id]}
                        onClick={() => handleRespondInvite(inv.id, inv.team, 'ACEPTADA')}>
                        {isResponding[inv.id] ? 'Procesando...' : '✓ Aceptar invitación'}
                      </button>
                      <button type="button" className="mr-secondary-btn" disabled={isResponding[inv.id]}
                        onClick={() => handleRespondInvite(inv.id, inv.team, 'RECHAZADA')}>
                        ✕ Rechazar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {activeTab === 'notificaciones' && (
          <section className="mr-panel mr-panel--padded" aria-label="Notificaciones">
            <div className="mr-notifications-heading">
              <div>
                <h2>Centro de notificaciones</h2>
                <p className="mr-section-description">Avisos de reservas, señas, sanciones y torneos.</p>
              </div>
              <button type="button" className="mr-text-btn" onClick={markAllNotificationsRead}>
                Marcar todas como leídas
              </button>
            </div>
            {notifications.length === 0 ? (
              <p className="mr-panel-empty">No tenés notificaciones.</p>
            ) : (
              <div className="mr-notifications-list">
                {notifications.map(n => (
                  <article key={n.id} className={`mr-notification ${n.read ? '' : 'is-unread'}`}>
                    <span className="mr-notification-icon" aria-hidden="true">
                      {n.type === 'reserva' ? '⚽' : n.type === 'torneo' ? '🏆' : n.type === 'sancion' ? '⚠️' : 'ℹ️'}
                    </span>
                    <div className="mr-notification-body">
                      <div className="mr-notification-heading">
                        <h3>{n.title}</h3>
                        <time>{formatTimeAgo(n.createdAt || n.timeAgo)}</time>
                      </div>
                      <p>{n.message}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <CancelacionConfirmModal
        errorMessage={cancelError}
        isSubmitting={isCancelling}
        isOpen={!!bookingToCancel}
        bookingName={bookingToCancel ? `${bookingToCancel.courtName} (${bookingToCancel.date} • ${bookingToCancel.time})` : ''}
        isRefundable={bookingToCancel?.aplicaDevolucion ?? false}
        hoursUntilMatch={bookingToCancel?.hoursUntilMatch}
        depositAmount={bookingToCancel?.depositPaid ?? 5400}
        onClose={() => {
          if (isCancelling) return;
          setCancelError(null);
          setBookingToCancel(null);
        }}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
};

export default MisReservas;
