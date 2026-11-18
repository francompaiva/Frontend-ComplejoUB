import React from 'react';
import type { Tournament } from '../data/mockData';
import { IconCalendar, IconCheck, IconTrophy, IconClose, IconArrowRight } from './Icons';
import { useComplejo } from '../context/ComplejoContext';

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
  const cupoPercentage = Math.min(100, Math.round((teamsCount / maxTeamsCount) * 100));
  const isCupoLleno = teamsCount >= maxTeamsCount;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 font-['Inter',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                {torneo.sport}
              </span>
              <span
                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  torneo.status === 'En curso'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : torneo.status === 'Inscripciones abiertas'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200'
                }`}
              >
                {torneo.status}
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{torneo.name}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
              <IconCalendar size={14} className="text-emerald-600" />
              <span>Cronograma: <strong className="text-slate-800">{torneo.dates}</strong></span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            title="Cerrar"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Premio Oficial</span>
              <span className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1 truncate" title={torneo.prize}>
                <IconTrophy size={13} className="text-amber-500 shrink-0" />
                <span className="truncate">{torneo.prize}</span>
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Inscripción Equipo</span>
              <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                ${torneo.entryFee.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Arancel / Arbitraje</span>
              <span className="text-sm font-extrabold text-slate-900 mt-0.5 block">
                ${torneo.matchFee.toLocaleString('es-AR')}
              </span>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 uppercase block font-bold">Modalidad</span>
              <span className="text-xs font-bold text-slate-700 mt-1 block">
                Liga (Todos contra todos)
              </span>
            </div>
          </div>

          {/* Cupo de Equipos & Barra de Progreso */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 font-semibold">Cupo de Equipos Participantes</span>
              <span className="font-bold text-slate-900">
                <strong className="text-emerald-700">{(torneo.registeredTeams || []).length}</strong> de {torneo.maxTeams} equipos ({cupoPercentage}%)
              </span>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  isCupoLleno ? 'bg-amber-500' : 'bg-[#199e1b]'
                }`}
                style={{ width: `${cupoPercentage}%` }}
              />
            </div>
          </div>

          {/* Equipos Inscriptos Confirmados */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <IconCheck size={15} className="text-emerald-600" />
                <span>Equipos Confirmados ({(torneo.registeredTeams || []).length})</span>
              </h3>
              {isCupoLleno ? (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Cupo Completo
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {torneo.maxTeams - (torneo.registeredTeams || []).length} cupos disponibles
                </span>
              )}
            </div>

            {(torneo.registeredTeams || []).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(torneo.registeredTeams || []).map((team, idx) => (
                  <div
                    key={team.id || idx}
                    className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{team.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        Capitán: {team.captain || 'Designado'}
                      </p>
                    </div>
                    <span className="text-[11px] bg-white text-emerald-700 px-2.5 py-1 rounded-lg border border-slate-200 font-bold whitespace-nowrap">
                      {team.playersCount || team.players?.length || 5} jug.
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
                Aún no hay equipos confirmados en este torneo.
              </div>
            )}
          </div>

          {/* Reglamento */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wide mb-1">
              Reglamento y Condiciones de Competencia
            </h4>
            <p>· <strong>Puntuación:</strong> Victoria 3 puntos, Empate 1 punto, Derrota 0 puntos.</p>
            <p>· <strong>Arbitraje:</strong> Cada encuentro cuenta con colegiado oficial designado por el complejo.</p>
            <p>· <strong>Actualización:</strong> Los resultados y posiciones se recalculan automáticamente al cerrarse el acta arbitral.</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition text-center"
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
                className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Ver Tabla y Fixture</span>
                <IconArrowRight size={14} />
              </button>
            )}

            {onInscribir && torneo.status !== 'Finalizado' && !isCupoLleno && userRole !== 'arbitro' && (
              <button
                type="button"
                onClick={() => {
                  onInscribir(torneo.id);
                  onClose();
                }}
                className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs shadow-md shadow-[#199e1b]/20 transition cursor-pointer text-center"
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
