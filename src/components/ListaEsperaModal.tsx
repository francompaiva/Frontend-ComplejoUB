import React, { useState } from 'react';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(17, 26, 16, 0.8)' }}
      onClick={(e) => e.target === e.currentTarget && handleDone()}
    >
      <div className="bg-[#1e281d] rounded-[16px] border border-[#5a7056] w-full max-w-[440px] shadow-[0px_20px_25px_rgba(0,0,0,0.5)] overflow-hidden text-white font-['Inter',sans-serif]">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="p-[28px] flex flex-col gap-[20px]">
            {/* Header */}
            <div className="flex items-center gap-[12px]">
              <div className="size-[44px] rounded-full bg-[rgba(245,158,11,0.15)] border border-[rgba(245,158,11,0.3)] flex items-center justify-center text-[22px]">
                ⏳
              </div>
              <div>
                <h3 className="font-bold text-[18px] text-white">Lista de Espera</h3>
                <p className="text-[12px] text-[#a0a0a0]">Aviso de cupo liberado</p>
              </div>
            </div>

            {/* Slot Details Card */}
            <div className="bg-[#293827] rounded-[10px] p-[14px] border border-[#5a7056] flex flex-col gap-[6px]">
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#a0a0a0]">Cancha:</span>
                <span className="font-semibold text-white">{courtName}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#a0a0a0]">Horario seleccionado:</span>
                <span className="font-semibold text-[#65c556]">{date} • {time}</span>
              </div>
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-[#a0a0a0]">Estado actual:</span>
                <span className="bg-[rgba(229,62,62,0.2)] text-[#e53e3e] px-2 py-0.5 rounded text-[11px] font-bold">
                  Turno Ocupado
                </span>
              </div>
            </div>

            <p className="text-[13px] text-[#c0c0c0] leading-relaxed">
              Si el usuario actual cancela su turno con más de 24 hs de anticipación, se te notificará de inmediato para que puedas abonar la seña y confirmar la reserva.
            </p>

            {/* Inputs */}
            <div className="flex flex-col gap-[12px]">
              <div>
                <label className="text-[12px] font-medium text-[#a0a0a0] block mb-1">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#293827] border border-[#5a7056] rounded-[8px] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#65c556]"
                />
              </div>

              <div>
                <label className="text-[12px] font-medium text-[#a0a0a0] block mb-1">
                  Teléfono / WhatsApp para aviso urgente
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#293827] border border-[#5a7056] rounded-[8px] px-3 py-2 text-sm text-white focus:outline-none focus:border-[#65c556]"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-[10px] mt-2">
              <button
                type="button"
                onClick={handleDone}
                className="flex-1 py-2.5 rounded-[8px] border border-[#5a7056] text-[#c0c0c0] hover:text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Volver
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-[8px] bg-[#f59e0b] hover:bg-[#d97706] text-[#1e281d] font-bold text-sm transition-colors cursor-pointer"
              >
                Anotarme
              </button>
            </div>
          </form>
        ) : (
          <div className="p-[32px] flex flex-col items-center text-center gap-[16px]">
            <div className="size-[56px] rounded-full bg-[rgba(101,197,86,0.15)] border border-[#65c556] flex items-center justify-center text-[28px]">
              ✅
            </div>
            <h3 className="font-bold text-[20px] text-white">¡Anotado en Lista de Espera!</h3>
            <p className="text-[13px] text-[#c0c0c0]">
              Has quedado registrado en la posición:
            </p>
            <div className="bg-[#293827] border border-[#65c556] rounded-[12px] px-6 py-3">
              <span className="text-[32px] font-black text-[#65c556]">#{queuePosition}</span>
              <p className="text-[11px] text-[#a0a0a0]">en la fila de espera para este turno</p>
            </div>
            <p className="text-[12px] text-[#a0a0a0]">
              Te enviaremos un aviso a <strong>{phone}</strong> si el titular cancela la reserva.
            </p>
            <button
              type="button"
              onClick={handleDone}
              className="w-full py-2.5 rounded-[8px] bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-sm transition-colors cursor-pointer mt-2"
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

