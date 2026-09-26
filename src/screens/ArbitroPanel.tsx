import React, { useState, useEffect } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { type FixtureMatch } from '../data/mockData';

export interface ArbitroPanelProps {
  onNavigate?: (screen: any) => void;
}

export const ArbitroPanel: React.FC<ArbitroPanelProps> = ({ onNavigate }) => {
  const { fixtures, saveMatchResult, tournaments } = useComplejo();

  const [refereeName, setRefereeName] = useState('Sebastian Norjean (Árbitro)');
  const [refereeMatricula, setRefereeMatricula] = useState('ARB-F5-091');

  useEffect(() => {
    try {
      const u = localStorage.getItem('complejo_user');
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed.nombre) setRefereeName(parsed.nombre);
        if (parsed.dni) setRefereeMatricula(`ARB-DNI-${parsed.dni}`);
      }
    } catch {}
  }, []);

  // Filtrar partidos asignados a este árbitro o disponibles para arbitraje
  const myMatches = fixtures.filter(
    (m) =>
      !m.isFreeDate &&
      (m.refereeName?.toLowerCase().includes('sebastian') ||
       m.refereeName?.toLowerCase().includes('árbitro') ||
       m.refereeName?.toLowerCase().includes(refereeName.toLowerCase().split(' ')[0]) ||
       m.refereeName?.toLowerCase().includes('sin') ||
       m.refereeName?.toLowerCase().includes('designado'))
  ).length > 0
    ? fixtures.filter(
        (m) =>
          !m.isFreeDate &&
          (m.refereeName?.toLowerCase().includes('sebastian') ||
           m.refereeName?.toLowerCase().includes('árbitro') ||
           m.refereeName?.toLowerCase().includes(refereeName.toLowerCase().split(' ')[0]) ||
           m.refereeName?.toLowerCase().includes('sin') ||
           m.refereeName?.toLowerCase().includes('designado'))
      )
    : fixtures.filter((m) => !m.isFreeDate);

  const [selectedMatch, setSelectedMatch] = useState<FixtureMatch>(myMatches[0] || fixtures[0]);

  useEffect(() => {
    if ((!selectedMatch || !myMatches.some(m => m.id === selectedMatch.id)) && myMatches.length > 0) {
      handleSelectMatch(myMatches[0]);
    }
  }, [myMatches, selectedMatch]);
  const [homeScore, setHomeScore] = useState<number>(selectedMatch?.homeScore ?? 0);
  const [awayScore, setAwayScore] = useState<number>(selectedMatch?.awayScore ?? 0);
  const [matchStatus, setMatchStatus] = useState<FixtureMatch['status']>(selectedMatch?.status || 'Programado');
  const [observations, setObservations] = useState<string>(selectedMatch?.observations || '');

  // Tarjetas temporales
  const [cardPlayer, setCardPlayer] = useState('');
  const [cardTeam, setCardTeam] = useState<'home' | 'away'>('home');
  const [cardType, setCardType] = useState<'amarilla' | 'roja'>('amarilla');
  const [cardMinute, setCardMinute] = useState<number>(15);
  const [cardReason, setCardReason] = useState('Conducta antideportiva');
  const [yellowCards, setYellowCards] = useState(selectedMatch?.yellowCards || []);
  const [redCards, setRedCards] = useState(selectedMatch?.redCards || []);

  const [saveToast, setSaveToast] = useState(false);

  const handleSelectMatch = (m: FixtureMatch) => {
    setSelectedMatch(m);
    setHomeScore(m.homeScore ?? 0);
    setAwayScore(m.awayScore ?? 0);
    setMatchStatus(m.status);
    setObservations(m.observations || '');
    setYellowCards(m.yellowCards || []);
    setRedCards(m.redCards || []);
    setCardTeam('home');
  };

  const handleAddCard = () => {
    if (!cardPlayer.trim()) return;
    const teamName = cardTeam === 'home' ? selectedMatch.homeTeam : selectedMatch.awayTeam;

    if (cardType === 'amarilla') {
      setYellowCards((prev) => [...prev, { team: teamName, player: cardPlayer, minute: cardMinute }]);
    } else {
      setRedCards((prev) => [
        ...prev,
        { team: teamName, player: cardPlayer, minute: cardMinute, reason: cardReason }
      ]);
    }
    setCardPlayer('');
  };

  const handleSaveActa = (e: React.FormEvent) => {
    e.preventDefault();
    saveMatchResult(
      selectedMatch.id,
      homeScore,
      awayScore,
      matchStatus,
      yellowCards,
      redCards,
      observations
    );
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3500);
  };

  return (
    <div className="flex-1 bg-[#293827] text-white font-['Inter',sans-serif] p-6 lg:p-8 min-h-full">
      {saveToast && (
        <div className="fixed top-14 right-6 z-50 bg-[#1e281d] border-2 border-[#65c556] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-xl">📋</span>
          <div>
            <p className="font-bold text-sm text-[#65c556]">¡Acta Arbitral Guardada con Éxito!</p>
            <p className="text-xs text-[#a0a0a0]">El resultado y las estadísticas de torneo fueron actualizados.</p>
          </div>
        </div>
      )}

      {/* Top Banner Arbitral */}
      <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-14 rounded-2xl bg-[rgba(101,197,86,0.15)] border-2 border-[#65c556] flex items-center justify-center text-3xl">
            🟨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">Panel Oficial del Árbitro</h1>
              <span className="bg-[#65c556] text-[#293827] text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                Colegiado AFA/UB
              </span>
            </div>
            <p className="text-sm text-[#a0a0a0] mt-0.5">
              Árbitro Asignado: <strong className="text-white">{refereeName}</strong> (Matrícula: {refereeMatricula})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('mis-torneos')}
              className="bg-[#293827] hover:bg-[#3b4d38] border border-[#5a7056] text-[#65c556] hover:text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
            >
              <span>🏆</span>
              <span>Ver Fixture y Posiciones</span>
            </button>
          )}
          <div className="bg-[#293827] border border-[#5a7056] px-4 py-2 rounded-xl text-center">
            <span className="block text-[11px] text-[#a0a0a0] uppercase font-semibold">Partidos a Dirigir</span>
            <span className="text-xl font-bold text-[#65c556]">{myMatches.length}</span>
          </div>
          <div className="bg-[#293827] border border-[#5a7056] px-4 py-2 rounded-xl text-center">
            <span className="block text-[11px] text-[#a0a0a0] uppercase font-semibold">Torneo Activo</span>
            <span className="text-xl font-bold text-white">{tournaments[0]?.sport || 'Fútbol 5'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: List of assigned matches */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Mis Encuentros Asignados</h2>
          </div>

          <div className="flex flex-col gap-3">
            {myMatches.map((m) => {
              const isSelected = selectedMatch?.id === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectMatch(m)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1e281d] border-[#65c556] shadow-lg shadow-[rgba(101,197,86,0.1)]'
                      : 'bg-[#1e281d]/70 border-[#5a7056] hover:border-[#65c556]/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#65c556]">{m.round} • {m.tournamentName}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        m.status === 'Disputado'
                          ? 'bg-[rgba(101,197,86,0.2)] text-[#65c556]'
                          : m.status === 'Suspendido'
                          ? 'bg-[rgba(229,62,62,0.2)] text-[#e53e3e]'
                          : 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b]'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1">
                    <div className="font-bold text-sm text-white">{m.homeTeam}</div>
                    {m.status === 'Disputado' ? (
                      <div className="text-sm font-black text-[#65c556] px-2 py-0.5 bg-[#293827] rounded">
                        {m.homeScore} - {m.awayScore}
                      </div>
                    ) : (
                      <span className="text-xs text-[#a0a0a0] px-2 font-mono">VS</span>
                    )}
                    <div className="font-bold text-sm text-white">{m.awayTeam}</div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-[#a0a0a0] mt-2 pt-2 border-t border-[#3b4d38]">
                    <span>📍 {m.court}</span>
                    <span>⏰ {m.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Digital Match Sheet (Planilla de Partido) */}
        <div className="lg:col-span-7">
          <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-[#5a7056] pb-4">
              <div>
                <span className="text-xs text-[#65c556] font-bold uppercase tracking-wider">
                  Planilla Digital de Partido
                </span>
                <h3 className="text-xl font-extrabold text-white mt-0.5">
                  {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
                </h3>
              </div>
              <div className="text-right text-xs text-[#a0a0a0]">
                <p>Cancha: <strong className="text-white">{selectedMatch.court}</strong></p>
                <p>Horario: <strong className="text-white">{selectedMatch.date}</strong></p>
              </div>
            </div>

            <form onSubmit={handleSaveActa} className="flex flex-col gap-6">
              {/* Score Inputs */}
              <div className="bg-[#293827] border border-[#5a7056] rounded-xl p-5 flex flex-col gap-3">
                <span className="text-xs font-semibold text-[#a0a0a0] uppercase tracking-wide">
                  Marcador Oficial
                </span>

                <div className="flex items-center justify-around gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <span className="font-bold text-sm text-center max-w-[140px] truncate">{selectedMatch.homeTeam}</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={homeScore}
                      onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                      className="size-16 bg-[#1e281d] border-2 border-[#65c556] rounded-xl text-center text-3xl font-black text-[#65c556] focus:outline-none"
                    />
                  </div>

                  <span className="text-2xl font-black text-[#5a7056]">:</span>

                  <div className="flex flex-col items-center gap-2">
                    <span className="font-bold text-sm text-center max-w-[140px] truncate">{selectedMatch.awayTeam}</span>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      value={awayScore}
                      onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                      className="size-16 bg-[#1e281d] border-2 border-[#65c556] rounded-xl text-center text-3xl font-black text-[#65c556] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-2">
                  Estado del Encuentro
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['Programado', 'Disputado', 'Suspendido', 'Reprogramado'] as FixtureMatch['status'][]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setMatchStatus(st)}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                        matchStatus === st
                          ? 'bg-[#65c556] text-[#293827] border-[#65c556]'
                          : 'bg-[#293827] text-[#a0a0a0] border-[#5a7056] hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Disciplinary Section (Tarjetas y Sanciones) */}
              <div className="border-t border-[#3b4d38] pt-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#a0a0a0] uppercase">
                    Incidencias y Tarjetas
                  </span>
                  <span className="text-[11px] text-[#65c556]">Informe Disciplinario</span>
                </div>

                {/* List of cards */}
                <div className="flex flex-wrap gap-2">
                  {yellowCards.map((c, i) => (
                    <span key={i} className="bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)] text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium">
                      <span>🟨</span> {c.player} ({c.team}) - Min {c.minute}'
                    </span>
                  ))}
                  {redCards.map((c, i) => (
                    <span key={i} className="bg-[rgba(229,62,62,0.15)] text-[#e53e3e] border border-[rgba(229,62,62,0.3)] text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 font-medium">
                      <span>🟥</span> {c.player} ({c.team}) - Min {c.minute}': {c.reason}
                    </span>
                  ))}
                  {yellowCards.length === 0 && redCards.length === 0 && (
                    <span className="text-xs text-[#a0a0a0] italic">Sin tarjetas registradas en este partido.</span>
                  )}
                </div>

                {/* Form to add card */}
                <div className="bg-[#293827] p-3.5 rounded-xl border border-[#5a7056] flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-white">Agregar Amonestación / Expulsión</span>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    <select
                      value={cardTeam}
                      onChange={(e) => setCardTeam(e.target.value as 'home' | 'away')}
                      className="bg-[#1e281d] border border-[#5a7056] text-xs text-white rounded px-2 py-1.5"
                    >
                      <option value="home">{selectedMatch.homeTeam}</option>
                      <option value="away">{selectedMatch.awayTeam}</option>
                    </select>

                    <input
                      type="text"
                      placeholder="Nombre del jugador"
                      value={cardPlayer}
                      onChange={(e) => setCardPlayer(e.target.value)}
                      className="bg-[#1e281d] border border-[#5a7056] text-xs text-white rounded px-2 py-1.5"
                    />

                    <select
                      value={cardType}
                      onChange={(e) => setCardType(e.target.value as 'amarilla' | 'roja')}
                      className="bg-[#1e281d] border border-[#5a7056] text-xs text-white rounded px-2 py-1.5"
                    >
                      <option value="amarilla">🟨 Amarilla</option>
                      <option value="roja">🟥 Roja Directa</option>
                    </select>

                    <input
                      type="number"
                      placeholder="Minuto"
                      min="1"
                      max="90"
                      value={cardMinute}
                      onChange={(e) => setCardMinute(parseInt(e.target.value) || 1)}
                      className="bg-[#1e281d] border border-[#5a7056] text-xs text-white rounded px-2 py-1.5"
                    />
                  </div>

                  {cardType === 'roja' && (
                    <input
                      type="text"
                      placeholder="Motivo de expulsión (ej. Falta de último recurso, agresión verbal)"
                      value={cardReason}
                      onChange={(e) => setCardReason(e.target.value)}
                      className="w-full bg-[#1e281d] border border-[#5a7056] text-xs text-white rounded px-2 py-1.5"
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleAddCard}
                    className="self-end bg-[#3b4d38] hover:bg-[#65c556] hover:text-[#293827] text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors cursor-pointer"
                  >
                    + Registrar Tarjeta
                  </button>
                </div>
              </div>

              {/* Referee Observations */}
              <div>
                <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                  Observaciones Generales e Informe del Árbitro
                </label>
                <textarea
                  rows={3}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Detallar condiciones de la cancha, comportamiento de las hinchadas, reclamos o situaciones atípicas..."
                  className="w-full bg-[#293827] border border-[#5a7056] text-xs text-white rounded-xl p-3 focus:outline-none focus:border-[#65c556]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-black text-sm tracking-wide transition-all shadow-lg shadow-[rgba(101,197,86,0.2)] cursor-pointer flex items-center justify-center gap-2"
              >
                <span>💾</span> Guardar y Firmar Acta Oficial del Encuentro
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArbitroPanel;

