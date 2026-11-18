import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { type SportType, SPORT_PRICING } from '../data/mockData';
import { IconPlus, IconClose, IconAlert } from '../components/Icons';

export const AdminCanchas: React.FC = () => {
  const { courts, addCourt, toggleCourtStatus } = useComplejo();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [courtName, setCourtName] = useState('');
  const [sport, setSport] = useState<SportType>('Fútbol 5');
  const [surface, setSurface] = useState('Césped Sintético');
  const [hasLighting, setHasLighting] = useState(true);
  const [price, setPrice] = useState(SPORT_PRICING['Fútbol 5']);

  const handleSportChange = (s: SportType) => {
    setSport(s);
    setPrice(SPORT_PRICING[s]);
  };

  const handleCreateCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courtName.trim()) return;

    addCourt({
      name: courtName,
      sport,
      surface,
      hasLighting,
      pricePerHour: price,
      status: 'activa'
    });

    setCourtName('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 min-h-full text-slate-900 font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-extrabold text-2xl text-slate-900 tracking-tight">Gestión de Canchas</h1>
          <p className="font-normal text-xs sm:text-sm text-slate-500 mt-1">
            Alta, baja, tarifas fijas y estado de mantenimiento de las instalaciones deportivas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs shadow-md shadow-[#199e1b]/20 transition-all cursor-pointer border-none"
        >
          <IconPlus size={16} />
          <span>Nueva Cancha</span>
        </button>
      </div>

      {/* Grid of courts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courts.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col justify-between gap-4 shadow-xs hover:border-emerald-300 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                    {c.sport}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">{c.name}</h3>
                </div>

                <span
                  className={`font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border ${
                    c.status === 'activa'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
                >
                  {c.status === 'activa' ? (
                    <>
                      <span className="size-1.5 rounded-full bg-emerald-500" />
                      <span>Operativa</span>
                    </>
                  ) : (
                    <>
                      <IconAlert size={11} />
                      <span>En Mantenimiento</span>
                    </>
                  )}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-slate-500 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 my-2">
                <div className="flex justify-between">
                  <span>Superficie</span>
                  <span className="text-slate-900 font-semibold">{c.surface}</span>
                </div>
                <div className="flex justify-between">
                  <span>Iluminación LED</span>
                  <span className="text-slate-900 font-semibold">{c.hasLighting ? 'Sí (Apta noche)' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarifa fija / hora</span>
                  <span className="text-emerald-700 font-bold">${c.pricePerHour.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">{c.nextSlot}</span>
              <button
                type="button"
                onClick={() => toggleCourtStatus(c.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border cursor-pointer transition-colors ${
                  c.status === 'activa'
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                {c.status === 'activa' ? 'Poner en Mantenimiento' : 'Habilitar Cancha'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal to add court */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in"
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[460px] p-6 shadow-2xl text-slate-900 font-['Inter',sans-serif]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900">Alta de Nueva Cancha</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-none p-1"
              >
                <IconClose size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCourt} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nombre de la Cancha
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cancha 5 – Fútbol 5 Sintético"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Disciplina / Deporte
                </label>
                <select
                  value={sport}
                  onChange={(e) => handleSportChange(e.target.value as SportType)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="Fútbol 5">Fútbol 5 ($18.000 / h)</option>
                  <option value="Fútbol 8">Fútbol 8 ($24.000 / h)</option>
                  <option value="Fútbol 11">Fútbol 11 ($35.000 / h)</option>
                  <option value="Pádel">Pádel ($12.000 / h)</option>
                  <option value="Tenis">Tenis ($14.000 / h)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tipo de Superficie
                </label>
                <input
                  type="text"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  placeholder="Ej. Polvo de ladrillo, Sintético monofilamento"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="light"
                  checked={hasLighting}
                  onChange={(e) => setHasLighting(e.target.checked)}
                  className="size-4 accent-[#199e1b]"
                />
                <label htmlFor="light" className="text-xs text-slate-700 cursor-pointer">
                  Cuenta con reflectores LED para turnos nocturnos
                </label>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs cursor-pointer transition-colors"
                >
                  Crear Cancha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCanchas;
