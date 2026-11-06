import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { SQUAD_LIMITS } from '../data/mockData';
import { equiposApi } from '../api/endpoints';
import { IconCheck, IconAlert, IconInfo, IconClose, IconHourglass, IconBan, IconPlus } from './Icons';

export interface TournamentPlayer {
  id: string;
  name: string;
  dni: string;
  position: string;
  statusLookup?: 'idle' | 'searching' | 'found' | 'notFound' | 'suspended';
  statusMessage?: string;
}

export interface InscripcionTorneoModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournamentId?: string;
  onSubmit?: (data: { teamName: string; players: TournamentPlayer[] }) => void;
}

export const POSICIONES_POR_DEPORTE: Record<string, string[]> = {
  'Fútbol 5': ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'],
  'Fútbol 8': ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'],
  'Fútbol 11': ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'],
  'Pádel': ['Drive', 'Revés'],
  'Tenis': ['Single', 'Dobles', 'Drive', 'Revés']
};

const getCaptainPlayer = (name?: string, dni?: string | null, position = 'Delantero'): TournamentPlayer => {
  const cleanDni = dni ? String(dni).replace(/\D/g, '') : '';
  return {
    id: 'capitan-1',
    name: name ? `${name} (Capitán)` : '',
    dni: cleanDni,
    position,
    statusLookup: cleanDni ? 'found' : 'idle',
    statusMessage: cleanDni ? 'Capitán autenticado' : undefined
  };
};

export const InscripcionTorneoModal: React.FC<InscripcionTorneoModalProps> = ({
  isOpen,
  onClose,
  tournamentId,
  onSubmit
}) => {
  const { tournaments, registerTeam, currentUser, userRole } = useComplejo();

  const getInitialTourneyId = () => {
    if (tournamentId) return tournamentId;
    const openT = tournaments.find(t => t.status === 'Inscripciones abiertas');
    return openT ? openT.id : (tournaments[0]?.id || '1');
  };

  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(getInitialTourneyId);
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState<TournamentPlayer[]>(() => [
    getCaptainPlayer(currentUser?.nombre, currentUser?.dni)
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getInitialSquad = React.useCallback((sportName: string) => {
    const defaultPos = (POSICIONES_POR_DEPORTE[sportName] || ['Delantero'])[0];
    return [
      getCaptainPlayer(currentUser?.nombre, currentUser?.dni, defaultPos)
    ];
  }, [currentUser]);

  React.useEffect(() => {
    if (!isOpen) return;

    let target = tournamentId ? tournaments.find(t => t.id === tournamentId) : null;
    if (!target || target.status !== 'Inscripciones abiertas') {
      const openT = tournaments.find(t => t.status === 'Inscripciones abiertas');
      if (openT) target = openT;
      else if (!target && tournaments.length > 0) target = tournaments[0];
    }

    if (target) {
      setSelectedTourneyId(target.id);
      const sp = target.sport || 'Fútbol 5';
      setPlayers(getInitialSquad(sp));
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [tournamentId, isOpen, tournaments, getInitialSquad]);

  const currentTourney = tournaments.find((t) => t.id === selectedTourneyId) || tournaments[0];
  const sport = currentTourney?.sport || 'Fútbol 5';
  const limits = SQUAD_LIMITS[sport] || { min: 5, max: 12 };

  const allowedPositions = POSICIONES_POR_DEPORTE[sport] || ['Arquero', 'Defensor', 'Mediocampista', 'Delantero'];

  const handleAddPlayer = () => {
    if (players.length >= limits.max) {
      setErrorMessage(`Límite de plantel alcanzado: máximo ${limits.max} jugadores para ${sport}.`);
      return;
    }
    setErrorMessage(null);
    setPlayers((prev) => [
      ...prev,
      {
        id: 'jugador-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        name: '',
        dni: '',
        position: allowedPositions[0] || 'Delantero',
        statusLookup: 'idle'
      }
    ]);
  };

  const handleRemovePlayer = (id: string) => {
    if (players.length <= 1) return;
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDniChange = async (id: string, rawVal: string) => {
    const cleanDni = rawVal.replace(/\D/g, '').slice(0, 8);
    const isCaptain = id === 'capitan-1';

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (cleanDni.length < 7) {
          return {
            ...p,
            dni: cleanDni,
            name: '',
            statusLookup: 'idle',
            statusMessage: undefined
          };
        }
        return {
          ...p,
          dni: cleanDni,
          statusLookup: 'searching',
          statusMessage: 'Buscando en padrón de usuarios...'
        };
      })
    );

    if (cleanDni.length === 7 || cleanDni.length === 8) {
      try {
        const res: any = await equiposApi.buscarJugadorPorDni(cleanDni);
        const data = (res && typeof res === 'object' && 'data' in res && res.data) ? res.data : res;
        const nombreEncontrado = data?.nombre || data?.name;

        if (nombreEncontrado) {
          const isSuspended = data.estado_cuenta === 'Suspendida' || data.estado === 'Suspendida';
          const isArbitro = data.rol === 'Arbitro' || data.rol === 'Árbitro';

          if (isArbitro) {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === id && p.dni === cleanDni
                  ? {
                      ...p,
                      name: '',
                      statusLookup: 'suspended',
                      statusMessage: 'Un usuario con rol Árbitro no puede participar como jugador de torneos'
                    }
                  : p
              )
            );
          } else {
            setPlayers((prev) =>
              prev.map((p) =>
                p.id === id && p.dni === cleanDni
                  ? {
                      ...p,
                      name: isCaptain ? `${nombreEncontrado} (Capitán)` : nombreEncontrado,
                      statusLookup: isSuspended ? 'suspended' : 'found',
                      statusMessage: isSuspended ? 'Cuenta suspendida por inasistencias o sanciones' : undefined
                    }
                  : p
              )
            );
          }
        } else {
          setPlayers((prev) =>
            prev.map((p) =>
              p.id === id && p.dni === cleanDni
                ? {
                    ...p,
                    name: '',
                    statusLookup: 'notFound',
                    statusMessage: 'Usuario no registrado en Complejo Deportivo UB'
                  }
                : p
            )
          );
        }
      } catch (err: any) {
        const errText = err?.message || err?.response?.data?.message || 'Usuario no registrado en el sistema';
        setPlayers((prev) =>
          prev.map((p) =>
            p.id === id && p.dni === cleanDni
              ? {
                  ...p,
                  name: '',
                  statusLookup: 'notFound',
                  statusMessage: errText
                }
              : p
          )
        );
      }
    }
  };

  const handlePositionChange = (id: string, position: string) => {
    setPlayers((prev) =>
      prev.map((p) => (p.id === id ? { ...p, position } : p))
    );
  };

  const handleTournamentSelect = (newTourneyId: string) => {
    setSelectedTourneyId(newTourneyId);
    const target = tournaments.find(t => t.id === newTourneyId);
    if (target) {
      const sp = target.sport || 'Fútbol 5';
      const lim = SQUAD_LIMITS[sp] || { min: 2, max: 10 };
      if (players.length < lim.min || players.length > lim.max) {
        setPlayers(getInitialSquad(sp));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (userRole === 'arbitro' || currentUser?.rol === 'Arbitro') {
      setErrorMessage('Un usuario con rol Árbitro no tiene permitido inscribir equipos ni participar en torneos.');
      return;
    }

    if (!teamName.trim()) {
      setErrorMessage('El nombre del equipo es obligatorio.');
      return;
    }

    if (players.length < limits.min) {
      setErrorMessage(
        `Plantel insuficiente: se requiere un mínimo de ${limits.min} jugadores para ${sport} (actualmente hay ${players.length}).`
      );
      return;
    }

    const DNI_REGEX = /^\d{7,8}$/;
    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const dniClean = (p.dni || '').trim();

      if (!dniClean) {
        setErrorMessage(`Por favor completa el DNI del jugador #${i + 1}.`);
        return;
      }
      if (!DNI_REGEX.test(dniClean)) {
        setErrorMessage(
          `El DNI del jugador #${i + 1} (${dniClean}) es inválido: debe contener exactamente 7 u 8 dígitos numéricos.`
        );
        return;
      }
      if (p.statusLookup === 'searching') {
        setErrorMessage(
          `Aún se está verificando el DNI del jugador #${i + 1}. Por favor aguarda un instante.`
        );
        return;
      }
      if (p.statusLookup === 'notFound') {
        setErrorMessage(
          `El jugador #${i + 1} (DNI ${dniClean}) no se encuentra registrado en el sistema.`
        );
        return;
      }
      if (p.statusLookup === 'suspended') {
        setErrorMessage(
          `El jugador #${i + 1} (${p.name || dniClean}) posee su cuenta suspendida por inasistencias y no puede ser inscripto.`
        );
        return;
      }
      if (!p.name.trim() || p.statusLookup !== 'found') {
        setErrorMessage(
          `No se pudo verificar el usuario para el jugador #${i + 1} (DNI ${dniClean}). Ingresa un DNI registrado válido.`
        );
        return;
      }
      if (!p.position || !allowedPositions.includes(p.position)) {
        setErrorMessage(
          `La posición '${p.position || 'No definida'}' del jugador #${i + 1} no es válida para ${sport}.`
        );
        return;
      }
    }

    const dnis = players.map(p => p.dni.trim().toLowerCase());
    if (new Set(dnis).size !== dnis.length) {
      setErrorMessage('Existen jugadores con números de DNI duplicados dentro del mismo plantel.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await registerTeam(selectedTourneyId, teamName.trim(), players);
      if (!res.success) {
        setErrorMessage(res.error || 'Error al inscribir equipo');
        return;
      }

      setSuccessMessage(`Equipo "${teamName.trim()}" inscripto con éxito en "${currentTourney?.name || 'el torneo'}".`);
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

  if (!isOpen) return null;

  const isTorneoCerrado = currentTourney && currentTourney.status !== 'Inscripciones abiertas';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in"
      onClick={(e) => !isSubmitting && e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[640px] max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-900 font-['Inter',sans-serif]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="font-bold text-base text-slate-900 tracking-tight">Inscripción de Equipo a Torneo</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Control automático de cupo por deporte y validación de padrón por DNI.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-none p-1.5 rounded-lg hover:bg-slate-200/60 disabled:opacity-40"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center gap-2 font-bold">
              <IconCheck size={16} className="text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {(userRole === 'arbitro' || currentUser?.rol === 'Arbitro') && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2 font-bold">
              <IconAlert size={16} className="text-red-600 shrink-0" />
              <span>Los usuarios con rol Árbitro Oficial no pueden inscribir equipos ni disputar torneos como jugadores.</span>
            </div>
          )}

          {isTorneoCerrado && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-center gap-2">
              <IconInfo size={16} className="text-amber-600 shrink-0" />
              <span>
                El torneo seleccionado se encuentra <strong>{currentTourney?.status}</strong>. Selecciona un certamen con <strong>Inscripciones abiertas</strong> para registrar tu equipo.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Torneo Oficial
              </label>
              <select
                value={selectedTourneyId}
                onChange={(e) => handleTournamentSelect(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.sport}) · {t.status === 'Inscripciones abiertas' ? 'ABIERTO' : t.status} · ${t.entryFee.toLocaleString('es-AR')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Nombre del Equipo
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Los Imparables FC"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Límites reglamentarios ({currentTourney?.sport})</span>
              <span className="font-bold text-slate-900">
                Mínimo: {limits.min} · Máximo: {limits.max} integrantes
              </span>
            </div>
            <span
              className={`font-bold text-xs px-3 py-1 rounded-full border ${
                players.length >= limits.min && players.length <= limits.max
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {players.length} / {limits.max} Jugadores
            </span>
          </div>

          {/* Players Roster */}
          <div className="flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <div>
                <label className="text-xs font-bold text-slate-800 block">
                  Nómina de Jugadores (DNI y Posición)
                </label>
                <span className="text-[11px] text-slate-500">
                  El nombre se valida automáticamente contra el padrón de cuentas activas.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddPlayer}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-1 transition"
              >
                <IconPlus size={13} />
                <span>Agregar Jugador</span>
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {players.map((p, idx) => {
                const isCaptain = idx === 0;
                return (
                  <div
                    key={p.id}
                    className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-slate-400 font-mono w-5 text-center font-bold">{idx + 1}.</span>
                      <input
                        type="text"
                        required
                        placeholder="DNI (7-8 díg.)"
                        inputMode="numeric"
                        maxLength={8}
                        value={p.dni}
                        disabled={isCaptain && Boolean(currentUser?.dni)}
                        onChange={(e) => handleDniChange(p.id, e.target.value)}
                        className="w-32 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-mono focus:outline-none focus:border-emerald-600 disabled:bg-slate-100 disabled:text-slate-500"
                      />
                    </div>

                    <div className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg px-3 py-1.5 flex items-center justify-between">
                      {p.statusLookup === 'searching' && (
                        <span className="text-amber-600 text-xs flex items-center gap-1.5">
                          <IconHourglass size={13} />
                          <span>Buscando en padrón...</span>
                        </span>
                      )}
                      {p.statusLookup === 'found' && (
                        <div className="flex items-center gap-1.5 truncate">
                          <IconCheck size={14} className="text-emerald-600 shrink-0" />
                          <span className="font-semibold text-slate-900 truncate" title={p.name}>
                            {p.name}
                          </span>
                          {isCaptain && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded ml-1">
                              Capitán
                            </span>
                          )}
                        </div>
                      )}
                      {p.statusLookup === 'notFound' && (
                        <div className="flex items-center gap-1.5 truncate text-red-600">
                          <IconClose size={14} className="shrink-0" />
                          <span className="text-xs truncate font-medium">
                            No registrado en Complejo UB
                          </span>
                        </div>
                      )}
                      {p.statusLookup === 'suspended' && (
                        <div className="flex items-center gap-1.5 truncate text-amber-600">
                          <IconBan size={14} className="shrink-0" />
                          <span className="text-xs truncate font-medium">
                            Cuenta suspendida o no elegible
                          </span>
                        </div>
                      )}
                      {(!p.statusLookup || p.statusLookup === 'idle') && (
                        <span className="text-slate-400 italic text-xs truncate">
                          Ingresa DNI para verificar jugador...
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        value={p.position}
                        onChange={(e) => handlePositionChange(p.id, e.target.value)}
                        className="w-32 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                      >
                        {allowedPositions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>

                      {!isCaptain && players.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlayer(p.id)}
                          className="text-slate-400 hover:text-red-600 p-1.5 bg-transparent border-none cursor-pointer rounded-lg hover:bg-red-50 transition-colors"
                          title="Quitar jugador"
                        >
                          <IconClose size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
              <IconAlert size={16} className="text-red-500 shrink-0" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-1 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer disabled:opacity-40 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || userRole === 'arbitro' || currentUser?.rol === 'Arbitro'}
              className="flex-1 py-2.5 px-5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs cursor-pointer transition-all shadow-md shadow-[#199e1b]/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Inscribiendo equipo...' : 'Confirmar Inscripción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InscripcionTorneoModal;
