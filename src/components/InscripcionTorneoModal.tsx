import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { SQUAD_LIMITS } from '../data/mockData';
import { equiposApi } from '../api/endpoints';
import './InscripcionTorneoModal.css';

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

  const inscribibles = React.useMemo(() => tournaments.filter(
    t => t.status === 'Inscripciones abiertas' &&
      (t.registeredTeams || []).length < t.maxTeams
  ), [tournaments]);


  const getInitialTourneyId = () => {
    return inscribibles.find(t => t.id === tournamentId)?.id ||
      inscribibles[0]?.id ||
      '';
  };


  const [selectedTourneyId, setSelectedTourneyId] = useState<string>(getInitialTourneyId);
  const [teamName, setTeamName] = useState('');
  const [players, setPlayers] = useState<TournamentPlayer[]>(() => [
    getCaptainPlayer(currentUser?.nombre, currentUser?.dni)
  ]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializa el plantel únicamente con los datos reales del usuario capitán autenticado
  const getInitialSquad = React.useCallback((sportName: string) => {
    const defaultPos = (POSICIONES_POR_DEPORTE[sportName] || ['Delantero'])[0];
    return [
      getCaptainPlayer(currentUser?.nombre, currentUser?.dni, defaultPos)
    ];
  }, [currentUser]);

  
  // Limpia el formulario al abrir, sin borrar lo escrito
  // cuando el contexto actualiza la lista de torneos.
  const estabaAbierto = React.useRef(false);

  React.useEffect(() => {
    if (!isOpen) {
      estabaAbierto.current = false;
      return;
    }

    const target =
      inscribibles.find(t => t.id === tournamentId) ||
      inscribibles[0];

    if (!estabaAbierto.current) {
      estabaAbierto.current = true;

      setSelectedTourneyId(target?.id || '');
      setTeamName('');
      setPlayers(getInitialSquad(target?.sport || 'Fútbol 5'));
      setErrorMessage(null);
      setSuccessMessage(null);
    } else if (!selectedTourneyId && target) {
      // Los torneos llegaron de la API después de abrir la tarjeta.
      setSelectedTourneyId(target.id);
      setPlayers(getInitialSquad(target.sport));
    }
  }, [
    isOpen,
    tournamentId,
    inscribibles,
    selectedTourneyId,
    getInitialSquad
  ]);


  const currentTourney = tournaments.find(
  (t) => t.id === selectedTourneyId
  );
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

    // Actualiza DNI y cambia estado a searching si tiene 7 u 8 dígitos
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
        // Desestructuración robusta: apiClient devuelve json.data as T, por lo que res ya contiene los datos directos
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
          // Si el servidor devolvió 200 pero sin nombre válido, no dejar en searching
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
        // apiClient lanza un Error con err.message directamente
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

      if (
        sport !== sp ||
        players.length < lim.min ||
        players.length > lim.max
      ) {
        setPlayers(getInitialSquad(sp));
      }
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);


    if (!currentTourney || currentTourney.status !== 'Inscripciones abiertas') {
      setErrorMessage(
        'Este torneo no admite inscripciones. Elegí un torneo abierto.'
      );
      return;
    }

    if ((currentTourney.registeredTeams || []).length >= currentTourney.maxTeams) {
      setErrorMessage('El torneo ya completó el cupo de equipos.');
      return;
    }

    if (players.length > limits.max) {
      setErrorMessage(
        `El plantel supera el máximo de ${limits.max} jugadores para ${sport}.`
      );
      return;
    }


    if (userRole === 'arbitro' || currentUser?.rol === 'Arbitro') {
      setErrorMessage('Un usuario con rol Árbitro no tiene permitido inscribir equipos ni participar en torneos.');
      return;
    }

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

    // Validar que cada jugador tenga DNI válido (7 u 8 dígitos), posición correcta y usuario registrado confirmado
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
          `El DNI del jugador #${i + 1} (${dniClean}) es inválido: debe contener exactamente 7 u 8 dígitos numéricos sin letras, espacios, puntos ni símbolos.`
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
          `El jugador #${i + 1} (DNI ${dniClean}) no se encuentra registrado en el sistema. Todos los integrantes del plantel deben poseer cuenta en Complejo Deportivo UB.`
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
          `La posición '${p.position || 'No definida'}' del jugador #${i + 1} no es válida para ${sport}. Posiciones permitidas: ${allowedPositions.join(', ')}.`
        );
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

  
  const isTorneoCerrado =
    !currentTourney ||
    currentTourney.status !== 'Inscripciones abiertas';

  const isCupoLleno = Boolean(
    currentTourney &&
    (currentTourney.registeredTeams || []).length >= currentTourney.maxTeams
  );


  return (
    <div
      className="ub-modal-backdrop"
      onClick={(e) => !isSubmitting && e.target === e.currentTarget && onClose()}
    >
      <div className="ub-modal-panel inscripcion-modal__panel">
        {/* Encabezado */}
        <div className="inscripcion-modal__header">
          <div>
            <div className="inscripcion-modal__header-title-row">
              <h2 className="inscripcion-modal__title">
                Inscripción de Equipo a Torneo
              </h2>
            </div>
            <p className="inscripcion-modal__subtitle">
              Control automático de cupo por deporte y control de jugador único.
            </p>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="inscripcion-modal__close"
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="inscripcion-modal__form">
          {successMessage && (
            <div className="inscripcion-modal__alert inscripcion-modal__alert--success">
              <span>✅</span>
              <span>{successMessage}</span>
            </div>
          )}

          {(userRole === 'arbitro' || currentUser?.rol === 'Arbitro') && (
            <div className="inscripcion-modal__alert inscripcion-modal__alert--arbitro">
              <span>⚠️</span>
              <span>
                Los usuarios con rol Árbitro Oficial no pueden inscribir equipos ni disputar torneos como jugadores.
              </span>
            </div>
          )}

         
          {(isTorneoCerrado || isCupoLleno) && (
            <div className="inscripcion-modal__alert inscripcion-modal__alert--closed">
              <span>ℹ️</span>
              <span>
                {inscribibles.length === 0
                  ? 'No hay torneos con inscripciones abiertas y cupos disponibles.'
                  : isCupoLleno
                    ? 'Este torneo ya completó el cupo de equipos.'
                    : 'Este torneo no admite nuevas inscripciones.'}
              </span>
            </div>
          )}


          {/* Selección del torneo */}
          <div>
            <label className="inscripcion-modal__label">
              Torneo Oficial
            </label>

            <select
              value={selectedTourneyId}
              onChange={(e) => handleTournamentSelect(e.target.value)}
              className="inscripcion-modal__select"
            >
            {inscribibles.length === 0 && (
                <option value="">No hay torneos disponibles</option>
              )}

              {inscribibles.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.sport}) • 🟢 ABIERTO • Inscripción: ${t.entryFee.toLocaleString('es-AR')}
                </option>
              ))}
            </select>
          </div>

          {/* Nombre del equipo */}
          <div>
            <label className="inscripcion-modal__label">
              Nombre del Equipo
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Los Imparables FC"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="inscripcion-modal__input"
            />
          </div>

          {/* Límites del plantel */}
          <div className="inscripcion-modal__limits">
            <div>
              <span className="inscripcion-modal__limits-label">
                Límites de plantel ({currentTourney?.sport}):
              </span>
              <span className="inscripcion-modal__limits-value">
                Mínimo: {limits.min} | Máximo: {limits.max} integrantes
              </span>
            </div>

            <span
              className={`inscripcion-modal__count ${
                players.length >= limits.min && players.length <= limits.max
                  ? 'is-valid'
                  : 'is-warning'
              }`}
            >
              {players.length} / {limits.max} Jugadores
            </span>
          </div>

          {/* Plantel de jugadores */}
          <div className="inscripcion-modal__roster">
            <div className="inscripcion-modal__roster-header">
              <div>
                <label className="inscripcion-modal__label inscripcion-modal__label--no-margin">
                  Plantel Oficial (DNI y Posición)
                </label>
                <span className="inscripcion-modal__hint">
                  El nombre oficial se obtiene automáticamente de la cuenta registrada en el sistema.
                </span>
              </div>

              <button
                type="button"
                onClick={handleAddPlayer}
                className="inscripcion-modal__add"
              >
                + Agregar Jugador
              </button>
            </div>

            <div className="inscripcion-modal__roster">
              {players.map((p, idx) => {
                const isCaptain = idx === 0;

                return (
                  <div
                    key={p.id}
                    className="inscripcion-modal__player"
                  >
                    <div className="inscripcion-modal__player-dni-wrap">
                      <span className="inscripcion-modal__player-index">
                        {idx + 1}.
                      </span>

                      <input
                        type="text"
                        required
                        placeholder="DNI (7-8 dígitos)"
                        inputMode="numeric"
                        maxLength={8}
                        value={p.dni}
                        disabled={isCaptain && Boolean(currentUser?.dni)}
                        onChange={(e) => handleDniChange(p.id, e.target.value)}
                        className="inscripcion-modal__dni"
                        title={
                          isCaptain && currentUser?.dni
                            ? 'DNI del Capitán (asociado a la cuenta)'
                            : 'Ingresa DNI sin puntos ni espacios'
                        }
                      />
                    </div>

                    {/* Nombre verificado desde la BD */}
                    <div className="inscripcion-modal__player-name-box">
                      {p.statusLookup === 'searching' && (
                        <span className="inscripcion-modal__searching">
                          <span>⏳</span> Buscando en padrón...
                        </span>
                      )}

                      {p.statusLookup === 'found' && (
                        <div className="inscripcion-modal__found">
                          <span className="inscripcion-modal__check">✓</span>
                          <span
                            className="inscripcion-modal__player-name"
                            title={p.name}
                          >
                            {p.name}
                          </span>

                          {isCaptain && (
                            <span className="inscripcion-modal__captain-tag">
                              Capitán
                            </span>
                          )}
                        </div>
                      )}

                      {p.statusLookup === 'notFound' && (
                        <div className="inscripcion-modal__not-found">
                          <span className="inscripcion-modal__state-icon">
                            ✕
                          </span>
                          <span className="inscripcion-modal__state-text">
                            No registrado en Complejo UB
                          </span>
                        </div>
                      )}

                      {p.statusLookup === 'suspended' && (
                        <div className="inscripcion-modal__suspended">
                          <span className="inscripcion-modal__state-icon">
                            ⛔
                          </span>
                          <span className="inscripcion-modal__state-text">
                            Cuenta suspendida
                          </span>
                        </div>
                      )}

                      {(!p.statusLookup || p.statusLookup === 'idle') && (
                        <span className="inscripcion-modal__placeholder">
                          Ingresa DNI para verificar jugador...
                        </span>
                      )}

                      <span className="inscripcion-modal__readonly">
                        Solo Lectura
                      </span>
                    </div>

                    <div className="inscripcion-modal__player-actions">
                      <select
                        value={p.position}
                        onChange={(e) => handlePositionChange(p.id, e.target.value)}
                        className="inscripcion-modal__position"
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
                          className="inscripcion-modal__remove"
                          title="Quitar jugador"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="inscripcion-modal__footnote">
            * Solamente se pueden inscribir jugadores que ya tengan cuenta registrada en la plataforma. El sistema verifica que ningún jugador esté inscripto en más de un equipo del mismo torneo.
          </p>

          {/* Mensajes de error */}
          {errorMessage && (
            <div className="inscripcion-modal__alert inscripcion-modal__alert--error">
              <span>⚠️</span>
              <span className="inscripcion-modal__error-text">
                {errorMessage}
              </span>
            </div>
          )}

          {/* Botones */}
          <div className="inscripcion-modal__actions">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="inscripcion-modal__cancel"
            >
              Cancelar
            </button>

            <button
              type="submit"
             
              disabled={
                isSubmitting ||
                isTorneoCerrado ||
                isCupoLleno ||
                userRole === 'arbitro' ||
                currentUser?.rol === 'Arbitro'
              }

              className="inscripcion-modal__submit"
            >
              {isSubmitting ? (
                <>
                  <span className="inscripcion-modal__spinner" />
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