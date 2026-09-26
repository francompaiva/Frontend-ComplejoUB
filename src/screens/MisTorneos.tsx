import React, { useState, useEffect } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import type { StandingRow, FixtureMatch } from '../data/mockData';

interface MisTorneosProps {
  onNavigate: (screen: any) => void;
  onOpenInscripcion: () => void;
}

export const MisTorneos: React.FC<MisTorneosProps> = ({ onNavigate, onOpenInscripcion }) => {
  const { tournaments, standings, fixtures, userRole, fetchTorneoData } = useComplejo();
  const [selectedTorneoId, setSelectedTorneoId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'posiciones' | 'fixture'>('posiciones');

  useEffect(() => {
    if (tournaments.length > 0) {
      const exists = tournaments.some(t => t.id === selectedTorneoId);
      const targetId = exists ? selectedTorneoId : tournaments[0].id;
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
    f => String(f.tournamentId) === String(selectedTorneo.id) || f.tournamentName.includes(selectedTorneo.name)
  );

  const handleBrandClick = () => {
    if (userRole === 'arbitro') onNavigate('arbitro');
    else if (userRole === 'admin') onNavigate('admin-agenda');
    else onNavigate('landing');
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#293827] text-white font-['Inter',sans-serif]">
      {/* Navbar principal */}
      <header className="sticky top-0 z-40 bg-[#293827]/95 backdrop-blur border-b border-[#445941] px-6 lg:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={handleBrandClick}>
          <div className="size-9 bg-[#65C556] rounded-lg flex items-center justify-center font-black text-[#293827]">
            UB
          </div>
          <span className="font-extrabold text-lg tracking-tight">Complejo Deportivo UB</span>
        </div>

        {userRole === 'arbitro' ? (
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#A3B89E]">
            <button onClick={() => onNavigate('arbitro')} className="hover:text-white transition flex items-center gap-1.5 cursor-pointer">
              <span>←</span> Volver al Panel Arbitral
            </button>
            <span className="text-[#65C556] font-bold">
              Fixture y Posiciones Oficiales
            </span>
          </nav>
        ) : userRole === 'admin' ? (
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#A3B89E]">
            <button onClick={() => onNavigate('admin-agenda')} className="hover:text-white transition flex items-center gap-1.5 cursor-pointer">
              <span>←</span> Volver al Panel Admin
            </button>
            <span className="text-[#65C556] font-bold">
              Torneos y Posiciones
            </span>
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#A3B89E]">
            <button onClick={() => onNavigate('landing')} className="hover:text-white transition cursor-pointer">
              Canchas
            </button>
            <button onClick={() => onNavigate('mis-reservas')} className="hover:text-white transition cursor-pointer">
              Mis Reservas
            </button>
            <span className="text-[#65C556] font-bold">
              Torneos
            </span>
            <button onClick={() => onNavigate('mis-reservas')} className="hover:text-white transition cursor-pointer">
              Mi Perfil
            </button>
          </nav>
        )}

        <div className="flex items-center gap-4">
          {userRole === 'arbitro' ? (
            <button
              onClick={() => onNavigate('arbitro')}
              className="bg-[#65C556] hover:bg-[#52ad44] text-[#293827] font-bold text-sm px-5 py-2.5 rounded-lg transition shadow-md shadow-[#65C556]/10 flex items-center gap-1.5 cursor-pointer"
            >
              <span>⏱️</span> Panel Arbitral
            </button>
          ) : userRole === 'admin' ? (
            <button
              onClick={() => onNavigate('admin-torneo')}
              className="bg-[#65C556] hover:bg-[#52ad44] text-[#293827] font-bold text-sm px-5 py-2.5 rounded-lg transition shadow-md shadow-[#65C556]/10 flex items-center gap-1.5 cursor-pointer"
            >
              <span>🏆</span> Gestionar Torneos
            </button>
          ) : (
            <button
              onClick={() => onNavigate('landing')}
              className="bg-[#65C556] hover:bg-[#52ad44] text-[#293827] font-bold text-sm px-5 py-2.5 rounded-lg transition shadow-md shadow-[#65C556]/10 cursor-pointer"
            >
              Reservar Cancha
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 lg:px-12 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Torneos del Complejo</h1>
            <p className="text-[#A3B89E] mt-1 text-sm">
              Competencias oficiales modalidad liga. Consulta tablas de posiciones, fixtures e inscribe a tu equipo.
            </p>
          </div>
          {userRole !== 'arbitro' && (
            <button
              onClick={onOpenInscripcion}
              className="inline-flex items-center justify-center gap-2 bg-[#65C556] hover:bg-[#54b045] text-[#293827] font-extrabold px-6 py-3 rounded-lg shadow-lg shadow-[#65C556]/20 transition cursor-pointer"
            >
              <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Inscribir Mi Equipo
            </button>
          )}
        </div>

        {/* Torneos Grid Cards (Figma 242:1726) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {tournaments.map((torneo) => {
            const isSelected = torneo.id === selectedTorneoId;
            return (
              <div
                key={torneo.id}
                onClick={() => setSelectedTorneoId(torneo.id)}
                className={`bg-[#344732] rounded-xl border p-5 flex flex-col justify-between transition cursor-pointer hover:border-[#65C556] ${
                  isSelected ? 'border-[#65C556] ring-1 ring-[#65C556] shadow-lg' : 'border-[#445941]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#3C503A] text-[#65C556]">
                      {torneo.sport}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded ${
                        torneo.status === 'En curso'
                          ? 'bg-[#65C556]/20 text-[#65C556]'
                          : torneo.status === 'Inscripciones abiertas'
                          ? 'bg-blue-400/20 text-blue-300'
                          : 'bg-gray-500/20 text-gray-300'
                      }`}
                    >
                      {torneo.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-lg text-white mb-1 line-clamp-1">{torneo.name}</h3>
                  <p className="text-xs text-[#A3B89E] mb-4">
                    📅 {torneo.dates} | 👥 {torneo.registeredTeams.length}/{torneo.maxTeams} Equipos
                  </p>
                </div>

                <div className="pt-4 border-t border-[#445941] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#A3B89E]">Modalidad Liga</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTorneoId(torneo.id);
                    }}
                    className="text-xs font-bold text-[#65C556] hover:underline"
                  >
                    Ver Detalles →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Torneo Activo: Pestañas de Posiciones y Fixture */}
        <div className="bg-[#344732] rounded-xl border border-[#445941] overflow-hidden shadow-xl">
          <div className="p-6 border-b border-[#445941] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-black text-white">{selectedTorneo.name}</h2>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-[#293827] text-[#65C556] border border-[#445941]">
                  {selectedTorneo.sport}
                </span>
              </div>
              <p className="text-xs text-[#A3B89E] mt-1">
                Fechas: {selectedTorneo.dates} — Sistema de puntos: Victoria 3 pts, Empate 1 pt, Derrota 0 pts.
              </p>
            </div>

            <div className="flex bg-[#293827] p-1 rounded-lg border border-[#445941]">
              <button
                onClick={() => setActiveTab('posiciones')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition ${
                  activeTab === 'posiciones'
                    ? 'bg-[#65C556] text-[#293827]'
                    : 'text-[#A3B89E] hover:text-white'
                }`}
              >
                Tabla de Posiciones
              </button>
              <button
                onClick={() => setActiveTab('fixture')}
                className={`px-4 py-2 rounded-md text-xs font-bold transition ${
                  activeTab === 'fixture'
                    ? 'bg-[#65C556] text-[#293827]'
                    : 'text-[#A3B89E] hover:text-white'
                }`}
              >
                Fixture & Partidos
              </button>
            </div>
          </div>

          {/* TAB 1: Tabla de Posiciones */}
          {activeTab === 'posiciones' && (
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#445941] text-[#A3B89E] text-xs uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Equipo</th>
                    <th className="py-3 px-4 text-center">PTS</th>
                    <th className="py-3 px-4 text-center">PJ</th>
                    <th className="py-3 px-4 text-center">PG</th>
                    <th className="py-3 px-4 text-center">PE</th>
                    <th className="py-3 px-4 text-center">PP</th>
                    <th className="py-3 px-4 text-center">GF</th>
                    <th className="py-3 px-4 text-center">GC</th>
                    <th className="py-3 px-4 text-center">DG</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#445941]">
                  {standings.map((team: StandingRow, idx: number) => {
                    const diffGoles = team.gf - team.gc;
                    return (
                      <tr
                        key={team.team}
                        className={`hover:bg-[#3C503A]/50 transition ${
                          idx === 0 ? 'bg-[#65C556]/5' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-black">
                          <span
                            className={`size-6 rounded-full inline-flex items-center justify-center text-xs ${
                              idx === 0
                                ? 'bg-[#65C556] text-[#293827]'
                                : idx === 1
                                ? 'bg-amber-400 text-[#293827]'
                                : 'text-[#A3B89E]'
                            }`}
                          >
                            {team.pos}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white flex items-center gap-2">
                          {team.team}
                          {idx === 0 && (
                            <span className="text-[10px] bg-[#65C556]/20 text-[#65C556] px-1.5 py-0.5 rounded font-extrabold">
                              Líder
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-black text-[#65C556] text-base">
                          {team.pts}
                        </td>
                        <td className="py-3 px-4 text-center text-[#A3B89E] font-medium">{team.pj}</td>
                        <td className="py-3 px-4 text-center font-medium">{team.pg}</td>
                        <td className="py-3 px-4 text-center font-medium">{team.pe}</td>
                        <td className="py-3 px-4 text-center font-medium">{team.pp}</td>
                        <td className="py-3 px-4 text-center text-[#A3B89E] font-medium">{team.gf}</td>
                        <td className="py-3 px-4 text-center text-[#A3B89E] font-medium">{team.gc}</td>
                        <td
                          className={`py-3 px-4 text-center font-bold ${
                            diffGoles > 0
                              ? 'text-[#65C556]'
                              : diffGoles < 0
                              ? 'text-red-400'
                              : 'text-white'
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
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFixtures.map((match: FixtureMatch) => (
                  <div
                    key={match.id}
                    className="bg-[#293827] rounded-xl border border-[#445941] p-5 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs text-[#A3B89E] mb-3">
                      <span className="font-bold text-[#65C556]">{match.round} - {match.date} {match.time}</span>
                      <span className="bg-[#344732] px-2 py-0.5 rounded border border-[#445941]">
                        {match.court}
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex-1 text-right">
                        <span className="font-extrabold text-base text-white">{match.homeTeam}</span>
                      </div>

                      <div className="px-5 text-center">
                        {match.status === 'Disputado' ? (
                          <div className="bg-[#344732] px-3 py-1 rounded border border-[#445941] font-black text-lg text-[#65C556]">
                            {match.homeScore} - {match.awayScore}
                          </div>
                        ) : match.isFreeDate ? (
                          <div className="text-xs font-bold text-amber-400 bg-[#344732] px-3 py-1 rounded">
                            Fecha Libre
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-[#A3B89E] bg-[#344732] px-3 py-1 rounded">
                            VS
                          </div>
                        )}
                      </div>

                      <div className="flex-1 text-left">
                        <span className="font-extrabold text-base text-white">
                          {match.isFreeDate ? '(Descanso)' : match.awayTeam}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#445941] flex items-center justify-between text-xs">
                      <span className="text-[#A3B89E]">Árbitro: {match.refereeName || 'Designado por el complejo'}</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          match.status === 'Disputado'
                            ? 'bg-[#65C556]/20 text-[#65C556]'
                            : 'bg-amber-400/20 text-amber-400'
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

      {/* Footer (Figma 242:1726) */}
      <footer className="bg-[#293827] border-t border-[#445941] py-12 px-6 lg:px-12 mt-12 text-[#A3B89E] text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-8 bg-[#65C556] rounded flex items-center justify-center font-black text-[#293827]">
                UB
              </div>
              <span className="font-extrabold text-white text-base">Complejo Deportivo UB</span>
            </div>
            <p className="leading-relaxed">
              La mejor infraestructura deportiva de la región. Canchas de fútbol, tenis y pádel de última generación.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Contacto</h4>
            <p className="mb-1">Tel: (555) 123-4567</p>
            <p className="mb-1">info@complejoub.com</p>
            <p>Av. Deporte 432, Mendoza</p>
          </div>

          <div>
            <h4 className="font-bold text-white text-sm mb-3">Horarios del Predio</h4>
            <p className="mb-1">Lunes a Sábados: 08:00 a 00:00 hs</p>
            <p>Domingos: 09:00 a 22:00 hs</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 border-t border-[#445941] flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Complejo Deportivo UB. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition">Términos de servicio</a>
            <a href="#" className="hover:text-white transition">Políticas de privacidad</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MisTorneos;
