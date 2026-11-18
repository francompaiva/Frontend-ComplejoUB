import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import {
  IconTrophy,
  IconBall,
  IconCalendar,
  IconCheck,
  IconClipboard,
  IconWhistle,
  IconHourglass,
  IconInfo,
  IconSearch
} from '../components/Icons';

export const AdminResultados: React.FC = () => {
  const { fixtures, saveMatchResult } = useComplejo();
  const [scores, setScores] = useState<Record<number, { home: number; away: number }>>({});
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'played'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Partidos jugables (excluyendo fechas libres)
  const playableMatches = fixtures.filter((f) => !f.isFreeDate);

  const filteredMatches = playableMatches.filter((match) => {
    const isSaved = savedIds.has(match.id) || match.status === 'Disputado';
    if (filterStatus === 'pending' && isSaved) return false;
    if (filterStatus === 'played' && !isSaved) return false;
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchText = `${match.homeTeam} ${match.awayTeam} ${match.tournamentName || ''} ${match.round || ''}`.toLowerCase();
      if (!matchText.includes(term)) return false;
    }
    return true;
  });

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

  const handleEditResult = (matchId: number) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(matchId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 min-h-full bg-slate-50 text-slate-900 font-['Inter',sans-serif]">
      {/* Header Banner */}
      <div className="rounded-2xl p-6 bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <IconClipboard size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Planilla Oficial de Resultados
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Registra los marcadores finales de cada encuentro. El sistema recalcula en tiempo real los puntos (3 PG, 1 PE, 0 PP), goles a favor, goles en contra y diferencia de gol en la tabla de posiciones.
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block tracking-wider">Total Partidos</span>
            <span className="text-base font-black text-emerald-700">{playableMatches.length} Encuentros</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              filterStatus === 'all'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            Todos ({playableMatches.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              filterStatus === 'pending'
                ? 'bg-amber-500 text-white border-amber-500'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            Pendientes ({playableMatches.filter((m) => m.status !== 'Disputado' && !savedIds.has(m.id)).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('played')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              filterStatus === 'played'
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            Disputados ({playableMatches.filter((m) => m.status === 'Disputado' || savedIds.has(m.id)).length})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-72">
          <IconSearch size={15} className="text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por equipo o torneo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
          />
        </div>
      </div>

      {/* Matches List */}
      <div className="flex flex-col gap-4">
        {filteredMatches.length === 0 ? (
          <div className="rounded-2xl p-12 text-center bg-white border border-slate-200 flex flex-col items-center justify-center gap-3 shadow-xs">
            <IconTrophy size={36} className="text-slate-300" />
            <h3 className="text-base font-bold text-slate-900">No se encontraron encuentros</h3>
            <p className="text-xs text-slate-500 max-w-md">
              No hay partidos que coincidan con el filtro seleccionado.
            </p>
          </div>
        ) : (
          filteredMatches.map((match) => {
            const isSaved = savedIds.has(match.id) || match.status === 'Disputado';
            const currentScore = scores[match.id] || {
              home: match.homeScore ?? 0,
              away: match.awayScore ?? 0
            };

            return (
              <div
                key={match.id}
                className="rounded-2xl bg-white border border-slate-200 p-5 transition-all shadow-xs flex flex-col gap-4"
              >
                {/* Top Card Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {match.round}
                    </span>
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <IconTrophy size={14} className="text-emerald-600" />
                      {match.tournamentName || 'Torneo Oficial UB'}
                    </span>
                    <span className="text-xs text-slate-600 flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-slate-100">
                      <IconBall size={13} className="text-emerald-600" />
                      {match.court}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <IconCalendar size={13} />
                      {match.date} {match.time ? `• ${match.time}` : ''}
                    </span>

                    {isSaved ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <IconCheck size={13} />
                        Disputado
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200">
                        <IconHourglass size={13} />
                        Por Disputar
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Score Area */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center py-1">
                  {/* Local Team Box */}
                  <div className="md:col-span-3 rounded-xl p-4 flex items-center justify-between gap-4 bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 bg-white border border-slate-200 text-emerald-700 shadow-2xs">
                        {match.homeTeam.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Equipo Local</span>
                        <h4 className="text-base font-bold text-slate-900 truncate" title={match.homeTeam}>
                          {match.homeTeam}
                        </h4>
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 mb-1 font-bold">Goles</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        disabled={isSaved}
                        value={currentScore.home}
                        onChange={(e) =>
                          handleScoreChange(match.id, 'home', parseInt(e.target.value) || 0)
                        }
                        className={`w-14 h-12 rounded-xl text-center font-black text-xl border transition focus:outline-none ${
                          isSaved
                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-white border-emerald-500 text-emerald-700 shadow-2xs'
                        }`}
                      />
                    </div>
                  </div>

                  {/* VS Indicator */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center text-center gap-1">
                    <div className="size-10 rounded-full flex items-center justify-center font-black text-xs bg-slate-100 border border-slate-200 text-slate-600">
                      VS
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                      <IconWhistle size={12} className="text-amber-500" />
                      <span>{match.refereeName || 'Árbitro Oficial AFA/UB'}</span>
                    </div>
                  </div>

                  {/* Away Team Box */}
                  <div className="md:col-span-3 rounded-xl p-4 flex items-center justify-between gap-4 bg-slate-50 border border-slate-200">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-slate-500 mb-1 font-bold">Goles</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        disabled={isSaved}
                        value={currentScore.away}
                        onChange={(e) =>
                          handleScoreChange(match.id, 'away', parseInt(e.target.value) || 0)
                        }
                        className={`w-14 h-12 rounded-xl text-center font-black text-xl border transition focus:outline-none ${
                          isSaved
                            ? 'bg-slate-100 border-slate-200 text-slate-700'
                            : 'bg-white border-emerald-500 text-emerald-700 shadow-2xs'
                        }`}
                      />
                    </div>

                    <div className="flex items-center gap-3 min-w-0 text-right justify-end">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Equipo Visitante</span>
                        <h4 className="text-base font-bold text-slate-900 truncate" title={match.awayTeam}>
                          {match.awayTeam}
                        </h4>
                      </div>
                      <div className="size-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 bg-white border border-slate-200 text-emerald-700 shadow-2xs">
                        {match.awayTeam.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-500">
                    <IconInfo size={14} className="text-slate-400 shrink-0" />
                    <span>
                      {isSaved
                        ? 'Resultado computado en la tabla de clasificación.'
                        : 'Ingresa el tanteador y presiona guardar para impactar la tabla.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isSaved ? (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <IconCheck size={14} /> Marcador Oficial Asentado
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditResult(match.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 transition cursor-pointer border border-slate-200"
                        >
                          Editar tanteador
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveResult(match.id)}
                        className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer flex items-center gap-2 shadow-xs border-none"
                      >
                        <IconCheck size={15} />
                        Guardar Marcador Oficial
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminResultados;
