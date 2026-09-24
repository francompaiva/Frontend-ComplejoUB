import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { type SportType, SQUAD_LIMITS } from '../data/mockData';

export interface AdminTorneoProps {
  onOpenInscripcion?: () => void;
}

export const AdminTorneo: React.FC<AdminTorneoProps> = ({ onOpenInscripcion }) => {
  const {
    tournaments,
    fixtures,
    standings,
    referees,
    createTournament,
    assignReferee
  } = useComplejo();

  const [activeTab, setActiveTab] = useState<'torneos' | 'fixture' | 'tabla'>('torneos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New Tournament Form
  const [tName, setTName] = useState('');
  const [tSport, setTSport] = useState<SportType>('Fútbol 5');
  const [tEntryFee, setTEntryFee] = useState(15000);
  const [tMatchFee, setTMatchFee] = useState(4000);
  const [tMaxTeams, setTMaxTeams] = useState(8);
  const [tDates, setTDates] = useState('Octubre - Noviembre 2026');
  const [tPrize, setTPrize] = useState('$100.000 + Medallas y Trofeo Oficial');

  const handleSportChange = (s: SportType) => {
    setTSport(s);
    if (s === 'Pádel') {
      setTEntryFee(8000);
      setTMatchFee(2500);
    } else if (s === 'Tenis') {
      setTEntryFee(9000);
      setTMatchFee(3000);
    } else {
      setTEntryFee(16000);
      setTMatchFee(4500);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tName.trim()) return;

    createTournament({
      name: tName,
      sport: tSport,
      status: 'Inscripciones abiertas',
      entryFee: tEntryFee,
      matchFee: tMatchFee,
      maxTeams: tMaxTeams,
      dates: tDates,
      prize: tPrize,
      format: 'Liga (Todos contra todos)'
    });

    setTName('');
    setIsCreateModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-[#293827] min-h-full text-white font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-2xl text-white">Administración de Torneos</h1>
          </div>
          <p className="font-normal text-sm text-[#a0a0a0] mt-1">
            Modalidad Liga (todos contra todos), fixtures automáticos con fecha libre y tabla de posiciones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenInscripcion && (
            <button
              type="button"
              onClick={onOpenInscripcion}
              className="px-4 py-2.5 rounded-xl border border-[#65c556] text-[#65c556] hover:bg-[#65c556]/10 font-bold text-xs transition-colors cursor-pointer"
            >
              + Inscribir Equipo
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-sm shadow-lg shadow-[rgba(101,197,86,0.25)] transition-all cursor-pointer border-none"
          >
            <span>+</span>
            <span>Nuevo Torneo</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#5a7056] pb-3">
        {[
          { id: 'torneos', label: 'Torneos Activos', icon: '🏆' },
          { id: 'fixture', label: 'Fixture Oficial & Árbitros', icon: '📅' },
          { id: 'tabla', label: 'Tabla de Posiciones Oficial', icon: '📊' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-[#65c556] text-[#293827]'
                : 'text-[#a0a0a0] hover:text-white hover:bg-[#1e281d]'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: TORNEOS */}
      {activeTab === 'torneos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-[#1e281d] rounded-2xl p-6 border border-[#5a7056] flex flex-col justify-between gap-4 shadow-xl"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#65c556] tracking-wider">
                      {t.sport} • {t.format}
                    </span>
                    <h3 className="text-xl font-bold text-white mt-1">{t.name}</h3>
                  </div>

                  <span className="bg-[rgba(101,197,86,0.15)] text-[#65c556] text-xs font-bold px-3 py-1 rounded-full border border-[#65c556]/30">
                    {t.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs my-4 bg-[#293827] p-3.5 rounded-xl border border-[#5a7056]">
                  <div>
                    <span className="text-[#a0a0a0] block">Inscripción por equipo:</span>
                    <span className="text-white font-bold">${t.entryFee.toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <span className="text-[#a0a0a0] block">Arancel por partido:</span>
                    <span className="text-white font-bold">${t.matchFee.toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <span className="text-[#a0a0a0] block">Cupo de equipos:</span>
                    <span className="text-[#65c556] font-bold">{t.registeredTeams.length} / {t.maxTeams} inscriptos</span>
                  </div>
                  <div>
                    <span className="text-[#a0a0a0] block">Límites de plantel:</span>
                    <span className="text-white font-medium">
                      {SQUAD_LIMITS[t.sport].min} a {SQUAD_LIMITS[t.sport].max} jugadores
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#c0c0c0] flex items-center gap-1.5">
                  <span>🎁</span>
                  <span><strong>Premio:</strong> {t.prize}</span>
                </p>
              </div>

              {/* Inscribed teams list preview */}
              <div className="border-t border-[#3b4d38] pt-3">
                <span className="text-[11px] font-bold text-[#a0a0a0] uppercase block mb-2">
                  Equipos en competencia ({t.registeredTeams.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {t.registeredTeams.map((team) => (
                    <span
                      key={team.id}
                      className="bg-[#293827] border border-[#5a7056] text-xs px-2.5 py-1 rounded-lg text-white font-medium"
                    >
                      {team.name} ({team.playersCount} jug.)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: FIXTURE OFICIAL */}
      {activeTab === 'fixture' && (
        <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold text-white">Fixture del Torneo Liga Todos Contra Todos</h3>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                Generado automáticamente con asignación de canchas y rotación de fechas libres.
              </p>
            </div>
            <span className="bg-[#293827] text-[#65c556] border border-[#5a7056] px-3 py-1 rounded-lg text-xs font-mono">
              Total Partidos: {fixtures.length}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fixtures.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  m.isFreeDate
                    ? 'bg-[#293827]/60 border-dashed border-[#5a7056]'
                    : 'bg-[#293827] border-[#5a7056]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-[#65c556] uppercase">
                    {m.round}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      m.status === 'Disputado'
                        ? 'bg-[rgba(101,197,86,0.2)] text-[#65c556]'
                        : m.isFreeDate
                        ? 'bg-[rgba(245,158,11,0.2)] text-[#f59e0b]'
                        : 'bg-[#1e281d] text-[#c0c0c0]'
                    }`}
                  >
                    {m.isFreeDate ? 'Fecha Libre' : m.status}
                  </span>
                </div>

                {m.isFreeDate ? (
                  <div className="py-2 text-center">
                    <span className="text-sm font-bold text-[#f59e0b]">
                      🏖️ Equipo con Fecha Libre: {m.freeTeamName}
                    </span>
                    <p className="text-[11px] text-[#a0a0a0] mt-1">
                      Asignada de forma rotativa por cantidad impar de equipos participantes.
                    </p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between py-2">
                      <span className="font-bold text-sm text-white">{m.homeTeam}</span>
                      {m.status === 'Disputado' ? (
                        <span className="font-black text-lg text-[#65c556] bg-[#1e281d] px-3 py-0.5 rounded border border-[#5a7056]">
                          {m.homeScore} - {m.awayScore}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-[#a0a0a0] px-2">VS</span>
                      )}
                      <span className="font-bold text-sm text-white">{m.awayTeam}</span>
                    </div>

                    <div className="text-xs text-[#a0a0a0] flex items-center justify-between mt-1">
                      <span>📍 {m.court}</span>
                      <span>⏰ {m.date} {m.time ? `• ${m.time}` : ''}</span>
                    </div>
                  </div>
                )}

                {!m.isFreeDate && (
                  <div className="pt-2 border-t border-[#3b4d38] flex items-center justify-between text-xs">
                    <span className="text-[#a0a0a0]">
                      Árbitro: <strong className="text-white">{m.refereeName || 'Sin asignar'}</strong>
                    </span>

                    {/* Quick Referee Assignment */}
                    <select
                      value={m.refereeName || ''}
                      onChange={(e) => assignReferee(m.id, e.target.value)}
                      className="bg-[#1e281d] border border-[#5a7056] text-[11px] text-[#65c556] rounded px-2 py-1 focus:outline-none"
                    >
                      <option value="">Cambiar Árbitro...</option>
                      {referees.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name} ({r.badgeNumber})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TABLA DE POSICIONES */}
      {activeTab === 'tabla' && (
        <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-[#5a7056] flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Tabla Oficial de Posiciones</h3>
              <p className="text-xs text-[#a0a0a0]">
                Criterio: Puntos &gt; Dif. Goles &gt; Goles a Favor
              </p>
            </div>
            <span className="bg-[#293827] text-[#65c556] border border-[#5a7056] px-3 py-1 rounded-lg text-xs font-bold">
              Actualización Automática
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="border-b border-[#5a7056] text-[#a0a0a0] bg-[#293827]">
                  <th className="py-3 px-4 text-center">POS</th>
                  <th className="py-3 px-4 text-left">EQUIPO</th>
                  <th className="py-3 px-3">PJ</th>
                  <th className="py-3 px-3">PG</th>
                  <th className="py-3 px-3">PE</th>
                  <th className="py-3 px-3">PP</th>
                  <th className="py-3 px-3">GF</th>
                  <th className="py-3 px-3">GC</th>
                  <th className="py-3 px-3">DIF</th>
                  <th className="py-3 px-4 text-center font-bold text-[#65c556]">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#293827]">
                {standings.map((s, idx) => {
                  const dif = s.gf - s.gc;
                  return (
                    <tr
                      key={s.team}
                      className={`hover:bg-[#293827]/40 transition-colors ${
                        idx === 0 ? 'bg-[rgba(101,197,86,0.08)]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-bold text-sm text-[#65c556]">
                        {s.pos}° {idx === 0 && '👑'}
                      </td>
                      <td className="py-3 px-4 text-left font-bold text-sm text-white">
                        {s.team}
                      </td>
                      <td className="py-3 px-3 text-[#c0c0c0] font-mono">{s.pj}</td>
                      <td className="py-3 px-3 text-[#c0c0c0] font-mono">{s.pg}</td>
                      <td className="py-3 px-3 text-[#c0c0c0] font-mono">{s.pe}</td>
                      <td className="py-3 px-3 text-[#c0c0c0] font-mono">{s.pp}</td>
                      <td className="py-3 px-3 text-[#c0c0c0] font-mono">{s.gf}</td>
                      <td className="py-3 px-3 text-[#c0c0c0] font-mono">{s.gc}</td>
                      <td className={`py-3 px-3 font-mono font-bold ${dif > 0 ? 'text-[#65c556]' : dif < 0 ? 'text-[#e53e3e]' : 'text-gray-400'}`}>
                        {dif > 0 ? `+${dif}` : dif}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-base text-[#65c556]">
                        {s.pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Crear Torneo */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(17, 26, 16, 0.8)' }}
          onClick={(e) => e.target === e.currentTarget && setIsCreateModalOpen(false)}
        >
          <div className="bg-[#1e281d] rounded-2xl border border-[#5a7056] w-full max-w-[500px] p-6 shadow-2xl text-white font-['Inter',sans-serif]">
            <div className="flex items-center justify-between border-b border-[#5a7056] pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">Crear Nuevo Torneo</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#a0a0a0] hover:text-white cursor-pointer bg-transparent border-none text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                  Nombre del Torneo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Torneo Clausura Pádel 2026"
                  value={tName}
                  onChange={(e) => setTName(e.target.value)}
                  className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#65c556]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                    Deporte
                  </label>
                  <select
                    value={tSport}
                    onChange={(e) => handleSportChange(e.target.value as SportType)}
                    className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#65c556]"
                  >
                    <option value="Fútbol 5">Fútbol 5</option>
                    <option value="Fútbol 8">Fútbol 8</option>
                    <option value="Fútbol 11">Fútbol 11</option>
                    <option value="Pádel">Pádel</option>
                    <option value="Tenis">Tenis</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                    Cupo Máximo Equipos
                  </label>
                  <input
                    type="number"
                    min="3"
                    max="32"
                    value={tMaxTeams}
                    onChange={(e) => setTMaxTeams(parseInt(e.target.value) || 8)}
                    className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#65c556]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                    Costo Inscripción / Equipo
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={tEntryFee}
                    onChange={(e) => setTEntryFee(parseInt(e.target.value) || 10000)}
                    className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#65c556]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                    Valor por Partido Disputado
                  </label>
                  <input
                    type="number"
                    min="500"
                    step="500"
                    value={tMatchFee}
                    onChange={(e) => setTMatchFee(parseInt(e.target.value) || 3000)}
                    className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#65c556]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                  Fechas Estimadas
                </label>
                <input
                  type="text"
                  value={tDates}
                  onChange={(e) => setTDates(e.target.value)}
                  className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                  Premios y Distinciones
                </label>
                <input
                  type="text"
                  value={tPrize}
                  onChange={(e) => setTPrize(e.target.value)}
                  className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="bg-[#293827] p-2.5 rounded-lg border border-[#5a7056] text-[11px] text-[#a0a0a0]">
                * Modalidad fija: <strong>Liga (todos contra todos)</strong> con generación automática de cruces y fecha libre si la cantidad de equipos es impar (Alcance 3.1).
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#5a7056] text-[#c0c0c0] hover:text-white font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs cursor-pointer transition-colors"
                >
                  Confirmar y Crear Torneo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTorneo;
