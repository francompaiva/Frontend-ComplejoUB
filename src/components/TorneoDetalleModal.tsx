import React from 'react';
import type { Tournament } from '../data/mockData';
import { IconCalendar, IconCheck } from './Icons';

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
  if (!isOpen || !torneo) return null;

  const cupoPercentage = Math.min(100, Math.round((torneo.registeredTeams.length / torneo.maxTeams) * 100));
  const isCupoLleno = torneo.registeredTeams.length >= torneo.maxTeams;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#1e281d] border border-[#5a7056] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#293827] px-6 py-5 border-b border-[#5a7056] flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#65c556]/20 text-[#65c556] border border-[#65c556]/30 uppercase">
                {torneo.sport}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  torneo.status === 'En curso'
                    ? 'bg-[#65c556]/15 text-[#65c556] border-[#65c556]/40'
                    : torneo.status === 'Inscripciones abiertas'
                    ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                    : 'bg-gray-500/20 text-gray-300 border-gray-500/40'
                }`}
              >
                {torneo.status}
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">{torneo.name}</h2>
            <p className="text-xs text-[#a0a0a0] flex items-center gap-1.5 mt-1 font-medium">
              <IconCalendar size={14} className="text-[#65c556]" />
              <span>Fechas de competencia: <strong>{torneo.dates}</strong></span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-[#a0a0a0] hover:text-white p-1 rounded-lg hover:bg-[#344732] transition cursor-pointer text-lg font-bold"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#293827] p-3.5 rounded-xl border border-[#5a7056]">
              <span className="text-[10px] text-[#a0a0a0] uppercase block font-semibold">Premio Oficial</span>
              <span className="text-sm font-black text-[#65c556] mt-0.5 block truncate" title={torneo.prize}>
                🏆 {torneo.prize}
              </span>
            </div>

            <div className="bg-[#293827] p-3.5 rounded-xl border border-[#5a7056]">
              <span className="text-[10px] text-[#a0a0a0] uppercase block font-semibold">Inscripción Equipo</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                ${torneo.entryFee.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="bg-[#293827] p-3.5 rounded-xl border border-[#5a7056]">
              <span className="text-[10px] text-[#a0a0a0] uppercase block font-semibold">Arancel / Arbitraje</span>
              <span className="text-sm font-bold text-white mt-0.5 block">
                ${torneo.matchFee.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="bg-[#293827] p-3.5 rounded-xl border border-[#5a7056]">
              <span className="text-[10px] text-[#a0a0a0] uppercase block font-semibold">Modalidad</span>
              <span className="text-xs font-bold text-[#c0c0c0] mt-1 block">
                Liga (Todos contra todos)
              </span>
            </div>
          </div>

          {/* Cupo de Equipos & Barra de Progreso */}
          <div className="bg-[#293827] p-4 rounded-xl border border-[#5a7056] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#c0c0c0] font-semibold">Cupo de Equipos Participantes:</span>
              <span className="font-bold text-white">
                <strong className="text-[#65c556]">{torneo.registeredTeams.length}</strong> de {torneo.maxTeams} equipos ({cupoPercentage}%)
              </span>
            </div>
            <div className="w-full bg-[#1e281d] h-2.5 rounded-full overflow-hidden border border-[#5a7056]/50">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isCupoLleno ? 'bg-amber-400' : 'bg-[#65c556]'
                }`}
                style={{ width: `${cupoPercentage}%` }}
              />
            </div>
          </div>

          {/* Equipos Inscriptos Confirmados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <IconCheck size={16} className="text-[#65c556]" />
                <span>Equipos Inscriptos ({torneo.registeredTeams.length})</span>
              </h3>
              {isCupoLleno ? (
                <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                  Cupo Completo
                </span>
              ) : (
                <span className="text-[10px] font-bold text-[#65c556] bg-[#65c556]/10 px-2 py-0.5 rounded-full border border-[#65c556]/30">
                  {torneo.maxTeams - torneo.registeredTeams.length} cupos disponibles
                </span>
              )}
            </div>

            {torneo.registeredTeams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {torneo.registeredTeams.map((team, idx) => (
                  <div
                    key={team.id || idx}
                    className="bg-[#293827] border border-[#5a7056] p-3 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{team.name}</h4>
                      <p className="text-[11px] text-[#a0a0a0]">
                        Capitán: {team.captain || 'Designado'}
                      </p>
                    </div>
                    <span className="text-xs bg-[#1e281d] text-[#65c556] px-2.5 py-1 rounded-lg border border-[#5a7056] font-bold whitespace-nowrap">
                      {team.playersCount || team.players?.length || 5} jug.
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-[#293827]/40 rounded-xl border border-dashed border-[#5a7056] text-center text-xs text-[#a0a0a0]">
                Aún no hay equipos confirmados en este torneo. ¡Sé el primero en anotar a tu equipo!
              </div>
            )}
          </div>

          {/* Reglamento y Condiciones del Torneo */}
          <div className="bg-[#293827]/60 p-4 rounded-xl border border-[#5a7056]/60 text-xs text-[#c0c0c0] space-y-1.5">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wide mb-1">
              Reglamento y Condiciones de Competencia
            </h4>
            <p>• <strong>Sistema de Puntuación:</strong> Victoria 3 puntos, Empate 1 punto, Derrota 0 puntos.</p>
            <p>• <strong>Arbitraje:</strong> Cada encuentro contará con terna arbitral oficial designada por el complejo.</p>
            <p>• <strong>Canchas Oficiales:</strong> Los partidos se disputan en fines de semana en las canchas reglamentarias con césped sintético y blindex.</p>
            <p>• <strong>Fixture y Resultados:</strong> Los resultados y la tabla de posiciones se actualizan de forma inmediata tras el pitazo final.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#293827] px-6 py-4 border-t border-[#5a7056] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-[#5a7056] text-[#c0c0c0] hover:text-white font-semibold text-xs cursor-pointer transition text-center"
          >
            Cerrar
          </button>

          <div className="w-full sm:w-auto flex items-center gap-2.5">
            {onVerFixture && (
              <button
                type="button"
                onClick={() => {
                  onVerFixture(torneo.id);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-[#1e281d] hover:bg-[#344732] border border-[#5a7056] text-[#65c556] font-bold text-xs transition cursor-pointer text-center"
              >
                Ver Tabla y Fixture →
              </button>
            )}

            {onInscribir && torneo.status !== 'Finalizado' && !isCupoLleno && (
              <button
                type="button"
                onClick={() => {
                  onInscribir(torneo.id);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#65c556] hover:bg-[#54b045] text-[#293827] font-extrabold text-xs shadow-lg shadow-[#65c556]/20 transition cursor-pointer text-center"
              >
                Inscribir Mi Equipo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TorneoDetalleModal;
