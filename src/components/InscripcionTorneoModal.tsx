import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { SQUAD_LIMITS } from '../data/mockData';

export interface TournamentPlayer {
  id: string;
  name: string;
  dni: string;
  position: string;
}

export interface InscripcionTorneoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId?: string;
  onSubmit?: (data: { teamName: string; players: TournamentPlayer[] }) => void;
}

const DEFAULT_PLAYERS: TournamentPlayer[] = [
  { id: '1', name: 'Juan Pérez (Capitán)', dni: '40.123.456', position: 'Delantero' },
  { id: '2', name: 'Lucas Paiva', dni: '41.229.400', position: 'Defensor' },
  { id: '3', name: 'Sebastián Norjean', dni: '42.110.339', position: 'Mediocampista' },
  { id: '4', name: 'Nicolás Marco', dni: '40.887.652', position: 'Defensor' },
  { id: '5', name: 'Tomás Cerro', dni: '41.554.912', position: 'Arquero' }
];

export const InscripcionTorneoModal: React.FC<InscripcionTorneoModalProps> = ({
  isOpen,
  onClose,
  tournamentId,
  onSubmit
}) => {
  const { tournaments, registerTeam, currentUser } = useComplejo();

  const getInitialTourneyId = () => {
    if (tournamentId) return tournamentId;
    const openT = tournaments.find(t => t.status === 'Inscripciones abiertas');
    return openT ? openT.id : (tournaments[0]?.id || '1');
  };

  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(getInitialTourneyId);
  const [teamName, setTeamName] = useState('Los Imparables FC');
  const [players, setPlayers] = useState<TournamentPlayer[]>(DEFAULT_PLAYERS);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to generate squad members matching sport and currentUser without colliding with existing seeds
  const buildSquadForSport = React.useCallback((sportName: string) => {
    const captainName = currentUser?.nombre ? `${currentUser.nombre} (Capitán)` : 'Lucas Díaz (Capitán)';
    const captainDni = currentUser?.dni || '40.123.456';

    if (sportName === 'Pádel' || sportName === 'Tenis') {
      return [
        { id: '1', name: captainName, dni: captainDni, position: sportName === 'Pádel' ? 'Drive' : 'Single' },
        { id: '2', name: 'Rodrigo De Paul', dni: '38.221.990', position: sportName === 'Pádel' ? 'Revés' : 'Single' }
      ];
    }
    if (sportName === 'Fútbol 8') {
      return [
        { id: '1', name: captainName, dni: captainDni, position: 'Delantero' },
        { id: '2', name: 'Leandro Paredes', dni: '38.455.912', position: 'Mediocampista' },
        { id: '3', name: 'Cristian Romero', dni: '41.002.341', position: 'Defensor' },
        { id: '4', name: 'Nahuel Molina', dni: '40.998.112', position: 'Defensor' },
        { id: '5', name: 'Alexis Mac Allister', dni: '41.332.190', position: 'Mediocampista' },
        { id: '6', name: 'Julián Álvarez', dni: '42.500.122', position: 'Delantero' },
        { id: '7', name: 'Lisandro Martínez', dni: '40.678.910', position: 'Defensor' },
        { id: '8', name: 'Emiliano Martínez', dni: '37.899.201', position: 'Arquero' }
      ];
    }
    // Fútbol 5 (default)
    return [
      { id: '1', name: captainName, dni: captainDni, position: 'Delantero' },
      { id: '2', name: 'Leandro Paredes', dni: '38.455.912', position: 'Mediocampista' },
      { id: '3', name: 'Cristian Romero', dni: '41.002.341', position: 'Defensor' },
      { id: '4', name: 'Nahuel Molina', dni: '40.998.112', position: 'Defensor' },
      { id: '5', name: 'Emiliano Martínez', dni: '37.899.201', position: 'Arquero' }
    ];
  }, [currentUser]);

  // Synchronize modal state on open or tournament selection
  React.useEffect(() => {
    if (!isOpen) return;

    let target = tournamentId ? tournaments.find(t => t.id === tournamentId) : null;
    // If specific tournament is closed, prefer the open one
    if (!target || target.status !== 'Inscripciones abiertas') {
      const openT = tournaments.find(t => t.status === 'Inscripciones abiertas');
      if (openT) target = openT;
      else if (!target && tournaments.length > 0) target = tournaments[0];
    }

    if (target) {
      setSelectedTourneyId(target.id);
      const sp = target.sport || 'Fútbol 5';
      setPlayers(buildSquadForSport(sp));
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [tournamentId, isOpen, tournaments, buildSquadForSport]);

  const currentTourney = tournaments.find((t) => t.id === selectedTourneyId) || tournaments[0];
  const sport = currentTourney?.sport || 'Fútbol 5';
  const limits = SQUAD_LIMITS[sport] || { min: 5, max: 12 };

  const handleAddPlayer = () => {
    if (players.length >= limits.max) {
      setErrorMessage(`Límite de plantel alcanzado: máximo ${limits.max} jugadores para ${sport}.`);
      return;
    }
    setErrorMessage(null);
    setPlayers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: '',
        dni: '',
        position: sport === 'Pádel' ? 'Drive' : 'Delantero'
      }
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 1) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePlayerChange = (id: string, field: keyof TournamentPlayer, value: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleTournamentSelect = (newTourneyId: string) => {
    setSelectedTourneyId(newTourneyId);
    const target = tournaments.find(t => t.id === newTourneyId);
    if (target) {
      const sp = target.sport || 'Fútbol 5';
      const lim = SQUAD_LIMITS[sp] || { min: 2, max: 10 };
      if (players.length < lim.min || players.length > lim.max) {
        setPlayers(buildSquadForSport(sp));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!teamName.trim()) {
      setErrorMessage('El nombre del equipo es obligatorio.');
      return;
    }

    // Check squad min
    if (players.length < limits.min) {
      setErrorMessage(
        `Plantel insuficiente: se requiere un mínimo de ${limits.min} jugadores para ${sport} (actualmente hay ${players.length}).`
      );
      return;
    }

    // Validate each player data
    for (let i = 0; i < players.length; i++) {
      if (!players[i].name.trim() || !players[i].dni.trim()) {
        setErrorMessage(`Por favor completa el Nombre y DNI del jugador #${i + 1}.`);
        return;
      }
    }

    // Check duplicate DNIS in the squad
    const dnis = players.map(p => p.dni.trim().toLowerCase());
    if (new Set(dnis).size !== dnis.length) {
      setErrorMessage('Existen jugadores con números de DNI duplicados dentro del mismo plantel.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Call context registerTeam which checks duplicate players in same tournament in MySQL
      const res = await registerTeam(selectedTourneyId, teamName.trim(), players);
      if (!res.success) {
        setErrorMessage(res.error || 'Error al inscribir equipo');
        return;
      }

      setSuccessMessage(`¡Equipo "${teamName.trim()}" inscripto con éxito en "${currentTourney?.name || 'el torneo'}"!`);
      setTimeout(() => {
        setSuccessMessage(null);
        if (onSubmit) {
          onSubmit({ teamName: teamName.trim(), players });
        }
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Safe early return strictly AFTER all hooks and callback declarations
  if (!isOpen) return null;

  const isTorneoCerrado = currentTourney && currentTourney.status !== 'Inscripciones abiertas';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(17, 26, 16, 0.8)' }}
      onClick={(e) => !isSubmitting && e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-[#1e281d] rounded-2xl border border-[#5a7056] w-full max-w-[620px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white font-['Inter',sans-serif]"
        style={{ animation: 'modalIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#5a7056]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg text-white">Inscripción de Equipo a Torneo</h2>
            </div>
            <p className="text-xs text-[#a0a0a0] mt-0.5">
              Control automático de cupo por deporte y control de jugador único.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-[#a0a0a0] hover:text-white cursor-pointer bg-transparent border-none text-base disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="bg-[rgba(229,62,62,0.15)] border border-[#e53e3e] rounded-xl p-3 text-xs text-[#e53e3e] flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-[rgba(101,197,86,0.15)] border border-[#65c556] rounded-xl p-3 text-xs text-[#65c556] flex items-center gap-2 font-bold">
              <span>✅</span>
              <span>{successMessage}</span>
            </div>
          )}

          {isTorneoCerrado && (
            <div className="bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 text-xs text-amber-300 flex items-center gap-2">
              <span>ℹ️</span>
              <span>
                El torneo seleccionado se encuentra <strong>{currentTourney?.status}</strong>. Selecciona un certamen con <strong>Inscripciones abiertas</strong> para registrar tu equipo.
              </span>
            </div>
          )}

          {/* Tournament selector */}
          <div>
            <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
              Torneo Oficial
            </label>
            <select
              value={selectedTourneyId}
              onChange={(e) => handleTournamentSelect(e.target.value)}
              className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#65c556]"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.sport}) • {t.status === 'Inscripciones abiertas' ? '🟢 ABIERTO' : `🔒 ${t.status}`} • Inscripción: ${t.entryFee.toLocaleString('es-AR')}
                </option>
              ))}
            </select>
          </div>

          {/* Team Name */}
          <div>
            <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
              Nombre del Equipo
            </label>
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#65c556]"
            />
          </div>

          {/* Sport Squad limits card */}
          <div className="bg-[#293827] border border-[#5a7056] rounded-xl p-3 flex justify-between items-center text-xs">
            <div>
              <span className="text-[#a0a0a0] block text-[11px]">Límites de plantel ({currentTourney?.sport}):</span>
              <span className="font-bold text-white">
                Mínimo: {limits.min} | Máximo: {limits.max} integrantes
              </span>
            </div>
            <span
              className={`font-black text-xs px-2.5 py-1 rounded-lg ${
                players.length >= limits.min && players.length <= limits.max
                  ? 'bg-[rgba(101,197,86,0.2)] text-[#65c556]'
                  : 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b]'
              }`}
            >
              {players.length} / {limits.max} Jugadores
            </span>
          </div>

          {/* Players Roster */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-[#a0a0a0] uppercase">
                Lista de Jugadores Oficiales
              </label>
              <button
                type="button"
                onClick={handleAddPlayer}
                className="text-xs text-[#65c556] font-bold hover:underline cursor-pointer bg-transparent border-none"
              >
                + Agregar Jugador
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {players.map((p, idx) => (
                <div
                  key={p.id}
                  className="bg-[#293827] p-2.5 rounded-xl border border-[#5a7056] flex items-center gap-2 text-xs"
                >
                  <span className="text-gray-400 font-mono w-5 text-center">{idx + 1}.</span>
                  <input
                    type="text"
                    required
                    placeholder="Nombre y Apellido"
                    value={p.name}
                    onChange={(e) => handlePlayerChange(p.id, 'name', e.target.value)}
                    className="flex-1 bg-[#1e281d] border border-[#5a7056] rounded px-2 py-1 text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Número de DNI"
                    value={p.dni}
                    onChange={(e) => handlePlayerChange(p.id, 'dni', e.target.value)}
                    className="w-28 bg-[#1e281d] border border-[#5a7056] rounded px-2 py-1 text-xs text-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Posición"
                    value={p.position}
                    onChange={(e) => handlePlayerChange(p.id, 'position', e.target.value)}
                    className="w-24 bg-[#1e281d] border border-[#5a7056] rounded px-2 py-1 text-xs text-white"
                  />
                  {players.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(p.id)}
                      className="text-[#e53e3e] hover:text-white px-2 py-1 bg-transparent border-none cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-[#a0a0a0] italic">
            * El sistema verifica que ningún jugador esté inscripto en más de un equipo en el mismo torneo.
          </p>

          {/* Actions */}
          <div className="flex gap-3.5 mt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-5 rounded-xl border border-[#5a7056] text-[#c0c0c0] hover:text-white font-bold text-xs cursor-pointer disabled:opacity-40 min-h-[44px] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-6 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-extrabold text-sm cursor-pointer transition-all shadow-lg shadow-[#65c556]/20 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-[#293827] border-t-transparent rounded-full animate-spin" />
                  <span>Inscribiendo equipo...</span>
                </>
              ) : (
                'Confirmar Inscripción'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InscripcionTorneoModal;
