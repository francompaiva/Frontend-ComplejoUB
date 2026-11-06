import React, { useState } from 'react';
import { IconCalendar } from './Icons';

export interface BookingData {
  id: string;
  courtName: string;
  sport: 'Fútbol 5' | 'Fútbol 7' | 'Pádel';
  surface: string;
  dateStr: string;
  timeSlot: string;
  price: string;
  status: 'Confirmado' | 'Seña Pagada' | 'En Espera';
}

interface BookingCardProps {
  booking: BookingData;
  onCancelBooking?: (bookingId: string) => void;
  className?: string;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onCancelBooking,
  className = ''
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleConfirmCancel = () => {
    if (onCancelBooking) {
      onCancelBooking(booking.id);
    }
    setShowConfirm(false);
  };

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl p-5 flex flex-col gap-4 shadow-xs relative font-['Inter',sans-serif] text-left ${className}`}
    >
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-900 m-0">
          {booking.courtName} — {booking.sport}
        </h3>
        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700">
          {booking.status}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
          <IconCalendar size={14} className="text-emerald-600" />
          <span>{booking.dateStr} · {booking.timeSlot}</span>
        </div>
        <div className="flex gap-4 items-center text-xs">
          <span className="text-slate-500">{booking.surface}</span>
          <span className="text-emerald-700 font-bold">
            Total: {booking.price}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-slate-100">
        <span className="text-[11px] text-slate-400">
          Cancelación con reintegro hasta 24 hs antes
        </span>

        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
        >
          Cancelar turno
        </button>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-2xl p-5 flex flex-col justify-center items-center gap-3 z-10 text-center">
          <span className="text-sm font-bold text-slate-900">
            ¿Seguro que deseas cancelar este turno?
          </span>
          <span className="text-xs text-slate-500">
            Esta acción liberará la cancha inmediatamente en la agenda general.
          </span>
          <div className="flex gap-2.5 mt-1">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              className="px-4 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-xs font-semibold cursor-pointer"
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              className="px-4 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold cursor-pointer"
            >
              Sí, Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingCard;
