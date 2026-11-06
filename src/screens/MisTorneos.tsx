import React, { useState, useEffect } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import type { StandingRow, FixtureMatch, Tournament } from '../data/mockData';
import { IconPlus, IconCalendar, IconUsers, IconArrowLeft, IconArrowRight, IconStadium } from '../components/Icons';
import TorneoDetalleModal from '../components/TorneoDetalleModal';

interface MisTorneosProps {
  onNavigate: (screen: any) => void;
  onOpenInscripcion: (tournamentId?: string) => void;
}

export const MisTorneos: React.FC<MisTorneosProps> = ({ onNavigate, onOpenInscripcion }) => {
  const { tournaments, standings, fixtures, userRole, fetchTorneoData } = useComplejo();
  const [selectedTorneoId, setSelectedTorneoId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'posiciones' | 'fixture'>('posiciones');
  const [detailModalTorneo, setDetailModalTorneo] = useState<Tournament | null>(null);

  useEffect(() => {
    if (tournaments.length > 0) {
      const exists = tournaments.some(t => t.id === selectedTorneoId);
      const defaultTorneo = tournaments.find(t => t.status === 'En curso') || tournaments[0];
      const targetId = exists ? selectedTorneoId : defaultTorneo.id;
      if (targetId !== selectedTorneoId) {
        setSelectedTorneoId(targetId);
      }
      fetchTorneoData(targetId);
    }
  }, [tournaments, selectedTorneoId, fetchTorneoData]);

  const selectedTorneo = tournaments.find(t => t.id === selectedTorneoId) || tournaments[0] || {
    id: '1',
    name: 'Copa Verano - Fútbol 5',
    sport: 'Fútbol 5',
    status: 'En curso',
    dates: '20 - 25 Oct',
    maxTeams: 6,
    registeredTeams: [],
    entryFee: 50000,
    matchFee: 8000,
    prize: 'Trofeo y $200.000',
    format: 'Liga (Todos contra todos)',
  };

  const filteredFixtures = fixtures.filter(
    f => String(f.tournamentId) === String(selectedTorneo.id) || Boolean(f.tournamentName && selectedTorneo?.name && f.tournamentName.includes(selectedTorneo.name))
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#f4f6f4] text-slate-900 font-['Inter',sans-serif]">
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Competencias Universitarias</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">Torneos del Complejo</h1>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm">
              Competencias oficiales modalidad liga. Consultá tablas de posiciones, fixtures e inscribí a tu plantel.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('landing')}
              className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl transition cursor-pointer text-xs"
            >
              <IconArrowLeft size={14} />
              <span>Volver a Canchas</span>
            </button>
            {userRole !== 'arbitro' && (
              <button
                type="button"
                onClick={() => {
                  const openTorneo = tournaments.find(t => t.status === 'Inscripciones abiertas');
                  const targetId = selectedTorneo?.status === 'Inscripciones abiertas' ? selectedTorneo.id : (openTorneo?.id || selectedTorneo?.id);
                  onOpenInscripcion(targetId);
                }}
                className="inline-flex items-center justify-center gap-2 bg-[#199e1b] hover:bg-[#158417] text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-[#199e1b]/20 transition cursor-pointer text-xs"
              >
                <IconPlus size={16} className="shrink-0" />
                <span>Inscribir Mi Equipo</span>
              </button>
            )}
          </div>
        </div>

        {/* Torneos Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {tournaments.map((torneo) => {
            const isSelected = torneo.id === selectedTorneoId;
            return (
              <div
                key={torneo.id}
                onClick={() => {
                  setSelectedTorneoId(torneo.id);
                  document.getElementById('torneo-activo-detalle')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition cursor-pointer hover:border-emerald-400 shadow-xs ${
                  isSelected ? 'border-[#199e1b] ring-2 ring-[#199e1b]/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3 gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {torneo.sport}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
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

                  <h3 className="font-bold text-base text-slate-900 mb-2 line-clamp-1">{torneo.name}</h3>
                  <div className="flex flex-col gap-1 text-xs text-slate-500 mb-4">
                    <span className="inline-flex items-center gap-1.5">
                      <IconCalendar size={13} className="text-slate-400" />
                      <span>{torneo.dates}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <IconUsers size={13} className="text-slate-400" />
                      <span>{(torneo.registeredTeams || []).length}/{torneo.maxTeams || 8} Equipos</span>
                    </span>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400">Modalidad Liga</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTorneoId(torneo.id);
                      setDetailModalTorneo(torneo);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-transparent border-none"
                  >
                    <span>Ver Detalles</span>
                    <IconArrowRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Torneo Activo: Pestañas de Posiciones y Fixture */}
        <div id="torneo-activo-detalle" className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">{selectedTorneo.name}</h2>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {selectedTorneo.sport}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fechas: {selectedTorneo.dates} · Sistema de puntos: Victoria 3 pts, Empate 1 pt, Derrota 0 pts.
              </p>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('posiciones')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'posiciones'
                    ? 'bg-[#199e1b] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tabla de Posiciones
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fixture')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                  activeTab === 'fixture'
                    ? 'bg-[#199e1b] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fixture y Partidos
              </button>
            </div>
          </div>

          {/* TAB 1: Tabla de Posiciones */}
          {activeTab === 'posiciones' && (
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider bg-slate-50">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Equipo</th>
                    <th className="py-3 px-4 text-center font-extrabold text-emerald-700">PTS</th>
                    <th className="py-3 px-4 text-center">PJ</th>
                    <th className="py-3 px-4 text-center">PG</th>
                    <th className="py-3 px-4 text-center">PE</th>
                    <th className="py-3 px-4 text-center">PP</th>
                    <th className="py-3 px-4 text-center">GF</th>
                    <th className="py-3 px-4 text-center">GC</th>
                    <th className="py-3 px-4 text-center">DG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {standings.map((team: StandingRow, idx: number) => {
                    const diffGoles = team.gf - team.gc;
                    return (
                      <tr
                        key={team.team}
                        className={`hover:bg-slate-50/80 transition ${
                          idx === 0 ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-bold">
                          <span
                            className={`size-6 rounded-full inline-flex items-center justify-center text-xs ${
                              idx === 0
                                ? 'bg-[#199e1b] text-white font-bold'
                                : idx === 1
                                ? 'bg-amber-400 text-slate-950 font-bold'
                                : 'text-slate-600'
                            }`}
                          >
                            {team.pos}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                          {team.team}
                          {idx === 0 && (
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                              Líder
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-emerald-700 text-sm">
                          {team.pts}
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600 font-mono">{team.pj}</td>
                        <td className="py-3 px-4 text-center font-mono">{team.pg}</td>
                        <td className="py-3 px-4 text-center font-mono">{team.pe}</td>
                        <td className="py-3 px-4 text-center font-mono">{team.pp}</td>
                        <td className="py-3 px-4 text-center text-slate-600 font-mono">{team.gf}</td>
                        <td className="py-3 px-4 text-center text-slate-600 font-mono">{team.gc}</td>
                        <td
                          className={`py-3 px-4 text-center font-mono font-bold ${
                            diffGoles > 0
                              ? 'text-emerald-700'
                              : diffGoles < 0
                              ? 'text-red-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {diffGoles > 0 ? `+${diffGoles}` : diffGoles}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: Fixture */}
          {activeTab === 'fixture' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFixtures.map((match: FixtureMatch) => (
                  <div
                    key={match.id}
                    className="bg-slate-50 rounded-xl border border-slate-200 p-5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                      <span className="font-bold text-emerald-700">{match.round} · {match.date} {match.time}</span>
                      <span className="bg-white px-2.5 py-0.5 rounded-md border border-slate-200 text-slate-700 font-medium">
                        {match.court}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex-1 text-right">
                        <span className="font-bold text-sm text-slate-900">{match.homeTeam}</span>
                      </div>

                      <div className="px-4 text-center">
                        {match.status === 'Disputado' ? (
                          <div className="bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 font-extrabold text-base text-emerald-700">
                            {match.homeScore} - {match.awayScore}
                          </div>
                        ) : match.isFreeDate ? (
                          <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                            Fecha Libre
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-lg">
                            VS
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-left">
                        <span className="font-bold text-sm text-slate-900">
                          {match.isFreeDate ? '(Descanso)' : match.awayTeam}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Árbitro: <strong className="text-slate-700">{match.refereeName || 'Designado por el complejo'}</strong></span>
                      <span
                        className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] border ${
                          match.status === 'Disputado'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {match.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0d1510] border-t border-white/10 py-8 px-6 lg:px-12 mt-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-8 bg-emerald-500/15 border border-emerald-500/30 rounded-lg flex items-center justify-center text-emerald-400">
              <IconStadium size={16} />
            </div>
            <span className="font-bold text-white text-sm">Complejo Deportivo UB</span>
          </div>
          <p>© 2026 Complejo Deportivo UB. Todos los derechos reservados.</p>
        </div>
      </footer>

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
          setDetailModalTorneo(null);
          setTimeout(() => {
            document.getElementById('torneo-activo-detalle')?.scrollIntoView({ behavior: 'smooth' });
          }, 150);
        }}
      />
    </div>
  );
};

export default MisTorneos;
