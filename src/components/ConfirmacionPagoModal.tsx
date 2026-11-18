import React, { useState } from 'react';
import { IconCreditCard, IconSmartphone, IconAlert, IconClose, IconCheck } from './Icons';

export interface BookingSlotInfo {
  court: string;
  courtId?: string;
  sport?: string;
  date: string;
  time: string;
  price?: number;
}

export interface ConfirmacionPagoModalProps {
  isOpen: boolean;
  slot: BookingSlotInfo | null;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

export const ConfirmacionPagoModal: React.FC<ConfirmacionPagoModalProps> = ({
  isOpen,
  slot,
  onClose,
  onConfirm,
}) => {
  const [method, setMethod] = useState<'tarjeta' | 'mercadopago'>('tarjeta');
  const [cardNum, setCardNum] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiryCvv, setCardExpiryCvv] = useState('');
  const [cardError, setCardError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !slot) return null;

  const totalPrice = slot.price || 18000;
  const deposit = Math.round(totalPrice * 0.3);
  const remaining = totalPrice - deposit;

  const handlePay = async () => {
    setCardError(null);
    if (method === 'tarjeta') {
      if (!cardNum.trim() || !cardHolder.trim()) {
        setCardError('Por favor ingresa el número de tarjeta y el nombre del titular para continuar.');
        return;
      }
    }
    setIsProcessing(true);
    try {
      await onConfirm();
    } catch (err: any) {
      setCardError(err?.message || 'No se pudo completar la reserva en la base de datos.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-[440px] shadow-2xl overflow-hidden text-slate-900 font-['Inter',sans-serif]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="size-2.5 rounded-full bg-[#199e1b]" />
            <h3 className="font-bold text-base text-slate-900 tracking-tight">
              Confirmación y Pago de Seña (30%)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 cursor-pointer bg-transparent border-none p-1 rounded-lg hover:bg-slate-200/60 transition"
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {/* Reservation Breakdown */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Instalación</span>
              <span className="font-bold text-slate-900">{slot.court}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Fecha y Horario</span>
              <span className="font-bold text-emerald-700">{slot.date} · {slot.time}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Duración del turno</span>
              <span className="font-semibold text-slate-800">1 hora fija</span>
            </div>
            <div className="h-px bg-slate-200 my-1" />
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Tarifa total del turno</span>
              <span className="font-semibold text-slate-900">${totalPrice.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center text-xs bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
              <span className="font-bold text-emerald-800">Seña a abonar hoy (30%)</span>
              <span className="font-extrabold text-sm text-emerald-700">${deposit.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500">
              <span>Saldo en recepción del complejo (70%)</span>
              <span className="font-semibold text-slate-800">${remaining.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-2">
              Medio de pago
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMethod('tarjeta')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                  method === 'tarjeta'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <IconCreditCard size={15} />
                <span>Tarjeta Crédito/Débito</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod('mercadopago')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                  method === 'mercadopago'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <IconSmartphone size={15} />
                <span>Mercado Pago</span>
              </button>
            </div>
          </div>

          {/* Card Form */}
          {method === 'tarjeta' && (
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-col gap-2.5">
              <div>
                <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Número de tarjeta</span>
                <input
                  type="text"
                  placeholder="•••• •••• •••• 4242"
                  value={cardNum}
                  onChange={(e) => setCardNum(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Titular</span>
                  <input
                    type="text"
                    placeholder="JUAN PEREZ"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <div className="w-28">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Venc / CVV</span>
                  <input
                    type="text"
                    placeholder="MM/AA · 123"
                    value={cardExpiryCvv}
                    onChange={(e) => setCardExpiryCvv(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-900 text-center placeholder-slate-400 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>
            </div>
          )}

          {cardError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 flex items-center gap-2">
              <IconAlert size={16} className="text-red-500 shrink-0" />
              <span>{cardError}</span>
            </div>
          )}

          <p className="text-[11px] text-slate-500 text-center">
            La seña bloquea el horario de inmediato para todos los usuarios del sistema.
          </p>

          {/* Actions */}
          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold text-xs cursor-pointer transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#199e1b] hover:bg-[#158417] text-white font-bold text-xs transition-all shadow-md shadow-[#199e1b]/20 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <IconCheck size={15} />
              <span>{isProcessing ? 'Procesando...' : `Abonar Seña $${deposit.toLocaleString('es-AR')}`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionPagoModal;
