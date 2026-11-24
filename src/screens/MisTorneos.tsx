
import React, { useEffect, useMemo, useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import type { FixtureMatch, StandingRow, Tournament } from '../data/mockData';
import { IconPlus } from '../components/Icons';
import TorneoDetalleModal from '../components/TorneoDetalleModal';
import './MisTorneos.css';
import { estadoVisiblePartido } from '../utils/partidos';

interface MisTorneosProps {
  onNavigate: (screen: string) => void;
  onOpenInscripcion: (tournamentId?: string) => void;
}

type FiltroTorneos = 'actuales' | 'abiertos' | 'en-curso' | 'finalizados';
type PestanaDetalle = 'posiciones' | 'fixture';

const admiteInscripciones = (torneo: Tournament) =>
  torneo.status === 'Inscripciones abiertas' &&
  (torneo.registeredTeams || []).length < (torneo.maxTeams || 8);

const claseEstado = (estado: Tournament['status']) =>
  estado === 'Inscripciones abiertas'
    ? 'is-open'
    : estado === 'En curso'
      ? 'is-progress'
      : 'is-finished';

export const MisTorneos: React.FC<MisTorneosProps> = ({
  onOpenInscripcion
}) => {
  const {
    tournaments,
    standings,
    fixtures,
    userRole,
    fetchTorneoData
  } = useComplejo();

  const [filtro, setFiltro] = useState<FiltroTorneos>('actuales');
  const [selectedTorneoId, setSelectedTorneoId] = useState('');
  const [activeTab, setActiveTab] = useState<PestanaDetalle>('posiciones');
  const [detailModalTorneo, setDetailModalTorneo] = useState<Tournament | null>(null);

  // Torneos abiertos que todavía tienen cupos.
  const torneosAbiertos = useMemo(
    () => tournaments.filter(admiteInscripciones),
    [tournaments]
  );

  // Filtrado de torneos según su estado.
  const torneosVisibles = useMemo(() => tournaments.filter((torneo) => {
    if (filtro === 'actuales') {
      return torneo.status !== 'Finalizado';
    }

    if (filtro === 'abiertos') {
      return torneo.status === 'Inscripciones abiertas';
    }

    if (filtro === 'en-curso') {
      return torneo.status === 'En curso';
    }

    return torneo.status === 'Finalizado';
  }), [tournaments, filtro]);

  // Selecciona un torneo real dentro del filtro actual.
  const selectedTorneo =
    torneosVisibles.find(t => t.id === selectedTorneoId) ||
    torneosVisibles[0] ||
    null;

  // Obtiene el fixture y las posiciones del torneo seleccionado.
  useEffect(() => {
    if (selectedTorneo) {
      void fetchTorneoData(selectedTorneo.id);
    }
  }, [selectedTorneo?.id, fetchTorneoData]);

  const filteredFixtures = selectedTorneo
    ? fixtures.filter(f =>
        String(f.tournamentId) === String(selectedTorneo.id) ||
        Boolean(
          f.tournamentName &&
          f.tournamentName.includes(selectedTorneo.name)
        )
      )
    : [];

  const handleSelectTorneo = (id: string) => {
    setSelectedTorneoId(id);

    document
      .getElementById('torneo-activo-detalle')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const abrirInscripcion = () => {
    const elegido =
      selectedTorneo && admiteInscripciones(selectedTorneo)
        ? selectedTorneo
        : torneosAbiertos[0];

    if (elegido) {
      onOpenInscripcion(elegido.id);
    }
  };

  return (
    <div className="mt-page">
      <main className="mt-main">

        {/* ENCABEZADO */}
        <header className="mt-page-header">
          <div>
            <h1 className="mt-page-title">
              Torneos del Complejo
            </h1>

            <p className="mt-page-description">
              Competencias oficiales modalidad liga. Consultá posiciones,
              fixtures e inscribí a tu equipo.
            </p>
          </div>

        </header>

        {/* FILTROS DE TORNEOS */}
        <div className="mt-filters" aria-label="Filtrar torneos">
          <button
            type="button"
            className={`mt-filter${filtro === 'actuales' ? ' is-active' : ''}`}
            onClick={() => setFiltro('actuales')}
          >
            Actuales
          </button>

          <button
            type="button"
            className={`mt-filter${filtro === 'abiertos' ? ' is-active' : ''}`}
            onClick={() => setFiltro('abiertos')}
          >
            Inscripciones abiertas
          </button>

          <button
            type="button"
            className={`mt-filter${filtro === 'en-curso' ? ' is-active' : ''}`}
            onClick={() => setFiltro('en-curso')}
          >
            En curso
          </button>

          <button
            type="button"
            className={`mt-filter${filtro === 'finalizados' ? ' is-active' : ''}`}
            onClick={() => setFiltro('finalizados')}
          >
            Historial (finalizados)
          </button>

          <div className="mt-page-actions">
        
            {userRole !== 'arbitro' && torneosAbiertos.length > 0 && (
              <button
                type="button"
                onClick={abrirInscripcion}
                className="mt-button mt-button--join"
              >
                <IconPlus size={18} />
                Inscribir Mi Equipo
              </button>
            )}
          </div>
        </div>

        {/* LISTADO DE TORNEOS */}
        {torneosVisibles.length === 0 ? (
          <div className="mt-empty-list" role="status">
            {tournaments.length === 0
              ? 'Todavía no hay torneos para mostrar.'
              : filtro === 'finalizados'
                ? 'Todavía no hay torneos finalizados.'
                : 'No hay torneos en esta categoría.'}
          </div>
        ) : (
          <>
            <div className="mt-tournament-grid">
              {torneosVisibles.map((torneo) => {
                const isSelected = torneo.id === selectedTorneo?.id;

                return (
                  <div
                    key={torneo.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleSelectTorneo(torneo.id)}
                    onKeyDown={(e) => {
                      if (
                        e.target === e.currentTarget &&
                        (e.key === 'Enter' || e.key === ' ')
                      ) {
                        e.preventDefault();
                        handleSelectTorneo(torneo.id);
                      }
                    }}
                    className={`mt-tournament-card${isSelected ? ' is-selected' : ''}`}
                  >
                    <div>
                      <div className="mt-card-topline">
                        <span className="mt-sport-tag">
                          {torneo.sport}
                        </span>

                        <span
                          className={`mt-status-tag ${claseEstado(torneo.status)}`}
                        >
                          {torneo.status}
                        </span>
                      </div>

                      <h3 className="mt-card-title" title={torneo.name}>
                        {torneo.name}
                      </h3>

                      <p className="mt-card-description">
                        📅 {torneo.dates} | 👥 {' '}
                        {(torneo.registeredTeams || []).length}/
                        {torneo.maxTeams || 8} Equipos
                      </p>
                    </div>

                    <div className="mt-card-footer">
                      <span>Modalidad Liga</span>

                      <button
                        type="button"
                        className="mt-details-link"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTorneoId(torneo.id);
                          setDetailModalTorneo(torneo);
                        }}
                      >
                        Ver Detalles
                        <span aria-hidden="true">→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DETALLE DEL TORNEO SELECCIONADO */}
            {selectedTorneo && (
              <section
                id="torneo-activo-detalle"
                className="mt-tournament-detail"
              >
                <div className="mt-detail-header">
                  <div>
                    <div className="mt-detail-heading">
                      <h2>{selectedTorneo.name}</h2>

                      <span className="mt-detail-sport">
                        {selectedTorneo.sport}
                      </span>
                    </div>

                    <p className="mt-detail-dates">
                      Fechas: {selectedTorneo.dates} — Sistema de puntos:
                      Victoria 3 pts, Empate 1 pt, Derrota 0 pts.
                    </p>
                  </div>

                  <div className="mt-detail-tabs">
                    <button
                      type="button"
                      className={`mt-detail-tab${
                        activeTab === 'posiciones' ? ' is-active' : ''
                      }`}
                      onClick={() => setActiveTab('posiciones')}
                    >
                      Tabla de Posiciones
                    </button>

                    <button
                      type="button"
                      className={`mt-detail-tab${
                        activeTab === 'fixture' ? ' is-active' : ''
                      }`}
                      onClick={() => setActiveTab('fixture')}
                    >
                      Fixture & Partidos
                    </button>
                  </div>
                </div>

                {/* TABLA DE POSICIONES */}
                {activeTab === 'posiciones' && (
                  <div className="mt-table-scroll">
                    {standings.length === 0 ? (
                      <p className="mt-empty-detail">
                        Todavía no hay posiciones registradas para este torneo.
                      </p>
                    ) : (
                      <table className="mt-standings-table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Equipo</th>
                            <th>PTS</th>
                            <th>PJ</th>
                            <th>PG</th>
                            <th>PE</th>
                            <th>PP</th>
                            <th>GF</th>
                            <th>GC</th>
                            <th>DG</th>
                          </tr>
                        </thead>

                        <tbody>
                          {standings.map((team: StandingRow, idx: number) => {
                            const diferencia = team.gf - team.gc;

                            return (
                              <tr
                                key={team.team}
                                className={idx === 0 ? 'is-leader' : ''}
                              >
                                <td>
                                  <span
                                    className={`mt-rank${
                                      idx === 0
                                        ? ' is-first'
                                        : idx === 1
                                          ? ' is-second'
                                          : ''
                                    }`}
                                  >
                                    {team.pos}
                                  </span>
                                </td>

                                <td className="mt-team-name">
                                  {team.team}

                                  {idx === 0 && (
                                    <span className="mt-leader-label">
                                      Líder
                                    </span>
                                  )}
                                </td>

                                <td className="mt-points">{team.pts}</td>
                                <td>{team.pj}</td>
                                <td>{team.pg}</td>
                                <td>{team.pe}</td>
                                <td>{team.pp}</td>
                                <td>{team.gf}</td>
                                <td>{team.gc}</td>

                                <td
                                  className={
                                    diferencia > 0
                                      ? 'mt-positive'
                                      : diferencia < 0
                                        ? 'mt-negative'
                                        : ''
                                  }
                                >
                                  {diferencia > 0
                                    ? `+${diferencia}`
                                    : diferencia}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* FIXTURE Y PARTIDOS */}
                {activeTab === 'fixture' && (
                  <div className="mt-fixture-content">
                    {filteredFixtures.length === 0 ? (
                      <p className="mt-empty-detail">
                        Todavía no hay partidos programados para este torneo.
                      </p>
                    ) : (
                      <div className="mt-fixture-grid">
                        {filteredFixtures.map((match: FixtureMatch) => (
                          <div
                            key={match.id}
                            className="mt-match-card"
                          >
                            <div className="mt-match-topline">
                              <span className="mt-match-round">
                                {match.round} - {match.date} {match.time}
                              </span>

                              <span className="mt-match-court">
                                {match.court}
                              </span>
                            </div>

                            <div className="mt-match-teams">
                              <div className="mt-match-home">
                                {match.homeTeam}
                              </div>

                              <div className="mt-match-score">
                                {match.status === 'Disputado' ? (
                                  <span className="mt-score">
                                    {match.homeScore} - {match.awayScore}
                                  </span>
                                ) : match.isFreeDate ? (
                                  <span className="mt-free-date">
                                    Fecha Libre
                                  </span>
                                ) : (
                                  <span className="mt-versus">
                                    VS
                                  </span>
                                )}
                              </div>

                              <div className="mt-match-away">
                                {match.isFreeDate
                                  ? '(Descanso)'
                                  : match.awayTeam}
                              </div>
                            </div>

                            <div className="mt-match-footer">
                              <span>
                                Árbitro: {match.refereeName ||
                                  'Designado por el complejo'}
                              </span>

                              <span
                                className={`mt-match-status${
                                  match.status === 'Disputado'
                                    ? ' is-played'
                                    : ''
                                }`}
                              >
                                {estadoVisiblePartido(match)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>


      {/* MODAL DE DETALLES DEL TORNEO */}
      <TorneoDetalleModal
        isOpen={!!detailModalTorneo}
        torneo={detailModalTorneo}
        onClose={() => setDetailModalTorneo(null)}
        onInscribir={(id) => {
          setDetailModalTorneo(null);
          onOpenInscripcion(id);
        }}
        onVerFixture={(id) => {
          setSelectedTorneoId(id);
          setActiveTab('fixture');
          setDetailModalTorneo(null);
          setFiltro('actuales');

          if (
            tournaments.find(t => t.id === id)?.status === 'Finalizado'
          ) {
            setFiltro('finalizados');
          }

          setTimeout(() => {
            document
              .getElementById('torneo-activo-detalle')
              ?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }}
      />
    </div>
  );
};

export default MisTorneos;
