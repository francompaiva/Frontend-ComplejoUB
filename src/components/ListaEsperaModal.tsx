import React, { useState } from 'react';
import { IconHourglass, IconCheck, IconClose } from './Icons';

export interface ListaEsperaModalProps {
  isOpen: boolean;
  courtName: string;
  date: string;
  time: string;
  onClose: () => void;
  onConfirm: (name: string, phone: string) => void;
}

export const ListaEsperaModal: React.FC<ListaEsperaModalProps> = ({
  isOpen,
  courtName,
  date,
  time,
  onClose,
  onConfirm
}) => {
  const [name, setName] = useState('Juan Pérez');
  const [phone, setPhone] = useState('11-4567-8901');
  const [submitted, setSubmitted] = useState(false);
  const [queuePosition, setQueuePosition] = useState(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(name, phone);
    setQueuePosition(Math.floor(Math.random() * 2) + 1);
    setSubmitted(true);
  };

  const handleDone = () => {
    setSubmitted(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in"
      onClick={(e) => e.target === e.currentTarget && handleDone()}
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[440px] shadow-2xl overflow-hidden text-slate-900 font-['Inter',sans-serif]">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                  <IconHourglass size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Lista de Espera</h3>
                  <p className="text-xs text-slate-500">Notificación automática de turno liberado</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDone}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 flex flex-col gap-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Cancha</span>
                <span className="font-bold text-slate-900">{courtName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Horario</span>
                <span className="font-bold text-emerald-700">{date} · {time}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Estado actual</span>
                <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md text-[11px] font-bold">
                  Reservado
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Si el titular actual cancela su turno, te enviaremos una alerta inmediata para que puedas abonar la seña y tomar el horario.
            </p>

            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Teléfono / WhatsApp para aviso
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <button
                type="button"
                onClick={handleDone}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Anotarme en Espera
              </button>
            </div>
          </form>
        ) : (
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="size-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <IconCheck size={24} />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Anotado en Lista de Espera</h3>
            <p className="text-xs text-slate-500">
              Quedaste registrado en la posición:
            </p>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-6 py-3">
              <span className="text-3xl font-extrabold text-emerald-700">#{queuePosition}</span>
              <p className="text-[11px] text-emerald-800/80">para {courtName} ({time})</p>
            </div>
            <p className="text-xs text-slate-500">
              Te notificaremos al <strong>{phone}</strong> en caso de liberarse el turno.
            </p>
            <button
              type="button"
              onClick={handleDone}
              className="w-full py-2.5 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs transition-colors cursor-pointer mt-1"
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListaEsperaModal;
