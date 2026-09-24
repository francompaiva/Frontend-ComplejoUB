import React, { useState } from 'react';

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
      className={`booking-card ${className}`}
      style={{
        backgroundColor: '#1E281D',
        border: '1px solid #5A7056',
        borderRadius: '12px', // PSP: 12px
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box',
        fontFamily: "'Inter', sans-serif",
        textAlign: 'left',
        position: 'relative'
      }}
    >
      {/* Header con Cancha y Badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
          {booking.courtName} - {booking.sport}
        </h3>
        <span
          style={{
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: 'rgba(101, 197, 86, 0.15)',
            border: '1px solid #65C556',
            color: '#65C556'
          }}
        >
          {booking.status}
        </span>
      </div>

      {/* Información intermedia */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '13px', fontWeight: 500, color: '#A3B8A1' }}>
          📅 {booking.dateStr} • {booking.timeSlot}
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '12px' }}>
          <span style={{ color: '#8EA68B' }}>{booking.surface}</span>
          <span style={{ color: '#57EF40', fontWeight: 700 }}>
            Total: {booking.price}
          </span>
        </div>
      </div>

      {/* Barra de acción inferior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '12px',
          borderTop: '1px solid #5A7056'
        }}
      >
        <span style={{ fontSize: '11px', color: '#7A8F76' }}>
          Cancelación gratuita hasta 24 hs antes
        </span>

        {/* Botón rojo de acción "Cancelar turno" */}
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#E53E3E',
            color: '#FFFFFF',
            fontSize: '12px',
            fontWeight: 600,
            borderRadius: '8px', // PSP: 8px
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            fontFamily: "'Inter', sans-serif"
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#C53030')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#E53E3E')}
        >
          Cancelar turno
        </button>
      </div>

      {/* Modal de confirmación de cancelación */}
      {showConfirm && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: 'rgba(26, 34, 25, 0.95)',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            zIndex: 10,
            textAlign: 'center'
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#FFFFFF' }}>
            ¿Seguro que deseas cancelar este turno?
          </span>
          <span style={{ fontSize: '11px', color: '#A3B8A1' }}>
            Esta acción liberará la cancha inmediatamente en la agenda.
          </span>
          <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #5A7056',
                backgroundColor: '#293827',
                color: '#A3B8A1',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Volver
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#E53E3E',
                color: '#FFFFFF',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
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

