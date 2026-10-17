import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { IconBell } from './Icons';
import { formatTimeAgo } from '../utils/dateUtils';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadNotifsCount, markNotificationRead, markAllNotificationsRead, responderInvitacion, invitations } = useComplejo();
  const [isOpen, setIsOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<Record<string, boolean>>({});

  const handleAction = async (notifId: string, respuesta: 'ACEPTADA' | 'RECHAZADA') => {
    setLoadingAction((prev) => ({ ...prev, [notifId]: true }));
    try {
      // Intentar encontrar la invitación correspondiente en invitations
      const notif = notifications.find((n) => n.id === notifId);
      const matchingInv = invitations.find((i) =>
        notif?.message?.toLowerCase().includes(i.team.toLowerCase()) ||
        notif?.title?.toLowerCase().includes(i.team.toLowerCase())
      ) || invitations[0];

      const targetId = matchingInv ? matchingInv.id : notifId;
      const res = await responderInvitacion(targetId, respuesta);
      setActionFeedback((prev) => ({
        ...prev,
        [notifId]: res.message || (respuesta === 'ACEPTADA' ? '¡Invitación aceptada!' : 'Invitación rechazada')
      }));
      markNotificationRead(notifId);
    } catch (err: any) {
      setActionFeedback((prev) => ({
        ...prev,
        [notifId]: err?.message || 'Error al responder invitación'
      }));
    } finally {
      setLoadingAction((prev) => ({ ...prev, [notifId]: false }));
    }
  };

  return (
    <div className="relative font-['Inter',sans-serif]">
      {/* Botón campana con badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl bg-[#344732] hover:bg-[#3C503A] text-white border border-[#445941] transition cursor-pointer flex items-center justify-center min-w-[40px] min-h-[40px]"
        title="Notificaciones"
      >
        <IconBell size={20} className="text-white shrink-0" />
        {unreadNotifsCount > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-[#65C556] text-[#293827] text-[11px] font-black rounded-full flex items-center justify-center shadow">
            {unreadNotifsCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-[#344732] border border-[#445941] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-[#445941] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white">Notificaciones</h3>
              {unreadNotifsCount > 0 && (
                <span className="text-[10px] bg-[#65C556]/20 text-[#65C556] px-2.5 py-0.5 rounded-full font-bold">
                  {unreadNotifsCount} nuevas
                </span>
              )}
            </div>
            {unreadNotifsCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-[#65C556] hover:underline font-semibold px-2 py-1 cursor-pointer"
              >
                Marcar todas leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-[#445941]/50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#A3B89E]">
                No tienes notificaciones pendientes
              </div>
            ) : (
              notifications.map((notif) => {
                const isInvite =
                  notif.type === 'torneo' &&
                  (notif.title.toLowerCase().includes('invitaci') ||
                    notif.message.toLowerCase().includes('invit'));
                const feedback = actionFeedback[notif.id];
                const isLoading = loadingAction[notif.id];

                return (
                  <div
                    key={notif.id}
                    className={`p-4 transition flex flex-col gap-2 ${
                      notif.read ? 'opacity-60 bg-[#293827]/40' : 'bg-[#3C503A]/30 hover:bg-[#3C503A]'
                    }`}
                  >
                    <div
                      className="flex gap-3 cursor-pointer"
                      onClick={() => markNotificationRead(notif.id)}
                    >
                      <div className="size-2 rounded-full mt-1.5 shrink-0 bg-[#65C556]" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-white">{notif.title}</span>
                          <span className="text-[10px] text-[#A3B89E] font-medium">
                            {formatTimeAgo(notif.createdAt || notif.timeAgo)}
                          </span>
                        </div>
                        <p className="text-xs text-[#A3B89E] leading-relaxed">{notif.message}</p>
                      </div>
                    </div>

                    {/* Feedback o Botones de acción para invitaciones a equipos */}
                    {feedback ? (
                      <div className="mt-1 px-3 py-1.5 rounded-lg bg-[#65C556]/15 border border-[#65C556] text-[11px] font-bold text-[#65C556]">
                        {feedback}
                      </div>
                    ) : isInvite && !notif.read ? (
                      <div className="flex items-center gap-2 pt-2 border-t border-[#445941]/40 mt-1">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleAction(notif.id, 'ACEPTADA')}
                          className="flex-1 py-2 px-3 rounded-lg bg-[#65C556] hover:bg-[#54b045] text-[#293827] font-bold text-xs cursor-pointer transition shadow text-center disabled:opacity-50 min-h-[34px] flex items-center justify-center gap-1.5"
                        >
                          {isLoading ? (
                            <span className="inline-block w-3 h-3 border-2 border-[#293827] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            '✓ Aceptar'
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleAction(notif.id, 'RECHAZADA')}
                          className="px-3 py-2 rounded-lg border border-[#445941] text-[#A3B89E] hover:text-white hover:bg-red-500/20 hover:border-red-500 font-semibold text-xs cursor-pointer transition min-h-[34px]"
                        >
                          ✕ Rechazar
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 border-t border-[#445941] text-center bg-[#293827]/50">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-[#A3B89E] hover:text-white font-medium px-4 py-1.5 rounded-lg cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
