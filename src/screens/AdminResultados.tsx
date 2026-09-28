import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { IconTrophy, IconBall, IconCalendar, IconCheck, IconClipboard, IconWhistle } from '../components/Icons';

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
    <div
      className="flex flex-col gap-6 p-6 lg:p-8 min-h-full text-white font-['Inter',sans-serif]"
      style={{ backgroundColor: '#293827' }}
    >
      {/* Header Banner */}
      <div
        className="rounded-3xl p-6 border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
        style={{ backgroundColor: '#1e281d', borderColor: '#445941' }}
      >
        <div className="flex items-center gap-4">
          <div
            className="size-14 rounded-2xl flex items-center justify-center text-[#65c556] shrink-0 border"
            style={{ backgroundColor: 'rgba(101,197,86,0.15)', borderColor: '#65c556' }}
          >
            <IconClipboard size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Planilla Oficial de Resultados
            </h1>
            <p className="text-xs text-[#a0a0a0] mt-1 max-w-2xl leading-relaxed">
              Registra los marcadores finales de cada encuentro. El sistema recalcula en tiempo real los puntos (3 PG, 1 PE, 0 PP), goles a favor, goles en contra y diferencia de gol en la tabla de posiciones.
            </p>
          </div>
        </div>

        {/* Counter Badge */}
        <div
          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border shrink-0"
          style={{ backgroundColor: '#141b13', borderColor: '#3b4d38' }}
        >
          <div className="text-right">
            <span className="text-[10px] text-[#a0a0a0] uppercase font-bold block">Total Partidos</span>
            <span className="text-lg font-black text-[#65c556]">{playableMatches.length} Encuentros</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md"
        style={{ backgroundColor: '#1e281d', borderColor: '#445941' }}
      >
        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              filterStatus === 'all'
                ? 'bg-[#65c556] text-[#293827] border-[#65c556]'
                : 'bg-[#293827] text-[#a0a0a0] border-[#445941] hover:text-white'
            }`}
          >
            Todos ({playableMatches.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              filterStatus === 'pending'
                ? 'bg-amber-400 text-[#141b13] border-amber-400 font-extrabold'
                : 'bg-[#293827] text-[#a0a0a0] border-[#445941] hover:text-white'
            }`}
          >
            Pendientes ({playableMatches.filter((m) => m.status !== 'Disputado' && !savedIds.has(m.id)).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('played')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              filterStatus === 'played'
                ? 'bg-[#65c556] text-[#293827] border-[#65c556]'
                : 'bg-[#293827] text-[#a0a0a0] border-[#445941] hover:text-white'
            }`}
          >
            Disputados ({playableMatches.filter((m) => m.status === 'Disputado' || savedIds.has(m.id)).length})
          </button>
        </div>

        {/* Search input */}
        <div className="w-full sm:w-72">
          <input
            type="text"
            placeholder="Buscar por equipo o torneo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#293827] border border-[#445941] rounded-xl px-4 py-2 text-xs text-white placeholder-[#71856d] focus:outline-none focus:border-[#65c556]"
          />
        </div>
      </div>

      {/* Matches List - Rendered as Independent Cards */}
      <div className="flex flex-col gap-4">
        {filteredMatches.length === 0 ? (
          <div
            className="rounded-2xl p-12 text-center border flex flex-col items-center justify-center gap-3"
            style={{ backgroundColor: '#1e281d', borderColor: '#445941' }}
          >
            <IconTrophy size={40} className="text-[#5a7056]" />
            <h3 className="text-base font-bold text-white">No se encontraron encuentros</h3>
            <p className="text-xs text-[#a0a0a0] max-w-md">
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
                className="rounded-2xl border transition-all shadow-lg flex flex-col gap-4"
                style={{
                  backgroundColor: '#1e281d',
                  borderColor: isSaved ? '#3b4d38' : '#5a7056',
                  padding: '22px',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.3)'
                }}
              >
                {/* Top Card Bar: Round, Tournament, Court, Status */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b"
                  style={{ borderColor: '#293827' }}
                >
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className="px-2.5 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider"
                      style={{ backgroundColor: '#293827', color: '#65c556', border: '1px solid #445941' }}
                    >
                      {match.round}
                    </span>
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <IconTrophy size={14} className="text-[#65c556]" />
                      {match.tournamentName || 'Torneo Oficial UB'}
                    </span>
                    <span
                      className="text-xs text-[#c0c0c0] flex items-center gap-1 px-2 py-0.5 rounded"
                      style={{ backgroundColor: '#141b13' }}
                    >
                      <IconBall size={13} className="text-[#65c556]" />
                      {match.court}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#a0a0a0] flex items-center gap-1 font-mono">
                      <IconCalendar size={13} />
                      {match.date} {match.time ? `• ${match.time}` : ''}
                    </span>

                    {isSaved ? (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border"
                        style={{
                          backgroundColor: 'rgba(101,197,86,0.15)',
                          color: '#65c556',
                          borderColor: 'rgba(101,197,86,0.4)'
                        }}
                      >
                        <IconCheck size={13} />
                        Disputado
                      </span>
                    ) : (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border"
                        style={{
                          backgroundColor: 'rgba(245,158,11,0.15)',
                          color: '#f59e0b',
                          borderColor: 'rgba(245,158,11,0.4)'
                        }}
                      >
                        ⏳ Por Disputar
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Score Area (Home vs Away) */}
                <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center py-2">
                  {/* Local Team Box */}
                  <div
                    className="md:col-span-3 rounded-xl p-4 flex items-center justify-between gap-4 border"
                    style={{ backgroundColor: '#293827', borderColor: '#3b4d38' }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="size-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border"
                        style={{ backgroundColor: '#1e281d', borderColor: '#5a7056', color: '#65c556' }}
                      >
                        {match.homeTeam.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#a0a0a0] uppercase font-bold tracking-wider block">Equipo Local</span>
                        <h4 className="text-base font-bold text-white truncate" title={match.homeTeam}>
                          {match.homeTeam}
                        </h4>
                      </div>
                    </div>

                    {/* Home Score Input */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-[#a0a0a0] mb-1 font-bold">Goles</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        disabled={isSaved}
                        value={currentScore.home}
                        onChange={(e) =>
                          handleScoreChange(match.id, 'home', parseInt(e.target.value) || 0)
                        }
                        className="w-14 h-12 rounded-xl text-center font-black text-xl border transition focus:outline-none"
                        style={{
                          backgroundColor: isSaved ? '#1e281d' : '#141b13',
                          borderColor: isSaved ? '#3b4d38' : '#65c556',
                          color: '#65c556',
                          opacity: isSaved ? 0.85 : 1
                        }}
                      />
                    </div>
                  </div>

                  {/* VS Indicator in Center */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center text-center gap-1">
                    <div
                      className="size-10 rounded-full flex items-center justify-center font-black text-xs border shadow-md"
                      style={{ backgroundColor: '#141b13', borderColor: '#5a7056', color: '#c0c0c0' }}
                    >
                      VS
                    </div>
                    <div className="text-[11px] text-[#a0a0a0] flex items-center gap-1 mt-1">
                      <IconWhistle size={12} className="text-yellow-400" />
                      <span>{match.refereeName || 'Árbitro Oficial AFA/UB'}</span>
                    </div>
                  </div>

                  {/* Away Team Box */}
                  <div
                    className="md:col-span-3 rounded-xl p-4 flex items-center justify-between gap-4 border"
                    style={{ backgroundColor: '#293827', borderColor: '#3b4d38' }}
                  >
                    {/* Away Score Input */}
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] text-[#a0a0a0] mb-1 font-bold">Goles</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        disabled={isSaved}
                        value={currentScore.away}
                        onChange={(e) =>
                          handleScoreChange(match.id, 'away', parseInt(e.target.value) || 0)
                        }
                        className="w-14 h-12 rounded-xl text-center font-black text-xl border transition focus:outline-none"
                        style={{
                          backgroundColor: isSaved ? '#1e281d' : '#141b13',
                          borderColor: isSaved ? '#3b4d38' : '#65c556',
                          color: '#65c556',
                          opacity: isSaved ? 0.85 : 1
                        }}
                      />
                    </div>

                    <div className="flex items-center gap-3 min-w-0 text-right justify-end">
                      <div className="min-w-0">
                        <span className="text-[10px] text-[#a0a0a0] uppercase font-bold tracking-wider block">Equipo Visitante</span>
                        <h4 className="text-base font-bold text-white truncate" title={match.awayTeam}>
                          {match.awayTeam}
                        </h4>
                      </div>
                      <div
                        className="size-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border"
                        style={{ backgroundColor: '#1e281d', borderColor: '#5a7056', color: '#65c556' }}
                      >
                        {match.awayTeam.substring(0, 2).toUpperCase()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Footer Actions */}
                <div
                  className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t text-xs"
                  style={{ borderColor: '#293827' }}
                >
                  <div className="flex items-center gap-2 text-[#a0a0a0]">
                    <span>ℹ️</span>
                    <span>
                      {isSaved
                        ? 'Resultado computado en la tabla de clasificación.'
                        : 'Ingresa el tanteador y presiona guardar para impactar la tabla.'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    {isSaved ? (
                      <div className="flex items-center gap-2">
                        <span
                          className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5"
                          style={{ backgroundColor: 'rgba(101,197,86,0.15)', color: '#65c556' }}
                        >
                          <IconCheck size={14} /> Marcador Oficial Asentado
                        </span>
                        <button
                          type="button"
                          onClick={() => handleEditResult(match.id)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-[#a0a0a0] hover:text-white transition cursor-pointer border"
                          style={{ backgroundColor: '#293827', borderColor: '#445941' }}
                        >
                          Editar tanteador
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSaveResult(match.id)}
                        className="px-5 py-2.5 rounded-xl font-black text-xs transition cursor-pointer flex items-center gap-2 shadow-lg"
                        style={{
                          backgroundColor: '#65c556',
                          color: '#293827',
                          boxShadow: '0 4px 12px rgba(101,197,86,0.3)'
                        }}
                      >
                        <IconCheck size={16} />
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
