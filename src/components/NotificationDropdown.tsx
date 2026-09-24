import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';

export const NotificationDropdown: React.FC = () => {
  const { notifications, unreadNotifsCount, markNotificationRead, markAllNotificationsRead } = useComplejo();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative font-['Inter',sans-serif]">
      {/* Botón campana con badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-[#344732] hover:bg-[#3C503A] text-white border border-[#445941] transition"
        title="Notificaciones"
      >
        <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadNotifsCount > 0 && (
          <span className="absolute -top-1 -right-1 size-5 bg-[#65C556] text-[#293827] text-[11px] font-black rounded-full flex items-center justify-center shadow">
            {unreadNotifsCount}
          </span>
        )}
      </button>

      {/* Popover / Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#344732] border border-[#445941] rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-[#445941] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-white">Notificaciones</h3>
              {unreadNotifsCount > 0 && (
                <span className="text-[10px] bg-[#65C556]/20 text-[#65C556] px-2 py-0.5 rounded-full font-bold">
                  {unreadNotifsCount} nuevas
                </span>
              )}
            </div>
            {unreadNotifsCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-[#65C556] hover:underline font-semibold"
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
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markNotificationRead(notif.id)}
                  className={`p-4 transition cursor-pointer flex gap-3 ${
                    notif.read ? 'opacity-60 bg-[#293827]/40' : 'bg-[#3C503A]/30 hover:bg-[#3C503A]'
                  }`}
                >
                  <div className="size-2 rounded-full mt-1.5 shrink-0 bg-[#65C556]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{notif.title}</span>
                      <span className="text-[10px] text-[#A3B89E]">{notif.timeAgo}</span>
                    </div>
                    <p className="text-xs text-[#A3B89E] leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-[#445941] text-center bg-[#293827]/50">
            <button
              onClick={() => setIsOpen(false)}
              className="text-xs text-[#A3B89E] hover:text-white font-medium"
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
