import React, { useState } from 'react';
import AdminSidebar, { type AdminNavSection } from './AdminSidebar';
import AdminActionBtn from './AdminActionBtn';

interface ScheduleSlot {
  courtId: string;
  courtName: string;
  sport: string;
  status: 'Disponible' | 'Reservado' | 'Mantenimiento';
  detail?: string;
}

interface HourlySchedule {
  hour: string;
  slots: ScheduleSlot[];
}

const COURTS = [
  { id: 'c1', name: 'Cancha 1', sport: 'Fútbol 5' },
  { id: 'c2', name: 'Cancha 2', sport: 'Fútbol 7' },
  { id: 'c3', name: 'Cancha 3', sport: 'Pádel 1' },
  { id: 'c4', name: 'Cancha 4', sport: 'Pádel 2' }
];

const INITIAL_SCHEDULE: HourlySchedule[] = [
  {
    hour: '17:00',
    slots: [
      { courtId: 'c1', courtName: 'Cancha 1', sport: 'Fútbol 5', status: 'Reservado', detail: 'Martínez FC' },
      { courtId: 'c2', courtName: 'Cancha 2', sport: 'Fútbol 7', status: 'Disponible' },
      { courtId: 'c3', courtName: 'Cancha 3', sport: 'Pádel 1', status: 'Reservado', detail: 'Clase Infantil' },
      { courtId: 'c4', courtName: 'Cancha 4', sport: 'Pádel 2', status: 'Mantenimiento', detail: 'Redes' }
    ]
  },
  {
    hour: '18:00',
    slots: [
      { courtId: 'c1', courtName: 'Cancha 1', sport: 'Fútbol 5', status: 'Reservado', detail: 'Torneo Apertura' },
      { courtId: 'c2', courtName: 'Cancha 2', sport: 'Fútbol 7', status: 'Disponible' },
      { courtId: 'c3', courtName: 'Cancha 3', sport: 'Pádel 1', status: 'Reservado', detail: 'López vs Díaz' },
      { courtId: 'c4', courtName: 'Cancha 4', sport: 'Pádel 2', status: 'Mantenimiento', detail: 'Redes' }
    ]
  },
  {
    hour: '19:00',
    slots: [
      { courtId: 'c1', courtName: 'Cancha 1', sport: 'Fútbol 5', status: 'Reservado', detail: 'Pérez y amigos' },
      { courtId: 'c2', courtName: 'Cancha 2', sport: 'Fútbol 7', status: 'Reservado', detail: 'Liga Veteranos' },
      { courtId: 'c3', courtName: 'Cancha 3', sport: 'Pádel 1', status: 'Reservado', detail: 'Gómez / Ruiz' },
      { courtId: 'c4', courtName: 'Cancha 4', sport: 'Pádel 2', status: 'Disponible' }
    ]
  },
  {
    hour: '20:00',
    slots: [
      { courtId: 'c1', courtName: 'Cancha 1', sport: 'Fútbol 5', status: 'Reservado', detail: 'Martín Rodríguez' },
      { courtId: 'c2', courtName: 'Cancha 2', sport: 'Fútbol 7', status: 'Reservado', detail: 'Los Halcones' },
      { courtId: 'c3', courtName: 'Cancha 3', sport: 'Pádel 1', status: 'Disponible' },
      { courtId: 'c4', courtName: 'Cancha 4', sport: 'Pádel 2', status: 'Disponible' }
    ]
  },
  {
    hour: '21:00',
    slots: [
      { courtId: 'c1', courtName: 'Cancha 1', sport: 'Fútbol 5', status: 'Reservado', detail: 'FC Stars' },
      { courtId: 'c2', courtName: 'Cancha 2', sport: 'Fútbol 7', status: 'Disponible' },
      { courtId: 'c3', courtName: 'Cancha 3', sport: 'Pádel 1', status: 'Reservado', detail: 'Final Nocturna' },
      { courtId: 'c4', courtName: 'Cancha 4', sport: 'Pádel 2', status: 'Disponible' }
    ]
  }
];

export const AdminDashboard: React.FC = () => {
  const [activeNav, setActiveNav] = useState<AdminNavSection>('agenda');
  const [schedule] = useState<HourlySchedule[]>(INITIAL_SCHEDULE);
  const [notification, setNotification] = useState<string | null>(null);

  const handleActionClick = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#293827',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box'
      }}
    >
      {/* Sidebar con menú lateral exclusivo */}
      <AdminSidebar activeSection={activeNav} onSelectSection={setActiveNav} />

      {/* Contenido Principal */}
      <main
        style={{
          flex: 1,
          padding: '32px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxSizing: 'border-box',
          overflowY: 'auto'
        }}
      >
        {/* Top Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              {activeNav === 'agenda' && 'Agenda Diaria de Turnos'}
              {activeNav === 'canchas' && 'Gestión y Mantenimiento de Canchas'}
              {activeNav === 'torneo' && 'Organización de Torneos Oficiales'}
              {activeNav === 'resultados' && 'Carga de Resultados y Planillas'}
            </h1>
            <p style={{ fontSize: '13px', color: '#A3B8A1', margin: '4px 0 0 0' }}>
              Complejo Deportivo UB • Lunes 7 de Septiembre • 82% Ocupación
            </p>
          </div>

          {/* Botones de acción operativa */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <AdminActionBtn
              action="AsignarTurno"
              variant="Primary"
              onClick={() => handleActionClick("Modal 'Asignar Turno Manual' desplegado.")}
            />
            <AdminActionBtn
              action="BloquearMantenimiento"
              variant="Secondary"
              onClick={() => handleActionClick("Modal 'Bloquear por Mantenimiento' desplegado.")}
            />
          </div>
        </div>

        {/* Notificación Toast */}
        {notification && (
          <div
            style={{
              backgroundColor: '#1E281D',
              border: '1px solid #65C556',
              color: '#65C556',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>✓ {notification}</span>
            <button
              onClick={() => setNotification(null)}
              style={{ background: 'none', border: 'none', color: '#65C556', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Tarjetas KPI Rápidas (12px radius) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div
            style={{
              backgroundColor: '#1E281D',
              border: '1px solid #5A7056',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '12px', color: '#A3B8A1' }}>Turnos del Día</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#65C556' }}>28 / 32</span>
            <span style={{ fontSize: '11px', color: '#8EA68B' }}>4 horarios libres disponibles</span>
          </div>

          <div
            style={{
              backgroundColor: '#1E281D',
              border: '1px solid #5A7056',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '12px', color: '#A3B8A1' }}>Torneo en Curso</span>
            <span style={{ fontSize: '22px', fontWeight: 700, color: '#57EF40' }}>Apertura 2026</span>
            <span style={{ fontSize: '11px', color: '#8EA68B' }}>16 equipos • Fecha 3</span>
          </div>

          <div
            style={{
              backgroundColor: '#1E281D',
              border: '1px solid #5A7056',
              borderRadius: '12px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}
          >
            <span style={{ fontSize: '12px', color: '#A3B8A1' }}>Canchas Habilitadas</span>
            <span style={{ fontSize: '24px', fontWeight: 700, color: '#689E5F' }}>5 de 6</span>
            <span style={{ fontSize: '11px', color: '#8EA68B' }}>Pádel 2 en mantenimiento programado</span>
          </div>
        </div>

        {/* Agenda Diaria / Timeline de Canchas */}
        <section
          style={{
            backgroundColor: '#1E281D',
            border: '1px solid #5A7056',
            borderRadius: '12px',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#FFFFFF', margin: 0 }}>
              Timeline de Ocupación por Cancha
            </h2>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#65C556' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#65C556' }}></span>
                Reservado
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#A3B8A1' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '4px', border: '1px solid #5A7056' }}></span>
                Disponible
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#57EF40' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: '#57EF40' }}></span>
                Mantenimiento
              </span>
            </div>
          </div>

          {/* Grilla */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Cabecera de Canchas */}
            <div style={{ display: 'grid', gridTemplateColumns: '80px repeat(4, 1fr)', gap: '10px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#5A7056', padding: '8px' }}>
                Hora
              </div>
              {COURTS.map((c) => (
                <div
                  key={c.id}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#65C556',
                    padding: '8px 12px',
                    textAlign: 'center'
                  }}
                >
                  {c.name} ({c.sport})
                </div>
              ))}
            </div>

            {/* Filas horarias */}
            {schedule.map((row) => (
              <div
                key={row.hour}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px repeat(4, 1fr)',
                  gap: '10px',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#A3B8A1',
                    textAlign: 'center',
                    padding: '12px 0'
                  }}
                >
                  {row.hour}
                </div>
                {row.slots.map((slot, sIdx) => {
                  const isReserved = slot.status === 'Reservado';
                  const isMaintenance = slot.status === 'Mantenimiento';
                  const isAvailable = slot.status === 'Disponible';

                  return (
                    <div
                      key={sIdx}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px', // PSP: 8px
                        border: isReserved
                          ? '1px solid #65C556'
                          : isMaintenance
                          ? '1px solid #689E5F'
                          : '1px solid #5A7056',
                        backgroundColor: isReserved
                          ? 'rgba(101, 197, 86, 0.15)'
                          : isMaintenance
                          ? '#222E21'
                          : '#293827',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: isReserved ? '#65C556' : isMaintenance ? '#57EF40' : '#A3B8A1'
                        }}
                      >
                        {slot.status}
                      </span>
                      {slot.detail && (
                        <span style={{ fontSize: '10px', color: '#FFFFFF', opacity: 0.85 }}>
                          {slot.detail}
                        </span>
                      )}
                      {isAvailable && (
                        <span style={{ fontSize: '10px', color: '#7A8F76' }}>
                          Libre para reserva
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashboard;

