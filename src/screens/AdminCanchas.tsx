import React, { useState } from 'react';
import { useComplejo } from '../context/ComplejoContext';
import { type SportType, SPORT_PRICING } from '../data/mockData';

export const AdminCanchas: React.FC = () => {
  const { courts, addCourt, toggleCourtStatus } = useComplejo();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
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
    <div className="flex flex-col gap-6 p-6 lg:p-8 bg-[#293827] min-h-full text-white font-['Inter',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-2xl text-white">Gestión de Canchas</h1>
          </div>
          <p className="font-normal text-sm text-[#a0a0a0] mt-1">
            Alta, baja, tarifas fijas y estado de mantenimiento de las instalaciones deportivas.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-sm shadow-lg shadow-[rgba(101,197,86,0.25)] transition-all cursor-pointer border-none"
        >
          <span className="text-base font-black">+</span>
          <span>Nueva Cancha</span>
        </button>
      </div>

      {/* Grid of courts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {courts.map((c) => (
          <div
            key={c.id}
            className="bg-[#1e281d] rounded-2xl p-5 border border-[#5a7056] flex flex-col justify-between gap-4 shadow-xl hover:border-[#65c556]/60 transition-all"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#65c556] tracking-wider">
                    {c.sport}
                  </span>
                  <h3 className="font-bold text-base text-white mt-0.5">{c.name}</h3>
                </div>

                <span
                  className={`font-extrabold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    c.status === 'activa'
                      ? 'bg-[rgba(101,197,86,0.15)] text-[#65c556] border border-[#65c556]/30'
                      : 'bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[#f59e0b]/30'
                  }`}
                >
                  {c.status === 'activa' ? '● Operativa' : '⚠️ En Mantenimiento'}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 text-xs text-[#a0a0a0] bg-[#293827] p-3 rounded-xl border border-[#5a7056]/60 my-2">
                <div className="flex justify-between">
                  <span>Superficie:</span>
                  <span className="text-white font-medium">{c.surface}</span>
                </div>
                <div className="flex justify-between">
                  <span>Iluminación LED:</span>
                  <span className="text-white font-medium">{c.hasLighting ? 'Sí (Apta noche)' : 'No'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tarifa fija / hora:</span>
                  <span className="text-[#65c556] font-bold">${c.pricePerHour.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#3b4d38] flex items-center justify-between">
              <span className="text-xs text-[#c0c0c0] font-mono">{c.nextSlot}</span>
              <button
                type="button"
                onClick={() => toggleCourtStatus(c.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border cursor-pointer transition-colors ${
                  c.status === 'activa'
                    ? 'border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b] hover:text-[#1e281d]'
                    : 'border-[#65c556] text-[#65c556] hover:bg-[#65c556] hover:text-[#293827]'
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(17, 26, 16, 0.8)' }}
          onClick={(e) => e.target === e.currentTarget && setIsModalOpen(false)}
        >
          <div className="bg-[#1e281d] rounded-2xl border border-[#5a7056] w-full max-w-[460px] p-6 shadow-2xl text-white font-['Inter',sans-serif]">
            <div className="flex items-center justify-between border-b border-[#5a7056] pb-3 mb-4">
              <h3 className="text-lg font-bold text-white">Alta de Nueva Cancha</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#a0a0a0] hover:text-white cursor-pointer bg-transparent border-none text-base"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCourt} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                  Nombre de la Cancha
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Cancha 5 – Fútbol 5 Sintético"
                  value={courtName}
                  onChange={(e) => setCourtName(e.target.value)}
                  className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#65c556]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                  Disciplina / Deporte
                </label>
                <select
                  value={sport}
                  onChange={(e) => handleSportChange(e.target.value as SportType)}
                  className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#65c556]"
                >
                  <option value="Fútbol 5">Fútbol 5 ($18.000 / h)</option>
                  <option value="Fútbol 8">Fútbol 8 ($24.000 / h)</option>
                  <option value="Fútbol 11">Fútbol 11 ($35.000 / h)</option>
                  <option value="Pádel">Pádel ($12.000 / h)</option>
                  <option value="Tenis">Tenis ($14.000 / h)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#a0a0a0] uppercase block mb-1">
                  Tipo de Superficie
                </label>
                <input
                  type="text"
                  value={surface}
                  onChange={(e) => setSurface(e.target.value)}
                  placeholder="Ej. Polvo de ladrillo, Sintético monofilamento"
                  className="w-full bg-[#293827] border border-[#5a7056] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#65c556]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="light"
                  checked={hasLighting}
                  onChange={(e) => setHasLighting(e.target.checked)}
                  className="size-4 accent-[#65c556]"
                />
                <label htmlFor="light" className="text-xs text-[#c0c0c0] cursor-pointer">
                  Cuenta con reflectores LED para turnos nocturnos
                </label>
              </div>

              <div className="flex gap-2.5 mt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#5a7056] text-[#c0c0c0] hover:text-white font-semibold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs cursor-pointer transition-colors"
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
