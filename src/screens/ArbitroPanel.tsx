import React, { useState, useEffect } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { type FixtureMatch } from '../data/mockData';
import {
  IconWhistle,
  IconTrophy,
  IconMapPin,
  IconClock,
  IconCheck,
  IconCardYellow,
  IconCardRed,
  IconPlus
} from '../components/Icons';

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
    <div className="flex-1 bg-[#f4f6f4] text-slate-900 font-['Inter',sans-serif] p-4 sm:p-6 lg:p-8 min-h-full">
      <div className="max-w-7xl mx-auto">
        {saveToast && (
          <div className="fixed top-16 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in border border-emerald-500/40">
            <div className="size-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <IconCheck size={18} />
            </div>
            <div>
              <p className="font-bold text-xs text-emerald-400">Acta Arbitral Guardada con Éxito</p>
              <p className="text-[11px] text-slate-300">El resultado y las estadísticas del torneo fueron actualizados.</p>
            </div>
          </div>
        )}

        {/* Top Banner Arbitral */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <IconWhistle size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Panel Oficial del Árbitro</h1>
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                  Colegiado AFA/UB
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Árbitro Asignado: <strong className="text-slate-900">{refereeName}</strong> (Matrícula: {refereeMatricula})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('mis-torneos')}
                className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <IconTrophy size={15} className="text-emerald-600" />
                <span>Ver Fixture y Posiciones</span>
              </button>
            )}
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Partidos Asignados</span>
              <span className="text-lg font-extrabold text-emerald-700">{myMatches.length}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-center">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Categoría</span>
              <span className="text-lg font-extrabold text-slate-900">{tournaments[0]?.sport || 'Fútbol 5'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: List of assigned matches */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-1">
              Mis Encuentros Designados
            </h2>

            <div className="flex flex-col gap-3">
              {myMatches.map((m) => {
                const isSelected = selectedMatch?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMatch(m)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer bg-white shadow-xs ${
                      isSelected
                        ? 'border-[#199e1b] ring-2 ring-[#199e1b]/15'
                        : 'border-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-emerald-700">{m.round} · {m.tournamentName}</span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          m.status === 'Disputado'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : m.status === 'Suspendido'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-1.5">
                      <div className="font-bold text-sm text-slate-900">{m.homeTeam}</div>
                      {m.status === 'Disputado' ? (
                        <div className="text-xs font-extrabold text-emerald-700 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md">
                          {m.homeScore} - {m.awayScore}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 px-2 font-mono font-bold">VS</span>
                      )}
                      <div className="font-bold text-sm text-slate-900">{m.awayTeam}</div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100">
                      <span className="inline-flex items-center gap-1">
                        <IconMapPin size={13} className="text-slate-400" />
                        <span>{m.court}</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <IconClock size={13} className="text-slate-400" />
                        <span>{m.date} {m.time}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Digital Match Sheet */}
          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-6 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] text-emerald-700 font-bold uppercase tracking-wider">
                    Planilla Digital de Partido
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-0.5">
                    {selectedMatch?.homeTeam} vs {selectedMatch?.awayTeam}
                  </h3>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <p>Cancha: <strong className="text-slate-900">{selectedMatch?.court}</strong></p>
                  <p>Fecha: <strong className="text-slate-900">{selectedMatch?.date}</strong></p>
                </div>
              </div>

              <form onSubmit={handleSaveActa} className="flex flex-col gap-6">
                {/* Score Inputs */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col gap-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Marcador Oficial
                  </span>

                  <div className="flex items-center justify-around gap-4">
                    <div className="flex flex-col items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 text-center max-w-[140px] truncate">{selectedMatch?.homeTeam}</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={homeScore}
                        onChange={(e) => setHomeScore(Math.max(0, parseInt(e.target.value) || 0))}
                        className="size-16 bg-white border-2 border-emerald-500 rounded-2xl text-center text-3xl font-extrabold text-slate-900 focus:outline-none shadow-xs"
                      />
                    </div>

                    <span className="text-2xl font-extrabold text-slate-300">:</span>

                    <div className="flex flex-col items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 text-center max-w-[140px] truncate">{selectedMatch?.awayTeam}</span>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={awayScore}
                        onChange={(e) => setAwayScore(Math.max(0, parseInt(e.target.value) || 0))}
                        className="size-16 bg-white border-2 border-emerald-500 rounded-2xl text-center text-3xl font-extrabold text-slate-900 focus:outline-none shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-2">
                    Estado del Encuentro
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Programado', 'Disputado', 'Suspendido', 'Reprogramado'] as FixtureMatch['status'][]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setMatchStatus(st)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                          matchStatus === st
                            ? 'bg-[#199e1b] text-white border-[#199e1b] shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disciplinary Section */}
                <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase">
                      Incidencias y Tarjetas
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">Informe Disciplinario</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {yellowCards.map((c, i) => (
                      <span key={i} className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                        <IconCardYellow size={14} />
                        <span>{c.player} ({c.team}) - Min {c.minute}&apos;</span>
                      </span>
                    ))}
                    {redCards.map((c, i) => (
                      <span key={i} className="bg-red-50 text-red-800 border border-red-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium">
                        <IconCardRed size={14} />
                        <span>{c.player} ({c.team}) - Min {c.minute}&apos;: {c.reason}</span>
                      </span>
                    ))}
                    {yellowCards.length === 0 && redCards.length === 0 && (
                      <span className="text-xs text-slate-400 italic">Sin tarjetas registradas en este partido.</span>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-800">Registrar Amonestación o Expulsión</span>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <select
                        value={cardTeam}
                        onChange={(e) => setCardTeam(e.target.value as 'home' | 'away')}
                        className="bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-2"
                      >
                        <option value="home">{selectedMatch?.homeTeam}</option>
                        <option value="away">{selectedMatch?.awayTeam}</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Nombre del jugador"
                        value={cardPlayer}
                        onChange={(e) => setCardPlayer(e.target.value)}
                        className="bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-2"
                      />

                      <select
                        value={cardType}
                        onChange={(e) => setCardType(e.target.value as 'amarilla' | 'roja')}
                        className="bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-2"
                      >
                        <option value="amarilla">Tarjeta Amarilla</option>
                        <option value="roja">Tarjeta Roja</option>
                      </select>

                      <input
                        type="number"
                        placeholder="Minuto"
                        min="1"
                        max="90"
                        value={cardMinute}
                        onChange={(e) => setCardMinute(parseInt(e.target.value) || 1)}
                        className="bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-2"
                      />
                    </div>

                    {cardType === 'roja' && (
                      <input
                        type="text"
                        placeholder="Motivo de expulsión"
                        value={cardReason}
                        onChange={(e) => setCardReason(e.target.value)}
                        className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-lg px-2.5 py-2"
                      />
                    )}

                    <button
                      type="button"
                      onClick={handleAddCard}
                      className="self-end bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <IconPlus size={14} />
                      <span>Registrar Tarjeta</span>
                    </button>
                  </div>
                </div>

                {/* Referee Observations */}
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1.5">
                    Observaciones Generales e Informe del Árbitro
                  </label>
                  <textarea
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Detallar condiciones del campo, disciplina o situaciones especiales..."
                    className="w-full bg-white border border-slate-300 text-xs text-slate-900 rounded-xl p-3 focus:outline-none focus:border-emerald-600"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-sm transition-all shadow-md shadow-[#199e1b]/20 cursor-pointer flex items-center justify-center gap-2"
                >
                  <IconCheck size={18} />
                  <span>Guardar y Firmar Acta Oficial del Encuentro</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArbitroPanel;
