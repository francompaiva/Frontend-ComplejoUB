import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';

export const AdminResultados: React.FC = () => {
  const { fixtures, saveMatchResult } = useComplejo();
  const [scores, setScores] = useState<Record<number, { home: number; away: number }>>({});
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());

  // Pending matches
  const playableMatches = fixtures.filter((f) => !f.isFreeDate);

  const handleScoreChange = (matchId: number, side: 'home' | 'away', val: number) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        home: prev[matchId]?.home ?? 0,
        away: prev[matchId]?.away ?? 0,
        [side]: Math.max(0, val)
      }
    }));
  };

  const handleSaveResult = (matchId: number) => {
    const current = scores[matchId] || { home: 0, away: 0 };
    saveMatchResult(matchId, current.home, current.away, 'Disputado');
    setSavedIds((prev) => new Set([...prev, matchId]));
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-[#293827] min-h-full text-white font-['Inter',sans-serif]">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-2xl text-white">Carga de Resultados Oficiales</h1>
        </div>
        <p className="font-normal text-sm text-[#a0a0a0] mt-1">
          Al guardar un resultado, el sistema recalcula automáticamente la tabla de posiciones con los criterios oficiales.
        </p>
      </div>

      {/* Matches List */}
      <div className="bg-[#1e281d] rounded-2xl border border-[#5a7056] overflow-hidden shadow-xl">
        <div className="px-6 py-4 border-b border-[#5a7056] flex justify-between items-center bg-[#293827]/60">
          <span className="font-bold text-sm text-white">
            Planilla de Encuentros del Torneo
          </span>
          <span className="text-xs text-[#65c556] font-mono">
            {playableMatches.length} partidos programados
          </span>
        </div>

        <div className="divide-y divide-[#293827]">
          {playableMatches.map((match) => {
            const isSaved = savedIds.has(match.id) || match.status === 'Disputado';
            const currentScore = scores[match.id] || {
              home: match.homeScore ?? 0,
              away: match.awayScore ?? 0
            };

            return (
              <div
                key={match.id}
                className="flex items-center justify-between gap-4 p-5 flex-wrap hover:bg-[#293827]/30 transition-colors"
              >
                <div className="flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-[#65c556]">
                      {match.round} • {match.tournamentName}
                    </span>
                    <span className="text-[11px] text-[#a0a0a0]">• {match.court}</span>
                  </div>

                  <div className="flex items-center gap-2.5 my-1">
                    <span className="font-bold text-base text-white">
                      {match.homeTeam}
                    </span>
                    <span className="text-xs text-[#a0a0a0] font-mono">vs</span>
                    <span className="font-bold text-base text-white">
                      {match.awayTeam}
                    </span>
                  </div>

                  <p className="text-xs text-[#a0a0a0]">
                    Horario: {match.date} {match.time ? `• ${match.time}` : ''} | Árbitro:{' '}
                    <strong className="text-[#c0c0c0]">{match.refereeName || 'A designar'}</strong>
                  </p>
                </div>

                {/* Score Controls */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2 bg-[#293827] px-3 py-1.5 rounded-xl border border-[#5a7056]">
                    <span className="text-xs font-bold text-[#c0c0c0]">{match.homeTeam.substring(0, 3)}:</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={currentScore.home}
                      disabled={isSaved}
                      onChange={(e) =>
                        handleScoreChange(match.id, 'home', parseInt(e.target.value) || 0)
                      }
                      className="w-12 h-9 bg-[#1e281d] border border-[#5a7056] rounded-lg text-center font-black text-sm text-[#65c556] focus:outline-none disabled:opacity-80"
                    />

                    <span className="text-xs text-[#5a7056] font-bold">-</span>

                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={currentScore.away}
                      disabled={isSaved}
                      onChange={(e) =>
                        handleScoreChange(match.id, 'away', parseInt(e.target.value) || 0)
                      }
                      className="w-12 h-9 bg-[#1e281d] border border-[#5a7056] rounded-lg text-center font-black text-sm text-[#65c556] focus:outline-none disabled:opacity-80"
                    />
                    <span className="text-xs font-bold text-[#c0c0c0]">{match.awayTeam.substring(0, 3)}:</span>
                  </div>

                  {isSaved ? (
                    <span className="bg-[rgba(101,197,86,0.15)] text-[#65c556] border border-[#65c556]/40 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1">
                      <span>✓</span> Guardado
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSaveResult(match.id)}
                      className="bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors shadow"
                    >
                      Guardar Resultado
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminResultados;
