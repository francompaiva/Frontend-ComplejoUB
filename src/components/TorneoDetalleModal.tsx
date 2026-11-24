
import React from 'react';
import { createPortal } from 'react-dom';
import type { Tournament } from '../data/mockData';
import { IconCalendar, IconCheck } from './Icons';
import { useComplejo } from '../context/ComplejoContext';
import './TorneoDetalleModal.css';

interface TorneoDetalleModalProps {
  isOpen: boolean;
  torneo: Tournament | null;
  onClose: () => void;
  onInscribir?: (tournamentId: string) => void;
  onVerFixture?: (tournamentId: string) => void;
}

export const TorneoDetalleModal: React.FC<TorneoDetalleModalProps> = ({
  isOpen,
  torneo,
  onClose,
  onInscribir,
  onVerFixture,
}) => {
  const { userRole } = useComplejo();

  if (!isOpen || !torneo) return null;

  const teamsCount = (torneo.registeredTeams || []).length;
  const maxTeamsCount = torneo.maxTeams || 8;
  const cupoPercentage = Math.min(
    100,
    Math.round((teamsCount / maxTeamsCount) * 100)
  );
  const isCupoLleno = teamsCount >= maxTeamsCount;

  const statusClass =
    torneo.status === 'En curso'
      ? 'torneo-detalle__status--progress'
      : torneo.status === 'Inscripciones abiertas'
        ? 'torneo-detalle__status--open'
        : 'torneo-detalle__status--closed';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalles del torneo ${torneo.name}`}
      className="ub-modal-backdrop torneo-detalle__overlay"
      onClick={onClose}
    >
      <div
        className="ub-modal-panel torneo-detalle__panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="torneo-detalle__header">
          <div className="torneo-detalle__heading">
            <div className="torneo-detalle__badges">
              <span className="torneo-detalle__sport">
                {torneo.sport}
              </span>

              <span className={`torneo-detalle__status ${statusClass}`}>
                {torneo.status}
              </span>
            </div>

            <h2 className="torneo-detalle__title">
              {torneo.name}
            </h2>

            <p className="torneo-detalle__dates">
              <IconCalendar
                size={14}
                className="torneo-detalle__calendar"
              />
              <span>
                Fechas de competencia: <strong>{torneo.dates}</strong>
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="torneo-detalle__close"
            title="Cerrar"
            aria-label="Cerrar detalles del torneo"
          >
            ✕
          </button>
        </div>

        {/* Contenido con desplazamiento interno */}
        <div className="torneo-detalle__content">

          {/* Información principal */}
          <div className="torneo-detalle__metrics">
            <div className="torneo-detalle__metric">
              <span className="torneo-detalle__metric-label">
                Premio Oficial
              </span>
              <span
                className="torneo-detalle__metric-value torneo-detalle__metric-value--prize"
                title={torneo.prize}
              >
                🏆 {torneo.prize}
              </span>
            </div>

            <div className="torneo-detalle__metric">
              <span className="torneo-detalle__metric-label">
                Inscripción Equipo
              </span>
              <span className="torneo-detalle__metric-value">
                ${torneo.entryFee.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="torneo-detalle__metric">
              <span className="torneo-detalle__metric-label">
                Arancel / Arbitraje
              </span>
              <span className="torneo-detalle__metric-value">
                ${torneo.matchFee.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="torneo-detalle__metric">
              <span className="torneo-detalle__metric-label">
                Modalidad
              </span>
              <span className="torneo-detalle__metric-value torneo-detalle__metric-value--mode">
                Liga (Todos contra todos)
              </span>
            </div>
          </div>

          {/* Cupos */}
          <div className="torneo-detalle__capacity">
            <div className="torneo-detalle__capacity-head">
              <span>
                Cupo de Equipos Participantes:
              </span>

              <span className="torneo-detalle__capacity-numbers">
                <strong>{teamsCount}</strong> de {maxTeamsCount} equipos ({cupoPercentage}%)
              </span>
            </div>

            <div className="torneo-detalle__progress-track">
              <div
                className={`torneo-detalle__progress-fill${isCupoLleno ? ' is-full' : ''}`}
                style={{ width: `${cupoPercentage}%` }}
              />
            </div>
          </div>

          {/* Equipos inscriptos */}
          <section className="torneo-detalle__teams-section">
            <div className="torneo-detalle__section-heading">
              <h3 className="torneo-detalle__section-title">
                <IconCheck
                  size={16}
                  className="torneo-detalle__check"
                />
                <span>
                  Equipos Inscriptos ({teamsCount})
                </span>
              </h3>

              {isCupoLleno ? (
                <span className="torneo-detalle__availability is-full">
                  Cupo Completo
                </span>
              ) : (
                <span className="torneo-detalle__availability">
                  {maxTeamsCount - teamsCount} cupos disponibles
                </span>
              )}
            </div>

            {teamsCount > 0 ? (
              <div className="torneo-detalle__team-grid">
                {(torneo.registeredTeams || []).map((team, idx) => (
                  <div
                    key={team.id || idx}
                    className="torneo-detalle__team"
                  >
                    <div className="torneo-detalle__team-info">
                      <h4 className="torneo-detalle__team-name">
                        {team.name}
                      </h4>

                      <p className="torneo-detalle__captain">
                        Capitán: {team.captain || 'Designado'}
                      </p>
                    </div>

                    <span className="torneo-detalle__players">
                      {team.playersCount || team.players?.length || 5} jug.
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="torneo-detalle__empty">
                Aún no hay equipos confirmados en este torneo.
                ¡Sé el primero en anotar a tu equipo!
              </div>
            )}
          </section>

          {/* Reglamento */}
          <section className="torneo-detalle__rules">
            <h4>
              Reglamento y Condiciones de Competencia
            </h4>

            <p>
              • <strong>Sistema de Puntuación:</strong> Victoria 3 puntos,
              Empate 1 punto, Derrota 0 puntos.
            </p>

            <p>
              • <strong>Arbitraje:</strong> Cada encuentro contará con
              terna arbitral oficial designada por el complejo.
            </p>

            <p>
              • <strong>Canchas Oficiales:</strong> Los partidos se disputan
              en fines de semana en las canchas reglamentarias con césped
              sintético y blindex.
            </p>

            <p>
              • <strong>Fixture y Resultados:</strong> Los resultados y la
              tabla de posiciones se actualizan de forma inmediata tras
              el pitazo final.
            </p>
          </section>
        </div>

        {/* Botones inferiores */}
        <div className="torneo-detalle__footer">
          <button
            type="button"
            onClick={onClose}
            className="torneo-detalle__button torneo-detalle__button--close"
          >
            Cerrar
          </button>

          <div className="torneo-detalle__footer-actions">
            {onVerFixture && (
              <button
                type="button"
                onClick={() => {
                  onVerFixture(torneo.id);
                  onClose();
                }}
                className="torneo-detalle__button torneo-detalle__button--fixture"
              >
                Ver Tabla y Fixture →
              </button>
            )}

            {onInscribir &&
              torneo.status === 'Inscripciones abiertas' &&
              !isCupoLleno &&
              userRole !== 'arbitro' && (
                <button
                  type="button"
                  onClick={() => {
                    onInscribir(torneo.id);
                    onClose();
                  }}
                  className="torneo-detalle__button torneo-detalle__button--join"
                >
                  Inscribir Mi Equipo
                </button>
              )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TorneoDetalleModal;
