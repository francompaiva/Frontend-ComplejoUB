import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { IconBell, IconCheck, IconClose } from './Icons';
import { formatTimeAgo } from '../utils/dateUtils';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadNotifsCount, markNotificationRead, markAllNotificationsRead, responderInvitacion, invitations } = useComplejo();
  const [isOpen, setIsOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<Record<string, string>>({});
  const [loadingAction, setLoadingAction] = useState<Record<string, boolean>>({});

  const handleAction = async (notifId: string, respuesta: 'ACEPTADA' | 'RECHAZADA') => {
    setLoadingAction((prev) => ({ ...prev, [notifId]: true }));
    try {
      const notif = notifications.find((n) => n.id === notifId);
      const matchingInv = invitations.find((i) =>
        notif?.message?.toLowerCase().includes(i.team.toLowerCase()) ||
        notif?.title?.toLowerCase().includes(i.team.toLowerCase())
      ) || invitations[0];

      const targetId = matchingInv ? matchingInv.id : notifId;
      const res = await responderInvitacion(targetId, respuesta);
      setActionFeedback((prev) => ({
        ...prev,
        [notifId]: res.message || (respuesta === 'ACEPTADA' ? 'Invitación aceptada' : 'Invitación rechazada')
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
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-200 border border-white/10 transition cursor-pointer flex items-center justify-center size-9"
        title="Centro de notificaciones"
      >
        <IconBell size={17} className="text-slate-200 shrink-0" />
        {unreadNotifsCount > 0 && (
          <span className="absolute -top-1 -right-1 size-4.5 bg-[#199e1b] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow ring-2 ring-[#0f1712]">
            {unreadNotifsCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-[#131d16] border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in">
          <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">Notificaciones</h3>
              {unreadNotifsCount > 0 && (
                <span className="text-[10px] bg-[#199e1b]/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-semibold">
                  {unreadNotifsCount} nuevas
                </span>
              )}
            </div>
            {unreadNotifsCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
              >
                Marcar leídas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/[0.06]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
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
                      notif.read ? 'opacity-60 bg-transparent' : 'bg-white/[0.03] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div
                      className="flex gap-3 cursor-pointer"
                      onClick={() => markNotificationRead(notif.id)}
                    >
                      <div className={`size-2 rounded-full mt-1.5 shrink-0 ${notif.read ? 'bg-slate-600' : 'bg-emerald-400'}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <span className="font-semibold text-xs text-white">{notif.title}</span>
                          <span className="text-[10px] text-slate-400 font-medium shrink-0">
                            {formatTimeAgo(notif.createdAt || notif.timeAgo)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>

                    {feedback ? (
                      <div className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
                        {feedback}
                      </div>
                    ) : isInvite && !notif.read ? (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10 mt-1">
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleAction(notif.id, 'ACEPTADA')}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-[#199e1b] hover:bg-[#158417] text-white font-semibold text-xs cursor-pointer transition shadow text-center disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <IconCheck size={14} />
                          <span>Aceptar</span>
                        </button>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleAction(notif.id, 'RECHAZADA')}
                          className="px-3 py-1.5 rounded-lg border border-white/15 text-slate-300 hover:text-white hover:bg-red-500/20 hover:border-red-500/40 font-semibold text-xs cursor-pointer transition flex items-center gap-1"
                        >
                          <IconClose size={14} />
                          <span>Rechazar</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>

          <div className="p-2.5 border-t border-white/10 text-center bg-black/20">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-white font-medium px-4 py-1 rounded-lg cursor-pointer"
            >
              Cerrar panel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
