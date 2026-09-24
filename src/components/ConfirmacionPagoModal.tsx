import React, { useState } from 'react';

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
  onConfirm: () => void;
}

export const ConfirmacionPagoModal: React.FC<ConfirmacionPagoModalProps> = ({
  isOpen,
  slot,
  onClose,
  onConfirm
}) => {
  const [method, setMethod] = useState<'tarjeta' | 'mercadopago'>('tarjeta');
  const [cardNum, setCardNum] = useState('•••• •••• •••• 4242');
  const [cardHolder, setCardHolder] = useState('JUAN PEREZ');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !slot) return null;

  const totalPrice = slot.price || 18000;
  const deposit = Math.round(totalPrice * 0.3);
  const remaining = totalPrice - deposit;

  const handlePay = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(17, 26, 16, 0.8)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1e281d] rounded-[16px] border border-[#5a7056] w-full max-w-[430px] shadow-[0px_20px_25px_rgba(0,0,0,0.5)] overflow-hidden text-white font-['Inter',sans-serif]">
        {/* Header */}
        <div className="px-[24px] pt-[20px] pb-[16px] border-b border-[#5a7056] flex justify-between items-center">
          <div className="flex items-center gap-[8px]">
            <div className="size-[10px] rounded-full bg-[#65c556] animate-pulse" />
            <h3 className="font-bold text-[17px] text-white">
              Confirmación y Pago de Seña (30%)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#a0a0a0] hover:text-white cursor-pointer bg-transparent border-none text-[16px]"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-[24px] flex flex-col gap-[16px]">
          {/* Reservation Breakdown */}
          <div className="bg-[#293827] rounded-[12px] p-[16px] border border-[#5a7056] flex flex-col gap-[8px]">
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#a0a0a0]">Instalación:</span>
              <span className="font-bold text-white">{slot.court}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#a0a0a0]">Fecha y Hora:</span>
              <span className="font-semibold text-[#65c556]">{slot.date} • {slot.time}</span>
            </div>
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#a0a0a0]">Duración:</span>
              <span className="font-medium text-white">1 hora fija</span>
            </div>
            <div className="h-px bg-[#3b4d38] my-1" />
            <div className="flex justify-between items-center text-[13px]">
              <span className="text-[#a0a0a0]">Tarifa fija total:</span>
              <span className="font-semibold text-white">${totalPrice.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center text-[14px] bg-[rgba(101,197,86,0.12)] p-2 rounded-[6px]">
              <span className="font-bold text-[#65c556]">Seña a abonar hoy (30%):</span>
              <span className="font-black text-[16px] text-[#65c556]">${deposit.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between items-center text-[12px] text-[#a0a0a0]">
              <span>Saldo a cancelar en mesa de entrada (70%):</span>
              <span className="font-medium text-white">${remaining.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="text-[12px] font-semibold text-[#c0c0c0] block mb-2">
              Medio de Pago (Simulación Aprobada)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('tarjeta')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[8px] text-xs font-semibold border cursor-pointer transition-colors ${
                  method === 'tarjeta'
                    ? 'bg-[rgba(101,197,86,0.2)] border-[#65c556] text-[#65c556]'
                    : 'bg-[#293827] border-[#5a7056] text-[#a0a0a0] hover:text-white'
                }`}
              >
                <span>💳</span> Tarjeta Crédito/Débito
              </button>
              <button
                type="button"
                onClick={() => setMethod('mercadopago')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-[8px] text-xs font-semibold border cursor-pointer transition-colors ${
                  method === 'mercadopago'
                    ? 'bg-[rgba(101,197,86,0.2)] border-[#65c556] text-[#65c556]'
                    : 'bg-[#293827] border-[#5a7056] text-[#a0a0a0] hover:text-white'
                }`}
              >
                <span>📱</span> Mercado Pago
              </button>
            </div>
          </div>

          {/* Card Form */}
          {method === 'tarjeta' && (
            <div className="bg-[#293827] p-3 rounded-[8px] border border-[#5a7056] flex flex-col gap-2">
              <div>
                <span className="text-[10px] text-[#a0a0a0] uppercase block">Número de tarjeta</span>
                <input
                  type="text"
                  value={cardNum}
                  onChange={(e) => setCardNum(e.target.value)}
                  className="w-full bg-[#1e281d] border border-[#5a7056] rounded px-2.5 py-1 text-xs text-white"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <span className="text-[10px] text-[#a0a0a0] uppercase block">Titular</span>
                  <input
                    type="text"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-[#1e281d] border border-[#5a7056] rounded px-2.5 py-1 text-xs text-white"
                  />
                </div>
                <div className="w-20">
                  <span className="text-[10px] text-[#a0a0a0] uppercase block">Venc / CVV</span>
                  <input
                    type="text"
                    defaultValue="12/28 • 321"
                    className="w-full bg-[#1e281d] border border-[#5a7056] rounded px-2.5 py-1 text-xs text-white text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Scope notice */}
          <p className="text-[11px] text-[#a0a0a0] italic text-center">
            * Conforme al alcance del proyecto (TP1 3.2), los pagos son simulados y se aprueban automáticamente.
          </p>

          {/* Actions */}
          <div className="flex gap-2.5 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-[8px] border border-[#5a7056] text-[#c0c0c0] hover:text-white font-semibold text-xs cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handlePay}
              disabled={isProcessing}
              className="flex-1 py-2.5 rounded-[8px] bg-[#65c556] hover:bg-[#57ef40] text-[#293827] font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isProcessing ? 'Procesando seña...' : `Pagar Seña $${deposit.toLocaleString('es-AR')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionPagoModal;
