import React, { useState, useEffect } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { type SportType, type Tournament, SQUAD_LIMITS } from '../data/mockData';
import { torneosApi } from '../api/endpoints';

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
    deleteTournament,
    assignReferee,
    fetchTorneoData
  } = useComplejo();

  const [activeTab, setActiveTab] = useState<'torneos' | 'fixture' | 'tabla'>('torneos');
  const [selectedTorneoId, setSelectedTorneoId] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGeneratingFixture, setIsGeneratingFixture] = useState(false);
  const [fixtureSuccessMsg, setFixtureSuccessMsg] = useState<string | null>(null);

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

  const handleGenerarFixture = async (torneoId: string) => {
    const numId = parseInt(torneoId.replace(/\D/g, ''), 10);
    if (isNaN(numId)) return;
    setIsGeneratingFixture(true);
    try {
      await torneosApi.generarFixture(numId);
      await fetchTorneoData(numId);
      setFixtureSuccessMsg('¡Fixture oficial generado y guardado en la base de datos MySQL!');
      setTimeout(() => setFixtureSuccessMsg(null), 4500);
    } catch (err: any) {
      alert(`Error al generar fixture: ${err?.message || 'Verifica que el torneo tenga equipos inscriptos.'}`);
    } finally {
      setIsGeneratingFixture(false);
    }
  };

  // Deletion States (2-step confirmation)
  const [tournamentToDelete, setTournamentToDelete] = useState<Tournament | null>(null);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccessMsg, setDeleteSuccessMsg] = useState<string | null>(null);

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

  const handleDeleteInitiate = (tournament: Tournament) => {
    setTournamentToDelete(tournament);
    setDeleteStep(1);
    setDeleteConfirmationText('');
  };

  const handleCancelDelete = () => {
    setTournamentToDelete(null);
    setDeleteStep(1);
    setDeleteConfirmationText('');
  };

  const handleConfirmDelete = async () => {
    if (!tournamentToDelete) return;

    setIsDeleting(true);
    try {
      // 1. Eliminar del contexto y almacenamiento local
      deleteTournament(tournamentToDelete.id);

      // 2. Notificar / sincronizar con API backend si cuenta con id numérico
      const numericId = parseInt(tournamentToDelete.id.replace(/\D/g, ''), 10);
      if (!isNaN(numericId)) {
        try {
          await torneosApi.delete(numericId);
        } catch {
          // Backend en memoria/mock o desconectado
        }
      }

      setDeleteSuccessMsg(`El torneo "${tournamentToDelete.name}" fue eliminado exitosamente.`);
      setTimeout(() => setDeleteSuccessMsg(null), 4500);
      handleCancelDelete();
    } finally {
      setIsDeleting(false);
    }
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

      {/* Banner de confirmación de acción */}
      {deleteSuccessMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base">✅</span>
            <span className="font-semibold">{deleteSuccessMsg}</span>
          </div>
          <button
            onClick={() => setDeleteSuccessMsg(null)}
            className="text-emerald-400 hover:text-white bg-transparent border-none cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>
      )}

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
        <>
          {tournaments.length === 0 ? (
            <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-12 text-center text-[#a0a0a0] flex flex-col items-center justify-center gap-2 shadow-xl">
              <span className="text-4xl block">🏆</span>
              <h3 className="text-base font-bold text-white">No hay torneos registrados actualmente</h3>
              <p className="text-xs text-[#a0a0a0] max-w-md">
                No se encontraron torneos activos en el complejo. Puedes dar de alta uno nuevo haciendo clic en "+ Nuevo Torneo".
              </p>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-3 px-4 py-2 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs transition-colors cursor-pointer border-none"
              >
                + Crear Primer Torneo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  className="bg-[#1e281d] rounded-2xl p-6 border border-[#5a7056] flex flex-col justify-between gap-4 shadow-xl relative"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#65c556] tracking-wider">
                          {t.sport} • {t.format}
                        </span>
                        <h3 className="text-xl font-bold text-white mt-1">{t.name}</h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="bg-[rgba(101,197,86,0.15)] text-[#65c556] text-xs font-bold px-3 py-1 rounded-full border border-[#65c556]/30">
                          {t.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteInitiate(t)}
                          className="px-2.5 py-1 rounded-lg border border-red-500/40 text-red-400 hover:bg-red-500/20 hover:border-red-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          title={`Eliminar torneo "${t.name}"`}
                        >
                          <span>🗑️</span>
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </div>
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
                      {t.registeredTeams.length > 0 ? (
                        t.registeredTeams.map((team) => (
                          <span
                            key={team.id}
                            className="bg-[#293827] border border-[#5a7056] text-xs px-2.5 py-1 rounded-lg text-white font-medium"
                          >
                            {team.name} ({team.playersCount} jug.)
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-[#808080] italic">
                          Sin equipos inscriptos aún
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* TAB 2: FIXTURE OFICIAL */}
      {activeTab === 'fixture' && (
        <div className="bg-[#1e281d] border border-[#5a7056] rounded-2xl p-6 shadow-xl flex flex-col gap-6">
          {fixtureSuccessMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
              <span>✅ {fixtureSuccessMsg}</span>
              <button onClick={() => setFixtureSuccessMsg(null)} className="text-emerald-400 hover:text-white bg-transparent border-none cursor-pointer">✕</button>
            </div>
          )}

          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-[#3b4d38] pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Fixture del Torneo Liga Todos Contra Todos</h3>
              <p className="text-xs text-[#a0a0a0] mt-0.5">
                Generado automáticamente con asignación de canchas y rotación de fechas libres.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#a0a0a0] font-semibold">Torneo:</label>
                <select
                  value={selectedTorneoId}
                  onChange={(e) => setSelectedTorneoId(e.target.value)}
                  className="bg-[#293827] border border-[#5a7056] text-white text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#65c556]"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.sport})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                disabled={isGeneratingFixture || !selectedTorneoId}
                onClick={() => handleGenerarFixture(selectedTorneoId)}
                className="px-3.5 py-1.5 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs shadow transition-all cursor-pointer border-none flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>⚡</span>
                <span>{isGeneratingFixture ? 'Generando...' : 'Generar Fixture Oficial'}</span>
              </button>

              <span className="bg-[#293827] text-[#65c556] border border-[#5a7056] px-3 py-1 rounded-lg text-xs font-mono">
                Total: {fixtures.length} partidos
              </span>
            </div>
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
          <div className="px-6 py-4 border-b border-[#5a7056] flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-base font-bold text-white">Tabla Oficial de Posiciones</h3>
              <p className="text-xs text-[#a0a0a0]">
                Criterio: Puntos &gt; Dif. Goles &gt; Goles a Favor
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs text-[#a0a0a0] font-semibold">Torneo:</label>
                <select
                  value={selectedTorneoId}
                  onChange={(e) => setSelectedTorneoId(e.target.value)}
                  className="bg-[#293827] border border-[#5a7056] text-white text-xs font-bold px-3 py-1.5 rounded-xl focus:outline-none focus:border-[#65c556]"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.sport})
                    </option>
                  ))}
                </select>
              </div>
              <span className="bg-[#293827] text-[#65c556] border border-[#5a7056] px-3 py-1 rounded-lg text-xs font-bold">
                Actualización Automática (Triggers BD)
              </span>
            </div>
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

      {/* Modal: Confirmación de Eliminación en Dos Pantallas */}
      {tournamentToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleCancelDelete()}
        >
          <div className="bg-[#1e281d] rounded-2xl border border-red-500/50 w-full max-w-[540px] p-6 shadow-2xl text-white font-['Inter',sans-serif] relative">
            {/* Header / Stepper */}
            <div className="flex items-center justify-between border-b border-[#5a7056] pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{deleteStep === 1 ? '⚠️' : '🚨'}</span>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {deleteStep === 1 ? 'Eliminar Torneo — Verificación Inicial' : 'Confirmación Definitiva de Eliminación'}
                  </h3>
                  <span className="text-[11px] text-[#a0a0a0]">
                    Pantalla de confirmación {deleteStep} de 2
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancelDelete}
                className="text-[#a0a0a0] hover:text-white cursor-pointer bg-transparent border-none text-lg p-1"
                aria-label="Cerrar modal"
              >
                ✕
              </button>
            </div>

            {/* Stepper Visual Indicator */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  deleteStep === 1
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-[#293827] text-emerald-400 border border-emerald-500/30'
                }`}
              >
                <span>{deleteStep === 2 ? '✓' : '1'}</span>
                <span>Paso 1: Advertencia</span>
              </div>
              <div
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  deleteStep === 2
                    ? 'bg-red-500/25 text-red-300 border border-red-500/60'
                    : 'bg-[#293827]/60 text-[#808080] border border-[#5a7056]/40'
                }`}
              >
                <span>2</span>
                <span>Paso 2: Confirmación Final</span>
              </div>
            </div>

            {/* PANTALLA 1: Advertencia e Impacto */}
            {deleteStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="bg-[#293827] rounded-xl p-4 border border-[#5a7056]">
                  <span className="text-[10px] uppercase font-bold text-[#65c556] tracking-wider block">
                    {tournamentToDelete.sport} • {tournamentToDelete.format}
                  </span>
                  <h4 className="text-lg font-bold text-white mt-0.5">{tournamentToDelete.name}</h4>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#3b4d38] text-xs">
                    <div>
                      <span className="text-[#a0a0a0] block">Estado del certamen:</span>
                      <span className="font-semibold text-white">{tournamentToDelete.status}</span>
                    </div>
                    <div>
                      <span className="text-[#a0a0a0] block">Equipos inscriptos:</span>
                      <span className="font-semibold text-[#65c556]">
                        {tournamentToDelete.registeredTeams.length} / {tournamentToDelete.maxTeams}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#a0a0a0] block">Inscripción por equipo:</span>
                      <span className="font-medium text-white">${tournamentToDelete.entryFee.toLocaleString('es-AR')}</span>
                    </div>
                    <div>
                      <span className="text-[#a0a0a0] block">Arancel por partido:</span>
                      <span className="font-medium text-white">${tournamentToDelete.matchFee.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3.5 text-xs text-amber-200 flex items-start gap-2.5">
                  <span className="text-base leading-none">⚠️</span>
                  <div className="leading-relaxed">
                    <strong>Atención Administrador:</strong> Esta acción dará de baja el torneo y desvinculará sus fixtures generados, resultados disputados y listas de planteles inscriptos.
                    <p className="mt-1 text-amber-300/80">
                      Para evitar borrados accidentales, se requiere avanzar a una segunda pantalla de confirmación antes de aplicar los cambios de manera definitiva.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-1">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="px-4 py-2.5 rounded-xl border border-[#5a7056] text-[#c0c0c0] hover:text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 cursor-pointer border-none"
                  >
                    <span>Continuar al Paso 2</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}

            {/* PANTALLA 2: Segunda Pantalla de Confirmación Definitiva */}
            {deleteStep === 2 && (
              <div className="flex flex-col gap-4">
                <div className="bg-red-950/40 border border-red-500/60 rounded-xl p-4 text-xs text-red-200">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-sm mb-1">
                    <span>🚨</span>
                    <span>Acción Irreversible</span>
                  </div>
                  <p className="leading-relaxed text-red-200/90">
                    Estás a punto de borrar de forma permanente el torneo <strong>«{tournamentToDelete.name}»</strong>.
                    Todos los datos asociados se eliminarán inmediatamente y no podrán recuperarse.
                  </p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-[#c0c0c0]">
                    Para confirmar la eliminación definitiva, escribe <strong className="text-red-400 tracking-wider">ELIMINAR</strong> a continuación:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    placeholder="Escribe ELIMINAR"
                    autoFocus
                    className="w-full bg-[#293827] border border-red-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-red-400 font-mono tracking-wider"
                  />
                  <span className="text-[11px] text-[#a0a0a0]">
                    * El botón de confirmación se habilitará cuando escribas <strong>ELIMINAR</strong>.
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 mt-2 pt-3 border-t border-[#3b4d38]">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(1)}
                    className="px-3.5 py-2 rounded-xl border border-[#5a7056] text-[#c0c0c0] hover:text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>←</span>
                    <span>Volver al Paso 1</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelDelete}
                      className="px-3.5 py-2 rounded-xl text-[#a0a0a0] hover:text-white font-semibold text-xs transition-colors cursor-pointer bg-transparent border-none"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={deleteConfirmationText.trim().toUpperCase() !== 'ELIMINAR' || isDeleting}
                      onClick={handleConfirmDelete}
                      className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition-all flex items-center gap-1.5 border-none ${
                        deleteConfirmationText.trim().toUpperCase() === 'ELIMINAR' && !isDeleting
                          ? 'bg-red-600 hover:bg-red-500 text-white cursor-pointer shadow-red-900/40'
                          : 'bg-red-950/60 text-red-400/40 cursor-not-allowed border border-red-900/30'
                      }`}
                    >
                      <span>🗑️</span>
                      <span>{isDeleting ? 'Eliminando...' : 'Sí, Eliminar Definitivamente'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTorneo;
