import React, { useState } from 'react';
import BookingCard, { type BookingData } from './BookingCard';
import { IconBall, IconCheck, IconClose } from './Icons';

const INITIAL_BOOKINGS: BookingData[] = [
  {
    id: 'b1',
    courtName: 'Cancha 1',
    sport: 'Fútbol 5',
    surface: 'Césped Sintético Premium',
    dateStr: 'Viernes 12 de Septiembre',
    timeSlot: '20:00 - 21:00 hs',
    price: '$18.000 (Abonado)',
    status: 'Confirmado'
  },
  {
    id: 'b2',
    courtName: 'Cancha Central',
    sport: 'Pádel',
    surface: 'Blindex Panorámico Pro',
    dateStr: 'Sábado 13 de Septiembre',
    timeSlot: '18:30 - 20:00 hs',
    price: '$22.000 (Abonado)',
    status: 'Confirmado'
  },
  {
    id: 'b3',
    courtName: 'Cancha 2',
    sport: 'Fútbol 7',
    surface: 'Césped Sintético 60mm',
    dateStr: 'Martes 16 de Septiembre',
    timeSlot: '21:00 - 22:00 hs',
    price: '$26.000 (Seña $10.000)',
    status: 'Seña Pagada'
  }
];

export const MyBookingsScreen: React.FC = () => {
  const [bookings, setBookings] = useState<BookingData[]>(INITIAL_BOOKINGS);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [cancelledNotice, setCancelledNotice] = useState<string | null>(null);

  const handleCancelBooking = (id: string) => {
    const target = bookings.find((b) => b.id === id);
    setBookings(bookings.filter((b) => b.id !== id));
    if (target) {
      setCancelledNotice(`Turno para ${target.courtName} (${target.dateStr}) cancelado correctamente.`);
      setTimeout(() => setCancelledNotice(null), 5000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 font-['Inter',sans-serif] flex flex-col">
      <main className="max-w-6xl w-full mx-auto px-6 py-9 flex flex-col gap-6">
        {cancelledNotice && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center justify-between">
            <span className="font-semibold flex items-center gap-2">
              <IconCheck size={14} />
              {cancelledNotice}
            </span>
            <button
              onClick={() => setCancelledNotice(null)}
              className="bg-transparent border-none text-red-500 cursor-pointer p-1"
            >
              <IconClose size={14} />
            </button>
          </div>
        )}

        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Perfil del Cliente / Mis Reservas</h1>
            <p className="text-xs text-slate-500 mt-1">
              Administrá tus turnos agendados en las canchas de fútbol y pádel
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                activeTab === 'active'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Turnos Activos ({bookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              Historial Pasado (14)
            </button>
          </div>
        </div>

        {activeTab === 'active' ? (
          bookings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancelBooking={handleCancelBooking}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center flex flex-col items-center gap-3">
              <div className="size-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <IconBall size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                No tenés turnos activos en este momento
              </h3>
              <p className="text-xs text-slate-500">
                Podés reservar una cancha de fútbol o pádel para jugar con tu equipo.
              </p>
              <button
                type="button"
                onClick={() => setBookings(INITIAL_BOOKINGS)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer border-none"
              >
                Restaurar turnos de demostración
              </button>
            </div>
          )
        ) : null}
      </main>
    </div>
  );
};

export default MyBookingsScreen;
