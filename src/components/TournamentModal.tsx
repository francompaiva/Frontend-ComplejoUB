import React, { useState } from 'react';

export interface PlayerEntry {
  id: string;
  name: string;
  dni: string;
  position: string;
  isCaptain?: boolean;
}

interface TournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: { teamName: string; players: PlayerEntry[] }) => void;
  tournamentName?: string;
  className?: string;
}

export const TournamentModal: React.FC<TournamentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  tournamentName = 'Torneo Apertura 2026',
  className = ''
}) => {
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState<PlayerEntry[]>([
    { id: '1', name: 'Martín Rodríguez', dni: '38.450.112', position: 'Delantero', isCaptain: true },
    { id: '2', name: 'Lucas Benítez', dni: '40.122.908', position: 'Arquero' },
    { id: '3', name: 'Santiago Gómez', dni: '39.887.411', position: 'Defensor' },
    { id: '4', name: 'Mateo Fernández', dni: '41.200.345', position: 'Mediocampista' },
    { id: '5', name: 'Joaquín Díaz', dni: '39.400.120', position: 'Defensor' }
  ]);

  if (!isOpen) return null;

  const handleAddPlayer = () => {
    const newId = String(players.length + 1);
    setPlayers([
      ...players,
      { id: newId, name: '', dni: '', position: 'Suplente' }
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 1) return;
    setPlayers(players.filter((p) => p.id !== id));
  };

  const handlePlayerChange = (id: string, field: 'name' | 'dni' | 'position', value: string) => {
    setPlayers(
      players.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({ teamName, players });
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 50,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div
        className={`tournament-modal ${className}`}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '90vh',
          backgroundColor: '#1E281D',
          border: '1px solid #5A7056',
          borderRadius: '12px', // PSP: 12px
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxSizing: 'border-box',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          fontFamily: "'Inter', sans-serif",
          textAlign: 'left'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#65C556', margin: 0 }}>
              Inscripción a {tournamentName}
            </h2>
            <p style={{ fontSize: '12px', color: '#A3B8A1', margin: '4px 0 0 0' }}>
              Completá los datos del equipo y la lista de buena fe de jugadores
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#A3B8A1',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Nombre del Equipo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="team-name" style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>
              Nombre del Equipo *
            </label>
            <input
              id="team-name"
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Ej: Los Galácticos FC"
              style={{
                width: '100%',
                height: '42px',
                padding: '0 14px',
                backgroundColor: '#293827',
                border: '1px solid #5A7056',
                borderRadius: '8px', // PSP: 8px
                fontSize: '13px',
                color: '#FFFFFF',
                outline: 'none',
                boxSizing: 'border-box',
                fontFamily: "'Inter', sans-serif"
              }}
            />
          </div>

          {/* Sección de Jugadores */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
                Lista de Jugadores (Mín. 5) *
              </span>
              <span style={{ fontSize: '11px', color: '#57EF40', fontWeight: 500 }}>
                {players.length} registrados
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '260px', overflowY: 'auto' }}>
              {players.map((player, index) => (
                <div
                  key={player.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 10px',
                    backgroundColor: '#293827',
                    border: '1px solid #5A7056',
                    borderRadius: '6px'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#65C556', minWidth: '24px' }}>
                    #{index + 1}
                  </span>
                  <input
                    type="text"
                    required
                    value={player.name}
                    onChange={(e) => handlePlayerChange(player.id, 'name', e.target.value)}
                    placeholder="Nombre completo"
                    style={{
                      flex: 2,
                      height: '34px',
                      padding: '0 8px',
                      backgroundColor: '#1E281D',
                      border: '1px solid #5A7056',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                  <input
                    type="text"
                    required
                    value={player.dni}
                    onChange={(e) => handlePlayerChange(player.id, 'dni', e.target.value)}
                    placeholder="DNI"
                    style={{
                      flex: 1.2,
                      height: '34px',
                      padding: '0 8px',
                      backgroundColor: '#1E281D',
                      border: '1px solid #5A7056',
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#FFFFFF',
                      outline: 'none'
                    }}
                  />
                  {player.isCaptain ? (
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: '#293827',
                        backgroundColor: '#65C556',
                        padding: '3px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      CAP
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(player.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#E53E3E',
                        cursor: 'pointer',
                        fontSize: '14px',
                        padding: '0 4px'
                      }}
                      title="Eliminar jugador"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddPlayer}
              style={{
                alignSelf: 'flex-start',
                padding: '8px 14px',
                borderRadius: '8px', // PSP: 8px
                border: '1px solid #689E5F',
                backgroundColor: '#293827',
                color: '#689E5F',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              + Agregar Jugador
            </button>
          </div>

          {/* Botones de acción del Modal */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px', // PSP: 8px
                border: '1px solid #5A7056',
                backgroundColor: '#293827',
                color: '#A3B8A1',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              style={{
                padding: '10px 22px',
                borderRadius: '8px', // PSP: 8px
                border: 'none',
                backgroundColor: '#65C556',
                color: '#293827',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontFamily: "'Inter', sans-serif"
              }}
            >
              Confirmar Inscripción
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TournamentModal;

