import React, { useState } from 'react';
import BookingCard, { type BookingData } from './BookingCard';

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
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#293827',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Navbar de Cliente */}
      <header
        style={{
          borderBottom: '1px solid #5A7056',
          padding: '20px 48px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#1E281D'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              backgroundColor: '#65C556',
              color: '#293827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '18px'
            }}
          >
            UB
          </div>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF' }}>
            Complejo Deportivo UB
          </span>
        </div>

        {/* Perfil del Cliente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
              Martín Rodríguez
            </span>
            <span style={{ fontSize: '11px', color: '#65C556' }}>
              Cliente / Capitán
            </span>
          </div>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '19px',
              backgroundColor: '#65C556',
              color: '#293827',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px'
            }}
          >
            MR
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main
        style={{
          maxWidth: '1200px',
          width: '100%',
          margin: '0 auto',
          padding: '36px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxSizing: 'border-box'
        }}
      >
        {/* Banner de Cancelación */}
        {cancelledNotice && (
          <div
            style={{
              backgroundColor: '#1E281D',
              border: '1px solid #E53E3E',
              color: '#FFFFFF',
              padding: '12px 18px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ color: '#E53E3E', fontWeight: 600 }}>✓ {cancelledNotice}</span>
            <button
              onClick={() => setCancelledNotice(null)}
              style={{ background: 'none', border: 'none', color: '#A3B8A1', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Encabezado y Selector de Pestañas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              Perfil del Cliente / Mis Reservas
            </h1>
            <p style={{ fontSize: '13px', color: '#A3B8A1', margin: '4px 0 0 0' }}>
              Administrá tus turnos agendados en las canchas de fútbol y pádel
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('active')}
              style={{
                padding: '9px 18px',
                borderRadius: '8px', // PSP: 8px
                border: 'none',
                backgroundColor: activeTab === 'active' ? '#65C556' : '#1E281D',
                color: activeTab === 'active' ? '#293827' : '#A3B8A1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              Turnos Activos ({bookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              style={{
                padding: '9px 18px',
                borderRadius: '8px', // PSP: 8px
                border: '1px solid #5A7056',
                backgroundColor: activeTab === 'history' ? '#65C556' : '#1E281D',
                color: activeTab === 'history' ? '#293827' : '#A3B8A1',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              Historial Pasado (14)
            </button>
          </div>
        </div>

        {/* Lista de Reservas Activas */}
        {activeTab === 'active' ? (
          bookings.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '20px'
              }}
            >
              {bookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  onCancelBooking={handleCancelBooking}
                />
              ))}
            </div>
          ) : (
            <div
              style={{
                backgroundColor: '#1E281D',
                border: '1px solid #5A7056',
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <span style={{ fontSize: '32px' }}>⚽</span>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
                No tenés turnos activos en este momento
              </h3>
              <p style={{ fontSize: '13px', color: '#A3B8A1', margin: 0 }}>
                Podés reservar una cancha de fútbol o pádel para jugar con tu equipo.
              </p>
              <button
                type="button"
                onClick={() => setBookings(INITIAL_BOOKINGS)}
                style={{
                  marginTop: '12px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#65C556',
                  color: '#293827',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Restaurar turnos de demostración
              </button>
            </div>
          )
        ) : (
          <div
            style={{
              backgroundColor: '#1E281D',
              border: '1px solid #5A7056',
              borderRadius: '12px',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#FFFFFF', margin: 0 }}>
              Historial de Partidos Jugados
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { court: 'Cancha 1 - Fútbol 5', date: '01/09/2026', time: '20:00 hs', score: 'Completado' },
                { court: 'Pádel 2', date: '28/08/2026', time: '19:00 hs', score: 'Completado' },
                { court: 'Cancha 2 - Fútbol 7', date: '22/08/2026', time: '21:00 hs', score: 'Completado' }
              ].map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    backgroundColor: '#293827',
                    borderRadius: '8px',
                    border: '1px solid #5A7056',
                    fontSize: '13px'
                  }}
                >
                  <span style={{ color: '#FFFFFF', fontWeight: 500 }}>{h.court}</span>
                  <span style={{ color: '#A3B8A1' }}>{h.date} - {h.time}</span>
                  <span style={{ color: '#689E5F', fontWeight: 600 }}>{h.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MyBookingsScreen;

